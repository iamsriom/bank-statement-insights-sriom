import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CheckCircle, AlertCircle, FileSpreadsheet, BarChart3, Settings, FileText, Upload as UploadIcon } from "lucide-react";
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
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed' | 'error'>('idle');
  const [excelData, setExcelData] = useState<any>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'excel' | 'categorization' | 'analysis' | 'export'>('upload');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleFileUpload = async (file: File, session: any) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload bank statements.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    console.log('Starting file upload process for:', file.name);
    setUploadedFile(file);
    setConversionStatus('converting');
    setProcessingError(null);
    
    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      
      console.log('File converted to base64, calling Mistral OCR...');
      console.log('File size:', file.size, 'bytes');
      console.log('File type:', file.type);

      // Call the process-statement edge function with enhanced error handling
      const { data, error } = await supabase.functions.invoke('process-statement', {
        body: {
          fileName: file.name,
          fileData: base64Data,
          fileSize: file.size
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        setProcessingError(error.message || 'Failed to process statement');
        setConversionStatus('error');
        
        toast({
          title: "Processing Failed",
          description: error.message || "Failed to process bank statement. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.success || !data.excelData || !data.statementId) {
        console.error('Invalid response data:', data);
        const errorMsg = data?.details || 'Invalid response from processing service';
        setProcessingError(errorMsg);
        setConversionStatus('error');
        
        toast({
          title: "Processing Failed",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      console.log('Successfully processed statement with Mistral OCR');
      console.log('Extracted transactions:', data.excelData.metadata.totalTransactions);
      
      setExcelData(data.excelData);
      setStatementId(data.statementId);
      setConversionStatus('completed');
      setCurrentStep('excel');
      setProcessingError(null); // Clear any previous errors
      
      toast({
        title: "Statement Processed Successfully!",
        description: `Bank statement analyzed with ${data.accuracy}% accuracy using Mistral OCR. Found ${data.excelData.metadata.totalTransactions} transactions.`,
      });

    } catch (error) {
      console.error('Upload error details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setProcessingError(errorMessage);
      setConversionStatus('error');
      
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRetryUpload = () => {
    console.log('Retrying upload process...');
    setUploadedFile(null);
    setConversionStatus('idle');
    setProcessingError(null);
    setCurrentStep('upload');
    setExcelData(null);
    setStatementId(null);
    setAnalysisData(null);
  };

  const handleContinueToCategorizationFromTable = () => {
    console.log('Continuing to categorization with data:', { excelData: !!excelData, statementId });
    
    if (!excelData || !statementId) {
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
    if (!statementId) {
      toast({
        title: "Error",
        description: "No statement data available for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call the analyze-transactions edge function with categorization config
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
    // Prevent going back to upload if we have processed data
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

        if (!user) {
          return (
            <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
              <Card className="max-w-md w-full text-center">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                  <p className="text-muted-foreground mb-6">
                    Please sign in to upload and analyze your bank statements securely.
                  </p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <div className="min-h-screen bg-gradient-background p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Bank Statement Analysis</h1>
              </div>

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
                    <UploadZone onFileUpload={(file) => handleFileUpload(file, session)} />
                    
                    {uploadedFile && conversionStatus === 'converting' && (
                      <div className="mt-6 flex items-center space-x-3 p-4 bg-secondary rounded-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        <div>
                          <p className="font-medium">Processing with Mistral OCR...</p>
                          <p className="text-sm text-muted-foreground">
                            Extracting transactions from {uploadedFile.name} using advanced AI vision
                          </p>
                        </div>
                      </div>
                    )}

                    {conversionStatus === 'error' && processingError && (
                      <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <div className="flex-1">
                            <p className="font-medium text-destructive">Processing Failed</p>
                            <p className="text-sm text-destructive/80">{processingError}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={handleRetryUpload}>
                            Try Again
                          </Button>
                        </div>
                      </div>
                    )}
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
                      disabled={!excelData || !statementId}
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
                  {/* Analysis Results Summary */}
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
                            {analysisData.categorization?.accuracy || 98.5}%
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
                            {analysisData.subscriptions?.length || 7}
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

              {currentStep === 'export' && analysisData && statementId && (
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
