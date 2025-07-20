import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  PieChart, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  Shield,
  Zap,
  FileText,
  Search
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced OCR and machine learning automatically categorize and analyze every transaction.",
      badge: "Smart"
    },
    {
      icon: PieChart,
      title: "Spending Insights",
      description: "Interactive charts and breakdowns show exactly where your money goes each month.",
      badge: "Visual"
    },
    {
      icon: Receipt,
      title: "Tax Deductions",
      description: "Automatically identify potential tax deductions and generate IRS-ready reports.",
      badge: "Premium"
    },
    {
      icon: CreditCard,
      title: "Subscription Tracking",
      description: "Find hidden subscriptions, track recurring payments, and get cancellation guides.",
      badge: "Premium"
    },
    {
      icon: TrendingUp,
      title: "Financial Health Score",
      description: "Get a comprehensive score with personalized recommendations for improvement.",
      badge: "Insights"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "256-bit encryption ensures your financial data stays private and secure.",
      badge: "Secure"
    }
  ];

  const quickFeatures = [
    {
      icon: Zap,
      title: "30-Second Processing",
      description: "Get results faster than making coffee"
    },
    {
      icon: FileText,
      title: "Multiple Formats",
      description: "PDF, images, and mobile photos supported"
    },
    {
      icon: Search,
      title: "Smart Detection",
      description: "Finds duplicate charges and unusual spending"
    }
  ];

  return (
    <section id="features" className="py-24 bg-gradient-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="secondary" className="mx-auto">
            <Brain className="h-3 w-3 mr-1" />
            Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Everything you need to understand your finances
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform transforms raw bank statements into actionable insights, 
            helping you make smarter financial decisions.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-elegant transition-all duration-300 hover:scale-105">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="bg-gradient-primary p-3 rounded-lg group-hover:animate-pulse-glow">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <Badge variant={feature.badge === "Premium" ? "default" : "secondary"}>
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Features */}
        <div className="grid md:grid-cols-3 gap-6">
          {quickFeatures.map((feature, index) => (
            <div key={index} className="text-center space-y-3 p-6">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;