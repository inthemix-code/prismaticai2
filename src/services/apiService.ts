import { AIResponse, AnalysisData, FusionResult } from '../types';
import { generateMockAnalysisData, generateMockFusionResult } from '../data/mockData';
import { proxyService } from './proxyService';
import { realClaudeService } from './realClaudeService';

interface ApiKeyStatus {
  claude: boolean;
  grok: boolean;
  gemini: boolean;
}

class PersonalAPIService {
  private readonly apiKeys = {
    claude: import.meta.env.VITE_CLAUDE_API_KEY,
    grok: import.meta.env.VITE_GROK_API_KEY,
    gemini: import.meta.env.VITE_GEMINI_API_KEY
  };

  private useMockData = false;
  private debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  constructor() {
    // Smart initialization logic:
    // 1. First check if user has a saved preference in localStorage
    const savedPreference = localStorage.getItem('useMockData');
    
    if (savedPreference !== null) {
      // User has a saved preference, use it
      this.useMockData = savedPreference === 'true';
    } else {
      // No saved preference, determine initial state intelligently
      // Check environment variable first
      if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
        this.useMockData = true;
      } else {
        // Default to mock mode only if no valid API keys are available
        this.useMockData = !this.hasValidKeys();
      }
      
      // Save this initial determination to localStorage
      localStorage.setItem('useMockData', this.useMockData.toString());
    }
    
    // Force mock mode if no valid API keys are available, regardless of saved preference
    if (!this.hasValidKeys() && import.meta.env.VITE_ENABLE_MOCK_DATA !== 'false') {
      this.useMockData = true;
      localStorage.setItem('useMockData', 'true');
    }
    
    // Debug logging
    if (this.debugMode) {
      console.log('🔧 API Service initialized:', {
        mockMode: this.useMockData,
        hasClaudeKey: !!this.apiKeys.claude,
        hasGrokKey: !!this.apiKeys.grok,
        hasGeminiKey: !!this.apiKeys.gemini,
        savedPreference,
        envVars: {
          VITE_ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA,
          VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE
        }
      });
    }
  }

  async queryModel(
    model: 'claude' | 'grok' | 'gemini',
    prompt: string
  ): Promise<AIResponse> {
    
    // Always check if we should use mock data before making API calls
    if (this.useMockData || !this.hasValidKeys()) {
      if (this.debugMode) {
        console.log(`📝 Using mock data for ${model} (useMockData: ${this.useMockData}, hasValidKeys: ${this.hasValidKeys()})`);
      }
      return this.generateMockResponse(model, prompt);
    }
    
    if (this.debugMode) {
      console.log(`🚀 Querying ${model}:`, {
        prompt: prompt.substring(0, 100) + '...',
        mockMode: this.useMockData,
        hasKey: !!this.apiKeys[model]
      });
    }
    
    // Use proxy service for better API handling
    try {
      let result;
      switch (model) {
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
      
      return result.data;
    } catch (error) {
      console.error(`❌ Error querying ${model}:`, error);
      return this.createErrorResponse(model, (error as Error).message);
    }
  }

  async queryAllModels(
    prompt: string,
    selectedModels: Record<string, boolean>
  ): Promise<AIResponse[]> {
    if (this.debugMode) {
      console.log('🚀 Querying all models:', {
        selectedModels,
        mockMode: this.useMockData,
        prompt: prompt.substring(0, 50) + '...'
      });
    }

    // Use the proxy service for better API handling and mock responses
    try {
      const results = await proxyService.queryMultiple(prompt, selectedModels);
      const responses = results.map(result => result.data);
      
      if (this.debugMode) {
        console.log('✅ All models completed:', {
          totalResponses: responses.length,
          successfulResponses: responses.filter(r => !r.error).length,
          errorResponses: responses.filter(r => r.error).length
        });
      }

      return responses;
    } catch (error) {
      console.error('❌ Error querying models:', error);
      
      // Fallback to mock responses if proxy service fails
      const enabledModels = Object.entries(selectedModels)
        .filter(([_, enabled]) => enabled)
        .map(([model, _]) => model as 'claude' | 'grok' | 'gemini');
      
      return enabledModels.map(model => this.createErrorResponse(model, 'Service temporarily unavailable'));
    }
  }

  // Legacy method - keeping for compatibility but using proxy service internally
  private async queryAllModelsLegacy(
    prompt: string,
    selectedModels: Record<string, boolean>
  ): Promise<AIResponse[]> {
    const enabledModels = Object.entries(selectedModels)
      .filter(([_, enabled]) => enabled)
      .map(([model, _]) => model as 'claude' | 'grok' | 'gemini');

    const promises = enabledModels.map(async (model) => {
      try {
        return await this.queryModel(model, prompt);
      } catch (error) {
        console.error(`❌ Error querying ${model}:`, error);
        return this.createErrorResponse(model, (error as Error).message);
      }
    });

    return Promise.all(promises);
  }

  async getAnalysisData(responses: AIResponse[]): Promise<AnalysisData> {
    // Generate dynamic analysis data based on actual AI responses
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockAnalysisData(responses);
  }

  async getFusionResult(responses: AIResponse[]): Promise<FusionResult> {
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
    console.log('🔄 getFusionResultWithPrompt called:', { prompt: prompt.substring(0, 50) + '...', responses: responses.length });
    
    // Try to use real Claude for intelligent synthesis
    if (import.meta.env.VITE_CLAUDE_API_KEY && responses.length > 0 && prompt) {
      try {
        console.log('🧠 Attempting Claude-powered response synthesis with prompt context...');
        
        const synthesisResult = await realClaudeService.synthesizeResponses(prompt, responses);
        
        if (synthesisResult.success) {
          console.log('✅ Claude synthesis successful');
          
          // Calculate sources based on response word counts
          const totalWords = responses.reduce((sum, r) => sum + r.wordCount, 0);
          const sources = {
            grok: Math.round((responses.find(r => r.platform === 'grok')?.wordCount || 0) / totalWords * 100),
            claude: Math.round((responses.find(r => r.platform === 'claude')?.wordCount || 0) / totalWords * 100),
            gemini: Math.round((responses.find(r => r.platform === 'gemini')?.wordCount || 0) / totalWords * 100)
          };
          
          // Normalize to ensure they add up to 100
          const total = sources.grok + sources.claude + sources.gemini;
          if (total > 0) {
            sources.grok = Math.round((sources.grok / total) * 100);
            sources.claude = Math.round((sources.claude / total) * 100);
            sources.gemini = 100 - sources.grok - sources.claude; // Ensure total = 100
          }
          
          // Extract key insights from the synthesized content
          const keyInsights = this.extractKeyInsights(synthesisResult.data.content);
          
          return {
            content: synthesisResult.data.content,
            confidence: synthesisResult.data.confidence,
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
    
    console.log('📝 Using mock fusion result (no Claude API key or no responses)');
    return generateMockFusionResult(responses);
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

  private generateMockResponse(model: string, prompt: string): AIResponse {
    const mockContent = this.generateMockContent(model, prompt);

    return {
      id: crypto.randomUUID(),
      platform: model as any,
      content: mockContent,
      confidence: 0.8 + Math.random() * 0.15,
      responseTime: 1000 + Math.random() * 2000,
      wordCount: mockContent.split(' ').length,
      loading: false,
      timestamp: Date.now()
    };
  }

  private generateMockContent(model: string, prompt: string): string {
    const promptPreview = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : '');
    
    const mockContent = {
      claude: `Claude's sophisticated analysis of "${promptPreview}":

This question touches on several interconnected dimensions that warrant careful examination. From a systematic perspective, we should consider both the immediate implications and the broader contextual factors at play.

**Key Considerations:**
• Foundational principles and theoretical frameworks
• Current implementation strategies and best practices  
• Emerging trends and future trajectory
• Risk assessment and mitigation approaches

The evidence suggests that this field is experiencing significant evolution, with traditional approaches being challenged by innovative methodologies. Stakeholders should adopt a balanced approach that considers both opportunities and constraints while maintaining focus on sustainable outcomes.

**Strategic Recommendations:**
1. Comprehensive assessment of current capabilities
2. Phased implementation with iterative refinement
3. Continuous monitoring and adaptive management
4. Cross-functional collaboration and knowledge sharing

The complexity of this domain requires nuanced thinking and careful planning to achieve optimal results.`,

      grok: `Grok's unfiltered take on "${promptPreview}":

Alright, let's cut through the noise here. While everyone's busy debating the surface-level stuff, the real action is happening in the spaces most people aren't looking.

**What's Actually Happening:**
The conventional wisdom is getting disrupted faster than anyone expected. Smart operators are already positioning for what's coming next, while the incumbents are still fighting yesterday's battles.

**The Real Deal:**
• Traditional playbooks aren't working anymore
• New players are rewriting the rules entirely  
• The convergence is creating massive opportunities
• First-mover advantage is everything right now

Here's what the data actually shows: we're at an inflection point where the old assumptions don't hold. The next 12-24 months will separate the winners from the also-rans.

**Bottom Line:**
Stop overthinking it. The fundamentals have shifted, the market knows it, and the smart money is already moving. Either adapt or get left behind.`,

      gemini: `Gemini's comprehensive analysis of "${promptPreview}":

This inquiry addresses a multifaceted domain that benefits from systematic examination and evidence-based assessment. Current research and industry trends indicate several key factors shaping this landscape.

**Technical Overview:**
The field is characterized by rapid advancement in methodologies and tools, driven by the intersection of multiple disciplines. Stakeholders are increasingly recognizing the importance of integrated approaches that balance innovation with practical implementation requirements.

**Current State Analysis:**
• Emerging technologies are reshaping traditional approaches
• Cross-industry applications are expanding rapidly
• Best practices are evolving through iterative learning
• Risk management frameworks are being refined

**Research Insights:**
Academic and industry research suggests that successful strategies require both technical expertise and strategic planning. The evidence supports a measured approach that prioritizes sustainable development while maintaining competitive positioning.

**Implementation Framework:**
1. Baseline assessment and capability mapping
2. Pilot program development and testing
3. Scaled deployment with monitoring systems
4. Continuous optimization and improvement

The trajectory indicates continued evolution with increasing sophistication in both theoretical understanding and practical application capabilities.`
    };

    return mockContent[model as keyof typeof mockContent] || "Comprehensive mock response for your query.";
  }

  private createErrorResponse(model: string, errorMessage: string): AIResponse {
    return {
      id: crypto.randomUUID(),
      platform: model as any,
      content: `❌ ${model.toUpperCase()} Error: ${errorMessage}`,
      confidence: 0,
      responseTime: 0,
      wordCount: 0,
      loading: false,
      error: errorMessage,
      timestamp: Date.now()
    };
  }

  // Utility methods
  toggleMockMode() {
    this.useMockData = !this.useMockData;
    localStorage.setItem('useMockData', this.useMockData.toString());
    
    if (this.debugMode) {
      console.log(`🔄 Mock mode toggled: ${this.useMockData ? 'ON' : 'OFF'}`);
    }
  }

  isMockMode(): boolean {
    return this.useMockData;
  }

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