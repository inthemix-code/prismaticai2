import { AIResponse, AnalysisData, FusionResult } from '../types';
import { proxyService } from './proxyService';
import { realClaudeService } from './realClaudeService';
import { generateMockAnalysisData, generateMockFusionResult } from '../data/mockData';

class PersonalAPIService {
  private _isMockMode: boolean;
  private readonly apiKeys = {
    claude: import.meta.env.VITE_CLAUDE_API_KEY,
    grok: import.meta.env.VITE_GROK_API_KEY,
    gemini: import.meta.env.VITE_GEMINI_API_KEY
  };

  private debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  constructor() {
    // Initialize mock mode from localStorage or environment variable
    const storedMockMode = localStorage.getItem('mockMode');
    this._isMockMode = storedMockMode ? 
      JSON.parse(storedMockMode) : 
      import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

    // Debug logging
    if (this.debugMode) {
      console.log('🔧 API Service initialized:', {
        hasClaudeKey: !!this.apiKeys.claude,
        hasGrokKey: !!this.apiKeys.grok,
        hasGeminiKey: !!this.apiKeys.gemini
      });
    }
  }

  isMockMode(): boolean {
    return this._isMockMode;
  }

  toggleMockMode(): void {
    this._isMockMode = !this._isMockMode;
    localStorage.setItem('mockMode', JSON.stringify(this._isMockMode));
  }

  async queryModel(
    model: 'claude' | 'grok' | 'gemini',
    prompt: string
  ): Promise<AIResponse> {
    // Check if mock mode is enabled
    if (this._isMockMode) {
      // Return mock data
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      return {
        platform: model,
        content: `Mock response from ${model}: This is a simulated response for the prompt "${prompt.substring(0, 50)}..."`,
        confidence: 0.75 + Math.random() * 0.2,
        error: undefined,
        wordCount: 50 + Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString()
      };
    }

    try {
      if (!this.apiKeys[model]) {
        throw new Error(`No API key configured for ${model}`);
      }

      // Directly call the proxy service
      const result = await proxyService[`query${model.charAt(0).toUpperCase() + model.slice(1)}`](prompt);
      
      // Convert proxy result to AIResponse format
      return {
        platform: model,
        content: result.data?.content || '',
        confidence: result.data?.confidence || 0.8,
        error: result.error,
        wordCount: result.data?.content?.split(' ').length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error querying ${model}:`, error);
      throw error;
    }
  }

  async queryAllModels(
    prompt: string,
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<Record<string, AIResponse>> {
    try {
      // Check if mock mode is enabled
      if (this._isMockMode) {
        // Return mock responses
        const mockResponses: Record<string, AIResponse> = {};
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        if (selectedModels.claude) {
          mockResponses.claude = {
            platform: 'claude',
            content: `Mock Claude response: This is a simulated response from Claude for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.8 + Math.random() * 0.15,
            error: undefined,
            wordCount: 60 + Math.floor(Math.random() * 80),
            timestamp: new Date().toISOString()
          };
        }
        
        if (selectedModels.grok) {
          mockResponses.grok = {
            platform: 'grok',
            content: `Mock Grok response: This is a simulated response from Grok for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.75 + Math.random() * 0.2,
            error: undefined,
            wordCount: 55 + Math.floor(Math.random() * 90),
            timestamp: new Date().toISOString()
          };
        }
        
        if (selectedModels.gemini) {
          mockResponses.gemini = {
            platform: 'gemini',
            content: `Mock Gemini response: This is a simulated response from Gemini for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.78 + Math.random() * 0.17,
            error: undefined,
            wordCount: 45 + Math.floor(Math.random() * 95),
            timestamp: new Date().toISOString()
          };
        }
        
        return mockResponses;
      }

      const [claudeResult, grokResult, geminiResult] = await Promise.all([
        selectedModels.claude ? this.queryModel('claude', prompt) : null,
        selectedModels.grok ? this.queryModel('grok', prompt) : null,
        selectedModels.gemini ? this.queryModel('gemini', prompt) : null
      ]);

      // Return results from real APIs
      return {
        claude: claudeResult,
        grok: grokResult,
        gemini: geminiResult
      };
    } catch (error) {
      console.error('Failed to query real APIs:', error);
      throw error;
    }
  }

  async getAnalysisData(responses: AIResponse[]): Promise<AnalysisData> {
    if (this._isMockMode) {
      return generateMockAnalysisData();
    }

    // Generate dynamic analysis data based on actual AI responses
    await new Promise(resolve => setTimeout(resolve, 500));
    // TO DO: implement real analysis data generation
    return {} as AnalysisData;
  }

  async getFusionResult(responses: AIResponse[]): Promise<FusionResult> {
    if (this._isMockMode) {
      return generateMockFusionResult();
    }

    console.log('🔄 getFusionResult called with responses:', responses.length);
    
    // Try to use real Claude for intelligent synthesis
    if (import.meta.env.VITE_CLAUDE_API_KEY && responses.length > 0) {
      try {
        // This is a fallback - the main synthesis should happen in the store with proper prompt context
        console.log('⚠️ getFusionResult: No prompt provided, using fallback mock data');
        // TO DO: implement real fusion result generation
        return {} as FusionResult;
      } catch (error) {
        console.error('❌ Error during response fusion:', error);
      }
    }
    
    console.log('📝 Using mock fusion result');
    // TO DO: implement real fusion result generation
    return {} as FusionResult;
  }

  async getFusionResultWithPrompt(prompt: string, responses: AIResponse[]): Promise<FusionResult> {
    if (this._isMockMode) {
      return generateMockFusionResult();
    }

    try {
      // Only proceed with synthesis if we have actual responses
      const validResponses = responses.filter(r => r && r.content);
      if (validResponses.length === 0) {
        throw new Error('No valid responses to synthesize');
      }

      // Calculate source contributions based on response length
      const sources = {
        grok: 0,
        claude: 0,
        gemini: 0
      };

      validResponses.forEach(response => {
        if (response.content) {
          const wordCount = response.content.split(' ').length;
          sources[response.platform as keyof typeof sources] += wordCount;
        }
      });

      // Normalize source contributions
      const totalWords = Object.values(sources).reduce((a, b) => a + b, 0);
      if (totalWords > 0) {
        Object.keys(sources).forEach(key => {
          sources[key as keyof typeof sources] = Math.round((sources[key as keyof typeof sources] / totalWords) * 100);
        });
      }

      // Create a synthesis of the responses
      const synthesis = validResponses.map(r => r.content || '').join('\n\n') + '\n\n' +
        'Based on these responses, here is a synthesized conclusion:\n\n' +
        validResponses.map(r => r.content || '').join('\n\n') + '\n\n' +
        'Key insights from all responses:\n\n' +
        validResponses.map(r => r.content || '').join('\n\n');

      return {
        content: synthesis,
        confidence: 0.85, // High confidence for real data
        sources,
        keyInsights: this.extractKeyInsights(synthesis)
      };
    } catch (error) {
      console.error('Error in fusion process:', error);
      throw error;
    }
  }

  private extractKeyInsights(content: string): string[] {
    // Simple extraction of bullet points and numbered items
    const insights: string[] = [];
    
    // Look for bullet points
    const bulletMatches = content.match(/[•\-\*]\s+([^\n]+)/g);
    if (bulletMatches) {
      insights.push(...bulletMatches.map(match => 
        match.replace(/^[•\-\*]\s+/, '').trim()
      ).slice(0, 2));
    }
    
    // Look for numbered points
    const numberedMatches = content.match(/\d+\.\s+([^\n]+)/g);
    if (numberedMatches) {
      insights.push(...numberedMatches.map(match => 
        match.replace(/^\d+\.\s+/, '').trim()
      ).slice(0, 2));
    }
    
    // Look for sentences with strong indicators
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const strongIndicators = ['key', 'important', 'critical', 'essential', 'significant', 'primary', 'fundamental'];
    
    for (const sentence of sentences) {
      if (strongIndicators.some(indicator => 
        sentence.toLowerCase().includes(indicator)) && insights.length < 4
      ) {
        insights.push(sentence.trim());
      }
    }
    
    // Fallback: use first few sentences if no insights found
    if (insights.length === 0) {
      insights.push(...sentences.slice(0, 3).map(s => s.trim()));
    }
    
    return insights.slice(0, 4).filter(insight => insight.length > 10);
  }

  async queryClaude(prompt: string): Promise<any> {
    if (!this.apiKeys.claude) {
      throw new Error('Claude API key not configured');
    }

    try {
      return await proxyService.queryClaude(prompt);
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  async queryGrok(prompt: string): Promise<any> {
    if (!this.apiKeys.grok) {
      throw new Error('Grok API key not configured');
    }

    try {
      return await proxyService.queryGroq(prompt);
    } catch (error) {
      console.error('Grok API error:', error);
      throw error;
    }
  }

  async queryGemini(prompt: string): Promise<any> {
    if (!this.apiKeys.gemini) {
      throw new Error('Gemini API key not configured');
    }

    try {
      return await proxyService.queryGemini(prompt);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // Utility methods
  hasValidKeys(): boolean {
    // Use proxy service for key validation when available
    if (proxyService) {
      return proxyService.hasValidKeys();
    }
    
    // Fallback to original validation
    return this.isValidClaudeKey(this.apiKeys.claude) || 
           this.isValidGrokKey(this.apiKeys.grok) || 
           this.isValidGeminiKey(this.apiKeys.gemini);
  }

  getApiKeyStatus(): Record<string, boolean> {
    // Use proxy service for status when available
    if (proxyService) {
      return proxyService.getApiKeyStatus();
    }
    
    // Fallback to original status
    return {
      claude: this.isValidClaudeKey(this.apiKeys.claude),
      grok: this.isValidGrokKey(this.apiKeys.grok),
      gemini: this.isValidGeminiKey(this.apiKeys.gemini)
    };
  }

  private isValidClaudeKey(key: string): boolean {
    return !!(key && 
      key.startsWith('sk-ant-api') && 
      !key.includes('your-claude-key-here') && 
      !key.includes('sk-ant-your-claude-key-here') &&
      key.length > 20);
  }

  private isValidGrokKey(key: string): boolean {
    return !!(key && 
      key.startsWith('xai-') && 
      !key.includes('your-grok-key-here') && 
      !key.includes('xai-your-grok-key-here') &&
      key.length > 10);
  }

  private isValidGeminiKey(key: string): boolean {
    return !!(key && 
      (key.startsWith('AIzaSy') || key.startsWith('AIza')) && 
      !key.includes('your-gemini-key-here') && 
      !key.includes('AIza-your-gemini-key-here') &&
      key.length > 30);
  }
}

export const apiService = new PersonalAPIService();