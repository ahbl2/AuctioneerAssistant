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
  Filter, 
  Clock, 
  DollarSign, 
  MapPin, 
  ExternalLink, 
  Star, 
  StarOff,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Trash2,
  BarChart3,
  Calendar
} from "lucide-react";
import type { AuctionItem, CrawlerRule } from "@shared/schema";

interface CrawlerResult {
  id: string;
  ruleId: string;
  ruleName: string;
  item: AuctionItem;
  timeLeftMinutes: number;
  matchedAt: string;
  isTracked: boolean;
  isWatched: boolean;
}

export default function ResultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRule, setSelectedRule] = useState("all");
  const [sortBy, setSortBy] = useState("timeLeft");
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [showWatchedOnly, setShowWatchedOnly] = useState(false);

  const queryClient = useQueryClient();

  // Fetch real crawler results from API
  const { data: crawlerResults = [] } = useQuery<CrawlerResult[]>({
    queryKey: ["/api/crawler/results"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // For now, show empty state until we implement the results API
  const mockResults: CrawlerResult[] = [];

  // Fetch crawler rules for filtering
  const { data: rules = [] } = useQuery<CrawlerRule[]>({
    queryKey: ["/api/crawler/rules"],
  });

  // Filter and sort results
  const filteredResults = crawlerResults.filter(result => {
    const matchesSearch = result.item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.item.facility.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRule = selectedRule === "all" || result.ruleId === selectedRule;
    const matchesTracked = !showTrackedOnly || result.isTracked;
    const matchesWatched = !showWatchedOnly || result.isWatched;
    
    return matchesSearch && matchesRule && matchesTracked && matchesWatched;
  }).sort((a, b) => {
    switch (sortBy) {
      case "timeLeft":
        return a.timeLeftMinutes - b.timeLeftMinutes;
      case "price":
        return parseFloat(a.item.currentPrice) - parseFloat(b.item.currentPrice);
      case "title":
        return a.item.title.localeCompare(b.item.title);
      case "location":
        return a.item.facility.localeCompare(b.item.facility);
      default:
        return 0;
    }
  });

  const toggleTracked = (resultId: string) => {
    // In real implementation, this would make an API call
    console.log('Toggle tracked for result:', resultId);
  };

  const toggleWatched = (resultId: string) => {
    // In real implementation, this would make an API call
    console.log('Toggle watched for result:', resultId);
  };

  const formatTimeLeft = (minutes: number) => {
    if (minutes < 0) return "Ended";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeLeftColor = (minutes: number) => {
    if (minutes < 0) return "text-red-500";
    if (minutes < 5) return "text-red-600 font-bold";
    if (minutes < 15) return "text-orange-500";
    return "text-green-600";
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Crawler Results</h1>
            <p className="text-muted-foreground mt-2">
              View items found by your crawler rules and manage your tracking.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              if (confirm('Are you sure you want to clear all results? This cannot be undone.')) {
                // TODO: Implement API call to clear results
                console.log('Clearing all results...');
              }
            }}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button variant="outline" asChild>
              <a href="/closed">
                <BarChart3 className="w-4 h-4 mr-2" />
                Closed Auctions
              </a>
            </Button>
            <Button>
              <Eye className="w-4 h-4 mr-2" />
              Tracked Items
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
                    <SelectItem value="timeLeft">Time Left</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
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
            <TabsTrigger value="all">All Results ({filteredResults.length})</TabsTrigger>
            <TabsTrigger value="tracked">Tracked ({filteredResults.filter(r => r.isTracked).length})</TabsTrigger>
            <TabsTrigger value="watched">Watched ({filteredResults.filter(r => r.isWatched).length})</TabsTrigger>
            <TabsTrigger value="urgent">Urgent ({filteredResults.filter(r => r.timeLeftMinutes < 5).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredResults.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="text-6xl">🔍</div>
                    <h3 className="text-xl font-semibold">No Results Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Your crawler is running and searching for items. Results will appear here when items match your criteria.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>• Make sure your crawler rules are active</p>
                      <p>• Check that your search criteria aren't too restrictive</p>
                      <p>• Results appear every 5 minutes when crawler runs</p>
                    </div>
                    <Button asChild>
                      <a href="/crawler">Manage Crawler Rules</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <img
                              src={result.item.imageUrl}
                              alt={result.item.title}
                              className="w-20 h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCAyMEMzMS4xNjM0IDIwIDI0IDI3LjE2MzQgMjQgMzZDMjQgNDQuODM2NiAzMS4xNjM0IDUyIDQwIDUyQzQ4LjgzNjYgNTIgNTYgNDQuODM2NiA1NiAzNkM1NiAyNy4xNjM0IDQ4LjgzNjYgMjAgNDAgMjBaIiBmaWxsPSIjOUI5QkE1Ii8+Cjwvc3ZnPgo=';
                              }}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold line-clamp-2">{result.item.title}</h3>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleTracked(result.id)}
                                    className={result.isTracked ? "text-yellow-500" : ""}
                                  >
                                    {result.isTracked ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleWatched(result.id)}
                                    className={result.isWatched ? "text-blue-500" : ""}
                                  >
                                    {result.isWatched ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {result.item.facility}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span className={getTimeLeftColor(result.timeLeftMinutes)}>
                                    {formatTimeLeft(result.timeLeftMinutes)} left
                                  </span>
                                </span>
                                <Badge variant="outline">{result.item.condition}</Badge>
                                <Badge variant="secondary">{result.ruleName}</Badge>
                              </div>

                              {/* Estimated End Time */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <Calendar className="w-4 h-4" />
                                <span>Ends: {new Date(result.item.endDate).toLocaleString()}</span>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="text-xl font-bold text-green-600">
                                    ${result.item.currentPrice}
                                  </span>
                                  <span className="text-sm text-muted-foreground line-through">
                                    ${result.item.msrp}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">Savings:</span>
                                  <span className="font-semibold text-green-600">
                                    ${(parseFloat(result.item.msrp) - parseFloat(result.item.currentPrice)).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button asChild>
                            <a href={result.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Auction
                            </a>
                          </Button>
                          <Button variant="outline" asChild>
                            <a href={result.item.amazonSearchUrl} target="_blank" rel="noopener noreferrer">
                              Compare on Amazon
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tracked">
            <div className="space-y-4">
              {filteredResults.filter(r => r.isTracked).map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{result.item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.item.facility} • {formatTimeLeft(result.timeLeftMinutes)} left • ${result.item.currentPrice}
                        </p>
                      </div>
                      <Button asChild>
                        <a href={result.item.auctionUrl} target="_blank" rel="noopener noreferrer">
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
              {filteredResults.filter(r => r.isWatched).map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{result.item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.item.facility} • {formatTimeLeft(result.timeLeftMinutes)} left • ${result.item.currentPrice}
                        </p>
                      </div>
                      <Button asChild>
                        <a href={result.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                          View Auction
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="urgent">
            <div className="space-y-4">
              {filteredResults.filter(r => r.timeLeftMinutes < 5).map((result) => (
                <Card key={result.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-red-900">{result.item.title}</h3>
                        <p className="text-sm text-red-700">
                          {result.item.facility} • <span className="font-bold">{formatTimeLeft(result.timeLeftMinutes)} left</span> • ${result.item.currentPrice}
                        </p>
                      </div>
                      <Button asChild className="bg-red-600 hover:bg-red-700">
                        <a href={result.item.auctionUrl} target="_blank" rel="noopener noreferrer">
                          Bid Now!
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
