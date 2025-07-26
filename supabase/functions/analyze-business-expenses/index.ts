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

    // Check credits and deduct 2 credits for business expense analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.credits < 2) {
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Business Expense Analysis requires 2 credits.' 
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
        operation_type: 'business_expense_analysis',
        credits_used: 2,
        remaining_credits: profile.credits - 2
      });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `Analyze these transactions and categorize them into business vs personal expenses. Generate a corporate expense report.

Transactions: ${JSON.stringify(transactions)}

Categorize expenses into:
BUSINESS CATEGORIES:
- Office supplies & equipment
- Travel & transportation
- Meals & entertainment
- Professional services
- Software & subscriptions
- Marketing & advertising
- Utilities & rent (business portion)
- Professional development
- Insurance (business)
- Telecommunications

PERSONAL CATEGORIES:
- Personal groceries & dining
- Personal travel & entertainment
- Personal shopping
- Personal healthcare
- Personal insurance
- Personal utilities & rent

For each transaction, determine:
1. Business vs Personal classification
2. Specific expense category
3. Receipt requirement (yes/no)
4. Confidence level
5. Notes for accounting

Generate corporate-ready summaries by:
- Month/quarter totals
- Category breakdowns
- Receipt tracking
- Reimbursement recommendations

Return as JSON:
{
  "business_expenses": [
    {
      "transaction_id": "string",
      "date": "string",
      "description": "string",
      "amount": number,
      "category": "string",
      "receipt_required": boolean,
      "confidence": number,
      "accounting_notes": "string"
    }
  ],
  "personal_expenses": [
    {
      "transaction_id": "string", 
      "date": "string",
      "description": "string",
      "amount": number,
      "category": "string"
    }
  ],
  "summary": {
    "total_business": number,
    "total_personal": number,
    "business_percentage": number,
    "by_category": object,
    "by_month": object,
    "receipts_needed": number
  },
  "accounting_export": {
    "quickbooks_format": array,
    "excel_format": array
  },
  "recommendations": array
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
          { role: 'system', content: 'You are a business accounting AI that categorizes expenses and generates corporate reports. Always respond with valid JSON.' },
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
        insight_type: 'business_expenses',
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
    console.error('Error in business expense analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});