import { AIResponse, AIResult } from '../types';

interface AIServiceConfig {
  claude: {
    apiKey: string;
    baseUrl: string;
  };
  grok: {
    apiKey: string;
    baseUrl: string;
  };
  gemini: {
    apiKey: string;
    baseUrl: string;
  };
}

class AIService {
  private config: AIServiceConfig;

  constructor() {
    this.config = {
      claude: {
        apiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
        baseUrl: 'https://api.anthropic.com/v1/messages'
      },
      grok: {
        apiKey: import.meta.env.VITE_GROK_API_KEY || '',
        baseUrl: 'https://api.x.ai/v1/chat/completions'
      },
      gemini: {
        apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
      }
    };
  }

  async queryClaude(prompt: string): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.config.claude.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.claude.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.content[0].text;

      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content,
          confidence: this.calculateConfidence(content) / 100,
          responseTime: responseTime / 1000,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content: '',
          confidence: 0,
          responseTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          loading: false,
          timestamp: Date.now()
        }
      };
    }
  }

  async queryGrok(prompt: string): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(this.config.grok.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.grok.apiKey}`
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.choices[0].message.content;

      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          platform: 'grok',
          content,
          confidence: this.calculateConfidence(content) / 100,
          responseTime: responseTime / 1000,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          id: crypto.randomUUID(),
          platform: 'grok',
          content: '',
          confidence: 0,
          responseTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          loading: false,
          timestamp: Date.now()
        }
      };
    }
  }

  async queryGemini(prompt: string): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.config.gemini.baseUrl}?key=${this.config.gemini.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.candidates[0].content.parts[0].text;

      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          platform: 'gemini',
          content,
          confidence: this.calculateConfidence(content) / 100,
          responseTime: responseTime / 1000,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          id: crypto.randomUUID(),
          platform: 'gemini',
          content: '',
          confidence: 0,
          responseTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          loading: false,
          timestamp: Date.now()
        }
      };
    }
  }

  async queryMultiple(
    prompt: string, 
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<AIResult[]> {
    const promises: Promise<AIResult>[] = [];

    if (selectedModels.claude && this.config.claude.apiKey) {
      promises.push(this.queryClaude(prompt));
    }

    if (selectedModels.grok && this.config.grok.apiKey) {
      promises.push(this.queryGrok(prompt));
    }

    if (selectedModels.gemini && this.config.gemini.apiKey) {
      promises.push(this.queryGemini(prompt));
    }

    if (promises.length === 0) {
      throw new Error('No AI services configured or selected');
    }

    return Promise.all(promises);
  }

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content characteristics
    let confidence = 0.5; // Base confidence

    // Length factor (longer responses generally more confident)
    const wordCount = content.split(' ').length;
    if (wordCount > 50) confidence += 0.1;
    if (wordCount > 100) confidence += 0.1;

    // Certainty markers
    const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'unclear'];
    const certainWords = ['definitely', 'certainly', 'clearly', 'obviously', 'undoubtedly'];
    
    const uncertainCount = uncertainWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);
    const certainCount = certainWords.reduce((count, word) => 
      count + (content.toLowerCase().match(new RegExp(word, 'g')) || []).length, 0);

    confidence += (certainCount * 0.05) - (uncertainCount * 0.05);

    // Clamp between 0 and 1, then convert to percentage
    return Math.max(0, Math.min(1, confidence)) * 100;
  }

  hasValidKeys(): boolean {
    return !!(this.config.claude.apiKey || this.config.grok.apiKey || this.config.gemini.apiKey);
  }

  getAvailableServices(): string[] {
    const services: string[] = [];
    if (this.config.claude.apiKey) services.push('claude');
    if (this.config.grok.apiKey) services.push('grok');
    if (this.config.gemini.apiKey) services.push('gemini');
    return services;
  }

  getApiKeyStatus(): Record<string, boolean> {
    return {
      claude: !!this.config.claude.apiKey,
      grok: !!this.config.grok.apiKey,
      gemini: !!this.config.gemini.apiKey
    };
  }
}

export const aiService = new AIService();