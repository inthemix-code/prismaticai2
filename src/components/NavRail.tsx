import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Triangle,
  History,
  FolderOpen,
  FlaskConical,
  LayoutGrid,
  X,
} from 'lucide-react';
import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProjectsMemoryDrawer } from './ProjectsMemoryDrawer';
import { ConversationHistoryDrawer } from './ConversationHistoryDrawer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NavPlacement } from '../services/uiPreferences';

export interface TurnRailItem {
  index: number;
  prompt: string;
  loading?: boolean;
}

export const NAV_RAIL_WIDTH_EXPANDED = 248;
export const NAV_RAIL_WIDTH_COLLAPSED = 60;

interface NavRailProps {
  turns: TurnRailItem[];
  currentIndex: number;
  onJump: (index: number) => void;
  onBackToTop: () => void;
  onNewConversation: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  placement: NavPlacement;
  onPlacementChange: (p: NavPlacement) => void;
}

function RailButton({
  collapsed,
  icon,
  label,
  onClick,
  ariaLabel,
  primary,
  asChild,
  children,
}: {
  collapsed: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  ariaLabel: string;
  primary?: boolean;
  asChild?: boolean;
  children?: ReactNode;
}) {
  const base = primary
    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-gray-950 hover:from-cyan-300 hover:to-teal-300 shadow-[0_0_24px_-8px_rgba(6,182,212,0.6)] border border-transparent'
    : 'bg-white/[0.02] text-gray-300 hover:text-white hover:bg-white/[0.06] border border-white/10';

  const classes = `flex items-center w-full rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 min-h-[40px] ${base} ${
    collapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
  }`;

  const inner = (
    <>
      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </>
  );

  if (asChild && children) {
    return <>{children}</>;
  }

  const btn = (
    <button onClick={onClick} aria-label={ariaLabel} className={classes}>
      {inner}
    </button>
  );

  if (!collapsed) return btn;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PromptLabButton({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname.startsWith('/lab');

  const handleClick = () => {
    navigate('/lab');
    onNavigate?.();
  };

  const btn = (
    <button
      onClick={handleClick}
      aria-label="Open Prompt Lab"
      aria-current={active ? 'page' : undefined}
      className={`flex items-center w-full rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 min-h-[40px] border ${
        active
          ? 'bg-cyan-500/10 text-cyan-200 border-cyan-400/40'
          : 'bg-white/[0.02] text-gray-300 hover:text-white hover:bg-white/[0.06] border-white/10'
      } ${collapsed ? 'justify-center px-0' : 'px-3 gap-2.5'}`}
    >
      <FlaskConical className="w-4 h-4 flex-shrink-0" />
      {!collapsed && <span className="text-sm font-medium truncate">Prompt Lab</span>}
    </button>
  );

  if (!collapsed) return btn;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Prompt Lab
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NavRail({
  turns,
  currentIndex,
  onJump,
  onBackToTop,
  onNewConversation,
  collapsed,
  onToggleCollapsed,
  placement,
}: NavRailProps) {
  const showRailActions = placement !== 'search';

  return (
    <motion.aside
      aria-label="Primary navigation"
      initial={false}
      animate={{ width: collapsed ? NAV_RAIL_WIDTH_COLLAPSED : NAV_RAIL_WIDTH_EXPANDED }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:flex flex-col fixed left-3 top-3 bottom-3 z-40 rounded-2xl border border-white/10 bg-gray-950/70 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
    >
      {/* Collapse toggle pinned to top-right edge */}
      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-gray-900 border border-white/10 hover:border-cyan-400/50 hover:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-cyan-300 transition-colors shadow-md z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Brand zone */}
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'px-3'} pt-4 pb-3`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-400/10 border border-white/10 flex items-center justify-center">
            <Triangle className="w-4 h-4 text-cyan-300" />
          </div>
          {!collapsed && (
            <div className="font-semibold text-white tracking-tight truncate">Prismatic</div>
          )}
        </div>
      </div>

      <div className="mx-3 h-px bg-white/5" />

      {/* Primary action + Turns list */}
      <div className={`flex flex-col ${collapsed ? 'px-2' : 'px-3'} pt-3 gap-2 flex-1 min-h-0`}>
        <RailButton
          collapsed={collapsed}
          icon={<Plus className="w-4 h-4" />}
          label="New conversation"
          onClick={onNewConversation}
          ariaLabel="Start new conversation"
          primary
        />

        <div className={`flex items-center justify-between mt-4 mb-1 ${collapsed ? 'hidden' : ''}`}>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Turns
          </span>
          <span className="text-[10px] text-gray-600 tabular-nums">
            {turns.length > 0 ? `${currentIndex + 1} / ${turns.length}` : '0'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
          {turns.length === 0 && !collapsed && (
            <div className="text-[11px] text-gray-600 px-1 py-2 leading-relaxed">
              Your turns will appear here as the conversation unfolds.
            </div>
          )}
          {turns.map((turn) => {
            const active = turn.index === currentIndex;
            const preview =
              turn.prompt.length > 60 ? `${turn.prompt.slice(0, 60).trim()}...` : turn.prompt;

            const btn = (
              <button
                key={turn.index}
                onClick={() => onJump(turn.index)}
                aria-current={active ? 'true' : undefined}
                className={`group w-full text-left rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 min-h-[40px] ${
                  active
                    ? 'border-cyan-400/40 bg-cyan-500/10'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                } ${collapsed ? 'flex items-center justify-center px-0 py-2' : 'p-2'}`}
              >
                {collapsed ? (
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      active ? 'text-cyan-300' : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                  >
                    {turn.index + 1}
                  </span>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="relative mt-1 flex-shrink-0">
                      <div
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          active
                            ? 'bg-cyan-400'
                            : turn.loading
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-gray-600 group-hover:bg-gray-400'
                        }`}
                      />
                      {active && (
                        <motion.div
                          layoutId="turn-rail-indicator"
                          className="absolute -inset-1 rounded-full ring-1 ring-cyan-400/40"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[10px] font-medium uppercase tracking-wider ${
                          active ? 'text-cyan-300' : 'text-gray-500'
                        }`}
                      >
                        Turn {turn.index + 1}
                      </div>
                      <div
                        className={`mt-0.5 text-xs leading-snug line-clamp-2 ${
                          active ? 'text-gray-200' : 'text-gray-400 group-hover:text-gray-300'
                        }`}
                      >
                        {preview || (turn.loading ? 'Thinking...' : '')}
                      </div>
                    </div>
                  </div>
                )}
              </button>
            );

            if (!collapsed) return btn;
            return (
              <TooltipProvider key={turn.index} delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-xs">
                    Turn {turn.index + 1}: {preview}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {turns.length > 0 && !collapsed && (
          <button
            onClick={onBackToTop}
            className="mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-xs text-gray-400 hover:text-gray-200 py-2 transition-colors"
            aria-label="Back to top"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Top
          </button>
        )}
      </div>

      <div className="mx-3 h-px bg-white/5 mt-3" />

      {/* Bottom tool zone */}
      <div className={`${collapsed ? 'px-2' : 'px-3'} py-3 space-y-1.5`}>
        {showRailActions && (
          <>
            <ProjectsMemoryDrawer
              trigger={
                <button
                  aria-label="Projects and memory"
                  className={`flex items-center w-full rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 min-h-[40px] bg-white/[0.02] text-gray-300 hover:text-white hover:bg-white/[0.06] border border-white/10 ${
                    collapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">Projects</span>}
                </button>
              }
            />

            <ConversationHistoryDrawer
              trigger={
                <button
                  aria-label="Conversation history"
                  className={`flex items-center w-full rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 min-h-[40px] bg-white/[0.02] text-gray-300 hover:text-white hover:bg-white/[0.06] border border-white/10 ${
                    collapsed ? 'justify-center px-0' : 'px-3 gap-2.5'
                  }`}
                >
                  <History className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium truncate">History</span>}
                </button>
              }
            />
          </>
        )}

        <PromptLabButton collapsed={collapsed} />
      </div>
    </motion.aside>
  );
}

interface NavRailDrawerProps extends NavRailProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Mobile variant of the rail: renders the same zones but as a slide-in drawer.
 */
export function NavRailDrawer({
  open,
  onOpenChange,
  turns,
  currentIndex,
  onJump,
  onBackToTop,
  onNewConversation,
  placement,
}: NavRailDrawerProps) {
  const close = () => onOpenChange(false);
  const showRailActions = placement !== 'search';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 left-0 w-[280px] z-50 bg-gray-950 border-r border-white/10 flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-400/10 border border-white/10 flex items-center justify-center">
                  <Triangle className="w-4 h-4 text-cyan-300" />
                </div>
                <span className="font-semibold text-white tracking-tight">Prismatic</span>
              </div>
              <button
                onClick={close}
                aria-label="Close menu"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mx-4 h-px bg-white/5" />

            <div className="flex flex-col px-3 pt-3 gap-2 flex-1 min-h-0">
              <button
                onClick={() => {
                  onNewConversation();
                  close();
                }}
                className="flex items-center gap-2.5 w-full px-3 min-h-[44px] rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-gray-950 font-medium shadow-[0_0_24px_-8px_rgba(6,182,212,0.6)]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New conversation</span>
              </button>

              <div className="flex items-center justify-between mt-4 mb-1 px-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  Turns
                </span>
                <span className="text-[10px] text-gray-600 tabular-nums">
                  {turns.length > 0 ? `${currentIndex + 1} / ${turns.length}` : '0'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-1">
                {turns.map((turn) => {
                  const active = turn.index === currentIndex;
                  const preview =
                    turn.prompt.length > 70 ? `${turn.prompt.slice(0, 70).trim()}...` : turn.prompt;
                  return (
                    <button
                      key={turn.index}
                      onClick={() => {
                        onJump(turn.index);
                        close();
                      }}
                      className={`group w-full text-left rounded-lg border p-2 min-h-[44px] transition-colors ${
                        active
                          ? 'border-cyan-400/40 bg-cyan-500/10'
                          : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`text-[10px] font-medium uppercase tracking-wider ${
                        active ? 'text-cyan-300' : 'text-gray-500'
                      }`}>
                        Turn {turn.index + 1}
                      </div>
                      <div className={`mt-0.5 text-xs leading-snug line-clamp-2 ${
                        active ? 'text-gray-200' : 'text-gray-400'
                      }`}>
                        {preview || (turn.loading ? 'Thinking...' : '')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {turns.length > 0 && (
                <button
                  onClick={() => {
                    onBackToTop();
                    close();
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-xs text-gray-400 hover:text-gray-200 min-h-[40px] transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                  Top
                </button>
              )}
            </div>

            <div className="mx-4 h-px bg-white/5 mt-3" />

            <div className="px-3 py-3 space-y-1.5">
              {showRailActions && (
                <>
                  <ProjectsMemoryDrawer
                    trigger={
                      <button className="flex items-center gap-2.5 w-full px-3 min-h-[44px] rounded-xl bg-white/[0.02] text-gray-200 hover:bg-white/[0.06] border border-white/10">
                        <FolderOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">Projects</span>
                      </button>
                    }
                  />
                  <ConversationHistoryDrawer
                    trigger={
                      <button className="flex items-center gap-2.5 w-full px-3 min-h-[44px] rounded-xl bg-white/[0.02] text-gray-200 hover:bg-white/[0.06] border border-white/10">
                        <History className="w-4 h-4" />
                        <span className="text-sm font-medium">History</span>
                      </button>
                    }
                  />
                </>
              )}
              <PromptLabButton collapsed={false} onNavigate={close} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

interface NavRailMobileStripProps {
  turns: TurnRailItem[];
  currentIndex: number;
  onJump: (index: number) => void;
  onOpenMenu: () => void;
}

/**
 * Small sticky strip shown on mobile with a Menu button and turn chips.
 */
export function NavRailMobileStrip({
  turns,
  currentIndex,
  onJump,
  onOpenMenu,
}: NavRailMobileStripProps) {
  return (
    <div className="lg:hidden sticky top-[57px] z-30 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {turns.length > 1 && (
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {turns.map((turn) => {
              const active = turn.index === currentIndex;
              return (
                <button
                  key={turn.index}
                  onClick={() => onJump(turn.index)}
                  className={`flex-shrink-0 rounded-full px-3 min-h-[36px] text-[11px] font-medium transition-colors ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40'
                      : 'bg-white/[0.04] text-gray-400 border border-white/10 hover:text-gray-200'
                  }`}
                >
                  {turn.index + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
