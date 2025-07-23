import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  ArrowLeft, 
  Calculator, 
  Building, 
  CreditCard, 
  FileText, 
  Shield,
  AlertTriangle,
  CheckCircle,
  DollarSign
} from "lucide-react";

interface InsightResultsProps {
  insight: {
    type: string;
    data: any;
  };
  onBack: () => void;
}

const InsightResults = ({ insight, onBack }: InsightResultsProps) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tax-deductions': return Calculator;
      case 'loan-application': return Building;
      case 'subscription-audit': return CreditCard;
      case 'business-expenses': return FileText;
      case 'fraud-alerts': return Shield;
      default: return FileText;
    }
  };

  const getInsightTitle = (type: string) => {
    switch (type) {
      case 'tax-deductions': return 'Tax Deductible Expenses Found';
      case 'loan-application': return 'Loan Application Package';
      case 'subscription-audit': return 'Subscription Analysis';
      case 'business-expenses': return 'Business Expense Report';
      case 'fraud-alerts': return 'Security & Fraud Analysis';
      default: return 'Analysis Results';
    }
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(insight.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${insight.type}-analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const Icon = getInsightIcon(insight.type);

  const renderTaxDeductions = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Deductible</p>
                <p className="text-2xl font-bold text-green-600">${data.totalDeductible?.toFixed(2) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Items Found</p>
                <p className="text-2xl font-bold">{data.deductibleExpenses?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Deductible Expenses</h3>
        {data.deductibleExpenses?.map((expense: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{expense.date}</p>
                  <Badge variant="secondary">{expense.category}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${Math.abs(expense.amount).toFixed(2)}</p>
                  <Badge variant={expense.confidence === 'High' ? 'default' : 'outline'}>
                    {expense.confidence}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderLoanApplication = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Income Analysis</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Monthly Income:</span>
                <span className="font-bold">${data.incomeAnalysis?.monthlyIncome?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Stability:</span>
                <Badge variant="secondary">{data.incomeAnalysis?.incomeStability || 'Unknown'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Financial Ratios</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Debt-to-Income:</span>
                <span className="font-bold">{(data.debtToIncomeRatio * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Average Balance:</span>
                <span className="font-bold">${data.averageBalance?.toFixed(2) || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2">Lender Summary</h3>
          <p className="text-sm">{data.lenderSummary || 'No summary available'}</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSubscriptionAudit = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Monthly Subscriptions</p>
                <p className="text-2xl font-bold">${data.totalMonthlyCost?.toFixed(2) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
                <p className="text-2xl font-bold text-green-600">${data.potentialSavings?.toFixed(2) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Active Subscriptions</h3>
        {data.subscriptions?.map((sub: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{sub.merchant}</p>
                  <p className="text-sm text-muted-foreground">{sub.frequency}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${sub.amount?.toFixed(2)}</p>
                  <Badge variant="outline">{sub.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.duplicateServices?.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-orange-600">Duplicate Services Found</h3>
          {data.duplicateServices.map((dup: any, index: number) => (
            <Card key={index} className="border-orange-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{dup.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {dup.services?.join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${dup.totalCost?.toFixed(2)}</p>
                    <p className="text-sm text-green-600">Save ${dup.potentialSavings?.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderBusinessExpenses = (data: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Business Expenses</h3>
            <p className="text-2xl font-bold text-blue-600">${data.expenseReport?.totalBusiness?.toFixed(2) || 0}</p>
            <p className="text-sm text-muted-foreground">{data.businessExpenses?.length || 0} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Export Ready</h3>
            <div className="space-y-1">
              <Badge variant="outline">QuickBooks Format</Badge>
              <Badge variant="outline">Excel Ready</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Business Transactions</h3>
        {data.businessExpenses?.slice(0, 10).map((expense: any, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">{expense.date}</p>
                  <Badge variant="secondary">{expense.category}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold">${Math.abs(expense.amount).toFixed(2)}</p>
                  {expense.receiptRequired && (
                    <Badge variant="outline" className="text-orange-600">Receipt Required</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFraudAlerts = (data: any) => (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Security Score</p>
              <p className="text-3xl font-bold text-green-600">{data.securityScore || 85}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.alerts?.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-red-600">Security Alerts</h3>
          {data.alerts.map((alert: any, index: number) => (
            <Card key={index} className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.type}</p>
                        <p className="text-sm text-muted-foreground">{alert.reason}</p>
                      </div>
                      <Badge variant={alert.severity === 'High' ? 'destructive' : 'outline'}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2 text-blue-600">{alert.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data.alerts?.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <p className="font-medium">No Security Issues Found</p>
            <p className="text-sm text-muted-foreground">Your transactions look normal</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderContent = () => {
    switch (insight.type) {
      case 'tax-deductions': return renderTaxDeductions(insight.data);
      case 'loan-application': return renderLoanApplication(insight.data);
      case 'subscription-audit': return renderSubscriptionAudit(insight.data);
      case 'business-expenses': return renderBusinessExpenses(insight.data);
      case 'fraud-alerts': return renderFraudAlerts(insight.data);
      default: return <div>Unknown insight type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Insights
          </Button>
          <div className="flex items-center space-x-2">
            <Icon className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{getInsightTitle(insight.type)}</h2>
          </div>
        </div>
        <Button onClick={exportResults} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Results
        </Button>
      </div>

      {renderContent()}
    </div>
  );
};

export default InsightResults;