import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactions, insightType, customOptions } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    
    switch (insightType) {
      case 'tax-deductions':
        prompt = `Analyze these bank transactions and identify ALL potential tax deductible expenses. Return a JSON object with:
        {
          "deductibleExpenses": [
            {
              "date": "transaction date",
              "description": "transaction description", 
              "amount": transaction_amount,
              "category": "Business Meals|Home Office|Medical|Charitable|etc",
              "deductionType": "specific tax category",
              "confidence": "High|Medium|Low"
            }
          ],
          "totalDeductible": total_amount,
          "summary": "brief summary of findings"
        }
        
        Transactions: ${JSON.stringify(transactions)}`;
        break;
        
      case 'loan-application':
        prompt = `Create a professional loan application package from these transactions. Return JSON:
        {
          "incomeAnalysis": {
            "monthlyIncome": average_monthly_income,
            "incomeStability": "Stable|Variable|Irregular",
            "incomeGrowth": percentage_change
          },
          "debtToIncomeRatio": calculated_ratio,
          "averageBalance": average_account_balance,
          "spendingPatterns": {
            "essentials": amount_percentage,
            "discretionary": amount_percentage
          },
          "lenderSummary": "professional summary for lenders"
        }
        
        Transactions: ${JSON.stringify(transactions)}`;
        break;
        
      case 'subscription-audit':
        prompt = `Find all recurring subscriptions and identify opportunities to save money. Return JSON:
        {
          "subscriptions": [
            {
              "merchant": "service name",
              "amount": monthly_amount,
              "frequency": "Monthly|Annual",
              "category": "Streaming|Software|etc",
              "lastCharge": "date"
            }
          ],
          "duplicateServices": [
            {
              "category": "service type",
              "services": ["service1", "service2"],
              "totalCost": combined_monthly_cost,
              "potentialSavings": estimated_savings
            }
          ],
          "totalMonthlyCost": total_subscription_cost,
          "potentialSavings": total_potential_savings
        }
        
        Transactions: ${JSON.stringify(transactions)}`;
        break;
        
      case 'business-expenses':
        prompt = `Separate business vs personal expenses and create a professional expense report. Return JSON:
        {
          "businessExpenses": [
            {
              "date": "date",
              "description": "description", 
              "amount": amount,
              "category": "Travel|Meals|Supplies|etc",
              "receiptRequired": true/false
            }
          ],
          "personalExpenses": [similar structure],
          "expenseReport": {
            "totalBusiness": total_amount,
            "byCategory": {category: amount},
            "quarterlyBreakdown": quarterly_totals
          },
          "exportFormats": {
            "quickbooks": "formatted for QuickBooks",
            "excel": "Excel-ready format"
          }
        }
        
        Transactions: ${JSON.stringify(transactions)}`;
        break;
        
      case 'fraud-alerts':
        prompt = `Analyze transactions for unusual patterns and potential fraud. Return JSON:
        {
          "alerts": [
            {
              "type": "Unusual Amount|Strange Location|Duplicate Charge|etc",
              "transaction": transaction_details,
              "reason": "explanation of why flagged",
              "severity": "High|Medium|Low",
              "recommendation": "suggested action"
            }
          ],
          "spendingPatterns": {
            "unusualSpikes": dates_and_amounts,
            "locationAnomalies": suspicious_locations,
            "timePatterns": unusual_timing
          },
          "securityScore": score_out_of_100,
          "recommendations": ["action items"]
        }
        
        Transactions: ${JSON.stringify(transactions)}`;
        break;
        
      default:
        throw new Error('Invalid insight type');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analysis expert. Analyze the provided bank transactions and return only valid JSON with no additional text or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Parse JSON response
    let insights;
    try {
      insights = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse analysis results');
    }

    return new Response(JSON.stringify({
      success: true,
      insights,
      insightType
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});