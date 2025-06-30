export interface AIResponse {
  id: string;
  platform: 'claude' | 'grok' | 'gemini';
  content: string;
  confidence: number;
  responseTime: number;
  wordCount: number;
  loading: boolean;
  error?: string;
  timestamp: number;
  isMock?: boolean;
}

// New type for API results
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
  loading: boolean;
  completed: boolean;
  progress?: number;
}

export interface Conversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
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