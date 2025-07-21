import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft, FileText, Brain, Zap, CheckCircle, Download, Eye } from "lucide-react";

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [excelReady, setExcelReady] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [excelData, setExcelData] = useState<any[]>([]);

  const steps = [
    { name: "Converting", icon: FileText, description: "Converting to Excel format..." },
    { name: "Extracting", icon: Zap, description: "Found 47 transactions..." },
    { name: "Analyzing", icon: Brain, description: "Categorizing expenses..." },
    { name: "Complete", icon: CheckCircle, description: "Excel ready for download!" }
  ];

  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    setUploadedFileName(file.name.replace(/\.[^/.]+$/, ""));
    
    // Simulate processing steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      setProgress((step / steps.length) * 100);
      
      if (step >= steps.length) {
        clearInterval(interval);
        setExcelReady(true);
        // Generate sample Excel data with good accuracy
        const sampleData = [
          { date: "2024-03-15", description: "STARBUCKS STORE #12345", category: "Dining", amount: -5.67, balance: 2150.33 },
          { date: "2024-03-15", description: "PAYROLL DEPOSIT - ACME CORP", category: "Income", amount: 1250.00, balance: 2156.00 },
          { date: "2024-03-14", description: "GROCERY STORE #456", category: "Groceries", amount: -87.45, balance: 906.00 },
          { date: "2024-03-14", description: "ATM WITHDRAWAL", category: "Cash", amount: -100.00, balance: 993.45 },
          { date: "2024-03-13", description: "NETFLIX.COM", category: "Entertainment", amount: -15.99, balance: 1093.45 },
          { date: "2024-03-13", description: "SHELL GAS STATION", category: "Transportation", amount: -45.20, balance: 1109.44 },
          { date: "2024-03-12", description: "AMAZON.COM PURCHASE", category: "Shopping", amount: -123.56, balance: 1154.64 },
          { date: "2024-03-12", description: "DIRECT DEPOSIT", category: "Income", amount: 500.00, balance: 1278.20 },
        ];
        setExcelData(sampleData);
      }
    }, 2000);
  };

  const handleDownloadExcel = () => {
    // Simulate Excel download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${uploadedFileName}_transactions.xlsx`;
    link.click();
  };

  const handleContinueToAnalysis = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StatementPro</span>
          </div>
        </div>

        {!isProcessing ? (
          // Upload Stage
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold">
                Upload Your Bank Statement
              </h1>
              <p className="text-xl text-muted-foreground">
                Drag and drop your PDF or image file to get started with AI-powered analysis
              </p>
            </div>

            <UploadZone onFileUpload={handleFileUpload} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Supports PDF, PNG, JPG</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>Up to 10MB file size</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full" />
                <span>256-bit encryption</span>
              </div>
            </div>
          </div>
        ) : (
          // Processing Stage
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold">
                Processing Your Statement
              </h1>
              <p className="text-xl text-muted-foreground">
                Our AI is analyzing your financial data...
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-6">
              <div className="flex justify-center items-center space-x-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                      index <= currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      <step.icon className="h-4 w-4" />
                      <span className="hidden sm:inline font-medium">{step.name}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 transition-colors duration-300 ${
                        index < currentStep ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              <Progress value={progress} className="w-full h-2" />

              {currentStep < steps.length && (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  <span>{steps[currentStep]?.description}</span>
                </div>
              )}
            </div>

            {/* Processing Animation */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-gradient-primary rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            {/* Excel Download Section */}
            {excelReady && (
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="h-6 w-6 text-success" />
                  <h3 className="font-semibold text-lg">Excel File Ready!</h3>
                </div>
                <p className="text-center text-muted-foreground">
                  Your bank statement has been converted to Excel format with all transactions organized and categorized.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleDownloadExcel}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Excel File</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setShowExcelPreview(true)}
                    className="flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview Excel Data</span>
                  </Button>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleContinueToAnalysis}
                    className="flex items-center space-x-2"
                  >
                    <Brain className="h-4 w-4" />
                    <span>Continue to Analysis</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Tips */}
            {!excelReady && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-left">💡 Did you know?</h3>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>• We convert your statement to Excel format first</li>
                  <li>• All transactions are automatically categorized</li>
                  <li>• Our AI finds potential tax deductions</li>
                  <li>• Duplicate charges are flagged for review</li>
                  <li>• All data is encrypted and deleted after 30 days</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Excel Preview Modal */}
        {showExcelPreview && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Excel Preview - {uploadedFileName}_transactions.xlsx</h2>
                </div>
                <Button variant="ghost" onClick={() => setShowExcelPreview(false)}>
                  ✕
                </Button>
              </div>
              
              <div className="p-6 overflow-auto max-h-[70vh]">
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {excelData.length} transactions with 99.2% accuracy
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelData.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.category === 'Income' ? 'bg-success/10 text-success' :
                            transaction.category === 'Dining' ? 'bg-orange-500/10 text-orange-500' :
                            transaction.category === 'Groceries' ? 'bg-green-500/10 text-green-500' :
                            transaction.category === 'Transportation' ? 'bg-blue-500/10 text-blue-500' :
                            transaction.category === 'Entertainment' ? 'bg-purple-500/10 text-purple-500' :
                            transaction.category === 'Shopping' ? 'bg-pink-500/10 text-pink-500' :
                            'bg-secondary text-secondary-foreground'
                          }`}>
                            {transaction.category}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          transaction.amount > 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">${transaction.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="p-6 border-t bg-muted/30">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleDownloadExcel}
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Excel File</span>
                  </Button>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleContinueToAnalysis}
                    className="flex items-center space-x-2"
                  >
                    <Brain className="h-4 w-4" />
                    <span>Continue to Analysis</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;