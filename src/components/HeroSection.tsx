import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadZone from "./UploadZone";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";

const HeroSection = () => {
  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name);
    // Handle file upload logic here - could redirect to upload page
    window.location.href = '/upload';
  };

  const handleProcessedData = (data: any) => {
    console.log("Data processed on homepage:", data);
    // Could store in session/localStorage and redirect to results
    sessionStorage.setItem('processedData', JSON.stringify(data));
    window.location.href = '/upload';
  };

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Content */}
        <div className="text-center space-y-8 mb-12">
          <Badge variant="secondary" className="mx-auto">
            <Zap className="h-3 w-3 mr-1" />
            AI-Powered Analysis
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Turn Bank Statements into{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Insights
            </span>{" "}
            in Seconds
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Upload your bank statement and get instant analysis, spending insights, 
            tax deductions, and subscription tracking. No signup required.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              <span>Client-side processing</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              <span>Microsoft TrOCR</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Zap className="h-4 w-4 text-success" />
              <span>No server upload</span>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="max-w-2xl mx-auto mb-8">
          <UploadZone 
            onFileUpload={handleFileUpload}
            onProcessedData={handleProcessedData}
          />
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Try Free - No signup required
          </p>
          
          <Button variant="outline" size="lg" className="group" onClick={() => window.location.href = '/auth?mode=signup'}>
            Get Started for Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">Client-side</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">0 Upload</div>
            <div className="text-sm text-muted-foreground">To Server</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">&lt; 30s</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">95%+</div>
            <div className="text-sm text-muted-foreground">TrOCR Accuracy</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
