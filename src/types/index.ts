export interface AIResponse {
  id: string;
  platform: 'claude' | 'grok' | 'gemini';
  content: string;
  confidence: number;
  responseTime: number;
  wordCount: number;
  loading: boolean;
  streaming?: boolean;
  firstTokenMs?: number;
  tokensPerSecond?: number;
  error?: string;
  timestamp: number;
  isMock?: boolean;
}

export interface AIResult {
  success: boolean;
  data: AIResponse;
  error?: string;
}

export interface DemoPrompt {
  id: string;
  text: string;
  category: string;
  description: string;
}

export interface ConversationTurn {
  id: string;
  prompt: string;
  timestamp: number;
  responses: AIResponse[];
  analysisData: AnalysisData | null;
  fusionResult: FusionResult | null;
  fusionStructured?: StructuredSynthesis | null;
  loading: boolean;
  completed: boolean;
  progress?: number;
  memoryUsed?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
  projectId?: string | null;
}

export interface FusionResult {
  content: string;
  confidence: number;
  sources: {
    grok: number;
    claude: number;
    gemini: number;
  };
  keyInsights: string[];
}

export type ModelId = 'claude' | 'grok' | 'gemini';

export interface SynthesisSentence {
  text: string;
  supported_by: ModelId[];
  contested_by?: ModelId[];
  rationale?: string;
}

export interface StructuredSynthesis {
  sentences: SynthesisSentence[];
  disagreements?: Array<{
    topic: string;
    positions: Array<{ model: ModelId; stance: string }>;
    resolution: string;
  }>;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  systemPersona: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectMemory {
  id: string;
  projectId: string;
  fact: string;
  sourceTurnId?: string | null;
  pinned: boolean;
  createdAt: number;
}

export interface AnalysisData {
  sentiment: Array<{
    platform: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  keywords: Array<{
    word: string;
    grok: number;
    claude: number;
    gemini: number;
  }>;
  metrics: Array<{
    platform: string;
    confidence: number;
    responseTime: number;
    wordCount: number;
  }>;
  efficiency: Array<{
    platform: string;
    conciseness: number;
    redundancy: number;
  }>;
  risk: Array<{
    platform: string;
    hallucination: number;
    contradictions: number;
    hedging: number;
  }>;
  differentiation: Array<{
    platform: string;
    originality: number;
    divergence: number;
    contribution: number;
  }>;
}
