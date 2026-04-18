import { AIResponse, JudgeVerdict, JudgeModelScore, ModelId } from '../types';

export function createJudgePrompt(originalPrompt: string, responses: AIResponse[]): string {
  const valid = responses.filter((r) => r.content && !r.error);
  const body = valid
    .map(
      (r, i) =>
        `=== MODEL ${i + 1}: ${r.platform.toUpperCase()} ===\n${r.content}`
    )
    .join('\n\n');

  const modelList = valid.map((r) => r.platform).join(', ');

  return `You are an impartial AI judge evaluating responses from multiple AI models. You MUST score every response objectively on three criteria.

User's original question:
"${originalPrompt}"

Responses to evaluate (from models: ${modelList}):

${body}

Evaluation criteria (score 0-100 each):
- accuracy: factual correctness and absence of hallucinations
- completeness: how thoroughly the question is addressed
- tone: clarity, appropriateness, and quality of writing

Return ONLY valid JSON (no prose, no markdown fences) matching EXACTLY this shape:
{
  "scores": [
    {
      "model": "claude" | "grok" | "gemini",
      "accuracy": 0-100,
      "completeness": 0-100,
      "tone": 0-100,
      "rationale": "One concise sentence explaining this model's strengths or weaknesses."
    }
  ],
  "overall_winner": "claude" | "grok" | "gemini" | null,
  "overall_summary": "A 1-3 sentence overall verdict explaining why the winner was chosen and how the responses compare."
}

Rules:
- Only score models that actually appear in the input (${modelList})
- Be honest and calibrated - do not inflate scores
- The winner must be the model with the strongest overall performance, or null if truly tied
- Keep rationales under 25 words`;
}

interface RawJudgeOutput {
  scores?: Array<{
    model?: string;
    accuracy?: number;
    completeness?: number;
    tone?: number;
    rationale?: string;
  }>;
  overall_winner?: string | null;
  overall_summary?: string;
}

function clamp(n: unknown, fallback = 0): number {
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function extractJson(raw: string): string {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return cleaned;
  return cleaned.slice(firstBrace, lastBrace + 1);
}

export function parseJudgeOutput(
  raw: string,
  evaluatedResponses: AIResponse[]
): JudgeVerdict | null {
  try {
    const parsed = JSON.parse(extractJson(raw)) as RawJudgeOutput;
    if (!parsed || !Array.isArray(parsed.scores)) return null;

    const allowed = new Set<ModelId>(
      evaluatedResponses.map((r) => r.platform)
    );

    const scores: JudgeModelScore[] = [];
    for (const s of parsed.scores) {
      const model = s.model as ModelId | undefined;
      if (!model || !allowed.has(model)) continue;
      scores.push({
        model,
        accuracy: clamp(s.accuracy),
        completeness: clamp(s.completeness),
        tone: clamp(s.tone),
        rationale: (s.rationale ?? '').toString().slice(0, 280),
        evaluated: true,
      });
    }

    if (scores.length === 0) return null;

    const winnerRaw = parsed.overall_winner;
    const winner =
      winnerRaw && allowed.has(winnerRaw as ModelId)
        ? (winnerRaw as ModelId)
        : null;

    return {
      judgeModel: 'claude',
      overallWinner: winner,
      overallSummary: (parsed.overall_summary ?? '').toString().slice(0, 1200),
      scores,
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function buildHeuristicVerdict(responses: AIResponse[]): JudgeVerdict {
  const valid = responses.filter((r) => r.content && !r.error);
  const scores: JudgeModelScore[] = valid.map((r) => {
    const base = Math.round(r.confidence * 100);
    const completenessBoost = Math.min(15, Math.floor(r.wordCount / 40));
    return {
      model: r.platform,
      accuracy: base,
      completeness: Math.min(100, base + completenessBoost),
      tone: Math.max(60, base - 4),
      rationale: 'Heuristic score (Claude judge unavailable).',
      evaluated: true,
    };
  });

  const winner =
    scores.length === 0
      ? null
      : scores.reduce((best, s) =>
          s.accuracy + s.completeness + s.tone >
          best.accuracy + best.completeness + best.tone
            ? s
            : best
        ).model;

  return {
    judgeModel: 'claude',
    overallWinner: winner,
    overallSummary:
      'Judge was unavailable, so a heuristic verdict based on response metrics is shown.',
    scores,
    createdAt: Date.now(),
  };
}
