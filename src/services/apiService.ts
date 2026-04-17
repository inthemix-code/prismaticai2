import { AIResponse, AnalysisData, FusionResult } from '../types';
import { queryAllModels, getSynthesis, getAnalysisData } from './modelService';

class APIService {
  async queryAllModels(
    prompt: string,
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<AIResponse[]> {
    return queryAllModels(prompt, selectedModels);
  }

  async getAnalysisData(responses: AIResponse[]): Promise<AnalysisData> {
    return getAnalysisData(responses);
  }

  async getFusionResultWithPrompt(prompt: string, responses: AIResponse[]): Promise<FusionResult> {
    return getSynthesis(prompt, responses);
  }
}

export const apiService = new APIService();
