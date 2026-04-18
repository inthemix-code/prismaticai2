import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface TurnRailItem {
  index: number;
  prompt: string;
  loading?: boolean;
}

interface TurnRailProps {
  turns: TurnRailItem[];
  currentIndex: number;
  onJump: (index: number) => void;
  onBackToTop: () => void;
}

export function TurnRail({ turns, currentIndex, onJump, onBackToTop }: TurnRailProps) {
  if (turns.length === 0) return null;

  return (
    <aside
      aria-label="Turn navigator"
      className="hidden lg:flex flex-col fixed left-4 xl:left-6 top-24 bottom-6 w-52 xl:w-60 z-30"
    >
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
          Turns
        </span>
        <span className="text-[11px] text-gray-600 tabular-nums">
          {currentIndex + 1} / {turns.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-1.5">
        {turns.map((turn) => {
          const active = turn.index === currentIndex;
          const preview = turn.prompt.length > 70
            ? `${turn.prompt.slice(0, 70).trim()}...`
            : turn.prompt;
          return (
            <button
              key={turn.index}
              onClick={() => onJump(turn.index)}
              aria-current={active ? 'true' : undefined}
              className={`group w-full text-left rounded-md border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                active
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : 'border-transparent hover:border-gray-800 hover:bg-gray-900/40'
              }`}
            >
              <div className="flex items-start gap-2 p-2">
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
            </button>
          );
        })}
      </div>

      <button
        onClick={onBackToTop}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-gray-800 bg-gray-900/50 hover:bg-gray-800/60 hover:border-gray-700 text-xs text-gray-400 hover:text-gray-200 py-2 transition-colors"
        aria-label="Back to top"
      >
        <ChevronUp className="w-3.5 h-3.5" />
        Top
      </button>
    </aside>
  );
}

export function TurnRailMobile({ turns, currentIndex, onJump }: Omit<TurnRailProps, 'onBackToTop'>) {
  if (turns.length <= 1) return null;
  return (
    <div className="lg:hidden sticky top-[57px] z-30 border-b border-gray-800/70 bg-gray-950/80 backdrop-blur-md">
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
        {turns.map((turn) => {
          const active = turn.index === currentIndex;
          return (
            <button
              key={turn.index}
              onClick={() => onJump(turn.index)}
              className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/40'
                  : 'bg-gray-800/60 text-gray-400 border border-gray-700/60 hover:text-gray-200'
              }`}
            >
              {turn.index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
