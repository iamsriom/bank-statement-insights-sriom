import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  FileText, 
  CreditCard, 
  Building2, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  Shield
} from "lucide-react";

interface InsightOptionsProps {
  excelData: any;
  onInsightSelected: (insightType: string) => void;
}

const InsightOptions = ({ excelData, onInsightSelected }: InsightOptionsProps) => {
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const insights = [
    {
      id: "tax-deduction",
      title: "Tax Deduction Finder",
      description: "Auto-identify ALL deductible expenses (business meals, home office utilities, medical, charitable, etc)",
      icon: Calculator,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      features: ["Business meal detection", "Home office utilities", "Medical expenses", "Charitable donations", "Custom additions/subtractions"]
    },
    {
      id: "loan-package",
      title: "Loan Application Package Generator",
      description: "Auto-calculate debt-to-income ratios, average balances, income stability for lenders",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      features: ["Debt-to-income ratios", "Average balance calculations", "Income stability analysis", "Professional summaries", "Lender-ready format"]
    },
    {
      id: "subscription-audit",
      title: "Subscription Audit & Cancellation Service",
      description: "Find forgotten subscriptions and identify duplicate services (multiple streaming platforms)",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      features: ["Forgotten subscription detection", "Duplicate service identification", "Cost analysis", "Cancellation recommendations", "Savings calculator"]
    },
    {
      id: "business-expenses",
      title: "Business Expense Reports",
      description: "Auto-generate corporate expense reports with receipts matched and business vs personal separation",
      icon: Building2,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      features: ["Automated expense categorization", "Business vs personal separation", "Receipt matching", "Export to accounting software", "Corporate compliance"]
    },
    {
      id: "fraud-alerts",
      title: "Fraud & Financial Anomaly Alerts",
      description: "Flag alerts for unusual spending patterns and potential fraudulent activities",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      features: ["Unusual pattern detection", "Spending anomaly alerts", "Fraud risk assessment", "Security recommendations", "Real-time monitoring"]
    }
  ];

  const handleInsightClick = (insightId: string) => {
    setSelectedInsight(insightId);
    onInsightSelected(insightId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI-Powered Financial Insights</span>
          <Badge variant="secondary" className="ml-2">
            {excelData.metadata.totalTransactions} transactions analyzed
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose the insights you need from your bank statement data. Our AI will analyze your transactions and provide actionable recommendations.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            const isSelected = selectedInsight === insight.id;
            
            return (
              <Card 
                key={insight.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected ? `${insight.borderColor} border-2 shadow-lg` : 'border hover:border-primary/50'
                }`}
                onClick={() => handleInsightClick(insight.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                      <Icon className={`h-5 w-5 ${insight.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">
                          {insight.title}
                        </h3>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                      
                      {isSelected && (
                        <div className="mt-3 space-y-2">
                          <div className="text-xs font-medium text-foreground">Key Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {insight.features.map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsightClick(insight.id);
                            }}
                          >
                            Generate {insight.title}
                            <TrendingUp className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Data Security & Privacy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All analyses are performed securely. Your financial data is never stored permanently and is processed with bank-level encryption.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightOptions;