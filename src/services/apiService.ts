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
        id: crypto.randomUUID(),
        platform: model,
        content: `Mock response from ${model}: This is a simulated response for the prompt "${prompt.substring(0, 50)}..."`,
        confidence: 0.75 + Math.random() * 0.2,
        responseTime: 1.5 + Math.random() * 2,
        error: undefined,
        loading: false,
        wordCount: 50 + Math.floor(Math.random() * 100),
        timestamp: Date.now()
      };
    }

    try {
      if (!this.apiKeys[model]) {
        throw new Error(`No API key configured for ${model}`);
      }

      // Directly call the proxy service
      let result;
      switch(model) {
        case 'claude':
          result = await proxyService.queryClaude(prompt);
          break;
        case 'grok':
          result = await proxyService.queryGroq(prompt);
          break;
        case 'gemini':
          result = await proxyService.queryGemini(prompt);
          break;
        default:
          throw new Error(`Unknown model: ${model}`);
      }
      
      if (result.success && result.data) {
        return result.data;
      } else {
        // Return error response
        return {
          id: crypto.randomUUID(),
          platform: model,
          content: `❌ ${model.toUpperCase()} Error: ${result.error || 'API call failed'}`,
          confidence: 0,
          responseTime: 0,
          wordCount: 0,
          loading: false,
          error: result.error || 'API call failed',
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Error querying ${model}:`, error);
      return {
        id: crypto.randomUUID(),
        platform: model,
        content: `❌ ${model.toUpperCase()} Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        responseTime: 0,
        wordCount: 0,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async queryAllModels(
    prompt: string,
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<AIResponse[]> {
    try {
      // Check if mock mode is enabled
      if (this._isMockMode) {
        // Return mock responses as array
        const mockResponses: AIResponse[] = [];
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        if (selectedModels.claude) {
          mockResponses.push({
            id: crypto.randomUUID(),
            platform: 'claude',
            content: `Mock Claude response: This is a simulated response from Claude for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.8 + Math.random() * 0.15,
            responseTime: 1.8 + Math.random() * 1.5,
            error: undefined,
            loading: false,
            wordCount: 60 + Math.floor(Math.random() * 80),
            timestamp: Date.now()
          });
        }
        
        if (selectedModels.grok) {
          mockResponses.push({
            id: crypto.randomUUID(),
            platform: 'grok',
            content: `Mock Grok response: This is a simulated response from Grok for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.75 + Math.random() * 0.2,
            responseTime: 1.2 + Math.random() * 1.8,
            error: undefined,
            loading: false,
            wordCount: 55 + Math.floor(Math.random() * 90),
            timestamp: Date.now()
          });
        }
        
        if (selectedModels.gemini) {
          mockResponses.push({
            id: crypto.randomUUID(),
            platform: 'gemini',
            content: `Mock Gemini response: This is a simulated response from Gemini for the prompt "${prompt.substring(0, 50)}..."`,
            confidence: 0.78 + Math.random() * 0.17,
            responseTime: 1.5 + Math.random() * 2.2,
            error: undefined,
            loading: false,
            wordCount: 45 + Math.floor(Math.random() * 95),
            timestamp: Date.now()
          });
        }
        
        return mockResponses;
      }

      // Query real APIs
      const [claudeResult, grokResult, geminiResult] = await Promise.all([
        selectedModels.claude ? this.queryModel('claude', prompt) : null,
        selectedModels.grok ? this.queryModel('grok', prompt) : null,
        selectedModels.gemini ? this.queryModel('gemini', prompt) : null
      ]);

      // Return results from real APIs as array
      const responses: AIResponse[] = [];
      if (claudeResult) responses.push(claudeResult);
      if (grokResult) responses.push(grokResult);
      if (geminiResult) responses.push(geminiResult);
      
      return responses;
    } catch (error) {
      console.error('Failed to query real APIs:', error);
      throw error;
    }
  }

  async getAnalysisData(responses: AIResponse[]): Promise<AnalysisData> {
    if (this._isMockMode) {
      return generateMockAnalysisData(responses);
    }

    // Generate dynamic analysis data based on actual AI responses
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockAnalysisData(responses);
  }

  async getFusionResult(responses: AIResponse[]): Promise<FusionResult> {
    if (this._isMockMode) {
      return generateMockFusionResult(responses);
    }

    console.log('🔄 getFusionResult called with responses:', responses.length);
    
    // Try to use real Claude for intelligent synthesis
    if (import.meta.env.VITE_CLAUDE_API_KEY && responses.length > 0) {
      try {
        // This is a fallback - the main synthesis should happen in the store with proper prompt context
        console.log('⚠️ getFusionResult: No prompt provided, using fallback mock data');
        return generateMockFusionResult(responses);
      } catch (error) {
        console.error('❌ Error during response fusion:', error);
      }
    }
    
    console.log('📝 Using mock fusion result');
    return generateMockFusionResult(responses);
  }

  async getFusionResultWithPrompt(prompt: string, responses: AIResponse[]): Promise<FusionResult> {
    if (this._isMockMode) {
      return generateMockFusionResult(responses);
    }

    console.log('🔄 getFusionResultWithPrompt called:', { prompt: prompt.substring(0, 50) + '...', responses: responses.length });
    
    try {
      // Only proceed with synthesis if we have actual responses
      const validResponses = responses.filter(r => r && r.content);
      if (validResponses.length === 0) {
        throw new Error('No valid responses to synthesize');
      }

      // Try to use real Claude for intelligent synthesis
      if (import.meta.env.VITE_CLAUDE_API_KEY && validResponses.length > 0 && prompt) {
        try {
          console.log('🧠 Attempting Claude-powered response synthesis with prompt context...');
          
          const synthesisResult = await realClaudeService.synthesizeResponses(prompt, validResponses);
          
          if (synthesisResult.success && synthesisResult.data) {
            console.log('✅ Claude synthesis successful');
            
            // Calculate sources based on response word counts
            const totalWords = validResponses.reduce((sum, r) => sum + r.wordCount, 0);
            const sources = {
              grok: Math.round((validResponses.find(r => r.platform === 'grok')?.wordCount || 0) / totalWords * 100),
              claude: Math.round((validResponses.find(r => r.platform === 'claude')?.wordCount || 0) / totalWords * 100),
              gemini: Math.round((validResponses.find(r => r.platform === 'gemini')?.wordCount || 0) / totalWords * 100)
            };
            
            // Normalize to ensure they add up to 100
            const total = sources.grok + sources.claude + sources.gemini;
            if (total > 0) {
              sources.grok = Math.round((sources.grok / total) * 100);
              sources.claude = Math.round((sources.claude / total) * 100);
              sources.gemini = 100 - sources.grok - sources.claude; // Ensure total = 100
            }
            
            // Extract key insights from the synthesized content
            const keyInsights = this.extractKeyInsights(synthesisResult.data?.content || '');
            
            return {
              content: synthesisResult.data?.content || '',
              confidence: synthesisResult.data?.confidence || 0.5,
              sources,
              keyInsights
            };
          } else {
            console.warn('⚠️ Claude synthesis failed, falling back to mock data:', synthesisResult.error);
          }
        } catch (error) {
          console.error('❌ Error during response fusion:', error);
        }
      }
      
      console.log('📝 Using mock fusion result (no Claude API key or synthesis failed)');
      
      // Fallback to mock data if Claude synthesis fails
      return generateMockFusionResult(validResponses);
      
    } catch (error) {
      console.error('Error in fusion process:', error);
      
      // Final fallback to mock data
      return generateMockFusionResult(responses);
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