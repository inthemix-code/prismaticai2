import { supabase, getClientId } from '../lib/supabase';

export interface ScrollPosition {
  turnIndex: number;
  scrollOffset: number;
}

const LOCAL_PREFIX = 'prismatic.scroll.';

function readLocal(conversationId: string): ScrollPosition | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + conversationId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.turnIndex === 'number') {
      return {
        turnIndex: parsed.turnIndex,
        scrollOffset: typeof parsed.scrollOffset === 'number' ? parsed.scrollOffset : 0,
      };
    }
  } catch { /* ignore */ }
  return null;
}

function writeLocal(conversationId: string, pos: ScrollPosition) {
  try {
    localStorage.setItem(LOCAL_PREFIX + conversationId, JSON.stringify(pos));
  } catch { /* ignore */ }
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const pending = new Map<string, ScrollPosition>();

async function flush(conversationId: string): Promise<void> {
  const pos = pending.get(conversationId);
  if (!pos) return;
  pending.delete(conversationId);
  try {
    await supabase
      .from('conversation_scroll_positions')
      .upsert(
        {
          client_id: getClientId(),
          conversation_id: conversationId,
          turn_index: pos.turnIndex,
          scroll_offset: pos.scrollOffset,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,conversation_id' }
      );
  } catch { /* ignore */ }
}

export const scrollPositions = {
  readLocal,

  async load(conversationId: string): Promise<ScrollPosition | null> {
    const local = readLocal(conversationId);
    try {
      const { data } = await supabase
        .from('conversation_scroll_positions')
        .select('turn_index, scroll_offset')
        .eq('client_id', getClientId())
        .eq('conversation_id', conversationId)
        .maybeSingle();
      if (data) {
        const remote: ScrollPosition = {
          turnIndex: data.turn_index ?? 0,
          scrollOffset: data.scroll_offset ?? 0,
        };
        writeLocal(conversationId, remote);
        return remote;
      }
    } catch { /* ignore */ }
    return local;
  },

  save(conversationId: string, pos: ScrollPosition): void {
    writeLocal(conversationId, pos);
    pending.set(conversationId, pos);
    const existing = timers.get(conversationId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      timers.delete(conversationId);
      void flush(conversationId);
    }, 800);
    timers.set(conversationId, t);
  },
};
