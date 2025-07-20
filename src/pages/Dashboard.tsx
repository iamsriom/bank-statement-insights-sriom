import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt,
  AlertTriangle,
  Eye,
  Download,
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  Search,
  Filter,
  Edit,
  Flag,
  CheckCircle,
  Crown
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const summaryData = {
    totalIncome: 4250,
    totalExpenses: 3890,
    netChange: 360,
    transactionCount: 127
  };

  const insights = [
    { icon: TrendingUp, text: "You spent 23% more on dining this month", type: "warning" },
    { icon: AlertTriangle, text: "Found 3 potential duplicate charges", type: "alert" },
    { icon: PieChart, text: "Your top expense category: Groceries ($450)", type: "info" },
    { icon: CreditCard, text: "Detected 7 recurring subscriptions", type: "info" }
  ];

  const transactions = [
    {
      date: "03/15",
      description: "STARBUCKS #12345",
      category: "Dining",
      amount: -5.67,
      id: 1
    },
    {
      date: "03/15",
      description: "PAYROLL DEPOSIT",
      category: "Income",
      amount: 1250,
      id: 2
    },
    {
      date: "03/14",
      description: "AMAZON.COM",
      category: "Shopping",
      amount: -89.99,
      id: 3
    },
    {
      date: "03/14",
      description: "GROCERY OUTLET",
      category: "Groceries",
      amount: -45.32,
      id: 4
    }
  ];

  const categories = [
    { name: "Groceries", amount: 450, percentage: 28, color: "bg-blue-500" },
    { name: "Dining", amount: 380, percentage: 24, color: "bg-green-500" },
    { name: "Transportation", amount: 220, percentage: 14, color: "bg-yellow-500" },
    { name: "Entertainment", amount: 180, percentage: 11, color: "bg-purple-500" },
    { name: "Other", amount: 370, percentage: 23, color: "bg-gray-500" }
  ];

  const subscriptions = [
    { name: "Netflix", amount: 15.99, nextCharge: "Apr 15", difficulty: "Easy" },
    { name: "Spotify", amount: 9.99, nextCharge: "Apr 12", difficulty: "Easy" },
    { name: "Adobe Creative", amount: 52.99, nextCharge: "Apr 18", difficulty: "Medium" },
    { name: "Gym Membership", amount: 45.00, nextCharge: "Apr 20", difficulty: "Hard" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/")} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold">Chase Bank</h1>
                  <p className="text-sm text-muted-foreground">March 1 - 31, 2024</p>
                </div>
              </div>
            </div>
            
            <Button variant="hero">
              <FileText className="h-4 w-4" />
              Process Another
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${summaryData.totalIncome.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    ${summaryData.totalExpenses.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${summaryData.netChange >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {summaryData.netChange >= 0 ? '+' : ''}${summaryData.netChange}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summaryData.transactionCount}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Quick Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50">
                    <insight.icon className={`h-5 w-5 ${
                      insight.type === 'warning' ? 'text-warning' :
                      insight.type === 'alert' ? 'text-destructive' :
                      'text-primary'
                    }`} />
                    <span className="text-sm">{insight.text}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{category.name}</span>
                      <span className="font-medium">${category.amount}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={category.percentage} className="flex-1" />
                      <span className="text-xs text-muted-foreground w-10">{category.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input 
                      className="border border-border rounded px-3 py-2 text-sm"
                      placeholder="Search descriptions..."
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="p-4 font-medium">Date</th>
                        <th className="p-4 font-medium">Description</th>
                        <th className="p-4 font-medium">Category</th>
                        <th className="p-4 font-medium">Amount</th>
                        <th className="p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-border hover:bg-muted/50">
                          <td className="p-4 text-sm">{transaction.date}</td>
                          <td className="p-4 text-sm font-medium">{transaction.description}</td>
                          <td className="p-4">
                            <Badge variant="secondary">{transaction.category}</Badge>
                          </td>
                          <td className={`p-4 text-sm font-medium ${
                            transaction.amount >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Flag className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {/* Financial Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Financial Health Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-4xl font-bold text-primary">78</div>
                  <p className="text-muted-foreground">Good financial health</p>
                </div>
                <Progress value={78} className="h-3" />
                <div className="text-sm text-muted-foreground">
                  <p>✅ Consistent income stream</p>
                  <p>⚠️ High dining expenses</p>
                  <p>✅ Emergency fund building</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Tracker */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Subscription Tracker</span>
                </CardTitle>
                <Badge variant="outline">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-lg font-semibold">
                  Total: $123.97/month
                </div>
                <div className="space-y-3">
                  {subscriptions.map((sub, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <div className="font-medium">{sub.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Next charge: {sub.nextCharge}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium">${sub.amount}/month</div>
                        <Badge variant={
                          sub.difficulty === 'Easy' ? 'default' : 
                          sub.difficulty === 'Medium' ? 'secondary' : 'outline'
                        }>
                          {sub.difficulty}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Quick Export */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Excel (.xlsx)
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button variant="hero" className="w-full justify-start">
                    <Crown className="h-4 w-4 mr-2" />
                    Tax Summary (Premium)
                  </Button>
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle>Direct Integrations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    QuickBooks
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Mint
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    YNAB
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    TurboTax
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;