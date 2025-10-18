import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";

export default function SearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";
  const [searchUrl, setSearchUrl] = useState("https://www.bidfta.com/category/all/1");

  useEffect(() => {
    if (query) {
      // Use BidFTA's search URL with the query
      const encodedQuery = encodeURIComponent(query);
      setSearchUrl(`https://www.bidfta.com/search?q=${encodedQuery}`);
    } else {
      setSearchUrl("https://www.bidfta.com/category/all/1");
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const encodedQuery = encodeURIComponent(searchQuery);
      setSearchUrl(`https://www.bidfta.com/search?q=${encodedQuery}`);
    } else {
      setSearchUrl("https://www.bidfta.com/category/all/1");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <SearchBar onSearch={handleSearch} initialValue={query} />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">BidFTA Live Search</h2>
            <p className="text-sm text-muted-foreground">
              {query ? `Searching for: "${query}"` : "Browse all auctions"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This loads the official BidFTA website with all their features and real-time data
            </p>
          </div>
          
          <div className="h-[calc(100vh-200px)]">
            <iframe
              src={searchUrl}
              className="w-full h-full border-0"
              title="BidFTA Search"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}