import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  FileText, 
  CreditCard, 
  Building, 
  Shield,
  Loader2,
  TrendingUp,
  AlertTriangle
} from "lucide-react";


interface InsightOptionsProps {
  transactions: any[];
  onInsightGenerated: (insight: any) => void;
}

const InsightOptions = ({ transactions, onInsightGenerated }: InsightOptionsProps) => {
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null);

  const generateInsight = async (insightType: string) => {
    setLoadingInsight(insightType);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate dummy insights based on type
      let dummyInsights;
      
      switch (insightType) {
        case 'tax-deductions':
          dummyInsights = {
            deductibleExpenses: [
              {
                date: "2024-01-29",
                description: "OFFICE SUPPLIES - STAPLES",
                amount: 78.45,
                category: "Business Supplies",
                deductionType: "Office Expenses",
                confidence: "High"
              },
              {
                date: "2024-01-26",
                description: "FREELANCE PAYMENT - CLIENT ABC",
                amount: 850.00,
                category: "Business Income",
                deductionType: "Self-Employment Income",
                confidence: "High"
              }
            ],
            totalDeductible: 928.45,
            summary: "Found 2 potentially deductible business expenses totaling $928.45"
          };
          break;
          
        case 'loan-application':
          dummyInsights = {
            incomeAnalysis: {
              monthlyIncome: 6350.00,
              incomeStability: "Stable",
              incomeGrowth: 5.2
            },
            debtToIncomeRatio: 0.28,
            averageBalance: 7070.53,
            spendingPatterns: {
              essentials: 65,
              discretionary: 35
            },
            lenderSummary: "Applicant shows stable income with good debt management. Monthly income averages $6,350 with a debt-to-income ratio of 28%, which is within acceptable lending standards."
          };
          break;
          
        case 'subscription-audit':
          dummyInsights = {
            subscriptions: [
              {
                merchant: "Netflix",
                amount: 15.99,
                frequency: "Monthly",
                category: "Streaming",
                lastCharge: "2024-01-22"
              },
              {
                merchant: "Spotify Premium",
                amount: 9.99,
                frequency: "Monthly", 
                category: "Music",
                lastCharge: "2024-01-28"
              }
            ],
            duplicateServices: [],
            totalMonthlyCost: 25.98,
            potentialSavings: 0
          };
          break;
          
        case 'business-expenses':
          dummyInsights = {
            businessExpenses: [
              {
                date: "2024-01-29",
                description: "OFFICE SUPPLIES - STAPLES",
                amount: 78.45,
                category: "Supplies",
                receiptRequired: true
              }
            ],
            personalExpenses: [
              {
                date: "2024-01-17",
                description: "GROCERY STORE - WHOLE FOODS", 
                amount: 125.75,
                category: "Food",
                receiptRequired: false
              }
            ],
            expenseReport: {
              totalBusiness: 78.45,
              byCategory: { "Supplies": 78.45 },
              quarterlyBreakdown: { "Q1": 78.45 }
            },
            exportFormats: {
              quickbooks: "QBO format ready",
              excel: "CSV export ready"
            }
          };
          break;
          
        case 'fraud-alerts':
          dummyInsights = {
            alerts: [],
            spendingPatterns: {
              unusualSpikes: [],
              locationAnomalies: [],
              timePatterns: []
            },
            securityScore: 92,
            recommendations: ["Continue monitoring account regularly", "Set up transaction alerts for amounts over $500"]
          };
          break;
          
        default:
          dummyInsights = { message: "Unknown insight type" };
      }
      
      onInsightGenerated({
        type: insightType,
        data: dummyInsights
      });
      
    } catch (error) {
      console.error('Error generating insight:', error);
    } finally {
      setLoadingInsight(null);
    }
  };

  const insightOptions = [
    {
      id: 'tax-deductions',
      title: 'Tax Deduction Finder',
      description: 'Auto-identify ALL deductible expenses (business meals, home office utilities, medical, charitable)',
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'loan-application',
      title: 'Loan Application Package',
      description: 'Calculate debt-to-income ratios, average balances, income stability for lenders',
      icon: Building,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'subscription-audit',
      title: 'Subscription Audit & Cancellation',
      description: 'Find forgotten subscriptions and identify duplicate services',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'business-expenses',
      title: 'Business Expense Reports',
      description: 'Auto-generate corporate expense reports and separate business vs personal',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'fraud-alerts',
      title: 'Fraud & Financial Anomaly Alerts',
      description: 'Flag unusual spending patterns and potential security issues',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Get AI-Powered Financial Insights</h2>
        <p className="text-muted-foreground">
          Choose the analysis you need for your {transactions.length} transactions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insightOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = loadingInsight === option.id;
          
          return (
            <Card 
              key={option.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => !isLoading && generateInsight(option.id)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-lg ${option.bgColor} flex items-center justify-center mb-3`}>
                  <Icon className={`h-6 w-6 ${option.color}`} />
                </div>
                <CardTitle className="text-lg">{option.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {option.description}
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    generateInsight(option.id);
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generate Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>All analysis is performed securely with no data stored permanently</span>
        </div>
      </div>
    </div>
  );
};

export default InsightOptions;