import { supabase, getClientId } from '../lib/supabase';
import type { JudgeVerdict, JudgeModelScore, ModelId } from '../types';

interface VerdictRow {
  id: string;
  conversation_id: string;
  turn_id: string;
  judge_model: string;
  overall_winner: string | null;
  overall_summary: string | null;
  scores: unknown;
  created_at: string;
  updated_at: string;
}

function mapRow(row: VerdictRow): JudgeVerdict {
  const scoresRaw = Array.isArray(row.scores)
    ? (row.scores as Array<Partial<JudgeModelScore>>)
    : [];
  const scores: JudgeModelScore[] = scoresRaw
    .filter((s): s is JudgeModelScore => !!s && typeof s.model === 'string')
    .map((s) => ({
      model: s.model as ModelId,
      accuracy: Number(s.accuracy ?? 0),
      completeness: Number(s.completeness ?? 0),
      tone: Number(s.tone ?? 0),
      rationale: (s.rationale ?? '').toString(),
      evaluated: s.evaluated !== false,
    }));

  return {
    judgeModel: 'claude',
    overallWinner: (row.overall_winner as ModelId | null) ?? null,
    overallSummary: row.overall_summary ?? '',
    scores,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export const judgeVerdictPersistence = {
  async upsertByTurn(
    turnId: string,
    conversationId: string,
    verdict: JudgeVerdict
  ): Promise<boolean> {
    const clientId = getClientId();
    const { error } = await supabase.from('judge_verdicts').upsert(
      {
        turn_id: turnId,
        conversation_id: conversationId,
        client_id: clientId,
        judge_model: verdict.judgeModel,
        overall_winner: verdict.overallWinner,
        overall_summary: verdict.overallSummary,
        scores: verdict.scores,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'turn_id' }
    );
    if (error) {
      console.warn('[judge] upsert failed:', error.message);
      return false;
    }
    return true;
  },

  async getByTurn(turnId: string): Promise<JudgeVerdict | null> {
    const { data, error } = await supabase
      .from('judge_verdicts')
      .select('*')
      .eq('turn_id', turnId)
      .maybeSingle();
    if (error) {
      console.warn('[judge] fetch failed:', error.message);
      return null;
    }
    if (!data) return null;
    return mapRow(data as VerdictRow);
  },

  async getByTurnIds(
    turnIds: string[]
  ): Promise<Record<string, JudgeVerdict>> {
    if (turnIds.length === 0) return {};
    const { data, error } = await supabase
      .from('judge_verdicts')
      .select('*')
      .in('turn_id', turnIds);
    if (error || !data) return {};
    const out: Record<string, JudgeVerdict> = {};
    for (const row of data as VerdictRow[]) {
      out[row.turn_id] = mapRow(row);
    }
    return out;
  },
};
