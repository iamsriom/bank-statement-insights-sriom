import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import ExcelDataTable from "@/components/ExcelDataTable";
import InsightOptions from "@/components/InsightOptions";
import InsightResults from "@/components/InsightResults";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Index = () => {
  console.log('Index component is rendering!');
  
  const [currentStep, setCurrentStep] = useState<'upload' | 'excel' | 'insights' | 'results'>('upload');
  const [processedData, setProcessedData] = useState<any>(null);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);

  console.log('Current step:', currentStep);

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

  try {
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b bg-white">
          <div className="container mx-auto px-4 flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-black">Bank Statement Analyzer</h1>
              {currentStep !== 'upload' && (
                <Button variant="ghost" onClick={handleNewUpload}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  New Upload
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Secure • No Data Stored • AI-Powered
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {currentStep === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-black">Upload Your Bank Statement</h2>
                <p className="text-lg text-gray-600">
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
                <h2 className="text-2xl font-bold text-black">Your Bank Statement Data</h2>
                <p className="text-gray-600">
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
  } catch (error) {
    console.error('Error rendering Index component:', error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600">Check the console for details</p>
        </div>
      </div>
    );
  }
};

export default Index;