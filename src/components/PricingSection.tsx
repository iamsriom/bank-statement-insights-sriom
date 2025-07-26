import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star, Shield } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Free Daily",
      price: "$0",
      period: "forever",
      description: "Perfect for occasional bank statement analysis",
      icon: Shield,
      features: [
        "1 free PDF to Excel conversion per day",
        "Basic transaction extraction",
        "CSV export functionality", 
        "No registration required",
        "Complete privacy - no data stored"
      ],
      limitations: [
        "No AI analysis features",
        "No tax deduction finder",
        "No subscription audit",
        "No loan application tools",
        "No fraud detection"
      ],
      cta: "Start Converting",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Premium",
      price: "$20",
      period: "per month",
      description: "Full AI-powered financial analysis suite",
      icon: Crown,
      features: [
        "Unlimited PDF to Excel conversions",
        "5 AI analysis tools included:",
        "→ Tax Deduction Finder (2 credits)",
        "→ Loan Application Package (2 credits)", 
        "→ Subscription Audit (1 credit)",
        "→ Business Expense Reports (2 credits)",
        "→ Fraud & Anomaly Detection (2 credits)",
        "Monthly credit allowance",
        "Priority processing",
        "Advanced export formats"
      ],
      limitations: [],
      cta: "Start Free Trial",
      variant: "hero" as const,
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mx-auto">
            <Crown className="h-3 w-3 mr-1" />
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Choose the plan that fits your needs
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Start free and upgrade anytime. All plans include bank-level security 
            and our AI-powered analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-primary shadow-glow' : 'hover:shadow-elegant'
              }`}
            >
              {plan.popular && (
                <Badge 
                  variant="default" 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                >
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center space-y-4">
                <div className={`p-3 rounded-lg w-fit mx-auto ${
                  plan.popular ? 'bg-gradient-primary' : 'bg-secondary'
                }`}>
                  <plan.icon className={`h-6 w-6 ${
                    plan.popular ? 'text-primary-foreground' : 'text-foreground'
                  }`} />
                </div>
                
                <div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-base font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <li key={limitationIndex} className="flex items-start space-x-3">
                      <div className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full border-2 border-muted" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  size="lg" 
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>30-day money-back guarantee</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Try premium risk-free. Cancel anytime with one click.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;