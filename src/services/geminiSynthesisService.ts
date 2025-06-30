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
    if (!this.apiKey || !this.apiKey.startsWith('AIza')) {
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

      // Call Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: synthesisPrompt
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

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini synthesis API error:', response.status, errorText);
        
        return {
          success: false,
          error: `Gemini synthesis API error: ${response.status}`
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

  async testConnection(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('AIza')) {
      return false;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Hello'
                }
              ]
            }
          ],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const geminiSynthesisService = new GeminiSynthesisService();