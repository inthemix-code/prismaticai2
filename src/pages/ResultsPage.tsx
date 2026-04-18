import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageSquare, Triangle, Check, Eye, Plus } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import { ConversationHistoryDrawer } from '../components/ConversationHistoryDrawer';
import { ProjectsMemoryDrawer } from '../components/ProjectsMemoryDrawer';
import { TurnRail, TurnRailMobile } from '../components/TurnRail';
import { TurnBlock } from '../components/TurnBlock';
import { useAIStore } from '../stores/aiStore';
import { conversationPersistence } from '../services/conversationPersistence';
import { uiPreferences, defaultUIPreferences, UIPreferences } from '../services/uiPreferences';

export function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    currentConversation,
    continueConversation,
    getCurrentTurn,
    setActiveConversation,
  } = useAIStore();
  const activeProjectId = useAIStore((s) => s.activeProjectId);
  const pinMemory = useAIStore((s) => s.pinMemory);
  const loadProjects = useAIStore((s) => s.loadProjects);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const [prefs, setPrefs] = useState<UIPreferences>(defaultUIPreferences);
  useEffect(() => {
    void uiPreferences.load().then(setPrefs);
  }, []);

  const updatePrefs = useCallback((patch: Partial<UIPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      void uiPreferences.save(next);
      return next;
    });
  }, []);

  const [currentTurnInView, setCurrentTurnInView] = useState<number>(0);
  const [savedPulse, setSavedPulse] = useState(false);
  const [sharedView, setSharedView] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);

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

  useEffect(() => {
    const last = currentConversation?.turns[currentConversation.turns.length - 1];
    if (last?.completed && !last.loading) {
      setSavedPulse(true);
      const t = setTimeout(() => setSavedPulse(false), 2200);
      return () => clearTimeout(t);
    }
  }, [currentConversation?.turns]);

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
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    turnRefs.current.forEach((el) => el && observer.observe(el));
    turnObserverRef.current = observer;

    return () => observer.disconnect();
  }, [currentConversation?.turns.length]);

  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const scrollToTurn = useCallback((index: number) => {
    const el = turnRefs.current[index];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
            {loadingShared ? 'Loading shared conversation...' : 'No active conversation'}
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
  const turns = currentConversation.turns;
  const railItems = turns.map((t, i) => ({
    index: i,
    prompt: t.prompt,
    loading: t.loading,
  }));

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -10%, rgba(59,130,246,0.08), transparent 60%), #0B0F1A',
      }}
    >
      {/* Slim header */}
      {!isLatestTurnLoading && (
        <header className="border-b border-gray-800/60 backdrop-blur-xl sticky top-0 z-40 bg-gray-950/70">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <button
              onClick={handleNewQuery}
              className="flex items-center gap-2 group rounded-md px-2 py-1 hover:bg-white/5 transition-colors"
              aria-label="Start new conversation"
            >
              <div className="w-7 h-7 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Triangle className="w-3.5 h-3.5 text-white/90" />
              </div>
              <span className="text-sm font-medium text-white tracking-tight">Prismatic</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <AnimatePresence>
                {savedPulse && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5"
                  >
                    <Check className="w-3 h-3" />
                    Saved
                  </motion.div>
                )}
              </AnimatePresence>

              <ProjectsMemoryDrawer />
              <ConversationHistoryDrawer />

              <Button
                size="sm"
                onClick={handleNewQuery}
                className="h-8 bg-cyan-500/90 hover:bg-cyan-400 text-gray-950 font-medium text-xs px-3"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New
              </Button>
            </div>
          </div>

          {/* Shared view pill */}
          {sharedView && (
            <div className="border-t border-cyan-900/40 bg-cyan-950/30">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs text-cyan-200">
                <div className="flex items-center gap-2 min-w-0">
                  <Eye className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Viewing a shared conversation (read-only).</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleNewQuery}
                  className="text-cyan-200 hover:text-white hover:bg-cyan-500/20 h-6 text-xs flex-shrink-0 px-2"
                >
                  Start your own
                </Button>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Mobile turn strip */}
      {prefs.showTurnRail && !isLatestTurnLoading && (
        <TurnRailMobile
          turns={railItems}
          currentIndex={currentTurnInView}
          onJump={scrollToTurn}
        />
      )}

      {/* Desktop left rail */}
      {prefs.showTurnRail && !isLatestTurnLoading && (
        <TurnRail
          turns={railItems}
          currentIndex={currentTurnInView}
          onJump={scrollToTurn}
          onBackToTop={scrollToTop}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 ${sharedView ? 'pb-16' : 'pb-32 sm:pb-36'}`}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-14">
          {turns.map((turn, turnIndex) => (
            <div key={turn.id} ref={setTurnRef(turnIndex)}>
              <TurnBlock
                turn={turn}
                turnIndex={turnIndex}
                isLatest={turnIndex === turns.length - 1}
                conversation={currentConversation}
                activeProjectId={activeProjectId}
                onPinFact={(fact, turnId) => { void pinMemory(fact, turnId); }}
                referenceCollapsedDefault={prefs.referenceCollapsedDefault}
                autoCollapseOlder={prefs.autoCollapseOlderTurns}
                responsesLayout={prefs.responsesLayout}
                onToggleResponsesLayout={() =>
                  updatePrefs({
                    responsesLayout: prefs.responsesLayout === 'expanded' ? 'compact' : 'expanded',
                  })
                }
                formatTimestamp={formatTimestamp}
              />
              {turnIndex < turns.length - 1 && (
                <div className="mt-10 sm:mt-14 flex items-center gap-3 text-[10px] uppercase tracking-wider text-gray-600">
                  <div className="h-px flex-1 bg-gray-800/70" />
                  <span>Turn {turnIndex + 2}</span>
                  <div className="h-px flex-1 bg-gray-800/70" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Narrow bottom search bar */}
      {!isLatestTurnLoading && !sharedView && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/70 to-transparent" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 py-4 pointer-events-auto">
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
