import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Target, 
  Settings, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  PieChart,
  Receipt,
  TrendingUp,
  Shield
} from "lucide-react";

interface CategorizationOptionsProps {
  onContinueAnalysis: (options: CategorizationConfig) => void;
  totalTransactions: number;
  isLoading?: boolean;
}

interface CategorizationConfig {
  mode: 'smart' | 'detailed' | 'custom';
  includeTaxAnalysis: boolean;
  includeSubscriptions: boolean;
  includeFinancialHealth: boolean;
  customCategories?: string[];
}

const CategorizationOptions = ({ 
  onContinueAnalysis, 
  totalTransactions, 
  isLoading = false 
}: CategorizationOptionsProps) => {
  const [config, setConfig] = useState<CategorizationConfig>({
    mode: 'smart',
    includeTaxAnalysis: true,
    includeSubscriptions: true,
    includeFinancialHealth: true,
    customCategories: []
  });

  const categorizationModes = [
    {
      id: 'smart',
      name: 'Smart Auto-Categorization',
      description: 'AI automatically categorizes using merchant patterns and transaction history',
      icon: Brain,
      features: ['95%+ accuracy', 'Merchant recognition', 'Pattern learning'],
      recommended: true
    },
    {
      id: 'detailed',
      name: 'Detailed Analysis',
      description: 'Comprehensive categorization with subcategories and spending insights',
      icon: Target,
      features: ['Subcategories', 'Spending trends', 'Detailed insights'],
      recommended: false
    },
    {
      id: 'custom',
      name: 'Custom Categories',
      description: 'Define your own categories for personalized financial tracking',
      icon: Settings,
      features: ['Custom rules', 'Personal categories', 'Manual control'],
      recommended: false
    }
  ];

  const analysisFeatures = [
    {
      id: 'includeTaxAnalysis',
      name: 'Tax Deduction Analysis',
      description: 'Identify potential tax-deductible expenses and generate tax reports',
      icon: Receipt,
      premium: false
    },
    {
      id: 'includeSubscriptions',
      name: 'Subscription Tracking',
      description: 'Detect recurring payments and subscription management insights',
      icon: Target,
      premium: false
    },
    {
      id: 'includeFinancialHealth',
      name: 'Financial Health Score',
      description: 'Calculate your financial wellness score with actionable insights',
      icon: TrendingUp,
      premium: false
    }
  ];

  const handleFeatureToggle = (featureId: keyof CategorizationConfig) => {
    setConfig(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const handleContinue = () => {
    onContinueAnalysis(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="h-5 w-5" />
          <span>Choose Your Analysis Type</span>
          <Badge variant="outline" className="ml-2">
            {totalTransactions} transactions ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categorization Mode Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Categorization Method</h3>
          <RadioGroup 
            value={config.mode} 
            onValueChange={(value) => setConfig(prev => ({ ...prev, mode: value as any }))}
            className="space-y-3"
          >
            {categorizationModes.map((mode) => (
              <div key={mode.id} className="relative">
                <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <RadioGroupItem value={mode.id} id={mode.id} />
                  <Label htmlFor={mode.id} className="flex-1 cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <mode.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{mode.name}</h4>
                          {mode.recommended && (
                            <Badge variant="default" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {mode.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Analysis Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Additional Analysis Features</h3>
          <div className="space-y-3">
            {analysisFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center space-x-3 p-4 border border-border rounded-lg">
                <Checkbox
                  id={feature.id}
                  checked={config[feature.id as keyof CategorizationConfig] as boolean}
                  onCheckedChange={() => handleFeatureToggle(feature.id as keyof CategorizationConfig)}
                />
                <Label htmlFor={feature.id} className="flex-1 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className="bg-secondary p-2 rounded-lg">
                      <feature.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{feature.name}</h4>
                        {feature.premium && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button 
            onClick={handleContinue} 
            disabled={isLoading}
            className="bg-gradient-primary min-w-40"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Start Analysis
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Analysis Summary */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <strong>Analysis will include:</strong> {config.mode} categorization
            {config.includeTaxAnalysis && ', tax analysis'}
            {config.includeSubscriptions && ', subscription tracking'}
            {config.includeFinancialHealth && ', financial health score'}
            <br />
            <strong>Processing time:</strong> ~30-60 seconds for {totalTransactions} transactions
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategorizationOptions;