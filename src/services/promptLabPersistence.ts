import { supabase, getClientId } from '../lib/supabase';
import {
  ModelId,
  PromptLabCellResult,
  PromptLabSession,
  PromptLabStatus,
  PromptVariant,
} from '../types';

type SessionRow = {
  id: string;
  title: string;
  project_id: string | null;
  shared_context: string;
  selected_models: ModelId[] | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
};

type VariantRow = {
  id: string;
  session_id: string;
  label: string;
  prompt: string;
  variant_index: number;
  notes: string;
  created_at: string;
};

type ResultRow = {
  id: string;
  session_id: string;
  variant_id: string;
  platform: ModelId;
  content: string;
  status: PromptLabStatus;
  response_time: number;
  word_count: number;
  confidence: number;
  first_token_ms: number;
  tokens_per_second: number;
  error: string;
  is_winner: boolean;
  updated_at: string;
};

function sessionFromRow(row: SessionRow): Omit<PromptLabSession, 'variants' | 'results'> {
  return {
    id: row.id,
    title: row.title,
    projectId: row.project_id,
    sharedContext: row.shared_context ?? '',
    selectedModels: (row.selected_models ?? ['claude', 'grok', 'gemini']) as ModelId[],
    isShared: row.is_shared,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

function variantFromRow(row: VariantRow): PromptVariant {
  return {
    id: row.id,
    sessionId: row.session_id,
    label: row.label,
    prompt: row.prompt,
    variantIndex: row.variant_index,
    notes: row.notes,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function resultFromRow(row: ResultRow): PromptLabCellResult {
  return {
    id: row.id,
    sessionId: row.session_id,
    variantId: row.variant_id,
    platform: row.platform,
    content: row.content,
    status: row.status,
    responseTime: row.response_time,
    wordCount: row.word_count,
    confidence: Number(row.confidence) || 0,
    firstTokenMs: row.first_token_ms,
    tokensPerSecond: Number(row.tokens_per_second) || 0,
    error: row.error,
    isWinner: row.is_winner,
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function createSession(input: {
  title: string;
  sharedContext: string;
  selectedModels: ModelId[];
  projectId?: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from('prompt_lab_sessions')
    .insert({
      client_id: getClientId(),
      title: input.title,
      shared_context: input.sharedContext,
      selected_models: input.selectedModels,
      project_id: input.projectId ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Failed to create lab session');
  return data.id;
}

export async function updateSession(sessionId: string, patch: Partial<{ title: string; sharedContext: string; selectedModels: ModelId[]; isShared: boolean }>): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.sharedContext !== undefined) payload.shared_context = patch.sharedContext;
  if (patch.selectedModels !== undefined) payload.selected_models = patch.selectedModels;
  if (patch.isShared !== undefined) payload.is_shared = patch.isShared;
  const { error } = await supabase.from('prompt_lab_sessions').update(payload).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase.from('prompt_lab_sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

export async function upsertVariant(variant: {
  id?: string;
  sessionId: string;
  label: string;
  prompt: string;
  variantIndex: number;
  notes?: string;
}): Promise<PromptVariant> {
  const payload = {
    id: variant.id,
    session_id: variant.sessionId,
    client_id: getClientId(),
    label: variant.label,
    prompt: variant.prompt,
    variant_index: variant.variantIndex,
    notes: variant.notes ?? '',
  };
  const { data, error } = await supabase
    .from('prompt_lab_variants')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Upsert variant returned no row');
  return variantFromRow(data as VariantRow);
}

export async function deleteVariant(variantId: string): Promise<void> {
  const { error } = await supabase.from('prompt_lab_variants').delete().eq('id', variantId);
  if (error) throw error;
}

export async function upsertResult(result: {
  id?: string;
  sessionId: string;
  variantId: string;
  platform: ModelId;
  content: string;
  status: PromptLabStatus;
  responseTime?: number;
  wordCount?: number;
  confidence?: number;
  firstTokenMs?: number;
  tokensPerSecond?: number;
  error?: string;
  isWinner?: boolean;
}): Promise<PromptLabCellResult> {
  const payload = {
    id: result.id,
    session_id: result.sessionId,
    variant_id: result.variantId,
    client_id: getClientId(),
    platform: result.platform,
    content: result.content,
    status: result.status,
    response_time: result.responseTime ?? 0,
    word_count: result.wordCount ?? 0,
    confidence: result.confidence ?? 0,
    first_token_ms: result.firstTokenMs ?? 0,
    tokens_per_second: result.tokensPerSecond ?? 0,
    error: result.error ?? '',
    is_winner: result.isWinner ?? false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('prompt_lab_results')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Upsert result returned no row');
  return resultFromRow(data as ResultRow);
}

export async function setWinner(sessionId: string, variantId: string, resultId: string | null): Promise<void> {
  const { error: clearErr } = await supabase
    .from('prompt_lab_results')
    .update({ is_winner: false })
    .eq('session_id', sessionId)
    .eq('variant_id', variantId);
  if (clearErr) throw clearErr;
  if (resultId) {
    const { error } = await supabase
      .from('prompt_lab_results')
      .update({ is_winner: true })
      .eq('id', resultId);
    if (error) throw error;
  }
}

export async function loadSession(sessionId: string): Promise<PromptLabSession | null> {
  const { data: sessionData, error: sErr } = await supabase
    .from('prompt_lab_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (sErr) throw sErr;
  if (!sessionData) return null;

  const { data: variantsData, error: vErr } = await supabase
    .from('prompt_lab_variants')
    .select('*')
    .eq('session_id', sessionId)
    .order('variant_index', { ascending: true });
  if (vErr) throw vErr;

  const { data: resultsData, error: rErr } = await supabase
    .from('prompt_lab_results')
    .select('*')
    .eq('session_id', sessionId);
  if (rErr) throw rErr;

  return {
    ...sessionFromRow(sessionData as SessionRow),
    variants: (variantsData ?? []).map((r) => variantFromRow(r as VariantRow)),
    results: (resultsData ?? []).map((r) => resultFromRow(r as ResultRow)),
  };
}

export async function listSessions(limit = 25): Promise<Array<Omit<PromptLabSession, 'variants' | 'results'>>> {
  const { data, error } = await supabase
    .from('prompt_lab_sessions')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => sessionFromRow(r as SessionRow));
}
