import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Clock, ChartBar as BarChart3, Users, ArrowLeft, Triangle, Database, Check, Eye } from 'lucide-react';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import { FusionPanel } from '../components/FusionPanel';
import { FusionPanelSkeleton } from '../components/FusionPanelSkeleton';
import { AnalyticsChartsSkeleton } from '../components/AnalyticsChartsSkeleton';
import { AIResponsePanelSkeleton } from '../components/AIResponsePanelSkeleton';
import SearchInput from '../components/SearchInput';
import { AIResponsePanel } from '../components/AIResponsePanel';
import { BackToTopButton } from '../components/BackToTopButton';
import { ConversationHistoryDrawer } from '../components/ConversationHistoryDrawer';
import { useAIStore } from '../stores/aiStore';
import { conversationPersistence } from '../services/conversationPersistence';

export function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduce = useReducedMotion();
  const {
    currentConversation,
    continueConversation,
    getCurrentTurn,
    setActiveConversation,
  } = useAIStore();

  const [showHeaderText, setShowHeaderText] = useState(false);
  const [currentTurnInView, setCurrentTurnInView] = useState<number>(0);
  const [savedPulse, setSavedPulse] = useState(false);
  const [sharedView, setSharedView] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const sharedTab = (searchParams.get('tab') === 'analytics' ? 'analytics' : 'responses') as 'analytics' | 'responses';

  const setTabParam = useCallback(
    (value: 'analytics' | 'responses') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === 'responses') next.delete('tab');
          else next.set('tab', value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Load shared conversation via ?c=<id> if no active conversation
  useEffect(() => {
    const id = searchParams.get('c');
    if (!id) return;
    if (currentConversation?.id === id) {
      setSharedView(true);
      return;
    }
    if (currentConversation) return;
    let cancelled = false;
    setLoadingShared(true);
    conversationPersistence.loadConversation(id).then((convo) => {
      if (cancelled) return;
      setLoadingShared(false);
      if (convo) {
        setActiveConversation(convo);
        setSharedView(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams, currentConversation, setActiveConversation]);

  const turnRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fusionObserverRef = useRef<IntersectionObserver | null>(null);
  const turnObserverRef = useRef<IntersectionObserver | null>(null);

  const setTurnRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      turnRefs.current[index] = el;
    },
    []
  );

  const handlePromptSubmit = async (
    prompt: string,
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ) => {
    await continueConversation(prompt, selectedModels);
  };

  const handleNewQuery = () => {
    navigate('/');
  };

  // Pulse "Saved" indicator when a turn completes
  useEffect(() => {
    const last = currentConversation?.turns[currentConversation.turns.length - 1];
    if (last?.completed && !last.loading) {
      setSavedPulse(true);
      const t = setTimeout(() => setSavedPulse(false), 2200);
      return () => clearTimeout(t);
    }
  }, [currentConversation?.turns]);

  // Smooth scroll to latest turn when a new one is appended
  useEffect(() => {
    const turns = currentConversation?.turns;
    if (!turns?.length) return;
    const lastEl = turnRefs.current[turns.length - 1];
    if (!lastEl) return;
    const id = requestAnimationFrame(() => {
      lastEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [currentConversation?.turns.length]);

  // IntersectionObserver for active turn detection
  useEffect(() => {
    if (!currentConversation?.turns.length) return;

    turnObserverRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const idx = turnRefs.current.findIndex((el) => el === visible[0].target);
          if (idx >= 0) setCurrentTurnInView(idx);
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    turnRefs.current.forEach((el) => el && observer.observe(el));
    turnObserverRef.current = observer;

    return () => observer.disconnect();
  }, [currentConversation?.turns.length]);

  // IntersectionObserver to toggle header prompt text once fusion is scrolled past
  useEffect(() => {
    fusionObserverRef.current?.disconnect();
    const fusionEls = document.querySelectorAll('[data-fusion-panel]');
    if (!fusionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const pastAny = entries.some(
          (e) => !e.isIntersecting && e.boundingClientRect.top < 0
        );
        setShowHeaderText(pastAny);
      },
      { rootMargin: '-80px 0px 0px 0px', threshold: [0, 1] }
    );
    fusionEls.forEach((el) => observer.observe(el));
    fusionObserverRef.current = observer;

    return () => observer.disconnect();
  }, [currentConversation?.turns.length, currentConversation?.turns.map(t => t.fusionResult?.content).join('|')]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const scrollToTurn = useCallback((index: number) => {
    const el = turnRefs.current[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard shortcuts: J/K to navigate turns, C to copy fusion, N for new
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      const turns = currentConversation?.turns ?? [];
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        scrollToTurn(Math.min(currentTurnInView + 1, turns.length - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        scrollToTurn(Math.max(currentTurnInView - 1, 0));
      } else if (e.key === 'c' || e.key === 'C') {
        const fusion = turns[currentTurnInView]?.fusionResult?.content;
        if (fusion) {
          navigator.clipboard.writeText(fusion);
          toast.success('Synthesis copied to clipboard');
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentConversation?.turns, currentTurnInView, scrollToTurn, navigate]);

  if (!currentConversation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#090C14' }}>
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {loadingShared ? 'Loading shared conversation…' : 'No active conversation'}
          </h3>
          <p className="text-gray-500">
            {loadingShared ? 'Fetching the shared thread from the database.' : 'Start a new conversation to see AI responses'}
          </p>
          {!loadingShared && (
            <Button
              onClick={() => navigate('/')}
              className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-white"
            >
              Start new
            </Button>
          )}
        </div>
      </div>
    );
  }

  const latestTurn = getCurrentTurn();
  const isLatestTurnLoading = latestTurn && latestTurn.loading;
  const currentTurnPrompt = currentConversation.turns[currentTurnInView]?.prompt || '';

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: 'radial-gradient(1200px 600px at 50% -10%, rgba(59,130,246,0.08), transparent 60%), #0B0F1A' }}>
      {/* Fixed Header */}
      {!isLatestTurnLoading && (
        <header className="border-b border-gray-800/70 backdrop-blur-xl sticky top-0 z-50 bg-gray-900/70">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewQuery}
                  className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-white hover:bg-gray-800 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">New Conversation</span>
                    <span className="sm:hidden">New</span>
                  </div>
                  <ArrowLeft className="w-4 h-4 text-gray-300" />
                </Button>

                <button
                  onClick={handleNewQuery}
                  className="flex items-center gap-2 sm:gap-3 group hover:bg-white/5 rounded-lg px-2 py-1 transition-all duration-200 cursor-pointer min-w-0"
                >
                  <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 group-hover:border-white/30 transition-all duration-200">
                    <Triangle className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 group-hover:text-white transition-colors duration-200" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 relative h-5 sm:h-5 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      {showHeaderText ? (
                        <motion.span
                          key="prompt"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs sm:text-sm text-white font-medium line-clamp-1 group-hover:text-blue-200 transition-colors duration-200"
                        >
                          {currentTurnPrompt}
                        </motion.span>
                      ) : (
                        <motion.span
                          key="wordmark"
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-xs sm:text-sm text-white font-medium group-hover:text-blue-200 transition-colors duration-200"
                        >
                          Prismatic
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <AnimatePresence>
                  {savedPulse && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5"
                    >
                      <Check className="w-3 h-3" />
                      Saved
                    </motion.div>
                  )}
                </AnimatePresence>

                <ConversationHistoryDrawer />

                <div className="hidden sm:flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/50 text-xs whitespace-nowrap">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1" />
                    Turn {currentTurnInView + 1} of {currentConversation.turns.length}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">Started {formatTimestamp(currentConversation.createdAt)}</span>
                  </div>
                </div>

                <div className="flex sm:hidden">
                  <Badge variant="outline" className="text-blue-400 border-blue-800 bg-blue-950/50 text-xs">
                    {currentTurnInView + 1}/{currentConversation.turns.length}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Turn progress dots */}
            {currentConversation.turns.length > 1 && (
              <div className="mt-2 flex items-center gap-1.5 justify-center">
                {currentConversation.turns.map((t, i) => {
                  const preview = t.prompt.length > 80 ? `${t.prompt.slice(0, 80)}…` : t.prompt;
                  return (
                    <button
                      key={i}
                      onClick={() => scrollToTurn(i)}
                      aria-label={`Jump to turn ${i + 1}: ${preview}`}
                      title={`Turn ${i + 1} · ${preview}`}
                      className={`h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                        i === currentTurnInView
                          ? 'w-6 bg-cyan-400'
                          : 'w-1.5 bg-gray-700 hover:bg-gray-600'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Shared view banner */}
      {sharedView && (
        <div className="sticky top-[64px] z-40 border-b border-cyan-900/40 bg-cyan-950/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm text-cyan-200">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">You are viewing a shared conversation (read-only).</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewQuery}
              className="text-cyan-200 hover:text-white hover:bg-cyan-500/20 h-7 text-xs flex-shrink-0"
            >
              Start your own
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 ${sharedView ? 'pb-12' : 'pb-36 sm:pb-40'} overflow-y-auto`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8 sm:space-y-16">
          {currentConversation.turns.map((turn, turnIndex) => (
            <motion.div
              key={turn.id}
              ref={setTurnRef(turnIndex)}
              initial={shouldReduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduce ? 0 : 0.4, ease: 'easeOut', delay: shouldReduce ? 0 : Math.min(turnIndex * 0.05, 0.3) }}
              className="space-y-6 sm:space-y-8 relative"
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
                    <span className="hidden sm:inline">{turn.responses.length} models</span>
                    <span className="sm:hidden">{turn.responses.length}</span>
                  </div>
                </div>
              )}

              {/* Prompt Display */}
              {!turn.loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="relative bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-6 overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/70 to-blue-400/10" />
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
                </motion.div>
              )}

              {/* Loading State */}
              {turn.loading && (
                <div className="space-y-8 sm:space-y-12">
                  <div className="relative bg-gray-800/30 rounded-lg border border-gray-700/50 p-4 sm:p-6 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/70 to-blue-400/10" />
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

                  <FusionPanelSkeleton />

                  <div className="mt-8 sm:mt-12">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        Reference Material
                        <span className="text-sm text-gray-500 font-normal">(Preparing...)</span>
                      </h3>
                      <div className="bg-gray-800 border-gray-700 rounded-lg p-1 flex w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none px-3 py-1.5 bg-gray-700 text-white rounded text-xs sm:text-sm text-center">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                          Analytics
                        </div>
                        <div className="flex-1 sm:flex-none px-3 py-1.5 text-gray-400 rounded text-xs sm:text-sm text-center">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 inline" />
                          AI Responses
                        </div>
                      </div>
                    </div>

                    <AnalyticsChartsSkeleton />

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
                <motion.div
                  data-fusion-panel
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="mt-8 sm:mt-12"
                >
                  <FusionPanel fusion={turn.fusionResult} conversationId={currentConversation.id} />
                </motion.div>
              )}

              {/* Analytics Tabs */}
              {!turn.loading && turn.analysisData && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                  className="mt-8 sm:mt-12"
                >
                  <Tabs value={sharedTab} onValueChange={(v) => setTabParam(v as 'analytics' | 'responses')} className="w-full">
                    <div className="flex flex-col items-center sm:items-start gap-4 mb-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2 self-center">
                        <Database className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        Reference Material
                      </h3>
                      <TabsList className="bg-gray-800 border-gray-700 w-full sm:w-auto justify-start self-start">
                        <TabsTrigger value="analytics" className="text-xs sm:text-sm">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Analytics
                        </TabsTrigger>
                        <TabsTrigger value="responses" className="text-xs sm:text-sm">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
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
                          {turn.responses.map((response, i) => (
                            <motion.div
                              key={response.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.05 * i }}
                            >
                              <AIResponsePanel response={response} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}

              {/* Numbered Turn Separator */}
              {turnIndex < currentConversation.turns.length - 1 && (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-gray-700 to-gray-700" />
                    <div className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900/70 px-3 py-1 text-[11px] uppercase tracking-wider text-gray-400">
                      Turn {turnIndex + 2}
                    </div>
                    <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-gray-700 to-gray-700" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Back to Top */}
      <BackToTopButton />

      {/* Bottom Search Bar */}
      {!isLatestTurnLoading && !sharedView && (
        <div className="fixed bottom-0 left-0 right-0 bg-transparent z-40">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/80 to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
