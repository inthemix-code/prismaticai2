import { supabase, getClientId } from '../lib/supabase';
import type { Conversation, ConversationTurn, Project, ProjectMemory } from '../types';

export interface StoredConversationRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_shared?: boolean;
  project_id?: string | null;
  turn_count?: number;
}

export const conversationPersistence = {
  async upsertConversation(conversation: Conversation): Promise<void> {
    const clientId = getClientId();
    const { error } = await supabase.from('conversations').upsert(
      {
        id: conversation.id,
        client_id: clientId,
        title: conversation.title,
        project_id: conversation.projectId ?? null,
        created_at: new Date(conversation.createdAt).toISOString(),
        updated_at: new Date(conversation.updatedAt).toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('[persistence] upsertConversation failed:', error.message);
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
        fusion_structured: turn.fusionStructured ?? null,
        completed: turn.completed,
        created_at: new Date(turn.timestamp).toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) console.warn('[persistence] upsertTurn failed:', error.message);
  },

  async listConversations(projectId?: string | null, limit = 100): Promise<StoredConversationRow[]> {
    let q = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, is_shared, project_id, conversation_turns(count)')
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (projectId !== undefined) {
      if (projectId === null) q = q.is('project_id', null);
      else q = q.eq('project_id', projectId);
    }
    const { data, error } = await q;
    if (error) {
      console.warn('[persistence] listConversations failed:', error.message);
      return [];
    }
    type Row = Omit<StoredConversationRow, 'turn_count'> & { conversation_turns?: Array<{ count: number }> };
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
      updated_at: r.updated_at,
      is_shared: r.is_shared,
      project_id: r.project_id,
      turn_count: r.conversation_turns?.[0]?.count ?? 0,
    }));
  },

  async setShared(id: string, shared: boolean): Promise<boolean> {
    const { error } = await supabase.from('conversations').update({ is_shared: shared }).eq('id', id);
    if (error) {
      console.warn('[persistence] setShared failed:', error.message);
      return false;
    }
    return true;
  },

  async setProjectId(conversationId: string, projectId: string | null): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({ project_id: projectId })
      .eq('id', conversationId);
    if (error) {
      console.warn('[persistence] setProjectId failed:', error.message);
      return false;
    }
    return true;
  },

  async loadConversation(id: string): Promise<Conversation | null> {
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at, project_id')
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
      fusionStructured: (t.fusion_structured ?? null) as ConversationTurn['fusionStructured'],
      loading: false,
      completed: t.completed,
    }));

    return {
      id: convo.id,
      title: convo.title,
      projectId: convo.project_id ?? null,
      createdAt: new Date(convo.created_at).getTime(),
      updatedAt: new Date(convo.updated_at).getTime(),
      turns: mappedTurns,
    };
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) console.warn('[persistence] deleteConversation failed:', error.message);
  },
};

function mapProject(row: {
  id: string;
  name: string;
  description: string;
  color: string;
  system_persona: string;
  created_at: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    systemPersona: row.system_persona,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export const projectPersistence = {
  async list(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.warn('[projects] list failed:', error.message);
      return [];
    }
    return (data ?? []).map(mapProject);
  },

  async create(input: { name: string; description?: string; color?: string; systemPersona?: string }): Promise<Project | null> {
    const clientId = getClientId();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        client_id: clientId,
        name: input.name,
        description: input.description ?? '',
        color: input.color ?? '#22d3ee',
        system_persona: input.systemPersona ?? '',
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.warn('[projects] create failed:', error?.message);
      return null;
    }
    return mapProject(data);
  },

  async update(
    id: string,
    patch: Partial<{ name: string; description: string; color: string; systemPersona: string }>
  ): Promise<boolean> {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.color !== undefined) payload.color = patch.color;
    if (patch.systemPersona !== undefined) payload.system_persona = patch.systemPersona;
    const { error } = await supabase.from('projects').update(payload).eq('id', id);
    if (error) {
      console.warn('[projects] update failed:', error.message);
      return false;
    }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      console.warn('[projects] delete failed:', error.message);
      return false;
    }
    return true;
  },
};

function mapMemory(row: {
  id: string;
  project_id: string;
  fact: string;
  source_turn_id: string | null;
  pinned: boolean;
  created_at: string;
}): ProjectMemory {
  return {
    id: row.id,
    projectId: row.project_id,
    fact: row.fact,
    sourceTurnId: row.source_turn_id,
    pinned: row.pinned,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const memoryPersistence = {
  async listForProject(projectId: string): Promise<ProjectMemory[]> {
    const { data, error } = await supabase
      .from('project_memory')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[memory] list failed:', error.message);
      return [];
    }
    return (data ?? []).map(mapMemory);
  },

  async add(projectId: string, fact: string, sourceTurnId?: string | null): Promise<ProjectMemory | null> {
    const clientId = getClientId();
    const { data, error } = await supabase
      .from('project_memory')
      .insert({
        project_id: projectId,
        client_id: clientId,
        fact,
        source_turn_id: sourceTurnId ?? null,
        pinned: true,
      })
      .select()
      .maybeSingle();
    if (error || !data) {
      console.warn('[memory] add failed:', error?.message);
      return null;
    }
    return mapMemory(data);
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase.from('project_memory').delete().eq('id', id);
    if (error) {
      console.warn('[memory] delete failed:', error.message);
      return false;
    }
    return true;
  },

  async update(id: string, fact: string): Promise<boolean> {
    const { error } = await supabase.from('project_memory').update({ fact }).eq('id', id);
    if (error) {
      console.warn('[memory] update failed:', error.message);
      return false;
    }
    return true;
  },
};

export function rankMemoryForPrompt(memories: ProjectMemory[], prompt: string, limit = 6): ProjectMemory[] {
  if (!memories.length) return [];
  const words = new Set(
    prompt.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)
  );
  const scored = memories.map((m) => {
    const text = m.fact.toLowerCase();
    let score = 0;
    for (const w of words) if (text.includes(w)) score += 1;
    const ageDays = (Date.now() - m.createdAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 2 - ageDays / 30);
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.m);
}
