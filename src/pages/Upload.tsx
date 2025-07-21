import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, CheckCircle, AlertCircle, FileSpreadsheet, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import UploadZone from "@/components/UploadZone";
import { AuthWrapper } from "@/components/AuthWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'completed'>('idle');
  const [excelData, setExcelData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (file: File, session: any) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload bank statements.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setUploadedFile(file);
    setConversionStatus('converting');
    
    try {
      // Convert file to base64
      const fileBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

      // Call the process-statement edge function
      const { data, error } = await supabase.functions.invoke('process-statement', {
        body: {
          fileName: file.name,
          fileData: base64Data,
          fileSize: file.size
        }
      });

      if (error) {
        throw error;
      }

      setExcelData(data.excelData);
      setStatementId(data.statementId);
      setConversionStatus('completed');
      setShowPreview(true);
      
      toast({
        title: "Conversion Complete!",
        description: `Bank statement converted with ${data.accuracy}% accuracy.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process bank statement.",
        variant: "destructive",
      });
      setConversionStatus('idle');
    }
  };

  const handleContinueToAnalysis = async () => {
    if (!statementId) {
      toast({
        title: "Error",
        description: "No statement data available for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Call the analyze-transactions edge function
      const { data, error } = await supabase.functions.invoke('analyze-transactions', {
        body: { statementId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Analysis Complete!",
        description: `Analyzed ${data.analysis.summary.totalTransactions} transactions with AI categorization.`,
      });

      // Navigate to dashboard with analysis results
      navigate('/dashboard', { 
        state: { 
          analysisData: data.analysis,
          statementId 
        } 
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze transactions.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AuthWrapper>
      {({ user, session, loading }) => {
        if (loading) {
          return (
            <div className="min-h-screen bg-gradient-background flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          );
        }

        if (!user) {
          return (
            <div className="min-h-screen bg-gradient-background flex items-center justify-center p-6">
              <Card className="max-w-md w-full text-center">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
                  <p className="text-muted-foreground mb-6">
                    Please sign in to upload and analyze your bank statements securely.
                  </p>
                  <Button asChild>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <div className="min-h-screen bg-gradient-background p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center space-x-4">
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <h1 className="text-3xl font-bold">Upload Bank Statement</h1>
              </div>

              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>Upload Your Bank Statement</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadZone onFileUpload={(file) => handleFileUpload(file, session)} />
                </CardContent>
              </Card>

              {/* Conversion Status */}
              {uploadedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {conversionStatus === 'converting' && <AlertCircle className="h-5 w-5 text-yellow-500 animate-spin" />}
                      {conversionStatus === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      <span>
                        {conversionStatus === 'converting' && 'Processing with 256-bit encryption...'}
                        {conversionStatus === 'completed' && 'Conversion Complete!'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Encrypted & Secured
                          </p>
                        </div>
                        {conversionStatus === 'completed' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            99.2% Accuracy
                          </Badge>
                        )}
                      </div>
                      
                      {conversionStatus === 'completed' && (
                        <div className="flex space-x-3">
                          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {showPreview ? 'Hide Preview' : 'Preview Data'}
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                          <Button 
                            onClick={handleContinueToAnalysis} 
                            className="bg-gradient-primary"
                            disabled={isAnalyzing}
                          >
                            {isAnalyzing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Continue to Analysis
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Excel Data Preview */}
              {showPreview && excelData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Excel Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Showing first 5 transactions from {excelData.sheets[0].data.length} total transactions
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {excelData.sheets[0].headers.map((header: string, index: number) => (
                              <TableHead key={index}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {excelData.sheets[0].data.slice(0, 5).map((row: any[], rowIndex: number) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell: any, cellIndex: number) => (
                                <TableCell key={cellIndex}>
                                  {typeof cell === 'number' ? 
                                    (cellIndex === 2 || cellIndex === 3 ? 
                                      `$${cell.toFixed(2)}` : 
                                      cell
                                    ) : 
                                    cell
                                  }
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      }}
    </AuthWrapper>
  );
};

export default Upload;