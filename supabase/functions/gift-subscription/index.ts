import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GIFT-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const { targetUserEmail, months = 1, message } = await req.json();
    if (!targetUserEmail) throw new Error("Target user email is required");

    logStep("Gifting subscription", { targetUserEmail, months, adminEmail: user.email });

    // Calculate subscription end date
    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + months);

    // Update or create subscriber record
    const { error: upsertError } = await supabaseClient
      .from("subscribers")
      .upsert({
        email: targetUserEmail,
        subscribed: true,
        subscription_tier: "Premium",
        subscription_end: subscriptionEnd.toISOString(),
        is_gifted: true,
        gifted_by: user.email,
        gift_message: message || `Gifted ${months} month${months > 1 ? 's' : ''} of Premium subscription`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (upsertError) throw upsertError;

    logStep("Subscription gifted successfully", { targetUserEmail, subscriptionEnd });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully gifted ${months} month${months > 1 ? 's' : ''} of Premium subscription to ${targetUserEmail}`,
      subscription_end: subscriptionEnd.toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in gift-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});