import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MapPin, Clock, DollarSign, ExternalLink } from 'lucide-react';

interface AuctionItem {
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
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

export default function BidFTAuctionClone() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [items, setItems] = useState<AuctionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedState, setSelectedState] = useState('Ohio');
  const [showFilters, setShowFilters] = useState(false);

  // Mock locations data (in real app, this would come from API)
  const mockLocations: Location[] = [
    { id: '637', name: 'Louisville - Intermodal Dr.', city: 'Louisville', state: 'KY', address: '7300 Intermodal Dr.' },
    { id: '21', name: 'Florence - Industrial Road', city: 'Florence', state: 'KY', address: '7405 Industrial Road' },
    { id: '22', name: 'Elizabethtown - Peterson Drive', city: 'Elizabethtown', state: 'KY', address: '204 Peterson Drive' },
    { id: '23', name: 'Cincinnati - School Road', city: 'Cincinnati', state: 'OH', address: '7660 School Road' },
    { id: '24', name: 'Dayton - Edwin C. Moses Blvd.', city: 'Dayton', state: 'OH', address: '835 Edwin C. Moses Blvd.' },
    { id: '25', name: 'Columbus - Chantry Drive', city: 'Columbus', state: 'OH', address: '5865 Chantry Drive' },
    { id: '34', name: 'Amelia - Ohio Pike', city: 'Amelia', state: 'OH', address: '1260 Ohio Pike' },
    { id: '35', name: 'Vandalia - Industrial Park Drive', city: 'Vandalia', state: 'OH', address: '1170 Industrial Park Drive' },
  ];

  useEffect(() => {
    setLocations(mockLocations);
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // For now, use our existing API
      const response = await fetch(`/api/auction-items/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setItems(data);
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

  const formatTimeLeft = (endDate: Date | string) => {
    const now = new Date();
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTimeLeftColor = (endDate: Date | string) => {
    const now = new Date();
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'text-red-600 font-bold';
    if (hours < 24) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  const filteredLocations = locations.filter(loc => loc.state === selectedState);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FtaKit</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Locations
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search for items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="px-8">
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters Section */}
        {showFilters && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              {/* State Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">State</h3>
                <div className="flex space-x-4">
                  {['Ohio', 'Kentucky', 'Tennessee'].map(state => (
                    <Button
                      key={state}
                      variant={selectedState === state ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedState(state)}
                    >
                      {state}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {filteredLocations.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={location.id}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => handleLocationToggle(location.id)}
                      />
                      <label 
                        htmlFor={location.id}
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {location.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        <div className="space-y-4">
          {items.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {items.length} items found
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Sort by Price</Button>
                <Button variant="outline" size="sm">Sort by Time</Button>
              </div>
            </div>
          )}

          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.imageUrl || '/placeholder-item.jpg'}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-item.jpg';
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {item.location}
                          </div>
                          <div className="flex items-center">
                            <Badge variant="secondary">{item.condition}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-lg font-bold text-green-600">
                              ${item.currentPrice}
                            </div>
                            {item.msrp !== '0' && (
                              <div className="text-sm text-gray-500 line-through">
                                MSRP: ${item.msrp}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className={`text-sm ${getTimeLeftColor(item.endDate)}`}>
                              <Clock className="w-4 h-4 inline mr-1" />
                              {formatTimeLeft(item.endDate)}
                            </div>
                            
                            <Button size="sm" asChild>
                              <a 
                                href={item.auctionUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Item
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No items found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
