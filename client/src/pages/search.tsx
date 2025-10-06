import { useState } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import FiltersSidebar from "@/components/filters-sidebar";
import ItemsTable from "@/components/items-table";
import ItemCards from "@/components/item-cards";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AuctionItem, Location } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterState {
  conditions: string[];
  states: string[];
  facilities: string[];
  minPrice?: number;
  maxPrice?: number;
  searchQuery: string;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<FilterState>({
    conditions: [],
    states: [],
    facilities: [],
    searchQuery: "",
  });
  const [sortBy, setSortBy] = useState("endDate");

  const queryClient = useQueryClient();

  // Fetch locations for filter options
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Filter mutation
  const filterMutation = useMutation({
    mutationFn: async (filterData: FilterState) => {
      const response = await apiRequest("POST", "/api/auction-items/filter", filterData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auction-items", "filtered"], data);
    },
  });

  // Get filtered items or all items
  const { data: items = [], isLoading } = useQuery<AuctionItem[]>({
    queryKey: ["auction-items", "filtered"],
    queryFn: async () => {
      if (hasActiveFilters(filters)) {
        return filterMutation.mutateAsync(filters);
      }
      const response = await fetch("/api/auction-items");
      return response.json();
    },
    enabled: !filterMutation.isPending,
  });

  const hasActiveFilters = (filters: FilterState) => {
    return filters.conditions.length > 0 || 
           filters.states.length > 0 || 
           filters.facilities.length > 0 ||
           filters.minPrice !== undefined ||
           filters.maxPrice !== undefined ||
           filters.searchQuery.trim() !== "";
  };

  const handleSearch = (query: string) => {
    const newFilters = { ...filters, searchQuery: query };
    setFilters(newFilters);
    filterMutation.mutate(newFilters);
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    filterMutation.mutate(updatedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      conditions: [],
      states: [],
      facilities: [],
      searchQuery: "",
    };
    setFilters(clearedFilters);
    queryClient.invalidateQueries({ queryKey: ["auction-items", "filtered"] });
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "priceAsc":
        return parseFloat(a.currentPrice) - parseFloat(b.currentPrice);
      case "priceDesc":
        return parseFloat(b.currentPrice) - parseFloat(a.currentPrice);
      case "msrpDiscount":
        const aDiscount = (parseFloat(a.msrp) - parseFloat(a.currentPrice)) / parseFloat(a.msrp);
        const bDiscount = (parseFloat(b.msrp) - parseFloat(b.currentPrice)) / parseFloat(b.msrp);
        return bDiscount - aDiscount;
      case "condition":
        return a.condition.localeCompare(b.condition);
      case "endDate":
      default:
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchBar onSearch={handleSearch} initialValue={filters.searchQuery} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <FiltersSidebar
            locations={locations}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            data-testid="filters-sidebar"
          />
          
          <main className="lg:col-span-3">
            {/* Results Header */}
            <Card className="mb-6" data-testid="results-header">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Showing <span data-testid="item-count">{sortedItems.length}</span> items
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-muted-foreground">Sort by:</label>
                    <Select value={sortBy} onValueChange={setSortBy} data-testid="sort-select">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="endDate">End Date (Soonest)</SelectItem>
                        <SelectItem value="priceAsc">Price (Low to High)</SelectItem>
                        <SelectItem value="priceDesc">Price (High to Low)</SelectItem>
                        <SelectItem value="msrpDiscount">MSRP Discount</SelectItem>
                        <SelectItem value="condition">Condition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoading || filterMutation.isPending ? (
              <div className="text-center py-8" data-testid="loading-state">
                <p className="text-muted-foreground">Loading auction items...</p>
              </div>
            ) : sortedItems.length === 0 ? (
              <Card data-testid="no-results">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No auction items found matching your criteria.</p>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="mt-4"
                    data-testid="button-clear-filters"
                  >
                    Clear all filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <ItemsTable items={sortedItems} />
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <ItemCards items={sortedItems} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
