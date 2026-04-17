import { AIResponse, FusionResult } from '../types';
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

function buildMockContent(model: 'claude' | 'grok' | 'gemini', prompt: string): string {
  const preview = prompt.length > 60 ? prompt.slice(0, 60) + '...' : prompt;

  const templates = {
    claude: `**Claude's Analysis: "${preview}"**

This question invites a carefully reasoned response drawing from multiple perspectives.

**Key Considerations:**
- Foundational principles and contextual factors at play
- Current best practices and emerging methodologies
- Potential risks and mitigation strategies
- Long-term implications and trajectory

**Analysis:**
The evidence points toward a nuanced interplay of technical, strategic, and human factors. Successful approaches consistently balance theoretical rigor with practical adaptability.

**Recommendations:**
1. Begin with a thorough contextual assessment
2. Apply iterative, feedback-driven implementation
3. Establish clear metrics for evaluation
4. Foster cross-functional collaboration throughout`,

    grok: `**Grok's Take: "${preview}"**

Let's cut straight to what actually matters here.

**The Reality:**
Most conventional approaches miss the underlying dynamics. The real leverage points are where few people are looking:

- Traditional frameworks are increasingly inadequate for current conditions
- Counterintuitive solutions often outperform consensus approaches
- The gap between theory and effective practice is wider than acknowledged
- First-mover advantage compounds over time in this space

**What the Data Shows:**
We're at an inflection point. The fundamentals have shifted, and the gap between adaptive and rigid approaches is widening.

**Practical Steps:**
1. Question baseline assumptions before building solutions
2. Find leverage where small inputs create large outputs
3. Build rapid feedback loops into every process
4. Position for the next phase, not the current one`,

    gemini: `**Gemini's Assessment: "${preview}"**

A systematic examination reveals several interconnected dimensions worth exploring.

**Technical Overview:**
Current research and implementation data indicate a multifaceted landscape shaped by the convergence of multiple disciplines. Best practices are emerging through iterative real-world application.

**Strategic Framework:**
- Stakeholder mapping and structured engagement protocols
- Evidence-based iterative development with continuous feedback
- Comprehensive risk identification and mitigation planning
- Performance benchmarking and optimization systems

**Research Insights:**
Academic and industry sources suggest that optimal outcomes require balancing innovation velocity with operational stability. Context-specificity is critical — generic solutions consistently underperform tailored approaches.

**Implementation Pathway:**
1. Baseline capability and constraint assessment
2. Pilot design with explicit success criteria
3. Scaled deployment with integrated monitoring
4. Continuous improvement through structured retrospectives`,
  };

  return templates[model];
}

export async function queryModel(
  model: 'claude' | 'grok' | 'gemini',
  prompt: string
): Promise<AIResponse> {
  const startTime = Date.now();

  try {
    const result = await callEdgeFunction({ action: 'query', model, prompt });

    if (result.success && result.data) {
      return result.data as AIResponse;
    }

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
  selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
): Promise<AIResponse[]> {
  const models = (['claude', 'grok', 'gemini'] as const).filter(m => selectedModels[m]);

  const results = await Promise.allSettled(models.map(m => queryModel(m, prompt)));

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

export async function getSynthesis(
  prompt: string,
  responses: AIResponse[]
): Promise<FusionResult> {
  const validResponses = responses.filter(r => r.content && !r.error);

  if (validResponses.length === 0) {
    return generateMockFusionResult(responses);
  }

  try {
    const result = await callEdgeFunction({ action: 'synthesize', prompt, responses: validResponses });

    if (result.success && result.data) {
      const data = result.data as { content: string; confidence: number };
      return {
        content: data.content,
        confidence: data.confidence,
        sources: calculateSourceAttribution(validResponses),
        keyInsights: extractKeyInsights(data.content),
      };
    }

    throw new Error(result.error ?? 'Synthesis returned no data');
  } catch (error) {
    console.error('Synthesis failed, using mock:', error instanceof Error ? error.message : error);
    return generateMockFusionResult(validResponses);
  }
}

export function getAnalysisData(responses: AIResponse[]): AnalysisData {
  return generateMockAnalysisData(responses);
}
