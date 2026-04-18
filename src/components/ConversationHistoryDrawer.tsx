import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { History, Loader as Loader2, MessageSquare, Search, Share2, Trash2, X } from 'lucide-react';
import { conversationPersistence, type StoredConversationRow } from '../services/conversationPersistence';
import { useAIStore } from '../stores/aiStore';

interface ConversationHistoryDrawerProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function bucketFor(iso: string): 'Today' | 'This week' | 'Older' {
  const now = new Date();
  const then = new Date(iso);
  const sameDay =
    now.getFullYear() === then.getFullYear() &&
    now.getMonth() === then.getMonth() &&
    now.getDate() === then.getDate();
  if (sameDay) return 'Today';
  const diffDays = (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) return 'This week';
  return 'Older';
}

export function ConversationHistoryDrawer({ trigger, open: openProp, onOpenChange }: ConversationHistoryDrawerProps) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = (v: boolean) => {
    setOpenInternal(v);
    onOpenChange?.(v);
  };
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StoredConversationRow[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const setActiveConversation = useAIStore((s) => s.setActiveConversation);
  const currentId = useAIStore((s) => s.currentConversation?.id);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    conversationPersistence.listConversations().then((data) => {
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleOpen = async (id: string) => {
    setLoadingId(id);
    const convo = await conversationPersistence.loadConversation(id);
    setLoadingId(null);
    if (convo) {
      setActiveConversation(convo);
      setOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await conversationPersistence.deleteConversation(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, query]);

  const grouped = useMemo(() => {
    const groups: Record<'Today' | 'This week' | 'Older', StoredConversationRow[]> = {
      Today: [],
      'This week': [],
      Older: [],
    };
    for (const r of filtered) groups[bucketFor(r.updated_at)].push(r);
    return groups;
  }, [filtered]);

  const totalTurns = rows.reduce((n, r) => n + (r.turn_count ?? 0), 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open conversation history"
            className="text-gray-400 hover:text-white hover:bg-gray-800 focus-visible:ring-1 focus-visible:ring-cyan-400/60 focus-visible:outline-none"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="bg-gray-900 border-gray-800 text-white w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-gray-800 flex-shrink-0">
          <SheetTitle className="text-white flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Conversation History
            </span>
            {rows.length > 0 && (
              <span className="text-xs font-normal text-gray-500">
                {rows.length} chat{rows.length === 1 ? '' : 's'} · {totalTurns} turn{totalTurns === 1 ? '' : 's'}
              </span>
            )}
          </SheetTitle>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="w-full bg-gray-800/60 border border-gray-700/60 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-700/60 text-gray-500 hover:text-gray-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 text-sm">
              <div className="w-12 h-12 rounded-full bg-gray-800/60 border border-gray-700/60 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-5 h-5 opacity-70" />
              </div>
              <p className="text-gray-300 font-medium mb-1">No saved conversations yet</p>
              <p className="text-xs text-gray-500">
                Ask a question to start. Press{' '}
                <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px]">N</kbd>{' '}
                anytime for a new one.
              </p>
            </div>
          )}
          {!loading && rows.length > 0 && filtered.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              No matches for "<span className="text-gray-300">{query}</span>"
            </div>
          )}
          {!loading &&
            (['Today', 'This week', 'Older'] as const).map((label) => {
              const items = grouped[label];
              if (!items?.length) return null;
              return (
                <div key={label}>
                  <div className="px-6 pt-4 pb-1 text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                    {label}
                  </div>
                  <ul className="divide-y divide-gray-800/70">
                    {items.map((row) => {
                      const isActive = row.id === currentId;
                      return (
                        <li key={row.id}>
                          <button
                            onClick={() => handleOpen(row.id)}
                            className={`w-full text-left px-6 py-3 flex items-start gap-3 transition-colors group hover:bg-gray-800/60 focus-visible:outline-none focus-visible:bg-gray-800/60 ${
                              isActive
                                ? 'bg-cyan-950/30 border-l-2 border-cyan-500'
                                : 'border-l-2 border-transparent'
                            }`}
                          >
                            <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-4 h-4 text-cyan-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {row.title || 'Untitled conversation'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>{formatRelative(row.updated_at)}</span>
                                {typeof row.turn_count === 'number' && row.turn_count > 0 && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span>
                                      {row.turn_count} turn{row.turn_count === 1 ? '' : 's'}
                                    </span>
                                  </>
                                )}
                                {row.is_shared && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    <span className="inline-flex items-center gap-1 text-emerald-400">
                                      <Share2 className="w-3 h-3" /> Shared
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {loadingId === row.id && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                              <button
                                onClick={(e) => handleDelete(e, row.id)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus-visible:ring-1 focus-visible:ring-red-400/60 focus-visible:outline-none"
                                aria-label="Delete conversation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
