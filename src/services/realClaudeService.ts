import { AIResponse, AIResult } from '../types';

interface ClaudeResponse {
  content: Array<{ text: string }>;
}

class RealClaudeService {
  private apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
  private debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  hasKey(): boolean {
    return !!(this.apiKey && 
      this.apiKey.startsWith('sk-ant-api') && 
      !this.apiKey.includes('your-claude-key-here') && 
      !this.apiKey.includes('sk-ant-your-claude-key-here') &&
      this.apiKey.length > 20);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.hasKey()) {
      return { success: false, error: 'No valid API key found' };
    }

    try {
      const result = await this.queryClaude('Test connection');
      return { success: result.success };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async queryClaude(prompt: string): Promise<AIResult> {
    const startTime = Date.now();

    if (!this.hasKey()) {
      const error = 'Claude API key not provided or invalid. Add VITE_CLAUDE_API_KEY to your .env file';
      return {
        success: false,
        error,
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content: '',
          confidence: 0,
          responseTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          loading: false,
          error,
          timestamp: Date.now()
        }
      };
    }

    if (this.debugMode) {
      console.log('🤖 Calling real Claude API...');
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
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API Error:', response.status, errorText);
        
        let errorMessage = `Claude API error: ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'Invalid Claude API key. Please check your VITE_CLAUDE_API_KEY in .env file';
        } else if (response.status === 403) {
          errorMessage = 'Claude API access forbidden. Check your API key permissions';
        } else if (response.status === 429) {
          errorMessage = 'Claude API rate limit exceeded. Please try again later';
        }

        return {
          success: false,
          error: errorMessage,
          data: {
            id: crypto.randomUUID(),
            platform: 'claude',
            content: '',
            confidence: 0,
            responseTime: (Date.now() - startTime) / 1000,
            wordCount: 0,
            loading: false,
            error: errorMessage,
            timestamp: Date.now()
          }
        };
      }

      const data: ClaudeResponse = await response.json();
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
        success: true,
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content,
          confidence: 0.92,
          responseTime: responseTime / 1000,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Claude API Error:', error);
      
      let errorMessage = 'Failed to connect to Claude API';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Failed to connect to Claude API. This could be due to network issues or CORS restrictions';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content: '',
          confidence: 0,
          responseTime: (Date.now() - startTime) / 1000,
          wordCount: 0,
          loading: false,
          error: errorMessage,
          timestamp: Date.now()
        }
      };
    }
  }

  async synthesizeResponses(originalPrompt: string, responses: AIResponse[]): Promise<AIResult> {
    if (!this.hasKey()) {
      return {
        success: false,
        error: 'Claude API key not available for synthesis',
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content: '',
          confidence: 0,
          responseTime: 0,
          wordCount: 0,
          loading: false,
          error: 'No API key',
          timestamp: Date.now()
        }
      };
    }

    const synthesisPrompt = `
Please synthesize and analyze the following AI responses to the query: "${originalPrompt}"

${responses.map((response, index) => `
Response ${index + 1} from ${response.platform.toUpperCase()}:
${response.content}
`).join('\n')}

Please provide a comprehensive synthesis that:
1. Identifies key themes and agreements across responses
2. Highlights important differences in perspective or approach
3. Synthesizes the information into a coherent, well-structured analysis
4. Provides actionable insights and recommendations

Focus on creating a unified perspective that draws from the strengths of each response while noting any contradictions or limitations.
`;

    try {
      const result = await this.queryClaude(synthesisPrompt);
      
      if (result.success && result.data) {
        // Enhance the confidence score for synthesis
        result.data.confidence = Math.min(0.95, result.data.confidence + 0.05);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Synthesis failed',
        data: {
          id: crypto.randomUUID(),
          platform: 'claude',
          content: '',
          confidence: 0,
          responseTime: 0,
          wordCount: 0,
          loading: false,
          error: 'Synthesis failed',
          timestamp: Date.now()
        }
      };
    }
  }
}

// Export the service instance
export const realClaudeService = new RealClaudeService();