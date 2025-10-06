import { Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">About BidFT</h3>
            <p className="text-sm text-muted-foreground">
              Advanced search platform for FTA auction items with full-text filtering and location-based search.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Full-text Search
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Location Filters
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Daily Email Alerts
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Watchlist
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Download</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://play.google.com/store/apps/details?id=com.ftakit"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-android-app"
                >
                  Android App
                </a>
              </li>
              <li>
                <a
                  href="https://itunes.apple.com/app/apple-store/id1168501703"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-ios-app"
                >
                  iOS App
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@bidft.auction"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center"
                  data-testid="link-email-support"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 BidFT Auction. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
