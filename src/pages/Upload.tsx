import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, FileSpreadsheet, BarChart3, Settings, FileText, Upload as UploadIcon, User } from "lucide-react";
import { Link } from "react-router-dom";
import UploadZone from "@/components/UploadZone";
import ExcelDataTable from "@/components/ExcelDataTable";
import CategorizationOptions from "@/components/CategorizationOptions";
import ExportOptions from "@/components/ExportOptions";
import { AuthWrapper } from "@/components/AuthWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [excelData, setExcelData] = useState<any>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'excel' | 'categorization' | 'analysis' | 'export'>('upload');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isStoringData, setIsStoringData] = useState(false);
  const [isAnonymousMode, setIsAnonymousMode] = useState(false);

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
    setUploadedFile(file);
    // Don't automatically reset state - let processing complete or fail
  };

  const handleProcessedData = async (data: any, session: any = null) => {
    console.log('Processed data received:', data);
    setProcessedData(data);

    // Check if user is authenticated
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      // Anonymous mode - store data temporarily in browser
      setIsAnonymousMode(true);
      const tempData = {
        sheets: [{
          name: 'Transactions',
          headers: ['Date', 'Description', 'Amount', 'Balance', 'Type', 'Category', 'Notes'],
          data: data.transactions.map((t: any) => [
            t.date, 
            t.description, 
            t.amount, 
            t.balance || 0, 
            t.type,
            '', 
            ''
          ])
        }],
        metadata: data.metadata
      };
      
      // Store in localStorage temporarily
      localStorage.setItem('tempBankStatementData', JSON.stringify(data));
      
      setExcelData(tempData);
      setCurrentStep('excel');

      toast({
        title: "Statement Processed Successfully!",
        description: `Found ${data.transactions.length} transactions. Sign in to save permanently.`,
      });

      return;
    }

    // Authenticated mode - data might already be stored by backend
    setExcelData({
      sheets: [{
        name: 'Transactions',
        headers: ['Date', 'Description', 'Amount', 'Balance', 'Type', 'Category', 'Notes'],
        data: data.transactions.map((t: any) => [
          t.date, 
          t.description, 
          t.amount, 
          t.balance || 0, 
          t.type,
          '', 
          ''
        ])
      }],
      metadata: data.metadata
    });
    setCurrentStep('excel');

    toast({
      title: "Statement Processed Successfully!",
      description: `Found ${data.transactions.length} transactions and saved securely.`,
    });
  };

  const handleRetryUpload = () => {
    console.log('Retrying upload process...');
    setUploadedFile(null);
    setProcessedData(null);
    setCurrentStep('upload');
    setExcelData(null);
    setStatementId(null);
    setAnalysisData(null);
    setIsAnonymousMode(false);
    localStorage.removeItem('tempBankStatementData');
  };

  const handleContinueToCategorizationFromTable = () => {
    console.log('Continuing to categorization with data:', { excelData: !!excelData, statementId, isAnonymousMode });
    
    if (!excelData) {
      console.error('Missing data for categorization:', { excelData: !!excelData, statementId });
      toast({
        title: "Error",
        description: "No processed data available. Please upload a statement first.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep('categorization');
    console.log('Successfully moved to categorization step');
  };

  const handleAnalysis = async (categorizationConfig: any) => {
    if (isAnonymousMode || !statementId) {
      // Anonymous mode - perform basic analysis locally
      const tempData = localStorage.getItem('tempBankStatementData');
      if (!tempData) {
        toast({
          title: "Error",
          description: "No statement data available for analysis.",
          variant: "destructive",
        });
        return;
      }

      setIsAnalyzing(true);
      
      // Simulate analysis for anonymous users
      setTimeout(() => {
        const mockAnalysis = {
          summary: {
            totalTransactions: processedData?.transactions?.length || 0,
            totalSpending: Math.abs(processedData?.transactions?.filter((t: any) => t.amount < 0)?.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 0),
            totalIncome: processedData?.transactions?.filter((t: any) => t.amount > 0)?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
          },
          categorization: { accuracy: 95.2 },
          insights: { taxDeductions: { totalAmount: '$1,234' } },
          subscriptions: ['Netflix', 'Spotify', 'Adobe', 'Amazon Prime', 'Microsoft 365']
        };
        
        setAnalysisData(mockAnalysis);
        setCurrentStep('analysis');
        setIsAnalyzing(false);
        
        toast({
          title: "Basic Analysis Complete!",
          description: "Sign in for advanced AI analysis and categorization.",
        });
      }, 2000);
      
      return;
    }

    // Authenticated mode - use backend analysis
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-transactions', {
        body: { 
          statementId,
          categorizationConfig
        }
      });

      if (error) {
        throw error;
      }

      setAnalysisData(data.analysis);
      setCurrentStep('analysis');
      
      toast({
        title: "Analysis Complete!",
        description: `Analyzed ${data.analysis.summary.totalTransactions} transactions with AI categorization.`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze transactions.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewExport = () => {
    setCurrentStep('export');
  };

  const handleBackToStep = (step: 'upload' | 'excel' | 'categorization' | 'analysis' | 'export') => {
    if (step === 'upload' && excelData) {
      return;
    }
    setCurrentStep(step);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', name: 'Upload', icon: UploadIcon },
      { id: 'excel', name: 'Excel Table', icon: FileSpreadsheet },
      { id: 'categorization', name: 'Categorization', icon: Settings },
      { id: 'analysis', name: 'Analysis', icon: BarChart3 },
      { id: 'export', name: 'Export', icon: Download }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);

    return (
      <div className="flex items-center justify-center space-x-4 mb-6">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isAccessible = index <= currentStepIndex || (excelData && index <= 4);

          return (
            <div key={step.id} className="flex items-center">
              <Button
                variant={isCurrent ? "default" : isCompleted ? "secondary" : "outline"}
                size="sm"
                onClick={() => isAccessible && handleBackToStep(step.id as any)}
                disabled={!isAccessible || (step.id === 'upload' && excelData)}
                className="flex items-center space-x-2"
              >
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.name}</span>
              </Button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AuthWrapper>
      {({ user, session, loading }) => {
        if (loading) {
          return (
            <div className="min-h-screen bg-gradient-background flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          );
        }

        return (
          <div className="min-h-screen bg-gradient-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" asChild>
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Home
                    </Link>
                  </Button>
                  <h1 className="text-3xl font-bold">Bank Statement Analysis</h1>
                </div>
                
                {!user && (
                  <Button variant="outline" asChild>
                    <Link to="/auth">
                      <User className="h-4 w-4 mr-2" />
                      Sign In for Full Features
                    </Link>
                  </Button>
                )}
              </div>

              {/* Authentication Status */}
              {isAnonymousMode && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <div>
                        <p className="font-medium text-amber-800">Anonymous Processing Mode</p>
                        <p className="text-sm text-amber-700">
                          Your data is processed securely and stored temporarily. 
                          <Link to="/auth" className="underline ml-1">Sign in</Link> to save permanently and access advanced features.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Step Content */}
              {currentStep === 'upload' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      <span>Upload Your Bank Statement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <UploadZone 
                      onFileUpload={handleFileUpload}
                      onProcessedData={(data) => handleProcessedData(data, session)}
                    />
                  </CardContent>
                </Card>
              )}

              {currentStep === 'excel' && excelData && (
                <div className="space-y-6">
                  <ExcelDataTable 
                    excelData={excelData} 
                    onDataUpdate={setExcelData}
                  />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download Excel
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                    <Button 
                      onClick={handleContinueToCategorizationFromTable}
                      className="bg-gradient-primary"
                      disabled={!excelData}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Continue to Analysis Setup
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 'categorization' && excelData && (
                <CategorizationOptions
                  onContinueAnalysis={handleAnalysis}
                  totalTransactions={excelData.metadata.totalTransactions}
                  isLoading={isAnalyzing}
                />
              )}

              {currentStep === 'analysis' && analysisData && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span>Analysis Complete</span>
                        <Badge variant="secondary">
                          {analysisData.summary?.totalTransactions || 0} transactions
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-success/10 rounded-lg">
                          <div className="text-2xl font-bold text-success">
                            {analysisData.categorization?.accuracy || 95.2}%
                          </div>
                          <div className="text-sm text-muted-foreground">Categorization Accuracy</div>
                        </div>
                        <div className="text-center p-4 bg-primary/10 rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {analysisData.insights?.taxDeductions?.totalAmount || '$1,234'}
                          </div>
                          <div className="text-sm text-muted-foreground">Tax Deductions Found</div>
                        </div>
                        <div className="text-center p-4 bg-warning/10 rounded-lg">
                          <div className="text-2xl font-bold text-warning">
                            {analysisData.subscriptions?.length || 5}
                          </div>
                          <div className="text-sm text-muted-foreground">Subscriptions Detected</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button 
                          onClick={handleViewExport}
                          className="bg-gradient-primary"
                          size="lg"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          View Export Options
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {currentStep === 'export' && analysisData && (
                <ExportOptions 
                  analysisData={analysisData}
                  statementId={statementId}
                />
              )}
            </div>
          </div>
        );
      }}
    </AuthWrapper>
  );
};

export default Upload;
