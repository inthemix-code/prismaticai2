import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  MessageSquare,
  Triangle,
  Check,
  Eye,
  Menu,
  Plus,
  History,
  FolderOpen,
  ArrowDown,
  Keyboard,
  Link as LinkIcon,
  Columns3,
} from 'lucide-react';
import SearchInput from '../components/SearchInput';
import {
  NavRail,
  NavRailDrawer,
  NavRailMobileStrip,
  NAV_RAIL_WIDTH_COLLAPSED,
  NAV_RAIL_WIDTH_EXPANDED,
} from '../components/NavRail';
import { TurnBlock } from '../components/TurnBlock';
import { useAIStore } from '../stores/aiStore';
import { conversationPersistence } from '../services/conversationPersistence';
import {
  uiPreferences,
  defaultUIPreferences,
  UIPreferences,
  ReadingWidth,
} from '../services/uiPreferences';
import { scrollPositions } from '../services/scrollPositions';

const READING_WIDTH_CLASS: Record<ReadingWidth, string> = {
  narrow: 'max-w-2xl',
  comfortable: 'max-w-3xl',
  wide: 'max-w-5xl',
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function useVisualViewportOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => {
      const diff = window.innerHeight - (vv.height + vv.offsetTop);
      setOffset(Math.max(0, diff));
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return offset;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentConversation = useAIStore((s) => s.currentConversation);
  const continueConversation = useAIStore((s) => s.continueConversation);
  const getCurrentTurn = useAIStore((s) => s.getCurrentTurn);
  const setActiveConversation = useAIStore((s) => s.setActiveConversation);
  const activeProjectId = useAIStore((s) => s.activeProjectId);
  const pinMemory = useAIStore((s) => s.pinMemory);
  const loadProjects = useAIStore((s) => s.loadProjects);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const reducedMotion = usePrefersReducedMotion();
  const viewportOffset = useVisualViewportOffset();

  const [prefs, setPrefs] = useState<UIPreferences>(
    () => uiPreferences.readLocalSync() ?? defaultUIPreferences
  );
  useEffect(() => {
    void uiPreferences.load().then(setPrefs);
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const updatePrefs = useCallback((patch: Partial<UIPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      uiPreferences.save(next);
      return next;
    });
  }, []);

  const [currentTurnInView, setCurrentTurnInView] = useState<number>(0);
  const [savedPulse, setSavedPulse] = useState(false);
  const [sharedView, setSharedView] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const conversationId = currentConversation?.id ?? null;
  const turns = useMemo(
    () => currentConversation?.turns ?? [],
    [currentConversation?.turns]
  );
  const turnCount = turns.length;

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

  // Refs for turn DOM nodes + a single long-lived observer
  const turnRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastAutoScrollAt = useRef(0);

  // Lazy-init the observer once
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const target = visible[0].target;
          let found = -1;
          turnRefs.current.forEach((el, idx) => {
            if (el === target) found = idx;
          });
          if (found >= 0) setCurrentTurnInView(found);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    observerRef.current = observer;
    // observe any already-registered refs
    turnRefs.current.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, []);

  const setTurnRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      const map = turnRefs.current;
      const existing = map.get(index);
      if (existing && existing !== el) {
        observerRef.current?.unobserve(existing);
        map.delete(index);
      }
      if (el) {
        map.set(index, el);
        observerRef.current?.observe(el);
      }
    },
    []
  );

  const handlePromptSubmit = useCallback(
    async (
      prompt: string,
      selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
    ) => {
      await continueConversation(prompt, selectedModels);
    },
    [continueConversation]
  );

  const handleNewQuery = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Save pulse when latest turn completes
  useEffect(() => {
    const last = turns[turns.length - 1];
    if (last?.completed && !last.loading) {
      setSavedPulse(true);
      const t = setTimeout(() => setSavedPulse(false), 2200);
      return () => clearTimeout(t);
    }
  }, [turns]);

  const getTurnEl = useCallback(
    (index: number) => turnRefs.current.get(index) ?? null,
    []
  );

  const scrollToTurn = useCallback(
    (index: number, opts?: { smooth?: boolean }) => {
      const el = getTurnEl(index);
      if (!el) return;
      lastAutoScrollAt.current = Date.now();
      el.scrollIntoView({
        behavior: reducedMotion || opts?.smooth === false ? 'auto' : 'smooth',
        block: 'start',
      });
    },
    [getTurnEl, reducedMotion]
  );

  const scrollToTop = useCallback(() => {
    lastAutoScrollAt.current = Date.now();
    window.scrollTo({
      top: 0,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [reducedMotion]);

  // Track whether the user is near the bottom (within 240px)
  const isNearBottomRef = useRef(true);
  useEffect(() => {
    const onScroll = () => {
      const scrollBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 240;
      isNearBottomRef.current = scrollBottom;
      if (scrollBottom) {
        setShowJumpToLatest(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll to latest turn only when user is near bottom; otherwise show pill
  const prevTurnCountRef = useRef(0);
  useEffect(() => {
    if (turnCount === 0) return;
    const prev = prevTurnCountRef.current;
    prevTurnCountRef.current = turnCount;
    if (turnCount <= prev) return;
    const lastEl = getTurnEl(turnCount - 1);
    if (!lastEl) return;
    if (isNearBottomRef.current) {
      const id = requestAnimationFrame(() => {
        lastAutoScrollAt.current = Date.now();
        lastEl.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
      return () => cancelAnimationFrame(id);
    }
    setShowJumpToLatest(true);
  }, [turnCount, getTurnEl, reducedMotion]);

  // Restore saved scroll position once turns are available for a new conversation
  const restoredForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!conversationId || turnCount === 0) return;
    if (restoredForRef.current === conversationId) return;

    const deepLinkTurn = Number(searchParams.get('t'));
    const hasDeepLink =
      Number.isFinite(deepLinkTurn) && deepLinkTurn >= 0 && deepLinkTurn < turnCount;

    const doRestore = (index: number) => {
      const el = getTurnEl(index);
      if (!el) return;
      const id = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
      return () => cancelAnimationFrame(id);
    };

    if (hasDeepLink) {
      restoredForRef.current = conversationId;
      doRestore(deepLinkTurn);
      return;
    }

    let cancelled = false;
    void scrollPositions.load(conversationId).then((pos) => {
      if (cancelled) return;
      if (pos && pos.turnIndex > 0 && pos.turnIndex < turnCount) {
        restoredForRef.current = conversationId;
        doRestore(pos.turnIndex);
      } else {
        restoredForRef.current = conversationId;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, turnCount, getTurnEl, searchParams]);

  // Persist scroll position when the turn in view changes
  useEffect(() => {
    if (!conversationId) return;
    if (restoredForRef.current !== conversationId) return;
    scrollPositions.save(conversationId, {
      turnIndex: currentTurnInView,
      scrollOffset: Math.round(window.scrollY),
    });
  }, [conversationId, currentTurnInView]);

  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  }, []);

  const handleToggleResponsesLayout = useCallback(() => {
    setPrefs((prev) => {
      const next: UIPreferences = {
        ...prev,
        responsesLayout: prev.responsesLayout === 'expanded' ? 'compact' : 'expanded',
      };
      uiPreferences.save(next);
      return next;
    });
  }, []);

  const handlePinFact = useCallback(
    (fact: string, turnId: string) => {
      void pinMemory(fact, turnId);
    },
    [pinMemory]
  );

  const handleCopyLink = useCallback(async () => {
    if (!conversationId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('c', conversationId);
    url.searchParams.set('t', String(currentTurnInView));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }, [conversationId, currentTurnInView]);

  const handleJumpToLatest = useCallback(() => {
    if (turnCount === 0) return;
    scrollToTurn(turnCount - 1);
    setShowJumpToLatest(false);
  }, [turnCount, scrollToTurn]);

  // Keep URL in sync with current turn (lightweight, no history spam)
  useEffect(() => {
    if (!conversationId) return;
    if (restoredForRef.current !== conversationId) return;
    const current = Number(searchParams.get('t'));
    if (current === currentTurnInView) return;
    const next = new URLSearchParams(searchParams);
    next.set('t', String(currentTurnInView));
    setSearchParams(next, { replace: true });
  }, [currentTurnInView, conversationId, searchParams, setSearchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        (e.target as HTMLElement)?.isContentEditable;
      if (e.key === '?' && !isEditable && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape' && helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        scrollToTurn(Math.min(currentTurnInView + 1, turnCount - 1));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        scrollToTurn(Math.max(currentTurnInView - 1, 0));
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        navigate('/');
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        scrollToTop();
      } else if (e.key === 'L') {
        e.preventDefault();
        handleJumpToLatest();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    turnCount,
    currentTurnInView,
    scrollToTurn,
    scrollToTop,
    navigate,
    handleJumpToLatest,
    helpOpen,
  ]);

  if (!currentConversation) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -10%, rgba(6,182,212,0.12), transparent 60%), #0B0F1A',
        }}
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-md"
        >
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/20 to-teal-400/10 flex items-center justify-center shadow-[0_0_32px_-8px_rgba(6,182,212,0.4)]">
            <MessageSquare className="w-6 h-6 text-cyan-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">
            {loadingShared ? 'Loading shared conversation' : 'No active conversation'}
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            {loadingShared
              ? 'Fetching the shared thread from the database.'
              : 'Ask any question and compare synthesized answers from three frontier models side-by-side.'}
          </p>
          {!loadingShared && (
            <Button
              onClick={() => navigate('/')}
              className="mt-5 h-10 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-gray-950 font-medium px-5 shadow-[0_0_24px_-6px_rgba(6,182,212,0.7)]"
            >
              Ask your first question
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  const latestTurn = getCurrentTurn();
  const isLatestTurnLoading = latestTurn && latestTurn.loading;
  const railItems = turns.map((t, i) => ({
    index: i,
    prompt: t.prompt,
    loading: t.loading,
  }));

  const railVisible = prefs.showTurnRail && !isLatestTurnLoading;
  const railWidth = prefs.navRailCollapsed ? NAV_RAIL_WIDTH_COLLAPSED : NAV_RAIL_WIDTH_EXPANDED;
  const contentPaddingLeft = railVisible ? railWidth + 24 : 0;
  const showSearchCluster = prefs.navPlacement !== 'rail';
  const readingClass = READING_WIDTH_CLASS[prefs.readingWidth];

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background:
          'radial-gradient(1200px 600px at 50% -10%, rgba(6,182,212,0.10), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(20,184,166,0.06), transparent 60%), #0B0F1A',
      }}
    >
      {/* Header */}
      {!isLatestTurnLoading && (
        <header
          className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-30 bg-gray-950/60 transition-[padding] duration-200"
          style={{ paddingLeft: contentPaddingLeft }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-300 hover:text-white hover:bg-white/5"
                    aria-label="Open menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-gray-950 border-white/10 w-52">
                  <DropdownMenuItem onClick={handleNewQuery} className="text-gray-200 focus:bg-white/5">
                    <Plus className="w-4 h-4 mr-2" /> New conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMobileMenuOpen(true)} className="text-gray-200 focus:bg-white/5">
                    <FolderOpen className="w-4 h-4 mr-2" /> Projects &amp; Memory
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setMobileMenuOpen(true)} className="text-gray-200 focus:bg-white/5">
                    <History className="w-4 h-4 mr-2" /> Conversation history
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={handleNewQuery}
                className="flex items-center gap-2 group rounded-md px-2 py-1 hover:bg-white/5 transition-colors lg:hidden"
                aria-label="Prismatic home"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-cyan-400/20 to-teal-400/10 border border-white/10 rounded-lg flex items-center justify-center">
                  <Triangle className="w-3.5 h-3.5 text-cyan-300" />
                </div>
                <span className="text-sm font-medium text-white tracking-tight">Prismatic</span>
              </button>
              <div className="hidden lg:block text-sm font-medium text-white/80 tracking-tight truncate max-w-md">
                {currentConversation.title || 'Conversation'}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Copy link to this turn"
                title="Copy link to this turn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Copy link</span>
                  </>
                )}
              </button>

              {/* Reading width */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Reading width"
                    title="Reading width"
                  >
                    <Columns3 className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-950 border-white/10 w-48">
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-500">
                    Reading width
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={prefs.readingWidth}
                    onValueChange={(v) => updatePrefs({ readingWidth: v as ReadingWidth })}
                  >
                    <DropdownMenuRadioItem value="narrow" className="text-gray-200 focus:bg-white/5">
                      Narrow
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="comfortable" className="text-gray-200 focus:bg-white/5">
                      Comfortable
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="wide" className="text-gray-200 focus:bg-white/5">
                      Wide
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={() => updatePrefs({ autoCollapseOlderTurns: !prefs.autoCollapseOlderTurns })}
                    className="text-gray-200 focus:bg-white/5 text-xs"
                  >
                    {prefs.autoCollapseOlderTurns ? 'Keep older turns expanded' : 'Auto-collapse older turns'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Shortcuts help */}
              <Popover open={helpOpen} onOpenChange={setHelpOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    aria-label="Keyboard shortcuts"
                    title="Keyboard shortcuts (?)"
                  >
                    <Keyboard className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="bg-gray-950 border-white/10 w-64 p-3 text-gray-200"
                >
                  <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2">
                    Keyboard shortcuts
                  </div>
                  <ul className="text-sm space-y-1.5">
                    {[
                      ['J', 'Next turn'],
                      ['K', 'Previous turn'],
                      ['G', 'Back to top'],
                      ['Shift + L', 'Jump to latest'],
                      ['N', 'New conversation'],
                      ['?', 'Toggle this help'],
                    ].map(([k, label]) => (
                      <li key={k} className="flex items-center justify-between">
                        <span className="text-gray-400">{label}</span>
                        <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 font-mono">
                          {k}
                        </kbd>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-1.5 pl-1" aria-live="polite">
                <span
                  className={`relative inline-block w-2 h-2 rounded-full transition-colors ${
                    savedPulse ? 'bg-emerald-400' : 'bg-emerald-400/40'
                  }`}
                >
                  <AnimatePresence>
                    {savedPulse && !reducedMotion && (
                      <motion.span
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full bg-emerald-400"
                      />
                    )}
                  </AnimatePresence>
                </span>
                <AnimatePresence>
                  {savedPulse && (
                    <motion.span
                      initial={reducedMotion ? false : { opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-300"
                    >
                      <Check className="w-3 h-3" />
                      Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

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

      {railVisible && (
        <NavRailMobileStrip
          turns={railItems}
          currentIndex={currentTurnInView}
          onJump={scrollToTurn}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
      )}

      {railVisible && (
        <NavRail
          turns={railItems}
          currentIndex={currentTurnInView}
          onJump={scrollToTurn}
          onBackToTop={scrollToTop}
          onNewConversation={handleNewQuery}
          collapsed={prefs.navRailCollapsed}
          onToggleCollapsed={() => updatePrefs({ navRailCollapsed: !prefs.navRailCollapsed })}
          placement={prefs.navPlacement}
          onPlacementChange={(p) => updatePrefs({ navPlacement: p })}
        />
      )}

      <NavRailDrawer
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        turns={railItems}
        currentIndex={currentTurnInView}
        onJump={scrollToTurn}
        onBackToTop={scrollToTop}
        onNewConversation={handleNewQuery}
        collapsed={false}
        onToggleCollapsed={() => {}}
        placement={prefs.navPlacement}
        onPlacementChange={(p) => updatePrefs({ navPlacement: p })}
      />

      <div
        className={`flex-1 transition-[padding] duration-200 ${sharedView ? 'pb-16' : 'pb-32 sm:pb-36'}`}
        style={{ paddingLeft: contentPaddingLeft }}
      >
        <div className={`mx-auto ${readingClass} px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-14`}>
          {turns.map((turn, turnIndex) => (
            <div key={turn.id} ref={setTurnRef(turnIndex)}>
              <TurnBlock
                turn={turn}
                turnIndex={turnIndex}
                isLatest={turnIndex === turns.length - 1}
                conversation={currentConversation}
                activeProjectId={activeProjectId}
                onPinFact={handlePinFact}
                referenceCollapsedDefault={prefs.referenceCollapsedDefault}
                autoCollapseOlder={prefs.autoCollapseOlderTurns}
                responsesLayout={prefs.responsesLayout}
                onToggleResponsesLayout={handleToggleResponsesLayout}
                formatTimestamp={formatTimestamp}
              />
              {turnIndex < turns.length - 1 && (
                <div className="mt-10 sm:mt-14 flex items-center gap-3 text-[10px] uppercase tracking-widest text-cyan-300/60">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-cyan-500/30" />
                  <span className="font-medium">Turn {turnIndex + 2}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-500/30 to-cyan-500/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Jump to latest pill */}
      <AnimatePresence>
        {showJumpToLatest && !isLatestTurnLoading && (
          <motion.button
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            onClick={handleJumpToLatest}
            className="fixed z-40 right-1/2 translate-x-1/2 bottom-28 sm:bottom-32 inline-flex items-center gap-2 px-4 h-9 rounded-full border border-cyan-400/40 bg-gray-950/80 backdrop-blur text-cyan-200 text-sm shadow-[0_0_24px_-6px_rgba(6,182,212,0.6)] hover:bg-cyan-500/10 transition-colors"
            style={{ bottom: `calc(7rem + ${viewportOffset}px)` }}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Jump to latest
          </motion.button>
        )}
      </AnimatePresence>

      {!isLatestTurnLoading && !sharedView && (
        <div
          className="fixed right-0 z-30 pointer-events-none transition-[left,bottom] duration-200"
          style={{ left: contentPaddingLeft, bottom: viewportOffset }}
        >
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/70 to-transparent" />
          <div className={`relative mx-auto ${readingClass} px-4 sm:px-6 py-4 pointer-events-auto`}>
            <SearchInput
              onSearch={handlePromptSubmit}
              isLoading={isLatestTurnLoading || false}
              showDemoPrompts={false}
              className="w-full"
              showQuickActions={showSearchCluster}
              showProjectBadge={showSearchCluster}
              onNewConversation={handleNewQuery}
            />
          </div>
        </div>
      )}
    </div>
  );
}
