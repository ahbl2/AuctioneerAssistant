import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Pause, Plus, Eye } from "lucide-react";
import type { CrawlerRule } from "@shared/schema";

const LOCATIONS = [
  "Louisville - Intermodal Dr.",
  "Florence - Industrial Road", 
  "Elizabethtown - Peterson Drive",
  "Georgetown - Triport Road",
  "Franklin - Washington Way",
  "Erlanger - Kenton Lands Rd",
  "Sparta - Johnson Rd",
  "Dayton - Webster Street",
  "Cincinnati - School Road",
  "Dayton - Edwin C. Moses Blvd.",
  "Amelia - Ohio Pike",
  "Strongsville - Drake Rd",
  "Cincinnati - Broadwell Rd",
  "Cincinnati - West Seymour Ave.",
  "Columbus - Chantry Drive",
  "Vandalia - Industrial Park Drive",
  "Columbus - Phillipi Rd",
  "Mansfield - Lexington Ave",
  "Cincinnati - Colerain Ave.",
  "Rogers - N Dixieland Rd.",
  "Siloam Springs - Propak UAC",
  "Harrison - 701 US-65",
  "LaVergne - Industrial Blvd",
  "Kingsport - Hwy 75",
  "Midlothian - Propak UAC"
];

export default function CrawlerPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<CrawlerRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    searchQuery: "",
    locations: [] as string[],
    maxBidPrice: "",
    maxTimeLeft: "",
    checkInterval: "",
    isActive: true,
  });

  const queryClient = useQueryClient();

  // Fetch crawler rules
  const { data: rules = [], isLoading } = useQuery<CrawlerRule[]>({
    queryKey: ["/api/crawler/rules"],
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      const response = await apiRequest("POST", "/api/crawler/rules", ruleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crawler/rules"] });
      setShowForm(false);
      resetForm();
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/crawler/rules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crawler/rules"] });
      setEditingRule(null);
      resetForm();
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/crawler/rules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/crawler/rules"] });
    },
  });

  // Start/Stop crawler mutations
  const startCrawlerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/crawler/start");
      return response.json();
    },
  });

  const stopCrawlerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/crawler/stop");
      return response.json();
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      searchQuery: "",
      locations: [],
      maxBidPrice: "",
      maxTimeLeft: "",
      checkInterval: "",
      isActive: true,
    });
  };

  const handleEdit = (rule: CrawlerRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      searchQuery: rule.searchQuery,
      locations: rule.locations,
      maxBidPrice: rule.maxBidPrice.toString(),
      maxTimeLeft: rule.maxTimeLeft.toString(),
      checkInterval: rule.checkInterval.toString(),
      isActive: rule.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a rule name');
      return;
    }
    if (!formData.searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }
    if (formData.locations.length === 0) {
      alert('Please select at least one location');
      return;
    }
    if (!formData.maxBidPrice || parseFloat(formData.maxBidPrice) <= 0) {
      alert('Please enter a valid max bid price');
      return;
    }
    if (!formData.maxTimeLeft || parseInt(formData.maxTimeLeft) <= 0) {
      alert('Please enter a valid max time left');
      return;
    }
    if (!formData.checkInterval || parseInt(formData.checkInterval) <= 0) {
      alert('Please enter a valid check interval');
      return;
    }
    
    const ruleData = {
      ...formData,
      maxBidPrice: parseFloat(formData.maxBidPrice),
      maxTimeLeft: parseInt(formData.maxTimeLeft),
      checkInterval: parseInt(formData.checkInterval),
    };

    console.log('Submitting rule data:', ruleData);

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const handleLocationToggle = (location: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Auction Crawler</h1>
            <p className="text-muted-foreground mt-2">
              Set up automated searches to monitor specific items and get notified when they match your criteria.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => startCrawlerMutation.mutate()}
              disabled={startCrawlerMutation.isPending}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Crawler
            </Button>
            <Button
              variant="outline"
              onClick={() => stopCrawlerMutation.mutate()}
              disabled={stopCrawlerMutation.isPending}
            >
              <Pause className="w-4 h-4 mr-2" />
              Stop Crawler
            </Button>
            <Button variant="outline" asChild>
              <a href="/results">
                <Eye className="w-4 h-4 mr-2" />
                View Results
              </a>
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </div>

        {/* Rules List */}
        <div className="grid gap-4 mb-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading crawler rules...</p>
            </div>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">No crawler rules set up yet.</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {rule.name}
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Search: "{rule.searchQuery}"
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(rule)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRuleMutation.mutate(rule.id)}
                        disabled={deleteRuleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Max Price</Label>
                      <p className="font-medium">${rule.maxBidPrice}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Time Left</Label>
                      <p className="font-medium">{rule.maxTimeLeft} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Check Every</Label>
                      <p className="font-medium">{rule.checkInterval} min</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Locations</Label>
                      <p className="font-medium">{rule.locations.length} selected</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-muted-foreground">Monitoring Locations</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.locations.map((location) => (
                        <Badge key={location} variant="outline" className="text-xs">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingRule ? "Edit Crawler Rule" : "Create New Crawler Rule"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Cheap Chairs in KY"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="searchQuery">Search Query</Label>
                    <Input
                      id="searchQuery"
                      value={formData.searchQuery}
                      onChange={(e) => setFormData(prev => ({ ...prev, searchQuery: e.target.value }))}
                      placeholder="e.g., chair, desk, furniture"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxBidPrice">Max Bid Price ($)</Label>
                    <Input
                      id="maxBidPrice"
                      type="number"
                      step="0.01"
                      value={formData.maxBidPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxBidPrice: e.target.value }))}
                      placeholder="10.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxTimeLeft">Max Time Left (minutes)</Label>
                    <Input
                      id="maxTimeLeft"
                      type="number"
                      value={formData.maxTimeLeft}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxTimeLeft: e.target.value }))}
                      placeholder="5"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInterval">Check Every (minutes)</Label>
                    <Input
                      id="checkInterval"
                      type="number"
                      value={formData.checkInterval}
                      onChange={(e) => setFormData(prev => ({ ...prev, checkInterval: e.target.value }))}
                      placeholder="5"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Locations to Monitor</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {LOCATIONS.map((location) => (
                      <div key={location} className="flex items-center space-x-2">
                        <Checkbox
                          id={location}
                          checked={formData.locations.includes(location)}
                          onCheckedChange={() => handleLocationToggle(location)}
                        />
                        <Label htmlFor={location} className="text-sm">
                          {location}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive">Active (start monitoring immediately)</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingRule(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                  >
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
