import { AIResponse } from '../types';

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

  async synthesizeResponses(originalPrompt: string, responses: AIResponse[]): Promise<SynthesisResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Claude API key not available'
      };
    }

    if (!this.apiKey.startsWith('sk-ant-api')) {
      return {
        success: false,
        error: 'Invalid Claude API key format'
      };
    }

    try {
      // Create a synthesis prompt based on the original query and AI responses
      const synthesisPrompt = this.createSynthesisPrompt(originalPrompt, responses);
      
      if (this.debugMode) {
        console.log('🧠 Synthesizing responses with Claude...');
      }

      const startTime = Date.now();
      
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
          messages: [{ role: 'user', content: synthesisPrompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude Synthesis API Error:', response.status, errorText);
        
        return {
          success: false,
          error: `Claude API error: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      const content = data.content[0]?.text || 'No synthesis available';

      if (this.debugMode) {
        console.log('✅ Claude synthesis completed:', {
          responseTime: `${responseTime}ms`,
          contentLength: content.length
        });
      }

      // Calculate confidence based on response quality indicators
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

  private createSynthesisPrompt(originalPrompt: string, responses: AIResponse[]): string {
    const responseTexts = responses
      .filter(r => !r.error)
      .map(r => `**${r.platform.toUpperCase()}:**\n${r.content}`)
      .join('\n\n---\n\n');

    return `You are an expert AI analyst tasked with synthesizing multiple AI responses into a single, coherent, and comprehensive answer.

**Original Question:** ${originalPrompt}

**AI Responses to Synthesize:**
${responseTexts}

**Instructions:**
1. Create a unified response that combines the best insights from all AI responses
2. Resolve any contradictions by providing balanced perspectives
3. Maintain accuracy while improving clarity and coherence
4. Structure the response with clear headings and bullet points
5. Highlight key insights and actionable recommendations
6. Ensure the synthesis is more valuable than any individual response

**Synthesized Response:**`;
  }

  private calculateSynthesisConfidence(content: string, responses: AIResponse[]): number {
    let confidence = 0.75; // Base confidence for successful synthesis
    
    // Boost confidence for longer, more detailed responses
    if (content.length > 1000) confidence += 0.05;
    if (content.length > 2000) confidence += 0.05;
    
    // Boost confidence for structured content (headings, bullets)
    if (content.includes('**') || content.includes('•') || content.includes('1.')) {
      confidence += 0.05;
    }
    
    // Boost confidence based on number of source responses
    confidence += Math.min(responses.length * 0.02, 0.08);
    
    // Boost confidence for balanced responses (mentions multiple perspectives)
    if (content.toLowerCase().includes('however') || 
        content.toLowerCase().includes('on the other hand') ||
        content.toLowerCase().includes('alternatively')) {
      confidence += 0.03;
    }
    
    return Math.min(confidence, 0.98); // Cap at 98%
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('sk-ant-api')) {
      return false;
    }

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
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Claude connection test failed:', error);
      return false;
    }
  }
}

export const realClaudeService = new RealClaudeService();