import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { History, Loader as Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { conversationPersistence, type StoredConversationRow } from '../services/conversationPersistence';
import { useAIStore } from '../stores/aiStore';

interface ConversationHistoryDrawerProps {
  trigger?: React.ReactNode;
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

export function ConversationHistoryDrawer({ trigger }: ConversationHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<StoredConversationRow[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="bg-gray-900 border-gray-800 text-white w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-5 border-b border-gray-800">
          <SheetTitle className="text-white flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Conversation History
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading
            </div>
          )}
          {!loading && rows.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-60" />
              No saved conversations yet
            </div>
          )}
          <ul className="divide-y divide-gray-800">
            {rows.map((row) => {
              const isActive = row.id === currentId;
              return (
                <li key={row.id}>
                  <button
                    onClick={() => handleOpen(row.id)}
                    className={`w-full text-left px-6 py-4 flex items-start gap-3 transition-colors group hover:bg-gray-800/60 ${
                      isActive ? 'bg-blue-950/30' : ''
                    }`}
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {row.title || 'Untitled conversation'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatRelative(row.updated_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {loadingId === row.id && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                      <button
                        onClick={(e) => handleDelete(e, row.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </SheetContent>
    </Sheet>
  );
}
