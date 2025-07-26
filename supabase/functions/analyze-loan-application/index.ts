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

    // Check credits and deduct 2 credits for loan analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Loan Application Analysis requires 2 credits.' 
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
        operation_type: 'loan_application_analysis',
        credits_used: 2,
        remaining_credits: profile.credits - 2
      });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Analyze these bank transactions to create a comprehensive loan application package. Calculate financial metrics and assess creditworthiness.

Transactions: ${JSON.stringify(transactions)}

Analyze and calculate:
1. Monthly income (salary, freelance, investment income)
2. Monthly expenses (fixed and variable)
3. Debt payments (credit cards, loans, etc.)
4. Average account balance
5. Income stability patterns
6. Cash flow analysis
7. Debt-to-income ratio
8. Creditworthiness indicators

Provide a professional lender-ready summary including:
- Financial strength assessment
- Risk factors
- Recommended loan amounts
- Supporting documentation needed

Return as JSON:
{
  "income_analysis": {
    "monthly_income": number,
    "income_sources": array,
    "income_stability": "stable|variable|irregular",
    "income_trend": "increasing|stable|decreasing"
  },
  "expense_analysis": {
    "monthly_expenses": number,
    "fixed_expenses": number,
    "variable_expenses": number,
    "expense_categories": object
  },
  "debt_analysis": {
    "total_debt_payments": number,
    "debt_to_income_ratio": number,
    "credit_utilization": string
  },
  "cash_flow": {
    "net_monthly_flow": number,
    "average_balance": number,
    "lowest_balance": number
  },
  "loan_recommendation": {
    "max_loan_amount": number,
    "recommended_loan_amount": number,
    "loan_to_income_ratio": number,
    "approval_likelihood": "high|medium|low"
  },
  "lender_summary": string,
  "risk_factors": array,
  "supporting_documents": array
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
          { role: 'system', content: 'You are a financial analyst AI that creates loan application packages from bank transaction data. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      }),
    });

    const aiResponse = await response.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    // Store insight
    await supabaseClient
      .from('financial_insights')
      .insert({
        user_id: user.id,
        insight_type: 'loan_application',
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
    console.error('Error in loan application analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});