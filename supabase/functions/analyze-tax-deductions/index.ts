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

    // Check credits and deduct 2 credits for tax analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Tax Deduction Analysis requires 2 credits.' 
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
        operation_type: 'tax_deduction_analysis',
        credits_used: 2,
        remaining_credits: profile.credits - 2
      });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Analyze these bank transactions and identify ALL potential tax-deductible expenses. Be comprehensive and include confidence scores.

Transactions: ${JSON.stringify(transactions)}

Identify deductible expenses in these categories:
- Business meals and entertainment (50% deductible)
- Home office utilities and expenses
- Medical and healthcare costs
- Charitable donations and contributions
- Professional development and education
- Travel and transportation for business
- Office supplies and equipment
- Professional services (legal, accounting)
- Business insurance
- Marketing and advertising

For each deductible item, provide:
1. Transaction details
2. Tax category
3. Deductible amount
4. Confidence score (0-100)
5. IRS notes/requirements

Return as JSON array with this structure:
{
  "deductions": [
    {
      "transaction_id": "string",
      "description": "string", 
      "amount": number,
      "deductible_amount": number,
      "category": "string",
      "confidence": number,
      "irs_notes": "string"
    }
  ],
  "total_deductible": number,
  "estimated_tax_savings": number
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
          { role: 'system', content: 'You are a tax expert AI that identifies deductible expenses from bank transactions. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Store insight
    await supabaseClient
      .from('financial_insights')
      .insert({
        user_id: user.id,
        insight_type: 'tax_deductions',
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
    console.error('Error in tax deduction analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});