import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { 
  Search, Filter, MapPin, Clock, DollarSign, ExternalLink, Plus, Settings, 
  Play, Pause, Eye, Zap, TrendingUp, AlertCircle, Bell, Activity, BarChart3,
  Target, Timer, DollarSign as DollarIcon, Users, Globe
} from 'lucide-react';

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
  matchesFound?: number;
  successRate?: number;
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
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export default function ModernCrawler() {
  const [rules, setRules] = useState<CrawlerRule[]>([]);
  const [results, setResults] = useState<CrawlerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [editingRule, setEditingRule] = useState<CrawlerRule | null>(null);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalMatches: 0,
    urgentMatches: 0,
    avgSavings: 0
  });

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
    updateStats();
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

  const updateStats = () => {
    const totalRules = rules.length;
    const activeRules = rules.filter(r => r.isActive).length;
    const totalMatches = results.length;
    const urgentMatches = results.filter(r => getUrgency(r.item.endDate) === 'critical' || getUrgency(r.item.endDate) === 'high').length;
    const avgSavings = results.reduce((sum, r) => {
      const msrp = parseFloat(r.item.msrp);
      const current = parseFloat(r.item.currentPrice);
      return sum + (msrp - current);
    }, 0) / results.length || 0;

    setStats({ totalRules, activeRules, totalMatches, urgentMatches, avgSavings });
  };

  const getUrgency = (endDate: string | Date) => {
    const now = new Date();
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diff = end.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 0) return 'low';
    if (hours < 1) return 'critical';
    if (hours < 24) return 'high';
    if (hours < 72) return 'medium';
    return 'low';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
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
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create rule:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      searchQuery: '',
      locations: [],
      maxBidPrice: 100,
      maxTimeLeft: 60,
      checkInterval: 5
    });
  };

  const toggleRuleActive = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      const response = await fetch(`/api/crawler/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, isActive: !rule.isActive })
      });

      if (response.ok) {
        await fetchRules();
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Rules</p>
                  <p className="text-3xl font-bold">{stats.totalRules}</p>
                </div>
                <Target className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Rules</p>
                  <p className="text-3xl font-bold">{stats.activeRules}</p>
                </div>
                <Activity className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Matches</p>
                  <p className="text-3xl font-bold">{stats.totalMatches}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Urgent Matches</p>
                  <p className="text-3xl font-bold">{stats.urgentMatches}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules">Crawler Rules</TabsTrigger>
            <TabsTrigger value="results">Live Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <div className="grid gap-6">
              {rules.map((rule) => (
                <Card key={rule.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-xl">{rule.name}</CardTitle>
                        <Badge 
                          variant={rule.isActive ? "default" : "secondary"}
                          className={rule.isActive ? "bg-green-500" : ""}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {rule.matchesFound && (
                          <Badge variant="outline" className="text-blue-600">
                            {rule.matchesFound} matches
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRuleActive(rule.id)}
                          className="hover:bg-green-50"
                        >
                          {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="hover:bg-red-50 text-red-600"
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
                        <p className="text-sm font-medium">{rule.searchQuery}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Locations</Label>
                        <p className="text-sm">{rule.locations.length} selected</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Max Price</Label>
                        <p className="text-sm font-medium text-green-600">${rule.maxBidPrice}</p>
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
                <Card className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      No crawler rules yet
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Create your first rule to start monitoring auctions automatically and never miss a great deal.
                    </p>
                    <Button 
                      onClick={() => setShowCreateRule(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Rule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Live Results ({results.length})
              </h2>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Sort by Time</Button>
                <Button variant="outline" size="sm">Sort by Price</Button>
                <Button variant="outline" size="sm">Filter Urgent</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => {
                const urgency = getUrgency(result.item.endDate);
                return (
                  <Card key={result.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <div className="relative">
                      <img
                        src={result.item.imageUrl || '/placeholder-item.jpg'}
                        alt={result.item.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge className={`${getUrgencyColor(urgency)} border-0`}>
                          {urgency.toUpperCase()}
                        </Badge>
                        {result.isWatched && (
                          <Badge className="bg-blue-500 text-white border-0">
                            <Eye className="w-3 h-3 mr-1" />
                            Watched
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {result.item.title}
                        </h3>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{result.item.location}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {result.item.condition}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-green-600">
                              ${result.item.currentPrice}
                            </div>
                            {result.item.msrp !== '0' && parseFloat(result.item.msrp) > 0 && (
                              <div className="text-sm text-gray-500 line-through">
                                MSRP: ${result.item.msrp}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getUrgencyColor(urgency)}`}>
                              <Clock className="w-4 h-4 inline mr-1" />
                              {formatTimeLeft(result.item.endDate)}
                            </div>
                            <div className="text-xs text-gray-500">left</div>
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg"
                          asChild
                        >
                          <a 
                            href={result.item.auctionUrl} 
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
                );
              })}

              {results.length === 0 && (
                <Card className="col-span-full border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Eye className="w-12 h-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      No results yet
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Create some crawler rules to start finding items automatically. The crawler will notify you when it finds matches.
                    </p>
                    <Button 
                      onClick={() => setShowCreateRule(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Rule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Rule Success Rate</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Response Time</span>
                        <span>2.3s</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Data Freshness</span>
                        <span>98%</span>
                      </div>
                      <Progress value={98} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Savings Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      ${stats.avgSavings.toFixed(0)}
                    </div>
                    <p className="text-gray-600 mb-4">Average Savings per Item</p>
                    <div className="text-sm text-gray-500">
                      Based on {results.length} tracked items
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Rule Modal */}
      {(showCreateRule || editingRule) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 bg-white/95 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-2xl">
                {editingRule ? 'Edit Rule' : 'Create New Rule'}
              </CardTitle>
              <p className="text-gray-600">
                Set up automated monitoring for specific auction items
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingRule ? handleCreateRule : handleCreateRule} className="space-y-6">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Camping Chairs Under $50"
                    className="mt-1"
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
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label>Locations</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto border rounded-lg p-3 mt-1">
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
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="checkInterval">Check Every (minutes)</Label>
                  <Select
                    value={formData.checkInterval.toString()}
                    onValueChange={(value) => setFormData({ ...formData, checkInterval: Number(value) })}
                  >
                    <SelectTrigger className="mt-1">
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

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateRule(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
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
