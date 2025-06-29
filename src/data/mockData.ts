import { AIResponse, DemoPrompt, AnalysisData, FusionResult } from '../types';

export const demoPrompts: DemoPrompt[] = [
  {
    id: '1',
    text: 'Explain quantum computing\'s impact on cybersecurity',
    category: 'Technical Analysis',
    description: 'Explores complex technical concepts with security implications'
  },
  {
    id: '2', 
    text: 'Design a sustainable city for 100 million people in 2050',
    category: 'Creative Problem Solving',
    description: 'Combines creativity with practical urban planning'
  },
  {
    id: '3',
    text: 'Should artificial intelligence have legal rights and responsibilities?',
    category: 'Ethical Reasoning',
    description: 'Philosophical question about AI ethics and law'
  },
  {
    id: '4',
    text: 'Analyze the economic implications of universal basic income',
    category: 'Economic Analysis', 
    description: 'Complex economic policy analysis with multiple perspectives'
  },
  {
    id: '5',
    text: 'Compare renewable energy strategies: solar vs wind vs nuclear',
    category: 'Comparative Analysis',
    description: 'Multi-faceted comparison of energy technologies'
  }
];

// Helper function to extract keywords from text content
function extractKeywords(text: string): string[] {
  // Remove common stop words and extract meaningful keywords
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .reduce((acc: string[], word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, [])
    .slice(0, 20); // Top 20 keywords
}

// Helper function to analyze sentiment from text
function analyzeSentiment(text: string): { positive: number; neutral: number; negative: number } {
  const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial', 'effective', 'successful', 'promising', 'innovative', 'optimal', 'strong', 'robust', 'reliable', 'efficient', 'valuable', 'important', 'significant', 'potential', 'opportunities', 'advantages', 'benefits', 'progress', 'development', 'growth', 'improvement'];
  const negativeWords = ['bad', 'poor', 'negative', 'problematic', 'challenges', 'issues', 'concerns', 'risks', 'limitations', 'constraints', 'difficulties', 'problems', 'barriers', 'obstacles', 'threats', 'vulnerabilities', 'weaknesses', 'failures', 'errors', 'conflicts', 'contradictions'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  
  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
    if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
  });
  
  const total = Math.max(words.length / 10, 1); // Normalize by text length
  const positive = Math.min((positiveCount / total) * 100, 100);
  const negative = Math.min((negativeCount / total) * 100, 100);
  const neutral = Math.max(100 - positive - negative, 0);
  
  return { positive, neutral, negative };
}

// Function to generate dynamic analysis data based on actual AI responses
export const generateMockAnalysisData = (responses: AIResponse[] = []): AnalysisData => {
  if (responses.length === 0) {
    // Fallback to static data if no responses provided
    return {
      sentiment: [
        { platform: 'Grok', positive: 45, neutral: 45, negative: 10 },
        { platform: 'Claude', positive: 40, neutral: 50, negative: 10 },
        { platform: 'Gemini', positive: 35, neutral: 55, negative: 10 }
      ],
      keywords: [
        { word: 'analysis', grok: 8, claude: 10, gemini: 12 },
        { word: 'approach', grok: 6, claude: 5, gemini: 8 },
        { word: 'considerations', grok: 4, claude: 7, gemini: 6 },
        { word: 'framework', grok: 3, claude: 6, gemini: 8 },
        { word: 'implementation', grok: 2, claude: 4, gemini: 6 }
      ],
      metrics: [
        { platform: 'Grok', confidence: 85, responseTime: 2.1, wordCount: 180 },
        { platform: 'Claude', confidence: 92, responseTime: 3.2, wordCount: 250 },
        { platform: 'Gemini', confidence: 88, responseTime: 2.8, wordCount: 220 }
      ],
      efficiency: [
        { platform: 'Grok', conciseness: 85, redundancy: 15 },
        { platform: 'Claude', conciseness: 75, redundancy: 25 },
        { platform: 'Gemini', conciseness: 80, redundancy: 20 }
      ],
      risk: [
        { platform: 'Grok', hallucination: 25, contradictions: 15, hedging: 75 },
        { platform: 'Claude', hallucination: 15, contradictions: 10, hedging: 85 },
        { platform: 'Gemini', hallucination: 20, contradictions: 12, hedging: 80 }
      ],
      differentiation: [
        { platform: 'Grok', originality: 70, divergence: 65, contribution: 75 },
        { platform: 'Claude', originality: 80, divergence: 75, contribution: 85 },
        { platform: 'Gemini', originality: 85, divergence: 80, contribution: 80 }
      ]
    };
  }

  // Extract all keywords from all responses
  const allKeywords: Record<string, { grok: number; claude: number; gemini: number }> = {};
  const platformSentiment: Record<string, { positive: number; neutral: number; negative: number }> = {};
  
  responses.forEach(response => {
    // Extract keywords
    const keywords = extractKeywords(response.content);
    keywords.forEach(keyword => {
      if (!allKeywords[keyword]) {
        allKeywords[keyword] = { grok: 0, claude: 0, gemini: 0 };
      }
      allKeywords[keyword][response.platform]++;
    });
    
    // Analyze sentiment
    platformSentiment[response.platform] = analyzeSentiment(response.content);
  });

  // Sort keywords by total frequency and take top 5
  const topKeywords = Object.entries(allKeywords)
    .sort(([, a], [, b]) => (b.grok + b.claude + b.gemini) - (a.grok + a.claude + a.gemini))
    .slice(0, 5)
    .map(([word, counts]) => ({ word, ...counts }));

  // Calculate efficiency metrics based on content analysis
  const efficiencyMetrics = responses.map(response => {
    const sentences = response.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = response.wordCount / sentences.length;
    const conciseness = Math.max(10, Math.min(100, 100 - (avgSentenceLength - 15) * 2)); // Optimal around 15 words per sentence
    
    // Simple redundancy detection
    const words = response.content.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const redundancy = Math.max(0, Math.min(50, (1 - uniqueWords.size / words.length) * 200));
    
    return {
      platform: response.platform.charAt(0).toUpperCase() + response.platform.slice(1),
      conciseness: Math.round(conciseness),
      redundancy: Math.round(redundancy)
    };
  });

  // Calculate risk metrics based on content analysis
  const riskMetrics = responses.map(response => {
    const text = response.content.toLowerCase();
    
    // Detect hedging language (uncertainty indicators)
    const hedgingWords = ['might', 'could', 'may', 'perhaps', 'possibly', 'likely', 'probably', 'generally', 'typically', 'often', 'usually', 'tend to'];
    const hedgingCount = hedgingWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const hedging = Math.min(100, Math.max(50, 90 - hedgingCount * 5)); // Higher hedging = lower risk
    
    // Detect potential contradictions (contrasting statements)
    const contradictionWords = ['however', 'but', 'although', 'despite', 'nevertheless', 'on the other hand', 'conversely'];
    const contradictionCount = contradictionWords.reduce((count, word) => count + (text.split(word).length - 1), 0);
    const contradictions = Math.min(50, contradictionCount * 8);
    
    // Estimate hallucination risk (lower for structured responses with citations/evidence)
    const structureIndicators = ['**', '•', '-', '1.', '2.', '3.', 'research', 'study', 'evidence', 'data'];
    const structureCount = structureIndicators.reduce((count, indicator) => count + (text.split(indicator).length - 1), 0);
    const hallucination = Math.max(5, Math.min(40, 35 - structureCount * 2));
    
    return {
      platform: response.platform.charAt(0).toUpperCase() + response.platform.slice(1),
      hallucination: Math.round(hallucination),
      contradictions: Math.round(contradictions),
      hedging: Math.round(hedging)
    };
  });

  // Calculate differentiation metrics
  const differentiationMetrics = responses.map(response => {
    const text = response.content;
    
    // Originality based on unique concepts/approaches
    const originalityIndicators = ['innovative', 'novel', 'unique', 'creative', 'alternative', 'unconventional', 'breakthrough'];
    const originalityScore = originalityIndicators.reduce((score, word) => 
      score + (text.toLowerCase().includes(word) ? 10 : 0), 60);
    
    // Divergence from common approaches
    const divergenceIndicators = ['different', 'alternative', 'contrary', 'opposite', 'unconventional', 'unique perspective'];
    const divergenceScore = divergenceIndicators.reduce((score, phrase) => 
      score + (text.toLowerCase().includes(phrase) ? 8 : 0), 55);
    
    // Contribution value
    const contributionIndicators = ['insight', 'perspective', 'analysis', 'framework', 'solution', 'recommendation'];
    const contributionScore = contributionIndicators.reduce((score, word) => 
      score + (text.toLowerCase().includes(word) ? 5 : 0), 65);
    
    return {
      platform: response.platform.charAt(0).toUpperCase() + response.platform.slice(1),
      originality: Math.min(100, originalityScore),
      divergence: Math.min(100, divergenceScore),
      contribution: Math.min(100, contributionScore)
    };
  });

  return {
    sentiment: responses.map(response => ({
      platform: response.platform.charAt(0).toUpperCase() + response.platform.slice(1),
      ...platformSentiment[response.platform]
    })),
    keywords: topKeywords,
    metrics: responses.map(response => ({
      platform: response.platform.charAt(0).toUpperCase() + response.platform.slice(1),
      confidence: Math.round(response.confidence * 100),
      responseTime: response.responseTime,
      wordCount: response.wordCount
    })),
    efficiency: efficiencyMetrics,
    risk: riskMetrics,
    differentiation: differentiationMetrics
  };
};

// Function to generate dynamic fusion result based on actual AI responses
export const generateMockFusionResult = (responses: AIResponse[] = []): FusionResult => {
  if (responses.length === 0) {
    // Fallback fusion result
    return {
      content: `**Comprehensive Analysis**

This synthesis represents a thoughtful examination of the available information and perspectives.

**Key Insights:**
• Multiple approaches and methodologies offer different advantages
• Implementation requires careful consideration of various factors
• Current trends suggest evolving best practices
• Balanced perspective considers both opportunities and constraints

**Strategic Recommendations:**
1. Comprehensive assessment of current capabilities and requirements
2. Phased implementation with continuous monitoring and adjustment
3. Cross-functional collaboration and stakeholder engagement
4. Adaptive approach that responds to changing conditions

The complexity of this domain requires nuanced thinking and careful planning to achieve optimal results.`,
      confidence: 0.85,
      sources: { grok: 30, claude: 35, gemini: 35 },
      keyInsights: [
        'Multiple perspectives provide comprehensive understanding',
        'Implementation requires systematic approach',
        'Continuous adaptation is essential for success',
        'Stakeholder engagement drives better outcomes'
      ]
    };
  }

  // Calculate average confidence
  const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;
  
  // Calculate source contributions based on word count and confidence
  const totalWeight = responses.reduce((sum, r) => sum + (r.wordCount * r.confidence), 0);
  const sources = {
    grok: 0,
    claude: 0,
    gemini: 0
  };
  
  responses.forEach(response => {
    const weight = (response.wordCount * response.confidence) / totalWeight * 100;
    sources[response.platform] = Math.round(weight);
  });

  // Ensure sources add up to 100
  const total = sources.grok + sources.claude + sources.gemini;
  if (total !== 100) {
    const diff = 100 - total;
    const maxPlatform = Object.keys(sources).reduce((a, b) => sources[a as keyof typeof sources] > sources[b as keyof typeof sources] ? a : b) as keyof typeof sources;
    sources[maxPlatform] += diff;
  }

  // Extract key insights from all responses
  const insights: string[] = [];
  
  responses.forEach(response => {
    const sentences = response.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Look for sentences that start with key insight indicators
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (trimmed.length > 50 && trimmed.length < 150) {
        const insightIndicators = ['key', 'important', 'critical', 'essential', 'fundamental', 'primary', 'main', 'central'];
        const hasInsightIndicator = insightIndicators.some(indicator => trimmed.toLowerCase().includes(indicator));
        
        if (hasInsightIndicator && insights.length < 6) {
          // Clean up the sentence
          const cleanSentence = trimmed
            .replace(/^[•\-\*\d\.]\s*/, '') // Remove bullet points
            .replace(/^\*\*.*?\*\*:?\s*/, '') // Remove bold headings
            .trim();
          
          if (cleanSentence.length > 30 && !insights.some(existing => existing.toLowerCase() === cleanSentence.toLowerCase())) {
            insights.push(cleanSentence);
          }
        }
      }
    });
  });

  // If we don't have enough insights, add some general ones based on content
  if (insights.length < 4) {
    const fallbackInsights = [
      'Multiple approaches provide valuable perspectives on this topic',
      'Implementation requires careful consideration of various factors',
      'Current evidence suggests evolving best practices in this field',
      'Balanced analysis considers both opportunities and constraints'
    ];
    
    fallbackInsights.forEach(insight => {
      if (insights.length < 4 && !insights.includes(insight)) {
        insights.push(insight);
      }
    });
  }

  // Create synthesized content by combining key elements from all responses
  const synthesis = responses.length > 0 ? 
    `**Comprehensive Synthesis**

Based on analysis from ${responses.length} AI platform${responses.length > 1 ? 's' : ''}, this synthesis combines the most valuable insights and perspectives:

**Integrated Analysis:**
${responses.map(r => {
  const firstParagraph = r.content.split('\n\n')[0] || r.content.substring(0, 200);
  return `• **${r.platform.charAt(0).toUpperCase() + r.platform.slice(1)} perspective**: ${firstParagraph.replace(/^\*\*.*?\*\*:?\s*/, '').trim()}`;
}).join('\n')}

**Synthesized Recommendations:**
1. Adopt a multi-perspective approach that leverages insights from different analytical frameworks
2. Implement solutions through iterative development with continuous feedback and adaptation
3. Balance theoretical understanding with practical implementation considerations
4. Maintain flexibility to respond to evolving requirements and emerging opportunities

**Conclusion:**
This synthesis represents a comprehensive examination that draws from multiple analytical approaches, providing a robust foundation for informed decision-making and strategic planning.` :
    generateMockFusionResult().content;

  return {
    content: synthesis,
    confidence: Math.min(0.95, Math.max(0.75, avgConfidence + 0.05)), // Slightly boost confidence for synthesis
    sources,
    keyInsights: insights.slice(0, 4)
  };
};