import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Clock, 
  DollarSign, 
  MapPin, 
  ExternalLink, 
  Star, 
  StarOff,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3
} from "lucide-react";

interface EndedAuctionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  currentPrice: string;
  msrp: string;
  location: string;
  facility: string;
  state: string;
  endDate: Date | string;
  condition: string;
  auctionUrl: string;
  amazonSearchUrl: string;
  timeLeft: string;
  bids: number;
  watchers: number;
  lotCode?: string;
  auctionId?: number;
  auctionNumber?: string;
  category1?: string;
  category2?: string;
  brand?: string;
  model?: string;
  endedAt: Date;
  finalPrice: string;
  wasWon: boolean;
}

export default function ClosedAuctionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRule, setSelectedRule] = useState("all");
  const [sortBy, setSortBy] = useState("endedAt");
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);

  const queryClient = useQueryClient();

  // Fetch ended auctions from API
  const { data: endedAuctions = [], isLoading, refetch } = useQuery<EndedAuctionItem[]>({
    queryKey: ["/api/ended-auctions"],
  });

  // Fetch ended auctions stats
  const { data: stats } = useQuery({
    queryKey: ["/api/ended-auctions/stats"],
  });

  // Fetch crawler rules for filtering
  const { data: rules = [] } = useQuery<any[]>({
    queryKey: ["/api/crawler/rules"],
  });

  // Filter and sort ended auctions
  const filteredAuctions = endedAuctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         auction.facility.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRule = selectedRule === "all"; // No rule filtering for ended auctions
    const matchesTracked = !showTrackedOnly || auction.wasWon;
    const matchesWatched = !showWatchedOnly || auction.wasWon;
    
    return matchesSearch && matchesRule && matchesTracked && matchesWatched;
  }).sort((a, b) => {
    switch (sortBy) {
      case "endedAt":
        return new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime();
      case "finalPrice":
        return parseFloat(b.finalPrice) - parseFloat(a.finalPrice);
      case "title":
        return a.title.localeCompare(b.title);
      case "location":
        return a.facility.localeCompare(b.facility);
      default:
        return 0;
    }
  });

  const getPriceTrend = (priceHistory: Array<{price: string, timestamp: string}>) => {
    if (priceHistory.length < 2) return "stable";
    const first = parseFloat(priceHistory[0].price);
    const last = parseFloat(priceHistory[priceHistory.length - 1].price);
    if (last > first) return "up";
    if (last < first) return "down";
    return "stable";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const clearAllClosed = useMutation({
    mutationFn: () => apiRequest("/api/ended-auctions", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ended-auctions"] });
    },
  });

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all ended auctions? This cannot be undone.')) {
      clearAllClosed.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Closed Auctions</h1>
            <p className="text-muted-foreground mt-2">
              View completed auctions and analyze price trends for future bidding strategies.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClearAll} disabled={clearAllClosed.isPending}>
              <Trash2 className="w-4 h-4 mr-2" />
              {clearAllClosed.isPending ? "Clearing..." : "Clear All"}
            </Button>
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Rule</label>
                <Select value={selectedRule} onValueChange={setSelectedRule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rules</SelectItem>
                    {rules.map(rule => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endedAt">End Date (Recent)</SelectItem>
                    <SelectItem value="finalPrice">Final Price (High to Low)</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tracked-only"
                    checked={showTrackedOnly}
                    onCheckedChange={(checked) => setShowTrackedOnly(checked as boolean)}
                  />
                  <label htmlFor="tracked-only" className="text-sm">Tracked Only</label>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watched-only"
                    checked={showWatchedOnly}
                    onCheckedChange={(checked) => setShowWatchedOnly(checked as boolean)}
                  />
                  <label htmlFor="watched-only" className="text-sm">Watched Only</label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Closed ({filteredAuctions.length})</TabsTrigger>
            <TabsTrigger value="tracked">Tracked ({filteredAuctions.filter(a => a.isTracked).length})</TabsTrigger>
            <TabsTrigger value="watched">Watched ({filteredAuctions.filter(a => a.isWatched).length})</TabsTrigger>
            <TabsTrigger value="trending">Price Trends ({filteredAuctions.filter(a => getPriceTrend(a.priceHistory) !== 'stable').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="text-6xl">⏳</div>
                    <h3 className="text-xl font-semibold">Loading Ended Auctions...</h3>
                    <p className="text-muted-foreground">Fetching completed auctions data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : filteredAuctions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="text-6xl">📊</div>
                    <h3 className="text-xl font-semibold">No Ended Auctions Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Ended auctions will appear here once they complete. You can analyze final selling prices and trends.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAuctions.map((auction) => {
                  return (
                    <Card key={auction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <img
                                src={auction.imageUrl}
                                alt={auction.title}
                                className="w-20 h-20 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMzMS4xNjM0IDIwIDI0IDI3LjE2MzQgMjQgMzZDMjQgNDQuODM2NiAzMS4xNjM0IDUyIDQwIDUyQzQ4LjgzNjYgNTIgNTYgNDQuODM2NiA1NiAzNkM1NiAyNy4xNjM0IDQ4LjgzNjYgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkE1Ii8+Cjwvc3ZnPgo=';
                                }}
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-lg font-semibold line-clamp-2">{auction.title}</h3>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Badge variant="outline" className="text-xs">
                                      {formatTimeAgo(auction.endedAt.toISOString())}
                                    </Badge>
                                    <Badge variant="secondary">{auction.condition}</Badge>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {auction.facility}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Ended {formatTimeAgo(auction.endedAt.toISOString())}
                                  </span>
                                  <Badge variant="outline">{auction.condition}</Badge>
                                </div>

                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="text-xl font-bold text-green-600">
                                      ${auction.finalPrice}
                                    </span>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ${auction.msrp}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Savings:</span>
                                    <span className="font-semibold text-green-600">
                                      ${(parseFloat(auction.msrp) - parseFloat(auction.finalPrice)).toFixed(2)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Bids:</span>
                                    <span className="font-medium">{auction.bids}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button asChild>
                              <a href={auction.auctionUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Auction
                              </a>
                            </Button>
                            <Button variant="outline" asChild>
                              <a href={auction.amazonSearchUrl} target="_blank" rel="noopener noreferrer">
                                Compare on Amazon
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracked">
            <div className="space-y-4">
              {filteredAuctions.filter(a => a.isTracked).map((auction) => (
                <Card key={auction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{auction.item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {auction.item.facility} • Final: ${auction.finalPrice} • {formatTimeAgo(auction.endedAt)}
                        </p>
                      </div>
                      <Button asChild>
                        <a href={auction.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                          View Auction
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watched">
            <div className="space-y-4">
              {filteredAuctions.filter(a => a.isWatched).map((auction) => (
                <Card key={auction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{auction.item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {auction.item.facility} • Final: ${auction.finalPrice} • {formatTimeAgo(auction.endedAt)}
                        </p>
                      </div>
                      <Button asChild>
                        <a href={auction.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                          View Auction
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending">
            <div className="space-y-4">
              {filteredAuctions.filter(a => getPriceTrend(a.priceHistory) !== 'stable').map((auction) => {
                const trend = getPriceTrend(auction.priceHistory);
                return (
                  <Card key={auction.id} className={trend === 'up' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{auction.item.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {auction.item.facility} • Final: ${auction.finalPrice} • {formatTimeAgo(auction.endedAt)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {getTrendIcon(trend)}
                            <span className={`text-sm font-medium ${
                              trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Price {trend === 'up' ? 'increased' : 'decreased'} during auction
                            </span>
                          </div>
                        </div>
                        <Button asChild>
                          <a href={auction.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                            View Auction
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
