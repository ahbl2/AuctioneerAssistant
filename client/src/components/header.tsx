import { Gavel, Download, Mail, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "/", label: "🏠 Modern Search", testId: "link-search" },
    { href: "/search", label: "🔍 Classic Search", testId: "link-classic-search" },
    { href: "/crawler", label: "🤖 Smart Crawler", testId: "link-crawler" },
    { href: "/results", label: "📊 Results", testId: "link-results" },
    { href: "/closed", label: "📈 Closed Auctions", testId: "link-closed" },
    { href: "/clone", label: "🎯 BidFTA Clone", testId: "link-clone" },
    { href: "/crawler-clone", label: "⚙️ Crawler Clone", testId: "link-crawler-clone" },
  ];

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BidFT</h1>
                <p className="text-xs text-muted-foreground -mt-1">Auction Search</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-4">
              {navigationLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  data-testid={link.testId}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="secondary" 
              className="hidden md:inline-flex"
              data-testid="button-get-app"
            >
              <Download className="mr-2 h-4 w-4" />
              Get App
            </Button>
            <Button data-testid="button-sign-up">
              <Mail className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4">
            <nav className="flex flex-col space-y-2">
              {navigationLinks.map((link) => (
                <a 
                  key={link.href}
                  href={link.href} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-muted"
                  data-testid={link.testId}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
