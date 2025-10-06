import { useState } from "react";
import { Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Location } from "@shared/schema";

interface FilterState {
  conditions: string[];
  states: string[];
  facilities: string[];
  minPrice?: number;
  maxPrice?: number;
  searchQuery: string;
}

interface FiltersSidebarProps {
  locations: Location[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

export default function FiltersSidebar({ 
  locations, 
  filters, 
  onFilterChange, 
  onClearFilters 
}: FiltersSidebarProps) {
  const [expandedStates, setExpandedStates] = useState<{ [key: string]: boolean }>({
    Kentucky: true,
    Ohio: true,
  });

  const conditions = ["Brand New", "New/Like New", "Good Condition", "As Is"];

  const handleConditionChange = (condition: string, checked: boolean) => {
    const newConditions = checked
      ? [...filters.conditions, condition]
      : filters.conditions.filter(c => c !== condition);
    onFilterChange({ conditions: newConditions });
  };

  const handleStateChange = (state: string, checked: boolean) => {
    const newStates = checked
      ? [...filters.states, state]
      : filters.states.filter(s => s !== state);
    
    // Also clear facilities from unchecked states
    let newFacilities = filters.facilities;
    if (!checked) {
      const stateLocation = locations.find(loc => loc.state === state);
      if (stateLocation) {
        newFacilities = filters.facilities.filter(
          facility => !(stateLocation.facilities as string[]).includes(facility)
        );
      }
    }
    
    onFilterChange({ states: newStates, facilities: newFacilities });
  };

  const handleFacilityChange = (facility: string, checked: boolean) => {
    const newFacilities = checked
      ? [...filters.facilities, facility]
      : filters.facilities.filter(f => f !== facility);
    onFilterChange({ facilities: newFacilities });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFilterChange({ [field]: numValue });
  };

  const toggleStateExpansion = (state: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [state]: !prev[state]
    }));
  };

  return (
    <aside className="lg:col-span-1">
      <Card className="sticky top-24" data-testid="filters-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-primary" />
              Filters
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
              data-testid="button-clear-all-filters"
            >
              Clear all
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Condition Filter */}
          <div data-testid="condition-filters">
            <h3 className="text-sm font-semibold text-foreground mb-3">Condition</h3>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <label key={condition} className="flex items-center space-x-2 cursor-pointer group">
                  <Checkbox
                    checked={filters.conditions.includes(condition)}
                    onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                    data-testid={`checkbox-condition-${condition.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {condition}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div data-testid="location-filters">
            <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
            <div className="space-y-2">
              {locations.map((location) => (
                <div key={location.id} className="space-y-2">
                  <Collapsible
                    open={expandedStates[location.state]}
                    onOpenChange={() => toggleStateExpansion(location.state)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between w-full cursor-pointer group">
                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                          <Checkbox
                            checked={filters.states.includes(location.state)}
                            onCheckedChange={(checked) => handleStateChange(location.state, checked as boolean)}
                            data-testid={`checkbox-state-${location.state.toLowerCase()}`}
                          />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {location.state}
                          </span>
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6"
                          data-testid={`button-toggle-${location.state.toLowerCase()}`}
                        >
                          {expandedStates[location.state] ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-2 mt-2">
                      <div className="max-h-48 overflow-y-auto">
                        {(location.facilities as string[]).map((facility) => (
                          <label key={facility} className="flex items-center space-x-2 cursor-pointer group">
                            <Checkbox
                              checked={filters.facilities.includes(facility)}
                              onCheckedChange={(checked) => handleFacilityChange(facility, checked as boolean)}
                              data-testid={`checkbox-facility-${facility.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                              {facility.replace(` - ${location.state}`, '')}
                            </span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div data-testid="price-range-filters">
            <h3 className="text-sm font-semibold text-foreground mb-3">Price Range</h3>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ''}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                className="flex-1"
                data-testid="input-min-price"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ''}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                className="flex-1"
                data-testid="input-max-price"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
