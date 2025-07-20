import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, FileText, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="bg-gradient-primary p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">StatementPro</span>
          </div>

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
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
          </nav>

          {/* Upload Button */}
          <div className="hidden md:block">
            <Button variant="hero" size="lg" onClick={() => navigate("/upload")}>
              <Upload className="h-4 w-4" />
              Upload Statement
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
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
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button variant="hero" onClick={() => navigate("/upload")}>
                <Upload className="h-4 w-4" />
                Upload Statement
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;