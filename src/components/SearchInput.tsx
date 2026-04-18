import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader as Loader2, Triangle, Bot, Zap, Diamond, Sparkles, Plus, History, FolderOpen, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { demoPrompts } from '../data/mockData';
import { DemoPrompt } from '../types';
import { validateSearchRequest } from '../utils/validation';
import { cn } from '@/lib/utils';
import { ProjectsMemoryDrawer } from './ProjectsMemoryDrawer';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';
import { ProjectBadge } from './ProjectBadge';
import { LivePill } from './LivePill';

interface SearchInputProps {
  onSearch: (query: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => void;
  isLoading: boolean;
  showDemoPrompts?: boolean;
  className?: string;
  showQuickActions?: boolean;
  onNewConversation?: () => void;
}

const SearchInput = ({
  onSearch,
  isLoading,
  showDemoPrompts = true,
  className,
  showQuickActions = false,
  onNewConversation,
}: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedModels, setSelectedModels] = useState(() => {
    try {
      const saved = localStorage.getItem('selectedModels');
      if (saved) return JSON.parse(saved) as { claude: boolean; grok: boolean; gemini: boolean };
    } catch {
      // ignore
    }
    return { claude: true, grok: true, gemini: true };
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 500;
  const charCount = query.length;

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryToSubmit = query.trim();

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

  const toggleModel = useCallback((model: keyof typeof selectedModels) => {
    setSelectedModels(prev => {
      const updated = { ...prev, [model]: !prev[model] };
      try { localStorage.setItem('selectedModels', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  const handleDemoPrompt = useCallback((demoPrompt: DemoPrompt) => {
    setQuery(demoPrompt.text);
    setValidationErrors([]);
  }, []);

  const filteredDemoPrompts = useMemo(() =>
    demoPrompts.filter(demo =>
      ['Comparative Analysis', 'Economic Analysis', 'Ethical Reasoning'].includes(demo.category)
    ),
    []
  );

  const modelChips = useMemo<{ id: keyof typeof selectedModels; label: string; icon: React.ReactNode }[]>(
    () => [
      { id: 'claude', label: 'Claude', icon: <Bot className="h-3.5 w-3.5" /> },
      { id: 'grok', label: 'Grok', icon: <Zap className="h-3.5 w-3.5" /> },
      { id: 'gemini', label: 'Gemini', icon: <Diamond className="h-3.5 w-3.5" /> },
    ],
    []
  );

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-3 relative", className)}>
      <div className="absolute inset-[-10px] z-[-1] rounded-xl radial-blur-gradient backdrop-blur-lg pointer-events-none" />

      <Card className={`chat-input-transition relative overflow-hidden ${
        isFocused
          ? 'chat-input-shadow-focus border-white/20'
          : 'chat-input-shadow border-white/10 hover:border-white/20'
        } ${isLoading ? 'animate-glow-pulse' : ''}`}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-start gap-2 px-3 sm:px-4 py-3">
            {/* Leading model chips */}
            <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
              {modelChips.map((m) => {
                const active = selectedModels[m.id];
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModel(m.id)}
                    disabled={isLoading}
                    aria-pressed={active}
                    aria-label={`${m.label} ${active ? 'enabled' : 'disabled'}`}
                    className={cn(
                      'inline-flex items-center gap-1 h-7 px-2 rounded-md border text-[11px] font-medium transition-colors',
                      active
                        ? 'bg-white/15 text-white border-white/20'
                        : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {m.icon}
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-white/10 mt-2 flex-shrink-0" aria-hidden="true" />

            {/* Textarea */}
            <div className="relative flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={query}
                onChange={handleQueryChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                className="w-full min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent text-sm font-normal placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 leading-relaxed p-0 pt-1"
                disabled={isLoading}
                rows={1}
              />

              {(isFocused || charCount > maxChars * 0.8) && (
                <div className={`absolute top-0 right-0 text-[10px] font-mono transition-colors duration-200 z-10 ${
                  charCount > maxChars
                    ? 'text-destructive'
                    : charCount > maxChars * 0.9
                      ? 'text-orange-500'
                      : 'text-muted-foreground/50'
                }`}>
                  {charCount}/{maxChars}
                </div>
              )}
            </div>

            {/* Send */}
            <Button
              type="submit"
              disabled={!query.trim() || isLoading || charCount > maxChars || validationErrors.length > 0}
              className="bg-accent-foreground hover:bg-gray-200 text-accent shadow-sm hover:shadow-md chat-input-transition font-medium h-7 px-3 text-xs flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Triangle className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {validationErrors.length > 0 && (
            <div className="mx-3 sm:mx-4 mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-xs text-red-400">
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Metadata row */}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pb-2 pt-0 text-[11px] text-gray-500 tabular-nums">
            <div className="flex items-center gap-2 min-w-0">
              <ProjectBadge />
              <LivePill isLoading={isLoading} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="hidden sm:inline text-gray-500">J/K navigate &middot; ? help</span>
              {showQuickActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="More actions"
                      className="inline-flex items-center justify-center h-6 w-6 rounded-md text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="top" className="bg-gray-950 border-white/10 w-52">
                    <DropdownMenuItem
                      onClick={() => onNewConversation?.()}
                      className="text-gray-200 focus:bg-white/5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-2" /> New conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setHistoryOpen(true);
                      }}
                      className="text-gray-200 focus:bg-white/5 text-xs"
                    >
                      <History className="w-3.5 h-3.5 mr-2" /> History
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setProjectsOpen(true);
                      }}
                      className="text-gray-200 focus:bg-white/5 text-xs"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-2" /> Projects
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </form>
      </Card>

      {/* Hidden drawer triggers controlled from overflow menu */}
      {showQuickActions && (
        <>
          <ConversationHistoryDrawer
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            trigger={<span className="hidden" aria-hidden="true" />}
          />
          <ProjectsMemoryDrawer
            open={projectsOpen}
            onOpenChange={setProjectsOpen}
            trigger={<span className="hidden" aria-hidden="true" />}
          />
        </>
      )}

      {showDemoPrompts && (
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center gap-2 mb-3 px-2 sm:px-0">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-300" />
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
