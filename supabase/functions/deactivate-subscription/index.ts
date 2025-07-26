import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEACTIVATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

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
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from("admin_users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!adminCheck) throw new Error("Unauthorized: Admin access required");
    logStep("Admin verified", { adminEmail: user.email });

    const { targetUserEmail, reason } = await req.json();
    if (!targetUserEmail) throw new Error("Target user email is required");

    logStep("Deactivating subscription", { targetUserEmail, adminEmail: user.email });

    // Update subscriber record to deactivate subscription
    const { error: updateError } = await supabaseClient
      .from("subscribers")
      .update({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        is_gifted: false,
        gifted_by: null,
        gift_message: reason ? `Deactivated by admin: ${reason}` : 'Deactivated by admin',
        updated_at: new Date().toISOString(),
      })
      .eq('email', targetUserEmail);

    if (updateError) throw updateError;

    logStep("Subscription deactivated successfully", { targetUserEmail });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully deactivated subscription for ${targetUserEmail}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in deactivate-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});