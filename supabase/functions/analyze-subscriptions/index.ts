import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const { transactions } = await req.json();

    // Check credits and deduct 1 credit for subscription analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Subscription Analysis requires 1 credit.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct credits
    await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('user_id', user.id);

    // Log credit transaction
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        operation_type: 'subscription_analysis',
        credits_used: 1,
        remaining_credits: profile.credits - 1
      });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Analyze these bank transactions to identify ALL subscription services and recurring charges. Find forgotten subscriptions and duplicates.

Transactions: ${JSON.stringify(transactions)}

Identify:
1. All recurring subscription charges (monthly, yearly, quarterly)
2. Forgotten or unused subscriptions
3. Duplicate services (multiple streaming platforms, cloud storage, etc.)
4. Subscription price changes over time
5. Cancelled subscriptions that might restart
6. Free trial periods that converted to paid

For each subscription found, provide:
- Service name and category
- Billing frequency and amount
- Last charge date
- Usage assessment (active/forgotten/duplicate)
- Cancellation recommendation
- Estimated annual cost

Return as JSON:
{
  "subscriptions": [
    {
      "service_name": "string",
      "category": "streaming|software|fitness|news|cloud|other",
      "amount": number,
      "frequency": "monthly|yearly|quarterly|weekly",
      "last_charge": "date",
      "status": "active|forgotten|duplicate|trial_converted",
      "cancellation_recommendation": "keep|cancel|consider",
      "annual_cost": number,
      "usage_assessment": "string"
    }
  ],
  "duplicates": [
    {
      "category": "string",
      "services": array,
      "potential_savings": number
    }
  ],
  "summary": {
    "total_monthly_cost": number,
    "total_annual_cost": number,
    "forgotten_subscriptions": number,
    "potential_monthly_savings": number,
    "recommendations": array
  }
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a subscription management AI that identifies recurring charges and suggests optimizations. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Store subscriptions in subscription_tracking table
    if (analysis.subscriptions) {
      for (const sub of analysis.subscriptions) {
        await supabaseClient
          .from('subscription_tracking')
          .upsert({
            user_id: user.id,
            service_name: sub.service_name,
            amount: sub.amount,
            frequency: sub.frequency,
            category: sub.category,
            is_active: sub.status === 'active',
            auto_cancel_eligible: sub.cancellation_recommendation === 'cancel'
          });
      }
    }

    // Store insight
    await supabaseClient
      .from('financial_insights')
      .insert({
        user_id: user.id,
        insight_type: 'subscription_audit',
        insight_data: analysis,
        statement_id: null
      });

    return new Response(JSON.stringify({
      ...analysis,
      credits_remaining: profile.credits - 1
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in subscription analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});