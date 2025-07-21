
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface OCRProgressIndicatorProps {
  progress: number;
  status: string;
  isComplete: boolean;
  hasError: boolean;
  fileName: string;
}

const OCRProgressIndicator = ({ 
  progress, 
  status, 
  isComplete, 
  hasError, 
  fileName 
}: OCRProgressIndicatorProps) => {
  const getIcon = () => {
    if (hasError) return <AlertCircle className="h-6 w-6 text-destructive" />;
    if (isComplete) return <CheckCircle className="h-6 w-6 text-success" />;
    return <Brain className="h-6 w-6 text-primary animate-pulse" />;
  };

  const getStatusColor = () => {
    if (hasError) return "destructive";
    if (isComplete) return "default";
    return "secondary";
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div className="flex-1">
              <h3 className="font-semibold">
                {hasError ? "Processing Failed" : isComplete ? "Processing Complete" : "Processing Document"}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
              </p>
            </div>
            <Badge variant={getStatusColor()}>
              {hasError ? "Error" : isComplete ? "Complete" : "Processing"}
            </Badge>
          </div>

          {/* Progress Bar */}
          {!hasError && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          )}

          {/* Processing Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className={`flex items-center space-x-1 ${progress >= 20 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 20 ? 'bg-primary' : 'bg-muted'}`} />
              <span>Document Upload</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 50 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 50 ? 'bg-primary' : 'bg-muted'}`} />
              <span>OCR Processing</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 80 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 80 ? 'bg-primary' : 'bg-muted'}`} />
              <span>Data Structuring</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 95 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 95 ? 'bg-primary' : 'bg-muted'}`} />
              <span>Finalizing</span>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
            <div>
              <div className="font-medium">OCR Engine</div>
              <div className="flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>Mistral Document OCR</span>
              </div>
            </div>
            <div>
              <div className="font-medium">Processing</div>
              <div>AI-Powered Analysis</div>
            </div>
          </div>

          {/* Cache Status */}
          {isComplete && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span>Results cached for faster future processing</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRProgressIndicator;
