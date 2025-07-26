
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadZone from "./UploadZone";
import { ArrowRight, Shield, Zap, TrendingUp, Brain, CreditCard, Search } from "lucide-react";
import { AuthWrapper } from "./AuthWrapper";

const HeroSection = () => {
  return (
    <AuthWrapper>
      {({ user }) => (
        <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            {/* Hero Content */}
            <div className="text-center space-y-8 mb-12">
              <Badge variant="secondary" className="mx-auto">
                <Brain className="h-3 w-3 mr-1" />
                Privacy-First AI Analysis
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Transform Your Bank Statements into{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Actionable Insights
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                AI-powered financial analysis with complete privacy. No data storage, 
                bank-level security, credit-based system for advanced insights.
              </p>

              {/* Feature highlights */}
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Shield className="h-4 w-4 text-success" />
                  <span>100% Private Processing</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Brain className="h-4 w-4 text-success" />
                  <span>AI-Powered Analysis</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4 text-success" />
                  <span>Credit-Based System</span>
                </div>
              </div>
            </div>

            {user ? (
              /* Authenticated User - Show Upload Zone */
              <div className="max-w-2xl mx-auto mb-8">
                <UploadZone />
              </div>
            ) : (
              /* Unauthenticated User - Show Sign In CTA */
              <div className="text-center space-y-6 mb-8">
                <div className="bg-muted/50 border border-border rounded-lg p-8 max-w-md mx-auto">
                  <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Get Started with 5 Free Credits</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Sign in to start analyzing your bank statements with AI
                  </p>
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="w-full group"
                    onClick={() => window.location.href = '/auth?mode=signup'}
                  >
                    Sign In to Get Started
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            )}

            {/* AI Analysis Features Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              <div className="text-center p-6 border border-border rounded-lg">
                <Search className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Tax Deduction Finder</h3>
                <p className="text-sm text-muted-foreground">Auto-identify ALL deductible expenses with AI</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">2 credits</span>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Loan Application Package</h3>
                <p className="text-sm text-muted-foreground">Professional summaries lenders require</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">2 credits</span>
              </div>
              
              <div className="text-center p-6 border border-border rounded-lg">
                <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Subscription Audit</h3>
                <p className="text-sm text-muted-foreground">Find forgotten subscriptions and duplicates</p>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">1 credit</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">0 Storage</div>
                <div className="text-sm text-muted-foreground">Complete Privacy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">Bank-Level</div>
                <div className="text-sm text-muted-foreground">Security</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">&lt; 30s</div>
                <div className="text-sm text-muted-foreground">AI Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">5 Free</div>
                <div className="text-sm text-muted-foreground">Credits</div>
              </div>
            </div>
          </div>
        </section>
      )}
    </AuthWrapper>
  );
};

export default HeroSection;
