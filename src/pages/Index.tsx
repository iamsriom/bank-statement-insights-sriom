import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import ExcelDataTable from "@/components/ExcelDataTable";
import InsightOptions from "@/components/InsightOptions";
import InsightResults from "@/components/InsightResults";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'excel' | 'insights' | 'results'>('upload');
  const [processedData, setProcessedData] = useState<any>(null);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file.name);
  };

  const handleProcessedData = (data: any) => {
    console.log('Data processed:', data);
    setProcessedData(data);
    setCurrentStep('excel');
  };

  const handleContinueToInsights = () => {
    setCurrentStep('insights');
  };

  const handleInsightGenerated = (insight: any) => {
    setSelectedInsight(insight);
    setCurrentStep('results');
  };

  const handleBackToInsights = () => {
    setCurrentStep('insights');
    setSelectedInsight(null);
  };

  const handleNewUpload = () => {
    setCurrentStep('upload');
    setProcessedData(null);
    setSelectedInsight(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Bank Statement Analyzer</h1>
            {currentStep !== 'upload' && (
              <Button variant="ghost" onClick={handleNewUpload}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                New Upload
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Secure • No Data Stored • AI-Powered
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {currentStep === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Upload Your Bank Statement</h2>
              <p className="text-lg text-muted-foreground">
                Convert your bank statement to Excel format and get AI-powered financial insights
              </p>
            </div>
            <UploadZone 
              onFileUpload={handleFileUpload}
              onProcessedData={handleProcessedData}
            />
          </div>
        )}

        {currentStep === 'excel' && processedData && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Your Bank Statement Data</h2>
              <p className="text-muted-foreground">
                Review and edit your transaction data below
              </p>
            </div>
            <ExcelDataTable 
              excelData={processedData}
              onDataUpdate={setProcessedData}
            />
            <div className="flex justify-center">
              <Button size="lg" onClick={handleContinueToInsights}>
                Get AI Financial Insights
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'insights' && processedData && (
          <InsightOptions 
            transactions={processedData.transactions || processedData.sheets[0].data}
            onInsightGenerated={handleInsightGenerated}
          />
        )}

        {currentStep === 'results' && selectedInsight && (
          <InsightResults 
            insight={selectedInsight}
            onBack={handleBackToInsights}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
