import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Triangle, Bot, Zap, Diamond, Sparkles } from 'lucide-react';
import { debounce } from 'lodash';
import { demoPrompts } from '../data/mockData';
import { DemoPrompt } from '../types';
import { validateSearchRequest } from '../utils/validation';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => void;
  isLoading: boolean;
  showDemoPrompts?: boolean;
  className?: string;
}

const SearchInput = ({ onSearch, isLoading, showDemoPrompts = true, className }: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [selectedModels, setSelectedModels] = useState({
    claude: true,
    grok: true,
    gemini: true
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 500;

  // Create debounced function for query updates
  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => {
      // This debounced function no longer needs to do anything since we removed debouncedQuery
    }, 300),
    []
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  useEffect(() => {
    setCharCount(query.length);
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryToSubmit = query.trim();
    
    // Validate the request
    const validation = validateSearchRequest(queryToSubmit, selectedModels);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    if (!isLoading && validation.sanitizedPrompt) {
      setValidationErrors([]);
      onSearch(validation.sanitizedPrompt, selectedModels);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const toggleModel = (model: keyof typeof selectedModels) => {
    setSelectedModels(prev => ({
      ...prev,
      [model]: !prev[model]
    }));
  };

  // Calculate selected models count and order
  const selectedCount = Object.values(selectedModels).filter(Boolean).length;
  const modelOrder = ['claude', 'grok', 'gemini'] as const;
  const selectedModelsList = modelOrder.filter(model => selectedModels[model]);
  

  const handleDemoPrompt = (demoPrompt: DemoPrompt) => {
    setQuery(demoPrompt.text);
    setValidationErrors([]); // Clear any existing validation errors
  };

  // Filter demo prompts to only show the three requested categories
  const filteredDemoPrompts = demoPrompts.filter(demo => 
    ['Comparative Analysis', 'Economic Analysis', 'Ethical Reasoning'].includes(demo.category)
  );

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6 relative", className)}>
      {/* Blur layer positioned behind the search card */}
      <div className="absolute inset-[-20px] z-[-1] rounded-xl bg-white/5 backdrop-blur-xl pointer-events-none" />
      
      <Card className={`chat-input-transition relative overflow-hidden ${
        isFocused 
          ? 'chat-input-shadow-focus border-white/20' 
          : 'chat-input-shadow border-white/10 hover:border-white/20'
        } ${isLoading ? 'animate-glow-pulse' : ''}`}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="px-4 sm:px-6 py-3">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything... I'll synthesize the best answer from multiple AI models"
                className="w-full min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent text-sm font-normal placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 leading-relaxed p-0 pr-16 sm:pr-20"
                disabled={isLoading}
                rows={1}
              />
              
              {/* Character count indicator */}
              {(isFocused || charCount > maxChars * 0.8) && (
                <div className={`absolute top-2 right-2 text-xs font-mono transition-colors duration-200 z-10 ${
                  charCount > maxChars 
                    ? 'text-destructive' 
                    : charCount > maxChars * 0.9 
                      ? 'text-orange-500' 
                      : 'text-muted-foreground/60'
                }`}>
                  {charCount}/{maxChars}
                </div>
              )}
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                {validationErrors.map((error, index) => (
                  <p key={index} className="text-xs text-red-400">
                    {error}
                  </p>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-2 bg-muted/30 border-t border-border/50 gap-2">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="text-xs text-muted-foreground/70 font-medium mr-1 sm:mr-2 w-full sm:w-auto">
                Models selected: {selectedCount}/3
              </div>
              
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleModel('claude')}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 ${
                    selectedModels.claude 
                      ? 'bg-white/15 text-white border-white/20' 
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Claude
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleModel('grok')}
                   className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 ${
                     selectedModels.grok 
                       ? 'bg-white/15 text-white border-white/20' 
                       : 'text-muted-foreground hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Grok
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleModel('gemini')}
                   className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 ${
                     selectedModels.gemini 
                       ? 'bg-white/15 text-white border-white/20' 
                       : 'text-muted-foreground hover:text-white'
                  }`}
                  disabled={isLoading}
                >
                  <Diamond className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Gemini
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground/60 font-mono hidden lg:block">
                {isFocused && 'Press ⏎ to send, Shift+⏎ for new line'}
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={!query.trim() || isLoading || charCount > maxChars || validationErrors.length > 0}
              className="bg-accent-foreground hover:bg-gray-200 text-accent shadow-sm hover:shadow-md chat-input-transition font-medium min-w-[60px] h-7 sm:h-8 text-xs sm:text-sm px-3 sm:px-4 w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Triangle className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Demo Prompts Section */}
      {showDemoPrompts && (
        <div className="mt-4 sm:mt-6">
        <div className="flex items-center gap-2 mb-3 px-2 sm:px-0">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
          <span className="text-xs sm:text-sm text-gray-300">Try these demo prompts:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-2 sm:px-0">
          {filteredDemoPrompts.map((demo) => (
            <div
              key={demo.id}
              onClick={() => handleDemoPrompt(demo)}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-colors h-full cursor-pointer ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="space-y-3">
                <div>
                  <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                    {demo.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-200 line-clamp-2 mb-1">
                    {demo.text}
                  </div>
                  <p className="text-xs text-gray-500">
                    {demo.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};

export default SearchInput;