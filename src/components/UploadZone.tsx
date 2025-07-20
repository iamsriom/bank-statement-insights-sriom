import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Check, Camera, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileUpload?: (file: File) => void;
  className?: string;
}

const UploadZone = ({ onFileUpload, className }: UploadZoneProps) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setUploadStatus('uploading');
      
      // Simulate upload process
      setTimeout(() => {
        setUploadStatus('success');
        onFileUpload?.(file);
      }, 1500);
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
  });

  const getUploadIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
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
      case 'uploading':
        return {
          main: "Processing your statement...",
          sub: "This may take a few moments"
        };
      case 'success':
        return {
          main: "Statement uploaded successfully!",
          sub: `${uploadedFile?.name} • ${(uploadedFile?.size || 0 / 1024 / 1024).toFixed(1)} MB`
        };
      case 'error':
        return {
          main: "Upload failed",
          sub: "Please try again or choose a different file"
        };
      default:
        return {
          main: isDragActive ? "Drop your statement here" : "Drag & drop your bank statement",
          sub: "Supports PDF, PNG, JPG files up to 10MB"
        };
    }
  };

  const text = getUploadText();

  return (
    <Card 
      {...getRootProps()} 
      className={cn(
        "relative overflow-hidden border-2 border-dashed cursor-pointer transition-all duration-300",
        isDragActive && !isDragReject && "border-primary bg-primary/5 scale-102",
        isDragReject && "border-destructive bg-destructive/5",
        uploadStatus === 'success' && "border-success bg-success/5",
        uploadStatus === 'error' && "border-destructive bg-destructive/5",
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
              <FileText className="h-4 w-4" />
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

        {uploadStatus === 'success' && (
          <Button variant="hero" size="lg" className="animate-scale-in">
            Continue to Analysis
          </Button>
        )}

        {uploadStatus === 'error' && (
          <Button 
            variant="outline" 
            size="lg" 
            onClick={(e) => {
              e.stopPropagation();
              setUploadStatus('idle');
              setUploadedFile(null);
            }}
          >
            Try Again
          </Button>
        )}
      </div>

      {/* Security badges */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span>Bank-level encryption</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span>No data stored</span>
        </div>
      </div>
    </Card>
  );
};

export default UploadZone;