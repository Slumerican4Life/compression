import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode } from "https://deno.land/std@0.190.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple TOTP implementation
function generateTOTP(secret: string, timeStep = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBytes = new ArrayBuffer(8);
  const timeView = new DataView(timeBytes);
  timeView.setUint32(4, time, false);

  const key = decode(secret);
  
  // Simple HMAC-SHA1 implementation
  const hmac = crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  return hmac.then(async (cryptoKey) => {
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

    const { token, secret } = await req.json();
    if (!token || !secret) throw new Error("Token and secret are required");

    const authToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(authToken);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    // Verify the token
    const expectedToken = await generateTOTP(secret);
    if (token !== expectedToken) {
      throw new Error("Invalid token");
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.getRandomValues(new Uint8Array(4))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')
    );

    // Save to database
    const { error } = await supabaseClient
      .from("profiles")
      .upsert({
        user_id: user.id,
        two_factor_enabled: true,
        two_factor_secret: secret,
        backup_codes: backupCodes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      backup_codes: backupCodes
    }), {
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