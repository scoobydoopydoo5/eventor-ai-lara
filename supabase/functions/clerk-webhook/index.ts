import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const event = await req.json();
    console.log('Clerk webhook event:', event.type);

    if (event.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = event.data;
      const email = email_addresses?.[0]?.email_address;

      console.log('Creating user profile for:', id, email);

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          clerk_user_id: id,
          email: email,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }

      // Create user balloons with initial 10 balloons
      const { error: balloonsError } = await supabase
        .from('user_balloons')
        .insert({
          clerk_user_id: id,
          balance: 10,
        });

      if (balloonsError) {
        console.error('Error creating balloons:', balloonsError);
        throw balloonsError;
      }

      // Create initial transaction record
      const { error: transactionError } = await supabase
        .from('balloon_transactions')
        .insert({
          clerk_user_id: id,
          amount: 10,
          transaction_type: 'earn',
          description: 'Welcome bonus',
        });

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
      }

      console.log('User profile and balloons created successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in clerk-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});