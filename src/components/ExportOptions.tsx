import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Receipt, 
  Share2,
  Crown,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportOptionsProps {
  analysisData: any;
  statementId: string;
}

const ExportOptions = ({ analysisData, statementId }: ExportOptionsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportFormats = [
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Complete data with multiple sheets',
      icon: FileSpreadsheet,
      format: '.xlsx',
      premium: false,
      features: ['All transactions', 'Category summary', 'Charts & graphs']
    },
    {
      id: 'csv',
      name: 'CSV File',
      description: 'Simple comma-separated values',
      icon: FileText,
      format: '.csv',
      premium: false,
      features: ['Transaction data', 'Easy import', 'Universal format']
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional formatted report',
      icon: FileText,
      format: '.pdf',
      premium: false,
      features: ['Summary report', 'Charts included', 'Print-ready']
    },
    {
      id: 'tax-summary',
      name: 'Tax Summary',
      description: 'Tax-deductible expenses report',
      icon: Receipt,
      format: '.pdf/.xlsx',
      premium: true,
      features: ['Tax deductions', 'IRS categories', 'Audit trail']
    }
  ];

  const integrations = [
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Direct import to QuickBooks Online',
      logo: '📊',
      premium: false,
      status: 'available'
    },
    {
      id: 'mint',
      name: 'Mint',
      description: 'Sync with Mint account',
      logo: '🌿',
      premium: false,
      status: 'coming-soon'
    },
    {
      id: 'ynab',
      name: 'YNAB',
      description: 'You Need A Budget integration',
      logo: '💰',
      premium: true,
      status: 'available'
    },
    {
      id: 'turbotax',
      name: 'TurboTax',
      description: 'Import tax-deductible expenses',
      logo: '📋',
      premium: true,
      status: 'available'
    }
  ];

  const handleExport = async (formatId: string) => {
    setIsExporting(formatId);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate download based on format
      const fileName = `bank-statement-${statementId}-${formatId}`;
      const format = exportFormats.find(f => f.id === formatId);
      
      toast({
        title: "Export Complete!",
        description: `${format?.name} has been downloaded successfully.`,
      });
      
      // Here you would implement actual file download logic
      console.log(`Exporting ${formatId} for statement ${statementId}`);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export the file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handleIntegration = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    
    if (integration?.status === 'coming-soon') {
      toast({
        title: "Coming Soon",
        description: `${integration.name} integration will be available soon!`,
      });
      return;
    }
    
    toast({
      title: "Integration Started",
      description: `Connecting to ${integration?.name}...`,
    });
    
    // Here you would implement actual integration logic
    console.log(`Integrating with ${integrationId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export & Share</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formats">File Formats</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="formats" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {exportFormats.map((format) => (
                <Card key={format.id} className="border border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <format.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{format.name}</h3>
                            {format.premium && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{format.description}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {format.format}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {format.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      onClick={() => handleExport(format.id)}
                      disabled={isExporting === format.id || (format.premium && false)} // Add premium check
                      className="w-full"
                      variant={format.premium ? "outline" : "default"}
                    >
                      {isExporting === format.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export {format.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="border border-border hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{integration.logo}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{integration.name}</h3>
                            {integration.premium && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {integration.status === 'available' ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleIntegration(integration.id)}
                      disabled={integration.premium && false} // Add premium check
                      className="w-full"
                      variant={integration.status === 'coming-soon' ? "outline" : "default"}
                    >
                      {integration.status === 'coming-soon' ? (
                        'Coming Soon'
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect to {integration.name}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>Export Summary:</strong> {analysisData?.summary?.totalTransactions || 0} transactions analyzed with 
            {analysisData?.categorization?.accuracy || 99.2}% accuracy. All exports include complete transaction data 
            with AI categorization and insights.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportOptions;