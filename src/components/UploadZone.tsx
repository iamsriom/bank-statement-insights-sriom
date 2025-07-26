import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Check, AlertCircle, Clock, Coins, Shield, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AuthWrapper } from "./AuthWrapper";
import { useToast } from "@/hooks/use-toast";
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
      main: isDragActive ? "Drop your PDF statements here" : "Upload your PDF bank statements",
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
              <Card key={index} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getUploadIcon(pFile.status)}
                      <div>
                        <h4 className="font-medium">{pFile.file.name}</h4>
                        <p className="text-sm text-muted-foreground">{pFile.statusMessage}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {pFile.status === 'success' && pFile.processedData && (
                        <Button 
                          onClick={() => downloadExcel(pFile.processedData, pFile.file.name)}
                          variant="outline"
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
                        >
                          Retry
                        </Button>
                      )}
                      {pFile.status === 'limit_exceeded' && (
                        <Button 
                          onClick={() => window.location.href = '/auth'}
                          variant="default"
                          size="sm"
                        >
                          Sign Up
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {pFile.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${pFile.progress}%` }}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground text-center">
                        {pFile.progress}% complete
                      </div>
                    </div>
                  )}
                  
                  {pFile.status === 'error' && pFile.errorMessage && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-destructive text-sm">{pFile.errorMessage}</p>
                    </div>
                  )}
                  
                  {pFile.status === 'limit_exceeded' && (
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">
                          Next free conversion available tomorrow
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
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
        <Card 
          {...getRootProps()} 
          className={cn(
            "relative overflow-hidden border-2 border-dashed cursor-pointer transition-all duration-300",
            isDragActive && !isDragReject && "border-primary bg-primary/5 scale-102",
            isDragReject && "border-destructive bg-destructive/5",
            className
          )}
        >
          <input {...getInputProps()} />
          
          <div className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              {getUploadIcon()}
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{text.main}</h3>
              <p className="text-muted-foreground">{text.sub}</p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" size="lg" className="mx-auto">
                <FileText className="h-4 w-4 mr-2" />
                Browse PDF Files
              </Button>
              
              {!user && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center justify-center space-x-2 text-primary text-sm">
                    <Coins className="h-4 w-4" />
                    <span>Sign up for unlimited conversions + AI analysis</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security badges */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Shield className="w-3 h-3 text-success" />
              <span>100% Private</span>
            </div>
            <div className="flex items-center space-x-1">
              <Check className="w-3 h-3 text-success" />
              <span>No Data Stored</span>
            </div>
          </div>
        </Card>
      )}
    </AuthWrapper>
  );
};

export default UploadZone;