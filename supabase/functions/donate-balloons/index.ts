import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { donor_id, recipient_id, amount } = await req.json();

    if (!donor_id || !recipient_id || !Number.isInteger(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (donor_id === recipient_id) {
      return new Response(JSON.stringify({ error: 'Cannot donate to yourself' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure donor record exists
    const { data: donor, error: donorSelErr } = await supabase
      .from('user_balloons')
      .select('balance')
      .eq('clerk_user_id', donor_id)
      .maybeSingle();

    if (donorSelErr) throw donorSelErr;

    const donorBalance = donor?.balance ?? 0;
    if (donorBalance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure recipient record exists
    const { data: recipient, error: recSelErr } = await supabase
      .from('user_balloons')
      .select('balance')
      .eq('clerk_user_id', recipient_id)
      .maybeSingle();

    if (recSelErr) throw recSelErr;

    const recipientBalance = recipient?.balance ?? 0;

    // Perform updates sequentially (best-effort atomicity)
    const newDonorBalance = donorBalance - amount + (amount * 2); // deduct then bonus 2x
    const newRecipientBalance = recipientBalance + amount;

    // Upsert donor
    const { error: donorUpErr } = await supabase
      .from('user_balloons')
      .upsert({ clerk_user_id: donor_id, balance: newDonorBalance }, { onConflict: 'clerk_user_id' });
    if (donorUpErr) throw donorUpErr;

    // Upsert recipient
    const { error: recipientUpErr } = await supabase
      .from('user_balloons')
      .upsert({ clerk_user_id: recipient_id, balance: newRecipientBalance }, { onConflict: 'clerk_user_id' });
    if (recipientUpErr) throw recipientUpErr;

    // Insert transactions
    await supabase.from('balloon_transactions').insert([
      { clerk_user_id: donor_id, amount: -amount, transaction_type: 'donate', description: `Donated ${amount} balloons to ${recipient_id}` },
      { clerk_user_id: recipient_id, amount: amount, transaction_type: 'donation_received', description: `Received ${amount} balloons from ${donor_id}` },
      { clerk_user_id: donor_id, amount: amount * 2, transaction_type: 'bonus', description: 'Donation bonus' },
    ]);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in donate-balloons:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
