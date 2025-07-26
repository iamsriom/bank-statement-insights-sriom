import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Check, AlertCircle, Clock, Coins, Shield, Download, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AuthWrapper } from "./AuthWrapper";
import { useToast } from "@/hooks/use-toast";
import OCRProgressIndicator from "./OCRProgressIndicator";
import * as XLSX from 'xlsx';

interface ProcessedFile {
  file: File;
  status: 'idle' | 'processing' | 'success' | 'error' | 'limit_exceeded';
  progress: number;
  statusMessage: string;
  errorMessage?: string;
  processedData?: any;
}

interface UploadZoneProps {
  onFileUpload?: (files: File[]) => void;
  onProcessedData?: (processedData: any) => void;
  className?: string;
}

const UploadZone = ({ onFileUpload, onProcessedData, className }: UploadZoneProps) => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [remainingConversions, setRemainingConversions] = useState<number | null>(null);
  const { toast } = useToast();

  const processFile = async (file: File, fileIndex: number, authToken?: string) => {
    try {
      // Update file status to processing
      setProcessedFiles(prev => prev.map((pf, i) => 
        i === fileIndex ? { ...pf, status: 'processing', progress: 20, statusMessage: 'Converting file to base64...' } : pf
      ));

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProcessedFiles(prev => prev.map((pf, i) => 
        i === fileIndex ? { ...pf, progress: 40, statusMessage: 'Processing with AI...' } : pf
      ));

      // Call the free PDF processing function
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await supabase.functions.invoke('process-pdf-free', {
        body: {
          file_data: fileData,
          file_name: file.name,
          file_size: file.size
        },
        headers
      });

      if (response.error) {
        if (response.error.message?.includes('limit reached')) {
          setProcessedFiles(prev => prev.map((pf, i) => 
            i === fileIndex ? { 
              ...pf, 
              status: 'limit_exceeded', 
              errorMessage: 'Daily free conversion limit reached. Sign up for unlimited conversions!' 
            } : pf
          ));
          setRemainingConversions(0);
          return;
        }
        throw new Error(response.error.message);
      }

      setProcessedFiles(prev => prev.map((pf, i) => 
        i === fileIndex ? { ...pf, progress: 80, statusMessage: 'Finalizing...' } : pf
      ));

      const data = response.data;
      setRemainingConversions(data.remaining_conversions);

      // Format data for parent component
      const formattedData = {
        sheets: [{
          name: 'Transactions',
          headers: ['Date', 'Description', 'Amount', 'Balance', 'Type'],
          data: data.excel_data.transactions.map((tx: any) => [
            tx.date,
            tx.description,
            tx.amount,
            tx.balance,
            tx.type
          ])
        }],
        metadata: {
          account_info: data.excel_data.account_info,
          date_range: data.excel_data.date_range,
          summary: data.excel_data.summary
        }
      };

      setProcessedFiles(prev => prev.map((pf, i) => 
        i === fileIndex ? { 
          ...pf, 
          status: 'success', 
          progress: 100, 
          statusMessage: 'Processing complete!',
          processedData: formattedData
        } : pf
      ));

      onProcessedData?.(formattedData);

      toast({
        title: "Success!",
        description: data.message || "PDF converted successfully!",
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      setProcessedFiles(prev => prev.map((pf, i) => 
        i === fileIndex ? { 
          ...pf, 
          status: 'error', 
          errorMessage: error.message || 'Failed to process file'
        } : pf
      ));
      toast({
        title: "Processing Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Initialize processed files array
      const newProcessedFiles: ProcessedFile[] = acceptedFiles.map(file => ({
        file,
        status: 'idle',
        progress: 0,
        statusMessage: 'Starting processing...'
      }));
      
      setProcessedFiles(newProcessedFiles);
      onFileUpload?.(acceptedFiles);

      // Get auth token if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      // Process each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        await processFile(acceptedFiles[i], i, authToken);
      }
    }
  }, [onFileUpload, onProcessedData, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: processedFiles.some(pf => pf.status === 'processing'),
  });

  const downloadExcel = (processedData: any, fileName: string) => {
    const wb = XLSX.utils.book_new();
    
    // Add main transactions sheet
    const ws = XLSX.utils.aoa_to_sheet([
      processedData.sheets[0].headers,
      ...processedData.sheets[0].data
    ]);
    
    XLSX.utils.book_append_sheet(wb, ws, processedData.sheets[0].name);
    
    // Add metadata sheet if available
    if (processedData.metadata) {
      const metadataWs = XLSX.utils.json_to_sheet([
        { Field: 'Account Info', Value: JSON.stringify(processedData.metadata.account_info) },
        { Field: 'Date Range', Value: JSON.stringify(processedData.metadata.date_range) },
        { Field: 'Summary', Value: JSON.stringify(processedData.metadata.summary) }
      ]);
      XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
    }
    
    // Generate file name
    const cleanFileName = fileName.replace('.pdf', '') + '.xlsx';
    XLSX.writeFile(wb, cleanFileName);
  };

  const getUploadIcon = (status?: string) => {
    switch (status) {
      case 'processing':
        return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />;
      case 'success':
        return <Check className="h-8 w-8 text-success" />;
      case 'error':
      case 'limit_exceeded':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Upload className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getUploadText = () => {
    return {
      main: isDragActive ? "Drop your PDF statements here" : "Convert PDF statements to Excel",
      sub: "Multiple files supported • 1 free conversion per day • No registration required"
    };
  };

  const handleNewFiles = () => {
    setProcessedFiles([]);
  };

  const handleRetry = async (fileIndex: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;
    
    setProcessedFiles(prev => prev.map((pf, i) => 
      i === fileIndex ? { ...pf, status: 'processing', progress: 0, statusMessage: 'Retrying...', errorMessage: undefined } : pf
    ));
    
    await processFile(processedFiles[fileIndex].file, fileIndex, authToken);
  };

  const text = getUploadText();

  // Show processed files if any
  if (processedFiles.length > 0) {
    return (
      <AuthWrapper>
        {({ user }) => (
          <div className={cn("space-y-4", className)}>
            {processedFiles.map((pFile, index) => (
              <div key={index} className="space-y-4">
                {/* Enhanced Progress Indicator */}
                <OCRProgressIndicator
                  progress={pFile.progress}
                  status={pFile.statusMessage}
                  isComplete={pFile.status === 'success'}
                  hasError={pFile.status === 'error' || pFile.status === 'limit_exceeded'}
                  fileName={pFile.file.name}
                />
                
                {/* Action Cards */}
                <Card className="p-4 bg-gradient-to-r from-card to-card/90 border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {pFile.status === 'success' ? '✅' : 
                         pFile.status === 'error' ? '❌' : 
                         pFile.status === 'limit_exceeded' ? '⏱️' : '⏳'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{pFile.file.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {pFile.status === 'success' ? 'Ready for download' :
                           pFile.status === 'error' ? 'Processing failed' :
                           pFile.status === 'limit_exceeded' ? 'Daily limit reached' :
                           'Processing...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {pFile.status === 'success' && pFile.processedData && (
                        <Button 
                          onClick={() => downloadExcel(pFile.processedData, pFile.file.name)}
                          className="bg-gradient-success hover:shadow-glow transition-all duration-300"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Excel
                        </Button>
                      )}
                      {pFile.status === 'error' && (
                        <Button 
                          onClick={() => handleRetry(index)}
                          variant="outline"
                          size="sm"
                          className="hover:bg-primary/10 hover:border-primary"
                        >
                          🔄 Retry
                        </Button>
                      )}
                      {pFile.status === 'limit_exceeded' && (
                        <Button 
                          onClick={() => window.location.href = '/auth?mode=signup'}
                          className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
                          size="sm"
                        >
                          ⭐ Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {pFile.status === 'error' && pFile.errorMessage && (
                    <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-destructive text-sm font-medium">❌ {pFile.errorMessage}</p>
                    </div>
                  )}
                  
                  {pFile.status === 'limit_exceeded' && (
                    <div className="mt-4 bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-warning">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          🚀 Upgrade for unlimited conversions + AI analysis!
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ))}
            
            <div className="text-center">
              <Button onClick={handleNewFiles} variant="outline">
                Process More Statements
              </Button>
            </div>
            
            {!user && processedFiles.some(pf => pf.status === 'success') && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Coins className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Sign up for unlimited conversions + AI analysis
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </AuthWrapper>
    );
  }

  // Default upload zone
  return (
    <AuthWrapper>
      {({ user }) => (
        <div className={cn("w-full", className)}>
          <Card 
            className="relative overflow-hidden shadow-elegant border-primary/20 bg-gradient-to-br from-card to-card/80 hover:shadow-glow transition-all duration-500"
          >
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-primary bg-gradient-to-br from-primary/10 to-primary-glow/5 scale-[1.02] shadow-glow' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30 hover:shadow-elegant'
              } bg-gradient-to-br from-background to-muted/20`}
            >
              <input {...getInputProps()} />
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className={`relative transition-all duration-300 ${isDragActive ? 'scale-110' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20 animate-pulse"></div>
                    <div className="relative">
                      {getUploadIcon()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    {text.main}
                  </h3>
                  <p className="text-muted-foreground font-medium text-lg">{text.sub}</p>
                </div>
                
                <div className="space-y-6">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-primary/30 hover:bg-primary/10 hover:border-primary transition-all duration-300 group shadow-elegant hover:shadow-glow h-14 px-10 text-lg"
                  >
                    <Upload className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                    Choose PDF Files
                  </Button>
                  
                  {!user && (
                    <div className="relative group max-w-2xl mx-auto">
                      <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <div 
                        className="relative bg-gradient-to-r from-primary/5 via-primary-glow/5 to-accent/5 border border-primary/30 rounded-2xl p-6 hover:shadow-glow transition-all duration-500 cursor-pointer group-hover:scale-[1.02]"
                        onClick={() => window.location.href = '/auth?mode=signup'}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-3">
                            <Coins className="h-6 w-6 text-primary animate-pulse" />
                            <span className="text-primary font-bold text-lg">Unlock AI-Powered Financial Insights</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-success rounded-full"></div>
                              <span>Advanced Fraud Detection</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <span>Smart Categorization</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              <span>Spending Trend Analysis</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-warning rounded-full"></div>
                              <span>Tax Optimization</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Security badges */}
            <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground mt-6 pb-4">
              <div className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-full">
                <Shield className="h-4 w-4 text-success" />
                <span className="font-medium">Bank-Grade Security</span>
              </div>
              <div className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-full">
                <div className="h-4 w-4 text-primary">🔒</div>
                <span className="font-medium">End-to-End Encrypted</span>
              </div>
              <div className="flex items-center space-x-2 bg-muted/30 px-3 py-2 rounded-full">
                <FileText className="h-4 w-4 text-accent" />
                <span className="font-medium">Instant Excel Export</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </AuthWrapper>
  );
};

export default UploadZone;