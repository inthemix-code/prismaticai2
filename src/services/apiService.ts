import { aiService } from './aiService';
import { generateMockAnalysisData, generateMockFusionResult } from '../data/mockData';
import { AIResponse, AnalysisData, FusionResult } from '../types';

interface ApiKeyStatus {
  claude: boolean;
  grok: boolean;
  gemini: boolean;
}

class ApiService {
  private mockMode: boolean = false;

  constructor() {
    // Check if we should use mock mode based on environment or available keys
    this.mockMode = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || 
                   localStorage.getItem('useMockData') === 'true' ||
                   !this.hasValidKeys();
    
    // Initialize localStorage if not set
    if (localStorage.getItem('useMockData') === null) {
      localStorage.setItem('useMockData', this.mockMode.toString());
    }
  }

  async queryAllModels(
    prompt: string, 
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<AIResponse[]> {
    console.log('ApiService.queryAllModels called with:', { prompt, selectedModels, mockMode: this.mockMode });

    if (this.mockMode) {
      return this.getMockResponses(prompt, selectedModels);
    }

    try {
      const results = await aiService.queryMultiple(prompt, selectedModels);
      
      return results.map(result => ({
        id: result.data.id,
        platform: result.data.platform,
        content: result.data.content,
        confidence: result.data.confidence,
        responseTime: result.data.responseTime,
        wordCount: result.data.wordCount,
        loading: false,
        error: result.success ? undefined : result.error || 'Unknown error',
        timestamp: result.data.timestamp
      }));
    } catch (error) {
      console.error('Error querying AI services:', error);
      // Fallback to mock data if real APIs fail
      return this.getMockResponses(prompt, selectedModels);
    }
  }

  private async getMockResponses(
    prompt: string, 
    selectedModels: { claude: boolean; grok: boolean; gemini: boolean }
  ): Promise<AIResponse[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses: AIResponse[] = [];

    if (selectedModels.grok) {
      responses.push({
        id: crypto.randomUUID(),
        platform: 'grok',
        content: `**Grok's Analysis:** ${prompt}

This is a fascinating question that touches on multiple complex domains. Let me break this down systematically:

**Key Considerations:**
• The technical implications are significant and multifaceted
• Current industry trends suggest rapid evolution in this space
• Implementation challenges need careful consideration

**Analysis:**
Based on current research and industry developments, several factors emerge as critical. The convergence of emerging technologies creates both opportunities and challenges that organizations must navigate carefully.

**Recommendations:**
1. Immediate action items focus on foundational preparation
2. Medium-term strategies should emphasize adaptability
3. Long-term planning requires scenario-based approaches

This analysis represents current understanding, but the landscape continues evolving rapidly.`,
        confidence: (Math.floor(Math.random() * 15) + 80) / 100,
        responseTime: (Math.random() * 2000 + 1500) / 1000,
        wordCount: 142,
        loading: false,
        timestamp: Date.now()
      });
    }

    if (selectedModels.claude) {
      responses.push({
        id: crypto.randomUUID(),
        platform: 'claude',
        content: `**Claude's Comprehensive Response:** ${prompt}

I'll provide a thorough analysis of this important topic, considering multiple perspectives and implications.

**Framework for Understanding:**
This question intersects several critical domains that require careful examination. Let me structure my response to address the key dimensions systematically.

**Core Analysis:**
The fundamental principles underlying this area suggest that successful approaches must balance theoretical understanding with practical implementation considerations. Current research indicates several promising directions, though each comes with distinct trade-offs.

**Evidence-Based Insights:**
Recent developments in the field point toward emerging consensus around best practices, while also highlighting areas where significant uncertainty remains. The interdisciplinary nature of this topic requires drawing from multiple knowledge domains.

**Strategic Implications:**
For organizations and individuals navigating this landscape, several key considerations emerge:

• Risk assessment and mitigation strategies
• Resource allocation and timing decisions  
• Stakeholder alignment and communication approaches
• Monitoring and adaptation mechanisms

**Conclusion:**
While this remains an evolving area with ongoing developments, the foundation for informed decision-making exists through careful analysis of available evidence and thoughtful consideration of multiple scenarios.`,
        confidence: (Math.floor(Math.random() * 10) + 88) / 100,
        responseTime: (Math.random() * 2000 + 2500) / 1000,
        wordCount: 187,
        loading: false,
        timestamp: Date.now()
      });
    }

    if (selectedModels.gemini) {
      responses.push({
        id: crypto.randomUUID(),
        platform: 'gemini',
        content: `**Gemini's Perspective:** ${prompt}

This question presents an excellent opportunity to explore the intersection of theory and practice in this dynamic field.

**Multi-Dimensional Analysis:**

*Technical Perspective:*
The underlying technical architecture suggests several viable approaches, each with distinct advantages and limitations. Current implementations demonstrate varying degrees of success across different contexts.

*Strategic Considerations:*
From a strategic standpoint, the key factors include scalability, maintainability, and adaptability to changing requirements. Organizations must balance immediate needs with long-term vision.

*Innovation Opportunities:*
Emerging trends point toward novel approaches that could significantly impact current paradigms. The convergence of different technologies creates new possibilities for innovation.

**Practical Implementation:**
Successful implementation typically requires:
- Comprehensive planning and stakeholder engagement
- Iterative development with continuous feedback loops
- Risk management and contingency planning
- Performance monitoring and optimization

**Future Outlook:**
The trajectory of development in this area suggests continued evolution and refinement. Organizations that maintain flexibility while building solid foundations are likely to achieve the best outcomes.

**Summary:**
This analysis reveals both challenges and opportunities, requiring nuanced approaches that consider multiple factors and stakeholder perspectives.`,
        confidence: (Math.floor(Math.random() * 12) + 85) / 100,
        responseTime: (Math.random() * 2000 + 2000) / 1000,
        wordCount: 203,
        loading: false,
        timestamp: Date.now()
      });
    }

    return responses;
  }

  async getAnalysisData(): Promise<AnalysisData> {
    // For now, always return mock analysis data as this requires complex NLP processing
    await new Promise(resolve => setTimeout(resolve, 500));
    return generateMockAnalysisData();
  }

  async getFusionResult(responses: AIResponse[]): Promise<FusionResult> {
    if (this.mockMode || !this.hasValidKeys()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockFusionResult();
    }

    // In a real implementation, you would use the responses to generate a fusion
    // For now, we'll return mock data but in future you could:
    // 1. Send all responses to another AI service for synthesis
    // 2. Use local NLP processing to combine responses
    // 3. Apply weighted algorithms based on confidence scores
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    return generateMockFusionResult();
  }

  getApiKeyStatus(): ApiKeyStatus {
    return aiService.getApiKeyStatus();
  }

  hasValidKeys(): boolean {
    return aiService.hasValidKeys();
  }

  isMockMode(): boolean {
    return this.mockMode;
  }

  toggleMockMode(): void {
    this.mockMode = !this.mockMode;
    localStorage.setItem('useMockData', this.mockMode.toString());
    console.log('Mock mode toggled:', this.mockMode);
  }

  // Force mock mode for testing
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
    localStorage.setItem('useMockData', enabled.toString());
  }
}

export const apiService = new ApiService();