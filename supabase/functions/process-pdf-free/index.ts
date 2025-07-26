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
    // Get client IP for daily usage tracking
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Check for authenticated user (optional)
    let user = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      try {
        const { data } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
        user = data.user;
      } catch (error) {
        console.log('No authenticated user, proceeding as anonymous');
      }
    }

    // Check daily usage limit for free PDF conversions
    const today = new Date().toISOString().split('T')[0];
    
    let dailyUsage;
    if (user) {
      // Check by user_id for authenticated users
      const { data } = await supabaseClient
        .from('daily_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .single();
      dailyUsage = data;
    } else {
      // Check by IP for anonymous users
      const { data } = await supabaseClient
        .from('daily_usage')
        .select('*')
        .eq('ip_address', clientIP)
        .eq('usage_date', today)
        .single();
      dailyUsage = data;
    }

    // Check if daily limit exceeded (1 free conversion per day)
    if (dailyUsage && dailyUsage.pdf_conversions >= 1) {
      return new Response(JSON.stringify({ 
        error: 'Daily free conversion limit reached. Sign up for unlimited conversions!',
        limit_exceeded: true,
        remaining_conversions: 0
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { file_data, file_name, file_size } = await req.json();

    // Process with Mistral OCR
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    
    const ocrResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-ocr-2505',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transaction data from this bank statement. Return structured data with dates, descriptions, amounts, and balances.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${file_data}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR failed: ${ocrResponse.statusText}`);
    }

    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.choices[0].message.content;

    // Convert to structured Excel format using AI
    const structureResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data processor. Convert bank statement text into structured JSON format suitable for Excel export.'
          },
          {
            role: 'user',
            content: `Convert this bank statement text into a structured JSON format:

${extractedText}

Return JSON with this exact structure:
{
  "account_info": {
    "account_number": "string",
    "account_holder": "string", 
    "bank_name": "string"
  },
  "date_range": {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "balance": number,
      "type": "debit|credit"
    }
  ],
  "summary": {
    "total_credits": number,
    "total_debits": number,
    "transaction_count": number
  }
}`
          }
        ],
        temperature: 0.1,
      }),
    });

    const structuredData = await structureResponse.json();
    const excelData = JSON.parse(structuredData.choices[0].message.content);

    // Update daily usage tracking
    if (user) {
      // For authenticated users
      await supabaseClient
        .from('daily_usage')
        .upsert({
          user_id: user.id,
          ip_address: clientIP,
          usage_date: today,
          pdf_conversions: (dailyUsage?.pdf_conversions || 0) + 1
        });
    } else {
      // For anonymous users
      await supabaseClient
        .from('daily_usage')
        .upsert({
          ip_address: clientIP,
          usage_date: today,
          pdf_conversions: (dailyUsage?.pdf_conversions || 0) + 1
        });
    }

    return new Response(JSON.stringify({
      success: true,
      excel_data: excelData,
      remaining_conversions: 0, // 1 per day limit
      message: 'PDF converted successfully! Free daily conversion used.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in PDF processing:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process PDF',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});