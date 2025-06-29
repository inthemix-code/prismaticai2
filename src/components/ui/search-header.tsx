import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Settings, Clock } from 'lucide-react';

interface SearchHeaderProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  onSettingsClick?: () => void;
  resultCount?: number;
  searchTime?: number;
}

export function SearchHeader({
  initialQuery = '',
  onSearch,
  onFilterClick,
  onSettingsClick,
  resultCount,
  searchTime,
}: SearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={handleInputChange}
              placeholder="Search across multiple AI models..."
              className="pl-10 pr-4"
            />
          </div>
          
          <Button type="submit" size="sm">
            Search
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFilterClick}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSettingsClick}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </form>
        
        {(resultCount !== undefined || searchTime !== undefined) && (
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            {resultCount !== undefined && (
              <Badge variant="secondary">
                {resultCount.toLocaleString()} results
              </Badge>
            )}
            {searchTime !== undefined && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{searchTime.toFixed(2)}s</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}