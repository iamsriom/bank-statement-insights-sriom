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

    // Check credits and deduct 2 credits for fraud analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Fraud & Anomaly Detection requires 2 credits.' 
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct credits
    await supabaseClient
      .from('profiles')
      .update({ credits: profile.credits - 2 })
      .eq('user_id', user.id);

    // Log credit transaction
    await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        operation_type: 'fraud_analysis',
        credits_used: 2,
        remaining_credits: profile.credits - 2
      });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Analyze these bank transactions for potential fraud, anomalies, and security concerns. Flag suspicious patterns.

Transactions: ${JSON.stringify(transactions)}

Detect and flag:
1. UNUSUAL SPENDING PATTERNS:
   - Transactions significantly above normal amounts
   - Unusual timing (late night, unusual days)
   - Geographic anomalies (unusual locations)
   - Frequency anomalies (too many transactions)

2. SUSPICIOUS CHARGES:
   - Duplicate charges (same amount, merchant, timeframe)
   - Round number charges (potential testing)
   - Unknown or suspicious merchant names
   - International charges (if unusual for user)

3. ACCOUNT SECURITY CONCERNS:
   - Multiple failed transactions
   - Unusual ATM usage patterns
   - Card-not-present transactions
   - Multiple small transactions (potential testing)

4. PATTERN ANALYSIS:
   - Spending velocity changes
   - Category shifts in spending
   - Balance manipulation patterns
   - Time-based anomalies

For each anomaly, provide:
- Severity level (low/medium/high/critical)
- Risk type and description
- Recommended actions
- False positive likelihood

Return as JSON:
{
  "anomalies": [
    {
      "transaction_id": "string",
      "anomaly_type": "unusual_amount|duplicate_charge|suspicious_merchant|geographic|timing|frequency",
      "severity": "low|medium|high|critical",
      "description": "string",
      "risk_score": number,
      "recommended_action": "string",
      "false_positive_likelihood": "low|medium|high"
    }
  ],
  "patterns": [
    {
      "pattern_type": "velocity|geographic|timing|category",
      "description": "string",
      "risk_level": "low|medium|high",
      "affected_transactions": array
    }
  ],
  "security_summary": {
    "total_anomalies": number,
    "high_risk_transactions": number,
    "suspicious_merchants": array,
    "recommended_immediate_actions": array,
    "account_security_score": number
  },
  "prevention_tips": array
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
          { role: 'system', content: 'You are a fraud detection AI that identifies suspicious financial activity and security threats. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Store insight
    await supabaseClient
      .from('financial_insights')
      .insert({
        user_id: user.id,
        insight_type: 'fraud_detection',
        insight_data: analysis,
        statement_id: null
      });

    return new Response(JSON.stringify({
      ...analysis,
      credits_remaining: profile.credits - 2
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fraud analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});