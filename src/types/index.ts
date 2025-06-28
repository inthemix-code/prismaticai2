export interface AIResponse {
  id: string;
  platform: 'grok' | 'claude' | 'gemini';
  content: string;
  confidence: number;
  responseTime: number;
  wordCount: number;
  loading: boolean;
  error?: string;
  timestamp: number;
}

export interface AnalysisData {
  sentiment: {
    platform: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
  keywords: {
    word: string;
    grok: number;
    claude: number;
    gemini: number;
  }[];
  metrics: {
    platform: string;
    confidence: number;
    responseTime: number;
    wordCount: number;
  }[];
  efficiency: {
    platform: string;
    conciseness: number;
    redundancy: number;
  }[];
  risk: {
    platform: string;
    hallucination: number;
    contradictions: number;
    hedging: number;
  }[];
  differentiation: {
    platform: string;
    originality: number;
    divergence: number;
    contribution: number;
  }[];
}

export interface DemoPrompt {
  id: string;
  text: string;
  category: string;
  description: string;
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

export interface AIResult {
  success: boolean;
  error?: string;
  data: AIResponse;
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
  progress?: number; // 0-100
}

export interface Conversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  updatedAt: number;
}