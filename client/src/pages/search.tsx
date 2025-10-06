import { useState, useCallback, useEffect, useRef } from "react";
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

interface PaginatedResponse {
  items: AuctionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SearchPage() {
  const [filters, setFilters] = useState<FilterState>({
    conditions: [],
    states: [],
    facilities: [],
    searchQuery: "",
  });
  const [sortBy, setSortBy] = useState("endDate");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch locations for filter options
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch paginated items
  const { data: paginatedData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ["auction-items", "paginated", filters, sortBy, currentPage],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/auction-items/filter", {
        ...filters,
        sortBy,
        page: currentPage,
        limit: itemsPerPage,
      });
      return response.json();
    },
  });

  const hasActiveFilters = (filters: FilterState) => {
    return filters.conditions.length > 0 || 
           filters.states.length > 0 || 
           filters.facilities.length > 0 ||
           filters.minPrice !== undefined ||
           filters.maxPrice !== undefined ||
           filters.searchQuery.trim() !== "";
  };

  const handleSearch = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
      conditions: [],
      states: [],
      facilities: [],
      searchQuery: "",
    };
    setFilters(clearedFilters);
    setCurrentPage(1);
  };

  const items = paginatedData?.items || [];
  const totalPages = paginatedData?.totalPages || 1;
  const total = paginatedData?.total || 0;
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, total);

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
                      Showing <span data-testid="item-count">{startIndex}-{endIndex}</span> of <span data-testid="total-items">{total}</span> items
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-muted-foreground">Sort by:</label>
                    <Select value={sortBy} onValueChange={handleSortChange} data-testid="sort-select">
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

            {isLoading ? (
              <div className="text-center py-8" data-testid="loading-state">
                <p className="text-muted-foreground">Loading auction items...</p>
              </div>
            ) : items.length === 0 ? (
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
                  <ItemsTable items={items} />
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden">
                  <ItemCards items={items} />
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Card className="mt-6" data-testid="pagination-controls">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          data-testid="button-previous-page"
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
