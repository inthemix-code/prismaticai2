import { AIResponse, AnalysisData, FusionResult, JudgeVerdict, ModelId, StructuredSynthesis } from '../types';
import {
  queryAllModels,
  queryModel,
  getSynthesis,
  getStructuredSynthesis,
  getAnalysisData,
  streamModelWithFallback,
  type QueryOptions,
  type StreamHandlers,
} from './modelService';
import { getJudgeVerdict } from './judgeService';

class APIService {
  async queryAllModels(
    prompt: string,
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean },
    options: QueryOptions = {}
  ): Promise<AIResponse[]> {
    return queryAllModels(prompt, selectedModels, options);
  }

  async queryModel(model: ModelId, prompt: string, options: QueryOptions = {}): Promise<AIResponse> {
    return queryModel(model, prompt, options);
  }

  async streamModel(
    model: ModelId,
    prompt: string,
    handlers: StreamHandlers,
    options: QueryOptions = {}
  ): Promise<AIResponse> {
    return streamModelWithFallback(model, prompt, handlers, options);
  }

  async getAnalysisData(responses: AIResponse[]): Promise<AnalysisData> {
    return getAnalysisData(responses);
  }

  async getFusionResultWithPrompt(prompt: string, responses: AIResponse[]): Promise<FusionResult> {
    return getSynthesis(prompt, responses);
  }

  async getStructuredSynthesis(prompt: string, responses: AIResponse[]): Promise<StructuredSynthesis | null> {
    return getStructuredSynthesis(prompt, responses);
  }

  async getJudgeVerdict(prompt: string, responses: AIResponse[]): Promise<JudgeVerdict | null> {
    return getJudgeVerdict(prompt, responses);
  }
}

export const apiService = new APIService();
