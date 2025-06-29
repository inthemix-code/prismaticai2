// src/services/realClaudeService.ts - Real Claude API service
import { AIResponse, AIResult } from '../types';

// Detect if running in Netlify environment
const isNetlify = window.location.hostname.includes('netlify') || 
                  window.location.hostname.includes('.app') ||
                  process.env.NODE_ENV === 'production';

const NETLIFY_FUNCTIONS_BASE = isNetlify 
  ? `${window.location.origin}/.netlify/functions`
  : 'http://localhost:8888/.netlify/functions'; // For local Netlify dev

interface SynthesisResult {
  success: boolean;
  data?: {
    content: string;
    confidence: number;
  };
  error?: string;
}

class RealClaudeService {
  private readonly apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  private readonly debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  async queryClaude(prompt: string): Promise<AIResult> {
    const startTime = Date.now();
    
    // If in Netlify environment, use Netlify Function
    if (isNetlify || this.shouldUseNetlifyFunction()) {
      return this.queryClaudeViaNetlify(prompt, startTime);
    }
    
    if (!this.apiKey) {
      return this.getFallbackResponse(prompt, startTime, 'No Claude API key configured');
    }

    if (!this.apiKey.startsWith('sk-ant-api')) {
      return this.getFallbackResponse(prompt, startTime, 'Invalid Claude API key format');
    }

    // Try direct API call first (works in many environments)
    const directResult = await this.makeDirectClaudeRequest(prompt, startTime);
    if (directResult.success) {
      return directResult;
    }

    // If direct call fails, try CORS proxies
    const proxyResult = await this.makeProxiedClaudeRequest(prompt, startTime);
    return proxyResult;
  }

  private shouldUseNetlifyFunction(): boolean {
    // Use Netlify Function if we detect we're in a deployment environment
    // or if the user explicitly wants to test the Netlify Function locally
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  private async queryClaudeViaNetlify(prompt: string, startTime: number): Promise<AIResult> {
    try {
      console.log('🌐 Using Netlify Function for Claude API...');
      
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/claude-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Netlify Claude proxy successful');
        return {
          success: true,
          data: {
            ...result.data,
            responseTime: (result.data.responseTime || Date.now() - startTime) / 1000
          }
        };
      } else {
        throw new Error(result.error || 'Netlify function returned error');
      }
      
    } catch (error) {
      console.error('❌ Netlify Claude proxy failed:', error);
      
      // Fallback to direct API call if Netlify Function fails
      if (!isNetlify) {
        console.log('🔄 Falling back to direct API call...');
        return this.makeDirectClaudeRequest(prompt, startTime);
      }
      
      return this.getFallbackResponse(prompt, startTime, `Netlify Function error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async synthesizeResponses(originalPrompt: string, responses: AIResponse[]): Promise<SynthesisResult> {
    // If in Netlify environment, use Netlify Function
    if (isNetlify || this.shouldUseNetlifyFunction()) {
      return this.synthesizeViaNetlify(originalPrompt, responses);
    }
    
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-api')) {
      console.log('⚠️ Claude API key not available for synthesis, using fallback');
      return {
        success: false,
        error: 'Claude API key not available'
      };
    }

    try {
      console.log('🧠 Starting Claude-powered synthesis...');
      
      // Create synthesis prompt
      const synthesisPrompt = this.createSynthesisPrompt(originalPrompt, responses);
      
      if (this.debugMode) {
        console.log('📝 Synthesis prompt created:', synthesisPrompt.substring(0, 200) + '...');
      }

      const startTime = Date.now();

      // Try direct API call first
      let response = await this.makeDirectClaudeAPICall(synthesisPrompt);
      
      // If direct call fails, try CORS proxy
      if (!response) {
        console.log('⚠️ Direct Claude API failed, trying CORS proxy...');
        response = await this.makeProxiedClaudeAPICall(synthesisPrompt);
      }

      if (!response) {
        return {
          success: false,
          error: 'All Claude API access methods failed'
        };
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.content[0]?.text || 'No synthesis available';

      console.log('✅ Claude synthesis successful:', {
        responseTime: `${responseTime}ms`,
        contentLength: content.length,
        wordCount: content.split(' ').length
      });

      // Calculate confidence based on synthesis quality
      const confidence = this.calculateSynthesisConfidence(content, responses);

      return {
        success: true,
        data: {
          content,
          confidence
        }
      };
    } catch (error) {
      console.error('❌ Error during Claude synthesis:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown synthesis error'
      };
    }
  }

  private async synthesizeViaNetlify(originalPrompt: string, responses: AIResponse[]): Promise<SynthesisResult> {
    try {
      console.log('🌐 Using Netlify Function for Claude synthesis...');
      
      const response = await fetch(`${NETLIFY_FUNCTIONS_BASE}/claude-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalPrompt,
          responses: responses.filter(r => !r.error && r.content.trim())
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Netlify Claude synthesis successful');
        return {
          success: true,
          data: result.data
        };
      } else {
        throw new Error(result.error || 'Netlify synthesis function returned error');
      }
      
    } catch (error) {
      console.error('❌ Netlify Claude synthesis failed:', error);
      
      return {
        success: false,
        error: `Netlify synthesis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async makeDirectClaudeAPICall(prompt: string): Promise<Response | null> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (response.ok) {
        console.log('✅ Direct Claude API call successful');
        return response;
      } else {
        console.warn('⚠️ Direct Claude API call failed:', response.status);
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Direct Claude API call error:', error);
      return null;
    }
  }

  private async makeProxiedClaudeAPICall(prompt: string): Promise<Response | null> {
    const corsProxies = [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?'
    ];

    for (const proxy of corsProxies) {
      try {
        console.log(`🌐 Trying Claude API via proxy: ${proxy}`);
        
        const url = proxy + encodeURIComponent('https://api.anthropic.com/v1/messages');
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (response.ok) {
          console.log('✅ Proxied Claude API call successful via:', proxy);
          return response;
        } else {
          console.warn(`⚠️ Proxy ${proxy} failed:`, response.status);
          continue;
        }
      } catch (error) {
        console.warn(`⚠️ Proxy ${proxy} error:`, error);
        continue;
      }
    }

    console.error('❌ All CORS proxies failed');
    return null;
  }

  private async makeDirectClaudeRequest(prompt: string, startTime: number): Promise<AIResult> {
    try {
      const response = await this.makeDirectClaudeAPICall(prompt);
      
      if (response) {
        const data = await response.json();
        const content = data.content[0]?.text || '';
        const responseTime = Date.now() - startTime;

        return {
          success: true,
          data: {
            id: crypto.randomUUID(),
            platform: 'claude',
            content,
            confidence: this.calculateConfidence(content),
            responseTime,
            wordCount: content.split(' ').length,
            loading: false,
            timestamp: Date.now()
          }
        };
      }
    } catch (error) {
      console.warn('❌ Direct Claude request failed:', error);
    }

    return this.getFallbackResponse(prompt, startTime, 'Direct API call failed');
  }

  private async makeProxiedClaudeRequest(prompt: string, startTime: number): Promise<AIResult> {
    try {
      const response = await this.makeProxiedClaudeAPICall(prompt);
      
      if (response) {
        const data = await response.json();
        const content = data.content[0]?.text || '';
        const responseTime = Date.now() - startTime;

        return {
          success: true,
          data: {
            id: crypto.randomUUID(),
            platform: 'claude',
            content,
            confidence: this.calculateConfidence(content),
            responseTime,
            wordCount: content.split(' ').length,
            loading: false,
            timestamp: Date.now()
          }
        };
      }
    } catch (error) {
      console.warn('❌ Proxied Claude request failed:', error);
    }

    return this.getFallbackResponse(prompt, startTime, 'All CORS proxies failed');
  }

  private createSynthesisPrompt(originalPrompt: string, responses: AIResponse[]): string {
    const responseTexts = responses
      .filter(r => !r.error && r.content.trim())
      .map(r => `**${r.platform.toUpperCase()} Response:**\n${r.content.trim()}`)
      .join('\n\n---\n\n');

    return `You are an expert AI analyst creating a comprehensive synthesis response. Your goal is to combine the best insights from multiple AI responses into a single, superior answer.

**Original Question:** "${originalPrompt}"

**AI Responses to Synthesize:**
${responseTexts}

**Your Task:**
Create a unified response that:
1. Combines the best insights and information from all responses
2. Resolves any contradictions with balanced analysis
3. Is more comprehensive and valuable than any individual response
4. Uses clear structure with headings and bullet points
5. Provides actionable insights and recommendations
6. Maintains accuracy while improving clarity

**Important:** Write as if you are providing the definitive answer to the original question, not as if you are analyzing other AI responses. The user should see this as THE answer, not a meta-analysis.

**Synthesized Response:**`;
  }

  private calculateSynthesisConfidence(content: string, responses: AIResponse[]): number {
    let confidence = 0.80; // Base confidence for successful real synthesis

    // Content quality indicators
    if (content.length > 1000) confidence += 0.05;
    if (content.length > 2000) confidence += 0.03;
    
    // Structure quality (headings, bullets, formatting)
    if (content.includes('**') || content.includes('##')) confidence += 0.04;
    if (content.includes('•') || content.includes('1.') || content.includes('-')) confidence += 0.03;
    
    // Number of source responses
    confidence += Math.min(responses.length * 0.01, 0.05);
    
    // Balanced analysis indicators
    const balanceWords = ['however', 'although', 'while', 'whereas', 'on the other hand'];
    const hasBalance = balanceWords.some(word => content.toLowerCase().includes(word));
    if (hasBalance) confidence += 0.02;
    
    // Actionable content indicators
    const actionWords = ['recommend', 'should', 'implement', 'consider', 'strategy'];
    const hasAction = actionWords.some(word => content.toLowerCase().includes(word));
    if (hasAction) confidence += 0.02;

    return Math.min(confidence, 0.96); // Cap at 96% for real synthesis
  }

  private calculateConfidence(content: string): number {
    let confidence = 0.85; // Base confidence for real Claude responses

    const wordCount = content.split(' ').length;
    if (wordCount > 100) confidence += 0.05;
    if (wordCount > 200) confidence += 0.05;

    // Claude tends to be well-structured
    if (content.includes('**') || content.includes('##')) confidence += 0.03;
    if (content.includes('•') || content.includes('-')) confidence += 0.02;

    return Math.max(75, Math.min(95, confidence * 100));
  }

  private getFallbackResponse(prompt: string, startTime: number, reason: string): AIResult {
    const responseTime = Date.now() - startTime;
    const content = `I apologize, but I'm currently unable to access the Claude API directly from the browser (${reason}). 

However, I can provide some insights about your query: "${prompt}"

This appears to be a thoughtful question that would benefit from careful analysis. Based on general principles, I would recommend considering multiple perspectives, evaluating both theoretical frameworks and practical applications, and examining current best practices in the field.

For full Claude API functionality, you might consider:
- Using a browser CORS extension
- Setting up a simple backend proxy
- Using a different deployment environment

Would you like me to provide more specific guidance despite these limitations?`;

    return {
      success: false,
      error: reason,
      data: {
        id: crypto.randomUUID(),
        platform: 'claude',
        content,
        confidence: 60,
        responseTime,
        wordCount: content.split(' ').length,
        loading: false,
        error: `Claude API unavailable: ${reason}`,
        timestamp: Date.now()
      }
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-api')) {
      // If no local API key but we might have Netlify Function, test that
      if (isNetlify || this.shouldUseNetlifyFunction()) {
        try {
          const testResult = await this.queryClaudeViaNetlify('Hello', Date.now());
          return testResult.success;
        } catch {
          return false;
        }
      }
      return false;
    }

    try {
      const response = await this.makeDirectClaudeAPICall('Hello');
      return !!response;
    } catch {
      return false;
    }
  }
}

export const realClaudeService = new RealClaudeService();