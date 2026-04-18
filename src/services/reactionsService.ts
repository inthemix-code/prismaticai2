import { supabase, getClientId } from '../lib/supabase';

export type ReactionKind = 'up' | 'down';

export const reactionsService = {
  async getMyReaction(turnId: string): Promise<ReactionKind | null> {
    const clientId = getClientId();
    const { data, error } = await supabase
      .from('conversation_reactions')
      .select('kind')
      .eq('turn_id', turnId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (error) {
      console.warn('[reactions] fetch failed:', error.message);
      return null;
    }
    return (data?.kind as ReactionKind | undefined) ?? null;
  },

  async setReaction(
    conversationId: string,
    turnId: string,
    kind: ReactionKind | null
  ): Promise<boolean> {
    const clientId = getClientId();
    if (kind === null) {
      const { error } = await supabase
        .from('conversation_reactions')
        .delete()
        .eq('turn_id', turnId)
        .eq('client_id', clientId);
      if (error) {
        console.warn('[reactions] delete failed:', error.message);
        return false;
      }
      return true;
    }
    const { error } = await supabase.from('conversation_reactions').upsert(
      {
        conversation_id: conversationId,
        turn_id: turnId,
        client_id: clientId,
        kind,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'turn_id,client_id' }
    );
    if (error) {
      console.warn('[reactions] upsert failed:', error.message);
      return false;
    }
    return true;
  },
};
