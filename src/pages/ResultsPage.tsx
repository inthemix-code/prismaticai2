import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, BarChart3, ArrowDown, Users, ArrowLeft, Triangle } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { FusionPanel } from '../components/FusionPanel';
import { FusionPanelSkeleton } from '../components/FusionPanelSkeleton';
import { AnalyticsChartsSkeleton } from '../components/AnalyticsChartsSkeleton';
import { AIResponsePanelSkeleton } from '../components/AIResponsePanelSkeleton';
import SearchInput from '../components/SearchInput';
import { AIResponsePanel } from '../components/AIResponsePanel';
import { Skeleton } from '@/components/ui/skeleton';
import { useAIStore } from '../stores/aiStore';
import { ApiStatusIndicator } from '../components/ApiStatusIndicator';

export function ResultsPage() {
  const navigate = useNavigate();
  const { 
    currentConversation,
    continueConversation,
    getCurrentTurn
  } = useAIStore();

  const [showHeaderText, setShowHeaderText] = useState(false);
  const [currentTurnInView, setCurrentTurnInView] = useState<number>(0);
  
  // Ref for the latest turn container
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Helper function to set turn refs
  const setTurnRef = (index: number) => (el: HTMLDivElement | null) => {
    turnRefs.current[index] = el;
    if (index === (currentConversation?.turns.length ?? 0) - 1) {
      (latestTurnRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    }
  };

  const handlePromptSubmit = async (prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => {
    await continueConversation(prompt, selectedModels);
  };

  const handleNewQuery = () => {
    navigate('/');
  };

  // Auto-scroll to latest turn when new turns are added
  useEffect(() => {
    if (latestTurnRef.current && currentConversation?.turns.length) {
      setTimeout(() => {
        latestTurnRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [currentConversation?.turns.length]);

  // Scroll listener to determine which turn is in view and when to show header text
  useEffect(() => {
    const handleScroll = () => {
      if (!currentConversation?.turns.length) return;

      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Find which turn is currently in view
      let currentTurn = 0;
      let shouldShowText = false;

      turnRefs.current.forEach((ref, index) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const turnTop = rect.top + scrollPosition;
          const turnBottom = rect.bottom + scrollPosition;
          
          // Check if this turn is in the viewport
          if (scrollPosition >= turnTop - windowHeight / 2 && scrollPosition < turnBottom) {
            currentTurn = index;
          }
          
          // Check if we've scrolled past the fusion response of any turn
          const fusionPanel = ref.querySelector('[data-fusion-panel]');
          if (fusionPanel) {
            const fusionRect = fusionPanel.getBoundingClientRect();
            const fusionBottom = fusionRect.bottom + scrollPosition;
            if (scrollPosition > fusionBottom - 100) { // 100px buffer
              shouldShowText = true;
            }
          }
        }
      });

      setCurrentTurnInView(currentTurn);
      setShowHeaderText(shouldShowText);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentConversation?.turns.length]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!currentConversation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#090C14' }}>
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No active conversation</h3>
          <p className="text-gray-500">Start a new conversation to see AI responses</p>
        </div>
      </div>
    );
  }

  // Check if the latest turn is loading to conditionally hide headers
  const latestTurn = getCurrentTurn();
  const isLatestTurnLoading = latestTurn && latestTurn.loading;

  // Get the current turn's prompt for the header
  const currentTurnPrompt = currentConversation.turns[currentTurnInView]?.prompt || '';

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      {/* API Status Indicator */}
      <ApiStatusIndicator />
      
      {/* Fixed Header - Hide when latest turn is loading */}
      {!isLatestTurnLoading && (
        <header className="border-b border-gray-800 backdrop-blur-md sticky top-0 z-50 bg-gray-900/90">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewQuery}
                  className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white hover:bg-gray-800 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Conversation</span>
                  <span className="sm:hidden">New</span>
                </Button>
                <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
                  <Triangle className="w-3 h-3 sm:w-4 sm:h-4 text-white/80" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  {showHeaderText ? (
                    <span className="text-xs sm:text-sm text-white font-medium line-clamp-1">
                      {currentTurnPrompt}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm text-white font-medium">
                      Prismatic
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-0">
                <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/50 text-xs whitespace-nowrap hidden sm:flex">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1" />
                  Turn {currentTurnInView + 1} of {currentConversation.turns.length}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-400 hidden sm:flex">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Started {formatTimestamp(currentConversation.createdAt)}</span>
                </div>
                {/* Mobile-only turn indicator */}
                <div className="flex sm:hidden">
                  <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/50 text-xs">
                    {currentTurnInView + 1}/{currentConversation.turns.length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area - Scrollable Conversation */}
      <div className="flex-1 pb-36 sm:pb-40 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8 sm:space-y-16">
          {currentConversation.turns.map((turn, turnIndex) => (
            <div 
              key={turn.id}
              ref={setTurnRef(turnIndex)}
              className="space-y-6 sm:space-y-8"
            >
              {/* Turn Header */}
              {!turn.loading && (
                <div className="flex items-center justify-between border-b border-gray-800 pb-3 sm:pb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/50 text-xs sm:text-sm">
                      Turn {turnIndex + 1}
                    </Badge>
                    <span className="text-xs sm:text-sm text-gray-400">
                      {formatTimestamp(turn.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      {turn.responses.length} models
                    </span>
                    <span className="sm:hidden">
                      {turn.responses.length}
                    </span>
                  </div>
                </div>
              )}

              {/* Prompt Display */}
              {!turn.loading && (
                <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-medium text-white mb-2">Your Question</h3>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed break-words">
                        {turn.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {turn.loading && (
                <div className="space-y-8 sm:space-y-12">
                  {/* Prompt skeleton */}
                  <div className="bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-white mb-2">Your Question</h3>
                        <p className="text-sm sm:text-base text-gray-300 leading-relaxed break-words">
                          {turn.prompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fusion Panel Skeleton */}
                  <FusionPanelSkeleton />

                  {/* Analytics Section Skeleton */}
                  <div className="mt-8 sm:mt-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        Reference Material
                        <span className="text-sm text-gray-500 font-normal">(Preparing...)</span>
                      </h3>
                      <div className="bg-gray-800 border-gray-700 rounded-lg p-1 flex w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-700 text-white rounded text-xs sm:text-sm text-center">
                          Analytics
                        </div>
                        <div className="flex-1 sm:flex-none px-3 py-1.5 text-gray-400 rounded text-xs sm:text-sm text-center">
                          AI Responses
                        </div>
                      </div>
                    </div>
                    
                    {/* Analytics Charts Skeleton */}
                    <AnalyticsChartsSkeleton />
                    
                    {/* AI Responses Section Skeleton */}
                    <div className="mt-8 space-y-4 sm:space-y-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          <h5 className="text-sm sm:text-base font-semibold text-white">Individual AI Responses</h5>
                          <span className="text-xs text-gray-500">(Loading...)</span>
                        </div>
                        <p className="text-xs text-gray-500">Compare how each platform approaches your query</p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                        {turn.responses.map((response) => (
                          <AIResponsePanelSkeleton key={response.id} platform={response.platform} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fusion Response */}
              {!turn.loading && turn.fusionResult && (
                <div data-fusion-panel className="mt-8 sm:mt-12">
                  <FusionPanel fusion={turn.fusionResult} />
                </div>
              )}

              {/* Analytics Tabs */}
              {!turn.loading && turn.analysisData && (
                <div className="mt-8 sm:mt-12">
                  <Tabs defaultValue="analytics" className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        Reference Material
                      </h3>
                      <TabsList className="bg-gray-800 border-gray-700 w-full sm:w-auto">
                        <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                          Analytics
                        </TabsTrigger>
                        <TabsTrigger value="responses" className="text-xs sm:text-sm">
                          AI Responses
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="analytics" className="mt-0">
                      <AnalyticsCharts 
                        data={turn.analysisData} 
                        fusionSources={turn.fusionResult?.sources}
                      />
                    </TabsContent>
                    
                    <TabsContent value="responses" className="mt-0">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                            <h5 className="text-sm sm:text-base font-semibold text-white">Individual AI Responses</h5>
                          </div>
                          <p className="text-xs text-gray-500">Compare how each platform approaches your query</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                          {turn.responses.map((response) => (
                            <AIResponsePanel key={response.id} response={response} />
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Turn Separator */}
              {turnIndex < currentConversation.turns.length - 1 && (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="h-px w-8 sm:w-12 bg-gray-700"></div>
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <div className="h-px w-8 sm:w-12 bg-gray-700"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Search Bar - Fixed */}
      {!isLatestTurnLoading && (
        <div className="fixed bottom-0 left-0 right-0 bg-transparent z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <SearchInput 
              onSearch={handlePromptSubmit} 
              isLoading={isLatestTurnLoading || false}
              showDemoPrompts={false}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}