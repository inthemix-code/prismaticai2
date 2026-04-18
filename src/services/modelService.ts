import { AIResponse, FusionResult, ModelId, StructuredSynthesis } from '../types';
import { generateMockAnalysisData, generateMockFusionResult } from '../data/mockData';
import { extractKeyInsights, calculateSourceAttribution } from '../utils/aiSynthesisUtils';
import { AnalysisData } from '../types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const MOCK_DELAYS = {
  claude: [1800, 2800],
  grok: [1200, 2200],
  gemini: [1400, 2400],
} as const;

function randomDelay(min: number, max: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
}

function calculateConfidence(content: string): number {
  let confidence = 0.82;
  const wordCount = content.split(' ').length;
  if (wordCount > 50) confidence += 0.04;
  if (wordCount > 150) confidence += 0.04;
  if (content.includes('**') || content.includes('##')) confidence += 0.02;
  return Math.min(0.97, confidence);
}

async function callEdgeFunction(body: object): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => 'Unknown error');
    throw new Error(`Edge function error ${response.status}: ${text}`);
  }
  return response.json();
}

function buildMockContent(model: ModelId, prompt: string): string {
  const preview = prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt;
  const templates: Record<ModelId, string> = {
    claude: `**Claude's Analysis: "${preview}"**\n\nThis question invites a carefully reasoned response drawing from multiple perspectives.\n\n**Key Considerations:**\n- Foundational principles and contextual factors at play\n- Current best practices and emerging methodologies\n- Potential risks and mitigation strategies\n- Long-term implications and trajectory\n\n**Recommendations:**\n1. Begin with a thorough contextual assessment\n2. Apply iterative, feedback-driven implementation\n3. Establish clear metrics for evaluation`,
    grok: `**Grok's Take: "${preview}"**\n\nLet's cut straight to what actually matters here.\n\n**The Reality:**\nMost conventional approaches miss the underlying dynamics. The real leverage points are where few people are looking.\n\n**Practical Steps:**\n1. Question baseline assumptions\n2. Find leverage where small inputs create large outputs\n3. Build rapid feedback loops`,
    gemini: `**Gemini's Assessment: "${preview}"**\n\nA systematic examination reveals several interconnected dimensions worth exploring.\n\n**Strategic Framework:**\n- Stakeholder mapping and engagement\n- Evidence-based iterative development\n- Risk identification and mitigation\n\n**Implementation Pathway:**\n1. Baseline capability assessment\n2. Pilot design with success criteria\n3. Scaled deployment with monitoring`,
  };
  return templates[model];
}

export interface QueryOptions {
  systemPersona?: string;
  memoryFacts?: string[];
}

export async function queryModel(
  model: ModelId,
  prompt: string,
  options: QueryOptions = {}
): Promise<AIResponse> {
  const startTime = Date.now();
  try {
    const result = await callEdgeFunction({
      action: 'query',
      model,
      prompt,
      systemPersona: options.systemPersona,
      memoryFacts: options.memoryFacts,
    });
    if (result.success && result.data) return result.data as AIResponse;
    throw new Error(result.error ?? 'Edge function returned no data');
  } catch (error) {
    console.error(`${model} query failed, using mock:`, error instanceof Error ? error.message : error);
    const [min, max] = MOCK_DELAYS[model];
    await randomDelay(min, max);
    const content = buildMockContent(model, prompt);
    return {
      id: crypto.randomUUID(),
      platform: model,
      content,
      confidence: calculateConfidence(content),
      responseTime: (Date.now() - startTime) / 1000,
      wordCount: content.split(' ').length,
      loading: false,
      timestamp: Date.now(),
      isMock: true,
    };
  }
}

export async function queryAllModels(
  prompt: string,
  selectedModels: { claude: boolean; grok: boolean; gemini: boolean },
  options: QueryOptions = {}
): Promise<AIResponse[]> {
  const models = (['claude', 'grok', 'gemini'] as const).filter(m => selectedModels[m]);
  const results = await Promise.allSettled(models.map(m => queryModel(m, prompt, options)));
  return results.map((result, index) => {
    const model = models[index];
    if (result.status === 'fulfilled') return result.value;
    const errorMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
    return {
      id: crypto.randomUUID(),
      platform: model,
      content: '',
      confidence: 0,
      responseTime: 0,
      wordCount: 0,
      loading: false,
      error: errorMsg,
      timestamp: Date.now(),
    };
  });
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onFirstToken?: () => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

async function streamInternal(
  model: ModelId,
  prompt: string,
  handlers: StreamHandlers,
  options: QueryOptions
): Promise<string> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      action: 'stream',
      model,
      prompt,
      systemPersona: options.systemPersona,
      memoryFacts: options.memoryFacts,
    }),
  });

  if (!response.ok || !response.body) throw new Error(`Stream failed: ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let firstTokenFired = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const evt of events) {
      let eventName = 'message';
      let dataStr = '';
      for (const line of evt.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
      }
      if (!dataStr) continue;
      try {
        const payload = JSON.parse(dataStr);
        if (eventName === 'delta' && payload.text) {
          if (!firstTokenFired) { firstTokenFired = true; handlers.onFirstToken?.(); }
          full += payload.text;
          handlers.onDelta(payload.text);
        } else if (eventName === 'done') {
          handlers.onDone?.();
        } else if (eventName === 'error') {
          handlers.onError?.(payload.message ?? 'stream error');
        }
      } catch { /* ignore */ }
    }
  }
  return full;
}

export async function streamModelWithFallback(
  model: ModelId,
  prompt: string,
  handlers: StreamHandlers,
  options: QueryOptions = {}
): Promise<AIResponse> {
  const startTime = Date.now();
  let firstTokenMs: number | undefined;
  try {
    const content = await streamInternal(
      model,
      prompt,
      {
        ...handlers,
        onFirstToken: () => {
          firstTokenMs = Date.now() - startTime;
          handlers.onFirstToken?.();
        },
      },
      options
    );
    if (!content) throw new Error('empty stream');
    const elapsed = (Date.now() - startTime) / 1000;
    const tokens = content.split(/\s+/).filter(Boolean).length;
    return {
      id: crypto.randomUUID(),
      platform: model,
      content,
      confidence: calculateConfidence(content),
      responseTime: elapsed,
      wordCount: tokens,
      loading: false,
      streaming: false,
      firstTokenMs,
      tokensPerSecond: elapsed > 0 ? tokens / elapsed : 0,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn(`[stream] ${model} fallback:`, err instanceof Error ? err.message : err);
    handlers.onError?.(err instanceof Error ? err.message : 'stream failed');
    return queryModel(model, prompt, options);
  }
}

export async function getSynthesis(prompt: string, responses: AIResponse[]): Promise<FusionResult> {
  const valid = responses.filter(r => r.content && !r.error);
  if (valid.length === 0) return generateMockFusionResult(responses);
  try {
    const result = await callEdgeFunction({ action: 'synthesize', prompt, responses: valid });
    if (result.success && result.data) {
      const data = result.data as { content: string; confidence: number };
      return {
        content: data.content,
        confidence: data.confidence,
        sources: calculateSourceAttribution(valid),
        keyInsights: extractKeyInsights(data.content),
      };
    }
    throw new Error(result.error ?? 'Synthesis returned no data');
  } catch (error) {
    console.error('Synthesis failed, using mock:', error instanceof Error ? error.message : error);
    return generateMockFusionResult(valid);
  }
}

export async function getStructuredSynthesis(
  prompt: string,
  responses: AIResponse[]
): Promise<StructuredSynthesis | null> {
  const valid = responses.filter(r => r.content && !r.error);
  if (valid.length === 0) return null;
  try {
    const result = await callEdgeFunction({
      action: 'synthesize_structured',
      prompt,
      responses: valid,
    });
    if (result.success && result.data) return result.data as StructuredSynthesis;
    return null;
  } catch (error) {
    console.warn('[structured synthesis] failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export function getAnalysisData(responses: AIResponse[]): AnalysisData {
  return generateMockAnalysisData(responses);
}
