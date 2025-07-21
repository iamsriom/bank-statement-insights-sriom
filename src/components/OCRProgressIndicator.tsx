
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileText, Brain, CheckCircle, AlertCircle, Cloud } from "lucide-react";

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
              <span>Extract Text</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 40 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 40 ? 'bg-primary' : 'bg-muted'}`} />
              <span>AI Analysis</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 70 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 70 ? 'bg-primary' : 'bg-muted'}`} />
              <span>MiniCPM-o OCR</span>
            </div>
            <div className={`flex items-center space-x-1 ${progress >= 90 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full ${progress >= 90 ? 'bg-primary' : 'bg-muted'}`} />
              <span>Parse Results</span>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-muted-foreground">
            <div>
              <div className="font-medium">OCR Engine</div>
              <div>MiniCPM-o 2.6</div>
            </div>
            <div>
              <div className="font-medium">Processing</div>
              <div>Hugging Face API</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OCRProgressIndicator;
