import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, MapPin, Clock, DollarSign, ExternalLink, Star, Heart, Share2, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface AuctionItem {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl?: string;
  currentPrice: number | string | null;
  msrp: number | string | null;
  location: string;
  endDate: string | null;
  condition?: string;
  auctionUrl?: string;
  isUrgent?: boolean;
  isWatched?: boolean;
  savings?: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

export default function ModernSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedState, setSelectedState] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Canonical locations from new API
  const canonicalLocations = [
    "Cincinnati — Broadwell Road",
    "Cincinnati — Colerain Avenue", 
    "Cincinnati — School Road",
    "Cincinnati — Waycross Road",
    "Cincinnati — West Seymour Avenue",
    "Elizabethtown — Peterson Drive",
    "Erlanger — Kenton Lane Road 100",
    "Florence — Industrial Road",
    "Franklin — Washington Way",
    "Georgetown — Triport Road",
    "Louisville — Intermodal Drive",
    "Sparta — Johnson Road",
  ];

  useEffect(() => {
    // Convert canonical locations to Location format
    const locationData: Location[] = canonicalLocations.map((name, index) => {
      const parts = name.split(' — ');
      const city = parts[0];
      const address = parts[1];
      const state = city.includes('Cincinnati') || city.includes('Georgetown') || city.includes('Franklin') || city.includes('Sparta') ? 'OH' : 'KY';
      
      return {
        id: String(index + 1),
        name: name,
        city: city,
        state: state,
        address: address
      };
    });
    setLocations(locationData);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      if (selectedLocations.length > 0) {
        selectedLocations.forEach(locId => {
          const location = locations.find(l => l.id === locId);
          if (location) {
            params.append('location', location.name);
          }
        });
      }
      if (priceRange[0] > 0) params.append('minBid', priceRange[0].toString());
      if (priceRange[1] < 1000) params.append('maxBid', priceRange[1].toString());
      params.append('status', 'unknown'); // Show all items initially
      
      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      
      // Deduplicate items by id and location
      const uniqueItems = data.reduce((acc: AuctionItem[], item: AuctionItem) => {
        const key = `${item.id}-${item.location}`;
        if (!acc.find(existing => `${existing.id}-${existing.location}` === key)) {
          acc.push(item);
        }
        return acc;
      }, []);

      // Enhance items with additional data
      const enhancedItems = uniqueItems.map((item: AuctionItem) => ({
        ...item,
        isUrgent: getTimeLeftMinutes(item.endDate) < 60,
        isWatched: false,
        savings: item.msrp && item.currentPrice ? Number(item.msrp) - Number(item.currentPrice) : 0
      }));
      
      setItems(enhancedItems);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const formatTimeLeft = (endDate: string | null) => {
    if (!endDate) return 'Unknown';
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeLeftMinutes = (endDate: string | null) => {
    if (!endDate) return 0;
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60));
  };

  const getTimeLeftColor = (endDate: string | null) => {
    const minutes = getTimeLeftMinutes(endDate);
    
    if (minutes < 0) return 'text-gray-500';
    if (minutes < 60) return 'text-red-600 font-bold';
    if (minutes < 1440) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const getUrgencyBadge = (endDate: string | null) => {
    const minutes = getTimeLeftMinutes(endDate);
    
    if (minutes < 0) return null;
    if (minutes < 30) return <Badge className="bg-red-500 text-white animate-pulse">URGENT</Badge>;
    if (minutes < 60) return <Badge className="bg-orange-500 text-white">Ending Soon</Badge>;
    if (minutes < 1440) return <Badge className="bg-yellow-500 text-black">Today</Badge>;
    return null;
  };

  const filteredLocations = selectedState === 'All' ? locations : locations.filter(loc => loc.state === selectedState);

  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (Number(a.currentPrice) || 0) - (Number(b.currentPrice) || 0);
      case 'price-high':
        return (Number(b.currentPrice) || 0) - (Number(a.currentPrice) || 0);
      case 'time-left':
        return getTimeLeftMinutes(a.endDate) - getTimeLeftMinutes(b.endDate);
      case 'savings':
        return (b.savings || 0) - (a.savings || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Search Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center">
              <Search className="w-6 h-6 mr-3 text-blue-600" />
              Find Your Perfect Deal
            </CardTitle>
            <p className="text-gray-600">Search thousands of live auctions across multiple locations</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for items... (e.g., camping chair, electronics, furniture)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg h-12 border-2 focus:border-blue-500 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={loading} 
                  className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-6 rounded-xl"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* State Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">State</label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All States</SelectItem>
                      <SelectItem value="Ohio">Ohio</SelectItem>
                      <SelectItem value="Kentucky">Kentucky</SelectItem>
                      <SelectItem value="Tennessee">Tennessee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={2000}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="time-left">Time Left</SelectItem>
                      <SelectItem value="savings">Best Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Locations */}
              <div className="mt-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">Locations</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {filteredLocations.map((location) => (
                    <div key={location.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => handleLocationToggle(location.id)}
                      />
                      <label 
                        htmlFor={location.id}
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        <div className="font-medium">{location.name}</div>
                        <div className="text-xs text-gray-500">{location.address}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        {items.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {items.length} items found
              </h2>
              <div className="flex space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {items.length > 0 && (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {sortedItems.map((item, index) => (
              <Card key={`${item.id}-${item.location}-${index}`} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="relative">
                  <img
                    src={item.imageUrl || '/placeholder-item.svg'}
                    alt={item.title || 'Auction Item'}
                    className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      viewMode === 'grid' ? 'h-48' : 'h-32 w-32'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-item.svg';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {getUrgencyBadge(item.endDate)}
                    {item.savings && item.savings > 0 && (
                      <Badge className="bg-green-500 text-white">
                        Save ${item.savings.toFixed(0)}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0 rounded-full">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="w-8 h-8 p-0 rounded-full">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    
                    {item.condition && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.condition}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{item.location}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-green-600">
                          ${Number(item.currentPrice || 0).toFixed(2)}
                        </div>
                        {item.msrp && Number(item.msrp) > 0 && (
                          <div className="text-sm text-gray-500 line-through">
                            MSRP: ${Number(item.msrp).toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getTimeLeftColor(item.endDate)}`}>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTimeLeft(item.endDate)}
                        </div>
                        <div className="text-xs text-gray-500">left</div>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg"
                      asChild
                    >
                      <a 
                        href={item.auctionUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Auction
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !loading && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Ready to Find Great Deals?
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Search through thousands of live auctions to find exactly what you're looking for at unbeatable prices.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500">
                <span className="px-3 py-1 bg-gray-100 rounded-full">camping gear</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">electronics</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">furniture</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">tools</span>
                <span className="px-3 py-1 bg-gray-100 rounded-full">appliances</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Searching Auctions...</h3>
              <p className="text-gray-600">Finding the best deals for you</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
