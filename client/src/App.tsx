import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/header";
import SearchPage from "@/pages/search";
import CrawlerPage from "@/pages/crawler";
import ResultsPage from "@/pages/results";
import ClosedAuctionsPage from "@/pages/closed-auctions";
import BidFTAuctionClone from "@/pages/bidfta-clone";
import CrawlerClone from "@/pages/crawler-clone";
import ModernSearch from "@/pages/modern-search";
import ModernCrawler from "@/pages/modern-crawler";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ModernSearch} />
      <Route path="/search" component={ModernSearch} />
      <Route path="/modern" component={ModernSearch} />
      <Route path="/crawler" component={ModernCrawler} />
      <Route path="/crawler-classic" component={CrawlerPage} />
      <Route path="/crawler-clone" component={CrawlerClone} />
      <Route path="/results" component={ResultsPage} />
      <Route path="/closed" component={ClosedAuctionsPage} />
      <Route path="/clone" component={BidFTAuctionClone} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Header />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
