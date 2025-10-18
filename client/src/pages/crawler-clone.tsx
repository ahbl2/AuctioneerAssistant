import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MapPin, Clock, DollarSign, ExternalLink, Plus, Settings, Play, Pause, Eye } from 'lucide-react';

interface CrawlerRule {
  id: string;
  name: string;
  searchQuery: string;
  locations: string[];
  maxBidPrice: number;
  maxTimeLeft: number;
  checkInterval: number;
  isActive: boolean;
  lastChecked?: string;
  createdAt: string;
  updatedAt: string;
}

interface CrawlerResult {
  id: string;
  ruleId: string;
  item: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    currentPrice: string;
    msrp: string;
    location: string;
    facility: string;
    state: string;
    endDate: string | Date;
    condition: string;
    auctionUrl: string;
  };
  matchedAt: string;
  isTracked: boolean;
  isWatched: boolean;
}

export default function CrawlerClone() {
  const [rules, setRules] = useState<CrawlerRule[]>([]);
  const [results, setResults] = useState<CrawlerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<CrawlerRule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    searchQuery: '',
    locations: [] as string[],
    maxBidPrice: 100,
    maxTimeLeft: 60,
    checkInterval: 5
  });

  const mockLocations = [
    { id: '637', name: 'Louisville - Intermodal Dr.', city: 'Louisville', state: 'KY' },
    { id: '21', name: 'Florence - Industrial Road', city: 'Florence', state: 'KY' },
    { id: '22', name: 'Elizabethtown - Peterson Drive', city: 'Elizabethtown', state: 'KY' },
    { id: '23', name: 'Cincinnati - School Road', city: 'Cincinnati', state: 'OH' },
    { id: '24', name: 'Dayton - Edwin C. Moses Blvd.', city: 'Dayton', state: 'OH' },
    { id: '25', name: 'Columbus - Chantry Drive', city: 'Columbus', state: 'OH' },
  ];

  useEffect(() => {
    fetchRules();
    fetchResults();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/crawler/rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/crawler/results');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/crawler/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRules();
        setShowCreateRule(false);
        setFormData({
          name: '',
          searchQuery: '',
          locations: [],
          maxBidPrice: 100,
          maxTimeLeft: 60,
          checkInterval: 5
        });
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/crawler/rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchRules();
        setEditingRule(null);
        setFormData({
          name: '',
          searchQuery: '',
          locations: [],
          maxBidPrice: 100,
          maxTimeLeft: 60,
          checkInterval: 5
        });
      }
    } catch (error) {
      console.error('Failed to update rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      const response = await fetch(`/api/crawler/rules/${ruleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const response = await fetch(`/api/crawler/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, isActive: !isActive })
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const formatTimeLeft = (endDate: string | Date) => {
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

  const getTimeLeftColor = (endDate: string | Date) => {
    const now = new Date();
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'text-red-600 font-bold';
    if (hours < 24) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  const startEditing = (rule: CrawlerRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      searchQuery: rule.searchQuery,
      locations: rule.locations,
      maxBidPrice: rule.maxBidPrice,
      maxTimeLeft: rule.maxTimeLeft,
      checkInterval: rule.checkInterval
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FtaKit Crawler</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowCreateRule(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rules">Crawler Rules</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid gap-6">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRuleActive(rule.id, rule.isActive)}
                        >
                          {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(rule)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Search Query</Label>
                        <p className="text-sm">{rule.searchQuery}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Locations</Label>
                        <p className="text-sm">{rule.locations.length} selected</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Max Price</Label>
                        <p className="text-sm">${rule.maxBidPrice}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Check Every</Label>
                        <p className="text-sm">{rule.checkInterval} minutes</p>
                      </div>
                    </div>
                    {rule.lastChecked && (
                      <div className="mt-4 text-sm text-gray-500">
                        Last checked: {new Date(rule.lastChecked).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {rules.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No crawler rules yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Create your first rule to start monitoring auctions
                    </p>
                    <Button onClick={() => setShowCreateRule(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Rule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {results.length} items found
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Sort by Price</Button>
                <Button variant="outline" size="sm">Sort by Time</Button>
              </div>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={result.item.imageUrl || '/placeholder-item.jpg'}
                          alt={result.item.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                              {result.item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {result.item.description}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {result.item.location}
                              </div>
                              <div className="flex items-center">
                                <Badge variant="secondary">{result.item.condition}</Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="text-lg font-bold text-green-600">
                                  ${result.item.currentPrice}
                                </div>
                                {result.item.msrp !== '0' && (
                                  <div className="text-sm text-gray-500 line-through">
                                    MSRP: ${result.item.msrp}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className={`text-sm ${getTimeLeftColor(result.item.endDate)}`}>
                                  <Clock className="w-4 h-4 inline mr-1" />
                                  {formatTimeLeft(result.item.endDate)}
                                </div>
                                
                                <Button size="sm" asChild>
                                  <a 
                                    href={result.item.auctionUrl} 
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

              {results.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No results yet
                    </h3>
                    <p className="text-gray-500">
                      Create some crawler rules to start finding items
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Crawler Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Rule Modal */}
      {(showCreateRule || editingRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingRule ? handleUpdateRule : handleCreateRule} className="space-y-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Camping Chairs Under $50"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="searchQuery">Search Query</Label>
                  <Input
                    id="searchQuery"
                    value={formData.searchQuery}
                    onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
                    placeholder="e.g., camping chair"
                    required
                  />
                </div>

                <div>
                  <Label>Locations</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {mockLocations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={location.id}
                          checked={formData.locations.includes(location.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                locations: [...formData.locations, location.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                locations: formData.locations.filter(id => id !== location.id)
                              });
                            }
                          }}
                        />
                        <label htmlFor={location.id} className="text-sm">
                          {location.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxBidPrice">Max Bid Price ($)</Label>
                    <Input
                      id="maxBidPrice"
                      type="number"
                      value={formData.maxBidPrice}
                      onChange={(e) => setFormData({ ...formData, maxBidPrice: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTimeLeft">Max Time Left (minutes)</Label>
                    <Input
                      id="maxTimeLeft"
                      type="number"
                      value={formData.maxTimeLeft}
                      onChange={(e) => setFormData({ ...formData, maxTimeLeft: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="checkInterval">Check Every (minutes)</Label>
                  <Select
                    value={formData.checkInterval.toString()}
                    onValueChange={(value) => setFormData({ ...formData, checkInterval: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateRule(false);
                      setEditingRule(null);
                      setFormData({
                        name: '',
                        searchQuery: '',
                        locations: [],
                        maxBidPrice: 100,
                        maxTimeLeft: 60,
                        checkInterval: 5
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingRule ? 'Update Rule' : 'Create Rule')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
