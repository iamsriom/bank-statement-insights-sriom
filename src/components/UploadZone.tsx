
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Check, Camera, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import OCRProcessor from "./OCRProcessor";
import OCRProgressIndicator from "./OCRProgressIndicator";

interface UploadZoneProps {
  onFileUpload?: (file: File) => void;
  onProcessedData?: (processedData: any) => void;
  className?: string;
}

const UploadZone = ({ onFileUpload, onProcessedData, className }: UploadZoneProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      console.log('File dropped:', file.name, file.type, file.size);
      setUploadedFile(file);
      setUploadStatus('processing');
      setOcrProgress(0);
      setOcrStatus('Starting document processing...');
      setErrorMessage(null);
      
      // Call the parent component's upload handler
      onFileUpload?.(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadStatus === 'processing', // Prevent new uploads while processing
  });

  const handleOCRProcessed = useCallback((processedData: any) => {
    console.log('Document processing completed:', processedData);
    setUploadStatus('success');
    setOcrProgress(100);
    setOcrStatus(`Successfully extracted ${processedData.transactions.length} transactions`);
    onProcessedData?.(processedData);
  }, [onProcessedData]);

  const handleOCRError = useCallback((error: string) => {
    console.error('Document processing failed:', error);
    setUploadStatus('error');
    setErrorMessage(error);
    setOcrStatus('Processing failed');
  }, []);

  const handleOCRProgress = useCallback((progress: number, status: string) => {
    setOcrProgress(progress);
    setOcrStatus(status);
  }, []);

  const getUploadIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />;
      case 'success':
        return <Check className="h-12 w-12 text-success" />;
      case 'error':
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
          sub: "Extracting transaction data from your document"
        };
      case 'success':
        return {
          main: "Statement processed successfully!",
          sub: `${uploadedFile?.name} • ${((uploadedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB`
        };
      case 'error':
        return {
          main: "Processing failed",
          sub: errorMessage || "Please try again or choose a different file"
        };
      default:
        return {
          main: isDragActive ? "Drop your statement here" : "Drag & drop your bank statement",
          sub: "Supports PDF, PNG, JPG files up to 10MB"
        };
    }
  };

  const text = getUploadText();

  const handleRetry = () => {
    if (uploadedFile) {
      console.log('Retrying processing with same file:', uploadedFile.name);
      setUploadStatus('processing');
      setOcrProgress(0);
      setOcrStatus('Starting document processing...');
      setErrorMessage(null);
      // Don't reset uploadedFile - use the same file for retry
    }
  };

  const handleNewFile = () => {
    console.log('Resetting for new file upload');
    setUploadedFile(null);
    setUploadStatus('idle');
    setOcrProgress(0);
    setOcrStatus('');
    setErrorMessage(null);
  };

  // Show processing progress when processing
  if (uploadStatus === 'processing' && uploadedFile) {
    return (
      <div className={cn("space-y-4", className)}>
        <OCRProgressIndicator
          progress={ocrProgress}
          status={ocrStatus}
          isComplete={false}
          hasError={false}
          fileName={uploadedFile.name}
        />
        <OCRProcessor
          file={uploadedFile}
          onProcessed={handleOCRProcessed}
          onError={handleOCRError}
          onProgress={handleOCRProgress}
        />
      </div>
    );
  }

  // Show success state
  if (uploadStatus === 'success' && uploadedFile) {
    return (
      <div className={cn("space-y-4", className)}>
        <OCRProgressIndicator
          progress={100}
          status={ocrStatus}
          isComplete={true}
          hasError={false}
          fileName={uploadedFile.name}
        />
        <div className="flex justify-center">
          <Button onClick={handleNewFile} variant="outline">
            Process Another Statement
          </Button>
        </div>
      </div>
    );
  }

  // Show error state with retry options
  if (uploadStatus === 'error' && uploadedFile) {
    return (
      <div className={cn("space-y-4", className)}>
        <OCRProgressIndicator
          progress={ocrProgress}
          status={errorMessage || 'Processing failed'}
          isComplete={false}
          hasError={true}
          fileName={uploadedFile.name}
        />
        <div className="flex justify-center space-x-4">
          <Button onClick={handleNewFile} variant="outline">
            Try Different File
          </Button>
          <Button onClick={handleRetry} variant="default">
            Retry Processing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={cn(
        "relative overflow-hidden border-2 border-dashed cursor-pointer transition-all duration-300",
        isDragActive && !isDragReject && "border-primary bg-primary/5 scale-102",
        isDragReject && "border-destructive bg-destructive/5",
        uploadStatus === 'processing' && "pointer-events-none opacity-75",
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

        {uploadStatus === 'idle' && (
          <div className="space-y-4">
            <Button variant="outline" size="lg" className="mx-auto">
              <FileText className="h-4 w-4 mr-2" />
              Browse Files
            </Button>
            
            <div className="flex items-center justify-center space-x-4 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span className="text-sm">Mobile: Take Photo</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security badges */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span>Secure processing</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span>No data stored locally</span>
        </div>
      </div>
    </Card>
  );
};

export default UploadZone;
