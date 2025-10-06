import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({ onSearch, initialValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      onSearch(newQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for items across entire platform (e.g., 'sofa', 'vacuum', 'pillow')..."
            value={query}
            onChange={handleChange}
            className="w-full pl-12 pr-4 py-3 text-sm shadow-sm"
            data-testid="input-search"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      </form>
    </div>
  );
}
