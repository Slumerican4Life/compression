import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple TOTP implementation
function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setUint32(4, time, false);

  const key = decode(secret);
  
  return crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  ).then(async (cryptoKey) => {
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBytes);
    const signatureArray = new Uint8Array(signature);
    const offset = signatureArray[19] & 0xf;
    const code = ((signatureArray[offset] & 0x7f) << 24) |
                 ((signatureArray[offset + 1] & 0xff) << 16) |
                 ((signatureArray[offset + 2] & 0xff) << 8) |
                 (signatureArray[offset + 3] & 0xff);
    return (code % 1000000).toString().padStart(6, '0');
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const { token } = await req.json();
    if (!token) throw new Error("Token is required");

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Get user's 2FA settings
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("two_factor_enabled, two_factor_secret, backup_codes")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) throw new Error("Profile not found");
    if (!profile.two_factor_enabled) throw new Error("Two-factor authentication not enabled");

    // Check if it's a backup code
    if (profile.backup_codes && profile.backup_codes.includes(token)) {
      // Remove used backup code
      const updatedBackupCodes = profile.backup_codes.filter(code => code !== token);
      await supabaseClient
        .from("profiles")
        .update({ backup_codes: updatedBackupCodes })
        .eq("user_id", user.id);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify TOTP token
    const expectedToken = await generateTOTP(profile.two_factor_secret);
    if (token !== expectedToken) {
      throw new Error("Invalid token");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});