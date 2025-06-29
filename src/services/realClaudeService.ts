// src/services/realClaudeService.ts - Real Claude API via CORS proxy
import { AIResponse, AIResult } from '../types';

class RealClaudeService {
  private corsProxies = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
  ];
  
  private claudeApiUrl = 'https://api.anthropic.com/v1/messages';
  private workingProxy: string | null = null;

  async queryClaude(prompt: string): Promise<AIResult> {
    const startTime = Date.now();
    
    if (!import.meta.env.VITE_CLAUDE_API_KEY) {
      return this.getFallbackResponse(prompt, startTime, 'No Claude API key configured');
    }

    // Try to get real Claude response
    const claudeResult = await this.makeClaudeRequest(prompt, startTime);
    return claudeResult;
  }

  async analyzeAllResponses(originalPrompt: string, allResponses: AIResponse[]): Promise<AIResult> {
    const startTime = Date.now();
    
    if (!import.meta.env.VITE_CLAUDE_API_KEY) {
      return this.getFallbackAnalysis(originalPrompt, allResponses, startTime);
    }

    // Create analysis prompt
    const analysisPrompt = `Please analyze these AI responses (including my own previous response) to the prompt: "${originalPrompt}"

Here are ALL the responses including mine:

${allResponses.map((response, index) => `
**${response.platform.toUpperCase()} Response:**
${response.content}

**Metadata:**
- Confidence: ${response.confidence}%
- Response Time: ${response.responseTime}ms
- Word Count: ${response.wordCount}
${response.platform === 'claude' ? '(This is my own previous response)' : ''}
`).join('\n---\n')}

Please provide a comprehensive meta-analysis including:

1. **Self-Assessment**: How does my own Claude response compare to the others? What are its strengths and weaknesses?

2. **Comparative Analysis**: How do all responses differ in approach, depth, and quality?

3. **Response Quality**: Which responses are most accurate, helpful, and well-structured?

4. **Style Differences**: How do the different AI communication styles compare?

5. **Gap Analysis**: What important aspects are missing across all responses?

6. **Synthesis**: How could the best elements be combined for an optimal answer?

7. **Meta-Commentary**: What does this reveal about different AI approaches to this type of question?

Be honest and critical about my own response's limitations.`;

    const analysisResult = await this.makeClaudeRequest(analysisPrompt, startTime);
    return analysisResult;
  }

  private async makeClaudeRequest(prompt: string, startTime: number): Promise<AIResult> {
    // Try each proxy until one works
    for (const proxy of this.corsProxies) {
      try {
        console.log(`🌐 Trying Claude API via proxy: ${proxy}`);
        
        const url = proxy + encodeURIComponent(this.claudeApiUrl);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': import.meta.env.VITE_CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 2000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content[0]?.text || '';
          const responseTime = Date.now() - startTime;

          console.log('✅ Real Claude API success via proxy:', proxy);
          this.workingProxy = proxy; // Remember working proxy

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
        } else {
          console.warn(`❌ Proxy ${proxy} failed:`, response.status);
          continue;
        }
      } catch (error) {
        console.warn(`❌ Proxy ${proxy} error:`, error);
        continue;
      }
    }

    // All proxies failed, return fallback
    console.error('❌ All CORS proxies failed, using fallback');
    return this.getFallbackResponse(prompt, startTime, 'All CORS proxies failed');
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
        confidence: 0.60,
        responseTime: responseTime / 1000,
        wordCount: content.split(' ').length,
        loading: false,
        error: `Claude API unavailable: ${reason}`,
        timestamp: Date.now()
      }
    };
  }

  private getFallbackAnalysis(originalPrompt: string, allResponses: AIResponse[], startTime: number): AIResult {
    const responseTime = Date.now() - startTime;
    const content = `**Analysis of AI Responses** (Limited - Claude API unavailable)

**Original Prompt:** "${originalPrompt}"

**Response Summary:**
I can see ${allResponses.length} responses from different AI platforms:

${allResponses.map(response => `
**${response.platform.toUpperCase()}:** ${response.wordCount} words, ${Math.round(response.confidence * 100)}% confidence
- Approach: ${response.platform === 'gemini' ? 'Technical and research-focused' : response.platform === 'grok' ? 'Practical and direct' : 'Structured analysis'}
- Response time: ${response.responseTime.toFixed(1)}s
`).join('\n')}

**Limited Analysis:**
Without full Claude API access, I can observe that each platform brings different strengths. For a complete comparative analysis including self-assessment, please enable Claude API access via CORS proxy or browser extension.

**Recommendation:** Enable real Claude API integration for comprehensive analysis capabilities.`;

    return {
      success: false,
      error: 'Claude API unavailable for analysis',
      data: {
        id: crypto.randomUUID(),
        platform: 'claude',
        content,
        confidence: 0.40,
        responseTime: responseTime / 1000,
        wordCount: content.split(' ').length,
        loading: false,
        error: 'Claude API unavailable for analysis',
        timestamp: Date.now()
      }
    };
  }

  private calculateConfidence(content: string): number {
    let confidence = 85; // Base confidence for real Claude responses

    const wordCount = content.split(' ').length;
    if (wordCount > 100) confidence += 5;
    if (wordCount > 200) confidence += 5;

    // Claude tends to be well-structured
    if (content.includes('**') || content.includes('##')) confidence += 3;
    if (content.includes('•') || content.includes('-')) confidence += 2;

    return Math.max(75, Math.min(95, confidence));
  }

  async testConnection(): Promise<boolean> {
    try {
      const testResult = await this.makeClaudeRequest('Test connection', Date.now());
      return testResult.success;
    } catch {
      return false;
    }
  }
}

export const realClaudeService = new RealClaudeService();