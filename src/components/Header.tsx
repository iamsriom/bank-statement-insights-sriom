import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, FileText, Upload, Coins, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthWrapper } from "./AuthWrapper";
import { supabase } from "@/integrations/supabase/client";
import { CreditDisplay } from "./CreditDisplay";
import { UserMenu } from "./UserMenu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <AuthWrapper>
      {({ user, loading }) => (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate("/")}>
                <div className="bg-gradient-primary p-2 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-foreground">BankFlow</span>
                  {user && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Shield className="h-3 w-3" />
                      <span>100% Private - No Data Stored</span>
                    </div>
                  )}
                </div>
              </div>

              {user ? (
                /* Authenticated User Navigation */
                <div className="flex items-center space-x-4">
                  <CreditDisplay userId={user.id} />
                  <UserMenu user={user} onLogout={handleLogout} />
                </div>
              ) : (
                /* Unauthenticated Navigation */
                <>
                  {/* Desktop Navigation */}
                  <nav className="hidden md:flex items-center space-x-8">
                    <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                      Features
                    </a>
                    <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                      Pricing
                    </a>
                    <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
                      Security
                    </a>
                    <Button variant="ghost" onClick={() => navigate("/auth")}>
                      Sign In to Get Started
                    </Button>
                  </nav>

                  {/* Upload Button */}
                  <div className="hidden md:block">
                    <Button variant="hero" size="lg" onClick={() => navigate("/auth?mode=signup")}>
                      <Upload className="h-4 w-4" />
                      Get Started
                    </Button>
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    className="md:hidden p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && !user && (
              <div className="md:hidden py-4 border-t border-border">
                <nav className="flex flex-col space-y-4">
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                  <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </a>
                  <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
                    Security
                  </a>
                  <Button variant="ghost" className="justify-start" onClick={() => navigate("/auth")}>
                    Sign In to Get Started
                  </Button>
                  <Button variant="hero" onClick={() => navigate("/auth?mode=signup")}>
                    <Upload className="h-4 w-4" />
                    Get Started
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </header>
      )}
    </AuthWrapper>
  );
};

export default Header;