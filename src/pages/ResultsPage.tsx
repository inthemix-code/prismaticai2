import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, BarChart3, ArrowDown, Users, ArrowLeft, Triangle } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { FusionPanel } from '../components/FusionPanel';
import SearchInput from '../components/SearchInput';
import { AIResponsePanel } from '../components/AIResponsePanel';
import { TriangleLoader } from '../components/TriangleLoader';
import { useAIStore } from '../stores/aiStore';
import { ApiStatusIndicator } from '../components/ApiStatusIndicator';

export function ResultsPage() {
  const navigate = useNavigate();
  const { 
    currentConversation,
    continueConversation,
    getCurrentTurn
  } = useAIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showHeaderText, setShowHeaderText] = useState(false);
  const [currentTurnInView, setCurrentTurnInView] = useState<number>(0);
  
  // Ref for the latest turn container
  const latestTurnRef = useRef<HTMLDivElement>(null);
  const turnRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Remove the useEffect that auto-populates searchQuery to prevent re-population

  const handlePromptSubmit = async (prompt: string, selectedModels: { claude: boolean; grok: boolean; gemini: boolean }) => {
    // Use the selected models from the search input
    await continueConversation(prompt, selectedModels);
    // Clear the searchQuery state after submission
    setSearchQuery('');
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

  // Calculate loading progress for incomplete turns
  const getLoadingProgress = (turn: any) => {
    return turn.progress || 0;
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
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New</span>
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
              className="space-y-4 sm:space-y-8"
              ref={(el) => {
                turnRefs.current[turnIndex] = el;
                if (turnIndex === currentConversation.turns.length - 1) {
                  latestTurnRef.current = el;
                }
              }}
            >
              {/* Turn Header - Hide when this turn is loading */}
              {!turn.loading && (
                <div className="flex items-start gap-2 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-800">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-medium text-white">
                        {turn.prompt}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{formatTimestamp(turn.timestamp)}</span>
                      {turn.completed && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">Analysis Complete</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Loading state for incomplete turns - Show Triangle Loader */}
              {turn.loading && (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <TriangleLoader 
                    size={window.innerWidth < 640 ? "md" : "lg"}
                    progress={getLoadingProgress(turn)}
                  />
                </div>
              )}

              {/* Fusion Response for this turn - FIRST */}
              {turn.completed && turn.fusionResult && (
                <div className="space-y-4 sm:space-y-6" data-fusion-panel>
                  <FusionPanel fusion={turn.fusionResult} />
                </div>
              )}

              {/* Tabbed Reference Material - SECOND */}
              {turn.completed && turn.analysisData && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h4 className="text-base sm:text-lg font-semibold text-white">Reference Material</h4>
                  </div>
                  
                  <Tabs defaultValue="analytics" className="w-full">
                    <TabsList>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Analytics</span>
                      </TabsTrigger>
                      <TabsTrigger value="responses" className="flex items-center gap-2">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">AI Responses</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="analytics" className="mt-4 sm:mt-6">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                            <h5 className="text-sm sm:text-base font-semibold text-white">Detailed Analytics</h5>
                          </div>
                          <p className="text-xs text-gray-500">Deep analysis of response patterns and insights</p>
                        </div>
                        <AnalyticsCharts 
                          data={turn.analysisData} 
                          fusionSources={turn.fusionResult?.sources}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="responses" className="mt-4 sm:mt-6">
                      <div className="space-y-4 sm:space-y-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                            <h5 className="text-sm sm:text-base font-semibold text-white">Individual AI Responses</h5>
                          </div>
                          <p className="text-xs text-gray-500">Compare how each platform approaches your query</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="h-px bg-gray-800 flex-1"></div>
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <div className="h-px bg-gray-800 flex-1"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Search Input - Hide when latest turn is loading */}
      {!isLatestTurnLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-50 max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <SearchInput
            onSearch={handlePromptSubmit}
            isLoading={isLatestTurnLoading}
            showDemoPrompts={false}
          />
        </div>
      )}
    </div>
  );
}