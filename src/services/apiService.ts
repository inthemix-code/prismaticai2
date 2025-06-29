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

  private async queryClaude(prompt: string): Promise<AIResponse> {
    if (!this.apiKeys.claude) {
      const error = 'Claude API key not provided. Add VITE_CLAUDE_API_KEY to your .env file';
      console.error('❌ Claude API Error:', error);
      throw new Error(error);
    }

    // Validate API key format
    if (!this.apiKeys.claude.startsWith('sk-ant-api')) {
      const error = 'Invalid Claude API key format. Please check your VITE_CLAUDE_API_KEY in .env file';
      console.error('❌ Claude API Error:', error);
      throw new Error(error);
    }

    if (this.debugMode) {
      console.log('🤖 Calling Claude API...');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKeys.claude,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API Error:', response.status, errorText);
        
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Invalid Claude API key. Please check your VITE_CLAUDE_API_KEY in .env file');
        } else if (response.status === 403) {
          throw new Error('Claude API access forbidden. Check your API key permissions');
        } else if (response.status === 429) {
          throw new Error('Claude API rate limit exceeded. Please try again later');
        } else {
          throw new Error(`Claude API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.content[0]?.text || 'No response';

      if (this.debugMode) {
        console.log('✅ Claude response received:', {
          responseTime: `${responseTime}ms`,
          contentLength: content.length,
          wordCount: content.split(' ').length
        });
      }

      return {
        id: crypto.randomUUID(),
        platform: 'claude',
        content,
        confidence: 0.92,
        responseTime: responseTime / 1000,
        wordCount: content.split(' ').length,
        loading: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Claude API Error:', error);
      
      // Handle different types of fetch errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Failed to connect to Claude API. This could be due to:\n' +
          '• Invalid or expired API key\n' +
          '• Network connectivity issues\n' +
          '• CORS restrictions\n\n' +
          'Please verify your VITE_CLAUDE_API_KEY in the .env file'
        );
      }
      
      throw error;
    }
  }

  private async queryGrok(prompt: string): Promise<AIResponse> {
    if (!this.apiKeys.grok) {
      const error = 'Grok API key not provided. Add VITE_GROK_API_KEY to your .env file';
      console.error('❌ Grok API Error:', error);
      throw new Error(error);
    }

    // Validate API key format
    if (!this.apiKeys.grok.startsWith('xai-')) {
      const error = 'Invalid Grok API key format. Please check your VITE_GROK_API_KEY in .env file';
      console.error('❌ Grok API Error:', error);
      throw new Error(error);
    }

    if (this.debugMode) {
      console.log('🤖 Calling Grok API...');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKeys.grok}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Grok API Error:', response.status, errorText);
        
        // Provide more specific error messages based on status code
        if (response.status === 401) {
          throw new Error('Invalid Grok API key. Please check your VITE_GROK_API_KEY in .env file');
        } else if (response.status === 403) {
          throw new Error('Grok API access forbidden. Check your API key permissions');
        } else if (response.status === 429) {
          throw new Error('Grok API rate limit exceeded. Please try again later');
        } else {
          throw new Error(`Grok API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.choices[0]?.message?.content || 'No response';

      if (this.debugMode) {
        console.log('✅ Grok response received:', {
          responseTime: `${responseTime}ms`,
          contentLength: content.length,
          wordCount: content.split(' ').length
        });
      }

      return {
        id: crypto.randomUUID(),
        platform: 'grok',
        content,
        confidence: 0.87,
        responseTime: responseTime / 1000,
        wordCount: content.split(' ').length,
        loading: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Grok API Error:', error);
      
      // Handle different types of fetch errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Failed to connect to Grok API. This could be due to:\n' +
          '• Invalid or expired API key\n' +
          '• Network connectivity issues\n' +
          '• CORS restrictions\n\n' +
          'Please verify your VITE_GROK_API_KEY in the .env file'
        );
      }
      
      throw error;
    }
  }

  private async queryGemini(prompt: string): Promise<AIResponse> {
    if (!this.apiKeys.gemini) {
      const error = 'Gemini API key not provided. Add VITE_GEMINI_API_KEY to your .env file';
      console.error('❌ Gemini API Error:', error);
      throw new Error(error);
    }

    // Validate API key format
    if (!this.apiKeys.gemini.startsWith('AIzaSy')) {
      const error = 'Invalid Gemini API key format. Please check your VITE_GEMINI_API_KEY in .env file';
      console.error('❌ Gemini API Error:', error);
      throw new Error(error);
    }

    if (this.debugMode) {
      console.log('🤖 Calling Gemini API...');
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKeys.gemini}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', response.status, errorText);
        
        // Provide more specific error messages based on status code
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env file');
        } else if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later');
        } else {
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.candidates[0]?.content?.parts[0]?.text || 'No response';

      if (this.debugMode) {
        console.log('✅ Gemini response received:', {
          responseTime: `${responseTime}ms`,
          contentLength: content.length,
          wordCount: content.split(' ').length
        });
      }

      return {
        id: crypto.randomUUID(),
        platform: 'gemini',
        content,
        confidence: 0.89,
        responseTime: responseTime / 1000,
        wordCount: content.split(' ').length,
        loading: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // Handle different types of fetch errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(
          'Failed to connect to Gemini API. This could be due to:\n' +
          '• Invalid or expired API key\n' +
          '• Network connectivity issues\n' +
          '• CORS restrictions\n\n' +
          'Please verify your VITE_GEMINI_API_KEY in the .env file'
        );
      }
      
      throw error;
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

  private async queryAllModelsOld(
    prompt: string,
    selectedModels: Record<string, boolean>
  ): Promise<AIResponse[]> {
    const results = await this.queryAllModelsLegacy(prompt, selectedModels);
    
    if (this.debugMode) {
      console.log('✅ All models completed:', {
        totalResponses: results.length,
        successfulResponses: results.filter(r => !r.error).length,
        errorResponses: results.filter(r => r.error).length
      });
    }

    return results;
  }

  async getAnalysisData(): Promise<AnalysisData> {
    // For now, always return mock analysis data as this requires complex NLP processing
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockAnalysisData();
  }

  async getFusionResult(responses: AIResponse[]): Promise<FusionResult> {
    // Try to use real Claude for intelligent synthesis if available
    if (import.meta.env.VITE_CLAUDE_API_KEY && responses.length > 0) {
      try {
        console.log('🧠 Attempting Claude-powered response synthesis...');
        
        // Get the original prompt from the first response context
        const synthesisPrompt = `Please synthesize these AI responses into a comprehensive, unified answer. Focus on creating the best possible response by combining insights, resolving contradictions, and providing a balanced perspective.
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
      claude: \`Claude's sophisticated analysis of "${promptPreview}":
      }
    }
  }
}

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

      grok: \`Grok's unfiltered take on "${promptPreview}":

Alright, let's cut through the noise here. While everyone\'s busy debating the surface-level stuff, the real action is happening in the spaces most people aren't looking.

**What's Actually Happening:**
The conventional wisdom is getting disrupted faster than anyone expected. Smart operators are already positioning for what's coming next, while the incumbents are still fighting yesterday\'s battles.

**The Real Deal:**
• Traditional playbooks aren't working anymore
• New players are rewriting the rules entirely  
• The convergence is creating massive opportunities
• First-mover advantage is everything right now

Here's what the data actually shows: we\'re at an inflection point where the old assumptions don't hold. The next 12-24 months will separate the winners from the also-rans.

**Bottom Line:**
Stop overthinking it. The fundamentals have shifted, the market knows it, and the smart money is already moving. Either adapt or get left behind.`,

      gemini: \`Gemini's comprehensive analysis of "${promptPreview}":

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
      content: \`❌ ${model.toUpperCase()} Error: ${errorMessage}`,
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