import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import UploadZone from "@/components/UploadZone";
import { ArrowLeft, FileText, Brain, Zap, CheckCircle, Download } from "lucide-react";

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [excelReady, setExcelReady] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

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
      </div>
    </div>
  );
};

export default Upload;