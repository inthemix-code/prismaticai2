import { useState, useRef, useEffect, useCallback, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader as Loader2, Triangle, Bot, Zap, Diamond, Sparkles, Radio, Plus, History, FolderOpen, Check } from 'lucide-react';
import { demoPrompts } from '../data/mockData';
import { DemoPrompt } from '../types';
import { validateSearchRequest } from '../utils/validation';
import { cn } from '@/lib/utils';
import { useAIStore } from '../stores/aiStore';
import { ProjectsMemoryDrawer } from './ProjectsMemoryDrawer';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';

interface SearchInputProps {
  onSearch: (query: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => void;
  isLoading: boolean;
  showDemoPrompts?: boolean;
  className?: string;
  showQuickActions?: boolean;
  showProjectBadge?: boolean;
  onNewConversation?: () => void;
}

const SearchInput = ({
  onSearch,
  isLoading,
  showDemoPrompts = true,
  className,
  showQuickActions = false,
  showProjectBadge = false,
  onNewConversation,
}: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxChars = 500;

  useEffect(() => {
    setCharCount(query.length);
  }, [query]);

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setCharCount(e.target.value.length);
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
    setSelectedModels(prev => {
      const updated = { ...prev, [model]: !prev[model] };
      try { localStorage.setItem('selectedModels', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  // Calculate selected models count and order
  const selectedCount = Object.values(selectedModels).filter(Boolean).length;

  const handleDemoPrompt = (demoPrompt: DemoPrompt) => {
    setQuery(demoPrompt.text);
    setValidationErrors([]); // Clear any existing validation errors
  };

  // Filter demo prompts to only show the three requested categories
  const filteredDemoPrompts = demoPrompts.filter(demo => 
    ['Comparative Analysis', 'Economic Analysis', 'Ethical Reasoning'].includes(demo.category)
  );

  const hasLeadingBadge = showProjectBadge;
  const hasTrailingCluster = showQuickActions;

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6 relative", className)}>
      {/* Blur layer positioned behind the search card - smaller with gradient */}
      <div className="absolute inset-[-10px] z-[-1] rounded-xl radial-blur-gradient backdrop-blur-lg pointer-events-none" />

      <Card className={`chat-input-transition relative overflow-hidden ${
        isFocused
          ? 'chat-input-shadow-focus border-white/20'
          : 'chat-input-shadow border-white/10 hover:border-white/20'
        } ${isLoading ? 'animate-glow-pulse' : ''}`}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-start gap-2">
              {hasLeadingBadge && (
                <div className="pt-0.5 flex-shrink-0">
                  <ProjectBadge />
                </div>
              )}
              <div className="relative flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything... I'll synthesize the best answer from multiple AI models"
                  className={cn(
                    'w-full min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent text-sm font-normal placeholder:text-muted-foreground/70 focus:outline-none focus:ring-0 leading-relaxed p-0',
                    hasTrailingCluster ? 'pr-28 sm:pr-32' : 'pr-16 sm:pr-20'
                  )}
                  disabled={isLoading}
                  rows={1}
                />
              
                {/* Character count indicator */}
                {(isFocused || charCount > maxChars * 0.8) && (
                  <div className={`absolute top-2 ${hasTrailingCluster ? 'right-32 sm:right-36' : 'right-2'} text-xs font-mono transition-colors duration-200 z-10 ${
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

              {hasTrailingCluster && (
                <div className="flex items-center gap-1 pt-0.5 flex-shrink-0">
                  <QuickActionIcon
                    label="New conversation"
                    onClick={() => onNewConversation?.()}
                    icon={<Plus className="w-4 h-4" />}
                  />
                  <ConversationHistoryDrawer
                    trigger={
                      <QuickActionIcon
                        label="Conversation history"
                        icon={<History className="w-4 h-4" />}
                        asButton={false}
                      />
                    }
                  />
                  <ProjectsMemoryDrawer
                    trigger={
                      <QuickActionIcon
                        label="Projects and memory"
                        icon={<FolderOpen className="w-4 h-4" />}
                        asButton={false}
                      />
                    }
                  />
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
              
              <LiveModeToggle isLoading={isLoading} />

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

interface QuickActionIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  asButton?: boolean;
}

const QuickActionIcon = forwardRef<HTMLButtonElement, QuickActionIconProps>(
  function QuickActionIcon({ icon, label, onClick, asButton = true, ...rest }, ref) {
    const btn = (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        className="inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
        {...rest}
      >
        {icon}
      </button>
    );
    if (!asButton) return btn;
    return (
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>{btn}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

function ProjectBadge() {
  const projects = useAIStore((s) => s.projects);
  const activeProjectId = useAIStore((s) => s.activeProjectId);
  const setActiveProject = useAIStore((s) => s.setActiveProject);
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={activeProject ? `Active project: ${activeProject.name}` : 'Select a project'}
          className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-colors text-xs text-gray-300"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: activeProject?.color ?? '#64748b' }}
          />
          <span className="max-w-[100px] truncate font-medium">
            {activeProject ? activeProject.name : 'No project'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64 p-1 bg-gray-950 border-white/10">
        <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-gray-500">
          Project context
        </div>
        <button
          onClick={() => {
            setActiveProject(null);
            setOpen(false);
          }}
          className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
            !activeProjectId ? 'bg-cyan-500/15 text-cyan-200' : 'text-gray-300 hover:bg-white/5'
          }`}
        >
          <span>No project</span>
          {!activeProjectId && <Check className="w-3 h-3" />}
        </button>
        <div className="max-h-64 overflow-y-auto">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProject(p.id);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                activeProjectId === p.id ? 'bg-cyan-500/15 text-cyan-200' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.name}</span>
              </span>
              {activeProjectId === p.id && <Check className="w-3 h-3 flex-shrink-0" />}
            </button>
          ))}
        </div>
        {projects.length === 0 && (
          <div className="px-2 py-2 text-[11px] text-gray-500">
            Create a project from the sidebar to scope memory and context.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function LiveModeToggle({ isLoading }: { isLoading: boolean }) {
  const liveMode = useAIStore(s => s.liveMode);
  const setLiveMode = useAIStore(s => s.setLiveMode);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setLiveMode(!liveMode)}
      disabled={isLoading}
      title="Stream responses token-by-token"
      className={`bg-white/5 backdrop-blur-sm rounded-xl border transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8 ${
        liveMode
          ? 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30 hover:bg-cyan-500/20'
          : 'border-white/10 text-muted-foreground hover:text-white hover:bg-white/10'
      }`}
    >
      <Radio className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${liveMode ? 'animate-pulse' : ''}`} />
      Live
    </Button>
  );
}

export default SearchInput;