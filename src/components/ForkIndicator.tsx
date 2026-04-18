import { useEffect, useState } from 'react';
import { GitBranch, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { conversationPersistence } from '../services/conversationPersistence';
import { useAIStore } from '../stores/aiStore';
import type { TurnSibling } from '../types';

interface ForkIndicatorProps {
  conversationId: string;
  turnId: string;
  parentTurnId: string | null;
  siblingIndex: number;
  siblingCount: number;
}

export function ForkIndicator({
  conversationId,
  turnId,
  parentTurnId,
  siblingIndex,
  siblingCount,
}: ForkIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [siblings, setSiblings] = useState<TurnSibling[]>([]);
  const [loading, setLoading] = useState(false);
  const switchBranch = useAIStore((s) => s.switchBranch);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void conversationPersistence
      .listSiblings(conversationId, parentTurnId)
      .then((list) => {
        if (!cancelled) {
          setSiblings(list);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, parentTurnId]);

  if (siblingCount <= 1) return null;

  const label = `${siblingIndex + 1}/${siblingCount}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 h-5 px-1.5 rounded-[5px] border border-cyan-400/30 bg-cyan-500/10 text-[10px] font-medium text-cyan-200/90 hover:bg-cyan-500/20 hover:text-cyan-100 transition-colors"
          title={`Branch ${label} - click to switch`}
          aria-label={`Branch ${label}, click to switch`}
        >
          <GitBranch className="w-2.5 h-2.5" />
          <span className="tabular-nums tracking-tight">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 bg-gray-950 border-white/10 p-1.5"
      >
        <div className="px-2 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-medium flex items-center gap-1.5">
          <GitBranch className="w-3 h-3" />
          Branches
        </div>
        {loading && (
          <div className="px-2 py-3 text-xs text-gray-500">Loading...</div>
        )}
        {!loading && siblings.length === 0 && (
          <div className="px-2 py-3 text-xs text-gray-500">No branches.</div>
        )}
        {!loading && siblings.map((sib, i) => {
          const isCurrent = sib.id === turnId;
          return (
            <button
              key={sib.id}
              onClick={() => {
                if (isCurrent) {
                  setOpen(false);
                  return;
                }
                void switchBranch(sib.id).then(() => setOpen(false));
              }}
              className={`w-full text-left px-2 py-1.5 rounded-md flex items-start gap-2 transition-colors ${
                isCurrent
                  ? 'bg-cyan-500/10 text-cyan-100'
                  : 'hover:bg-white/5 text-gray-300'
              }`}
            >
              <span
                className={`mt-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-semibold tabular-nums flex-shrink-0 ${
                  isCurrent
                    ? 'bg-cyan-400 text-gray-950'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs leading-snug line-clamp-2 break-words">
                  {sib.prompt || '(empty prompt)'}
                </span>
                <span className="block text-[10px] text-gray-500 mt-0.5">
                  {new Date(sib.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
              {isCurrent && (
                <Check className="w-3 h-3 text-cyan-300 flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
