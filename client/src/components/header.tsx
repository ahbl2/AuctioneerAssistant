import { Gavel, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Gavel className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BidFT</h1>
                <p className="text-xs text-muted-foreground -mt-1">Auction Search</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a 
                href="#" 
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                data-testid="link-search"
              >
                Search
              </a>
              <a 
                href="#" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-my-bids"
              >
                My Bids
              </a>
              <a 
                href="#" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-watchlist"
              >
                Watchlist
              </a>
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
          </div>
        </div>
      </div>
    </header>
  );
}
