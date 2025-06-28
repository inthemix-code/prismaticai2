import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Filter, Share } from 'lucide-react';

interface BottomSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onNewQuery: () => void;
}

export function BottomSearchBar({ query, onQueryChange, onSearch, onNewQuery }: BottomSearchBarProps) {
  const [searchValue, setSearchValue] = useState(query);

  const handleSearch = () => {
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      // Clear the search bar after submitting
      setSearchValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur-md border-t border-gray-800 z-50" style={{ backgroundColor: 'rgba(9, 12, 20, 0.95)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewQuery}
            className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            New
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                // Remove the onQueryChange call to prevent parent re-renders on every keystroke
              }}
              onKeyPress={handleKeyPress}
              placeholder="Search or ask a new question..."
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 rounded-lg pr-12"
            />
            <Button
              size="sm"
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-white text-black hover:bg-gray-200 h-8 px-4 rounded-lg"
            >
              Search
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}