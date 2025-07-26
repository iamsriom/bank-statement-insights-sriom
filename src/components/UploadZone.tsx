import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Check, AlertCircle, Clock, Coins, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { AuthWrapper } from "./AuthWrapper";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFileUpload?: (file: File) => void;
  onProcessedData?: (processedData: any) => void;
  className?: string;
}

const UploadZone = ({ onFileUpload, onProcessedData, className }: UploadZoneProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error' | 'limit_exceeded'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingConversions, setRemainingConversions] = useState<number | null>(null);
  const { toast } = useToast();

  const processFile = async (file: File, authToken?: string) => {
    try {
      setProgress(20);
      setStatusMessage('Converting file to base64...');

      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProgress(40);
      setStatusMessage('Processing with AI...');

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
          setUploadStatus('limit_exceeded');
          setRemainingConversions(0);
          setErrorMessage('Daily free conversion limit reached. Sign up for unlimited conversions!');
          return;
        }
        throw new Error(response.error.message);
      }

      setProgress(80);
      setStatusMessage('Finalizing...');

      const data = response.data;
      setProgress(100);
      setStatusMessage('Processing complete!');
      setUploadStatus('success');
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

      onProcessedData?.(formattedData);

      toast({
        title: "Success!",
        description: data.message || "PDF converted successfully!",
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Failed to process file');
      toast({
        title: "Processing Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setUploadStatus('processing');
      setProgress(0);
      setStatusMessage('Starting processing...');
      setErrorMessage(null);
      
      onFileUpload?.(file);

      // Get auth token if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      await processFile(file, authToken);
    }
  }, [onFileUpload, onProcessedData, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadStatus === 'processing',
  });

  const getUploadIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />;
      case 'success':
        return <Check className="h-12 w-12 text-success" />;
      case 'error':
      case 'limit_exceeded':
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      default:
        return <Upload className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getUploadText = () => {
    switch (uploadStatus) {
      case 'processing':
        return {
          main: "Processing your statement...",
          sub: statusMessage
        };
      case 'success':
        return {
          main: "Statement processed successfully!",
          sub: `${uploadedFile?.name} • Free conversion used`
        };
      case 'limit_exceeded':
        return {
          main: "Daily limit reached",
          sub: "Sign up for unlimited conversions!"
        };
      case 'error':
        return {
          main: "Processing failed",
          sub: errorMessage || "Please try again or choose a different file"
        };
      default:
        return {
          main: isDragActive ? "Drop your PDF statement here" : "Upload your PDF bank statement",
          sub: "1 free conversion per day • No registration required"
        };
    }
  };

  const handleNewFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setErrorMessage(null);
  };

  const handleRetry = async () => {
    if (uploadedFile) {
      setUploadStatus('processing');
      setProgress(0);
      setStatusMessage('Retrying...');
      setErrorMessage(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      await processFile(uploadedFile, authToken);
    }
  };

  const text = getUploadText();

  // Show processing progress
  if (uploadStatus === 'processing') {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-8">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              {getUploadIcon()}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{text.main}</h3>
              <p className="text-muted-foreground">{text.sub}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {progress}% complete
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show success state
  if (uploadStatus === 'success') {
    return (
      <AuthWrapper>
        {({ user }) => (
          <div className={cn("space-y-4", className)}>
            <Card className="p-8">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  {getUploadIcon()}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{text.main}</h3>
                  <p className="text-muted-foreground">{text.sub}</p>
                </div>
                {!user && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Next free conversion available tomorrow
                      </span>
                    </div>
                  </div>
                )}
                <Button onClick={handleNewFile} variant="outline">
                  Process Another Statement
                </Button>
              </div>
            </Card>
          </div>
        )}
      </AuthWrapper>
    );
  }

  // Show limit exceeded state
  if (uploadStatus === 'limit_exceeded') {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-8">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              {getUploadIcon()}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{text.main}</h3>
              <p className="text-muted-foreground">{text.sub}</p>
            </div>
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Next free conversion available tomorrow
                  </span>
                </div>
              </div>
              <div className="flex space-x-4 justify-center">
                <Button onClick={() => window.location.href = '/auth'} variant="default">
                  Sign Up for Unlimited
                </Button>
                <Button onClick={handleNewFile} variant="outline">
                  Try Tomorrow
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state
  if (uploadStatus === 'error') {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="p-8">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              {getUploadIcon()}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{text.main}</h3>
              <p className="text-muted-foreground">{text.sub}</p>
            </div>
            <div className="flex space-x-4 justify-center">
              <Button onClick={handleNewFile} variant="outline">
                Try Different File
              </Button>
              <Button onClick={handleRetry} variant="default">
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
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