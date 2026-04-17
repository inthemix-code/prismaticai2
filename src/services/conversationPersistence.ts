import { supabase, getClientId } from '../lib/supabase';
import type { Conversation, ConversationTurn } from '../types';

export interface StoredConversationRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_shared?: boolean;
  turn_count?: number;
}

export interface StoredTurnRow {
  id: string;
  conversation_id: string;
  turn_index: number;
  prompt: string;
  responses: ConversationTurn['responses'];
  analysis_data: ConversationTurn['analysisData'];
  fusion_result: ConversationTurn['fusionResult'];
  completed: boolean;
  created_at: string;
}

export const conversationPersistence = {
  async upsertConversation(conversation: Conversation): Promise<void> {
    const clientId = getClientId();
    const { error } = await supabase.from('conversations').upsert(
      {
        id: conversation.id,
        client_id: clientId,
        title: conversation.title,
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date(conversation.updatedAt).toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[persistence] upsertConversation failed:', error.message);
    }
  },

  async upsertTurn(conversationId: string, turn: ConversationTurn, index: number): Promise<void> {
    const clientId = getClientId();
    const { error } = await supabase.from('conversation_turns').upsert(
      {
        id: turn.id,
        conversation_id: conversationId,
        client_id: clientId,
        turn_index: index,
        prompt: turn.prompt,
        responses: turn.responses ?? [],
        analysis_data: turn.analysisData,
        fusion_result: turn.fusionResult,
        completed: turn.completed,
        created_at: new Date(turn.timestamp).toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[persistence] upsertTurn failed:', error.message);
    }
  },

  async listConversations(limit = 50): Promise<StoredConversationRow[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, is_shared, conversation_turns(count)')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('[persistence] listConversations failed:', error.message);
      return [];
    }
    type Row = Omit<StoredConversationRow, 'turn_count'> & {
      conversation_turns?: Array<{ count: number }>;
    };
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
      updated_at: r.updated_at,
      is_shared: r.is_shared,
      turn_count: r.conversation_turns?.[0]?.count ?? 0,
    }));
  },

  async setShared(id: string, shared: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ is_shared: shared })
      .eq('id', id);
    if (error) {
      console.warn('[persistence] setShared failed:', error.message);
      return false;
    }
    return true;
  },

  async loadConversation(id: string): Promise<Conversation | null> {
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();
    if (convoErr || !convo) return null;

    const { data: turns, error: turnsErr } = await supabase
      .from('conversation_turns')
      .select('*')
      .eq('conversation_id', id)
      .order('turn_index', { ascending: true });
    if (turnsErr) return null;

    const mappedTurns: ConversationTurn[] = (turns ?? []).map((t) => ({
      id: t.id,
      prompt: t.prompt,
      timestamp: new Date(t.created_at).getTime(),
      responses: (t.responses ?? []) as ConversationTurn['responses'],
      analysisData: t.analysis_data as ConversationTurn['analysisData'],
      fusionResult: t.fusion_result as ConversationTurn['fusionResult'],
      loading: false,
      completed: t.completed,
    }));

    return {
      id: convo.id,
      title: convo.title,
      createdAt: new Date(convo.created_at).getTime(),
      updatedAt: new Date(convo.updated_at).getTime(),
      turns: mappedTurns,
    };
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) {
      console.warn('[persistence] deleteConversation failed:', error.message);
    }
  },
};
