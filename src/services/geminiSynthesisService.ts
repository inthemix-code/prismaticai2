import { AIResponse } from '../types';
import { createSynthesisPrompt, calculateSynthesisConfidence } from '../utils/aiSynthesisUtils';

interface SynthesisResult {
  success: boolean;
  data?: {
    content: string;
    confidence: number;
  };
  error?: string;
}

class GeminiSynthesisService {
  private readonly apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  private readonly debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  async synthesizeResponses(originalPrompt: string, responses: AIResponse[]): Promise<SynthesisResult> {
    if (!this.apiKey || (!this.apiKey.startsWith('AIzaSy') && !this.apiKey.startsWith('AIza')) || this.apiKey.includes('your-gemini-key-here')) {
      console.log('⚠️ Gemini API key not available for synthesis');
      return {
        success: false,
        error: 'Gemini API key not available'
      };
    }

    try {
      console.log('🔷 Starting Gemini-powered synthesis...');
      
      // Create synthesis prompt
      const synthesisPrompt = createSynthesisPrompt(originalPrompt, responses);
      
      if (this.debugMode) {
        console.log('📝 Gemini synthesis prompt created:', synthesisPrompt.substring(0, 200) + '...');
      }

      const startTime = Date.now();

      // Try Gemini 1.5 Flash first
      let response = await this.callGeminiAPI('gemini-1.5-flash', synthesisPrompt);
      
      // If Flash fails, try Pro model
      if (!response || !response.ok) {
        console.log('🔄 Gemini Flash failed, trying Pro model...');
        response = await this.callGeminiAPI('gemini-1.5-pro', synthesisPrompt);
      }

      const responseTime = Date.now() - startTime;

      if (!response || !response.ok) {
        const errorText = response ? await response.text() : 'No response';
        console.error('❌ Gemini synthesis API error:', response?.status, errorText);
        
        return {
          success: false,
          error: `Gemini synthesis API error: ${response?.status || 'No response'}`
        };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No synthesis available';

      console.log('✅ Gemini synthesis successful:', {
        responseTime: `${responseTime}ms`,
        contentLength: content.length,
        wordCount: content.split(' ').length
      });

      // Calculate confidence based on synthesis quality
      const confidence = calculateSynthesisConfidence(content, responses);

      return {
        success: true,
        data: {
          content,
          confidence
        }
      };
    } catch (error) {
      console.error('❌ Error during Gemini synthesis:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown synthesis error'
      };
    }
  }

  private async callGeminiAPI(model: string, prompt: string): Promise<Response | null> {
    try {
      return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
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
            maxOutputTokens: 2000,
            temperature: 0.7
          }
        })
      });
    } catch (error) {
      console.error(`❌ Error calling Gemini ${model}:`, error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || (!this.apiKey.startsWith('AIzaSy') && !this.apiKey.startsWith('AIza')) || this.apiKey.includes('your-gemini-key-here')) {
      return false;
    }

    try {
      const response = await this.callGeminiAPI('gemini-1.5-flash', 'Hello');
      return response?.ok || false;
    } catch {
      return false;
    }
  }
}

export const geminiSynthesisService = new GeminiSynthesisService();