import { AIResponse, JudgeVerdict } from '../types';
import { queryModel } from './modelService';
import {
  createJudgePrompt,
  parseJudgeOutput,
  buildHeuristicVerdict,
} from '../utils/aiJudgeUtils';

export async function getJudgeVerdict(
  originalPrompt: string,
  responses: AIResponse[]
): Promise<JudgeVerdict | null> {
  const valid = responses.filter((r) => r.content && !r.error);
  if (valid.length === 0) return null;

  try {
    const judgePrompt = createJudgePrompt(originalPrompt, valid);
    const result = await queryModel('claude', judgePrompt);
    if (!result || !result.content) return buildHeuristicVerdict(valid);

    const parsed = parseJudgeOutput(result.content, valid);
    if (parsed) return parsed;

    console.warn('[judge] failed to parse Claude output, using heuristic');
    return buildHeuristicVerdict(valid);
  } catch (err) {
    console.warn(
      '[judge] verdict failed:',
      err instanceof Error ? err.message : err
    );
    return buildHeuristicVerdict(valid);
  }
}
