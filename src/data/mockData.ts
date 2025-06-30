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
    text: 'Should AI have feelings?',
    category: 'Ethical Reasoning',
    description: 'Exploring AI consciousness and emotional capacity'
  },
  {
    id: '4',
    text: 'What if money grew on trees?',
    category: 'Economic Analysis', 
    description: 'Playful exploration of economics and resource scarcity'
  },
  {
    id: '5',
    text: 'Cats vs. dogs: which is better?',
    category: 'Comparative Analysis',
    description: 'The age-old debate with scientific reasoning'
  }
];

// Function to generate unique analysis data for each conversation
export const generateMockAnalysisData = (responses?: AIResponse[]): AnalysisData => {
  // Generate analytics based on actual responses if provided
  if (responses && responses.length > 0) {
    return generateDynamicAnalysisData(responses);
  }
  
  // Fallback to random mock data
  return generateRandomAnalysisData();
};

// Generate analytics based on actual AI response data
function generateDynamicAnalysisData(responses: AIResponse[]): AnalysisData {
  // Create platform-specific data from actual responses
  const platformData = responses.reduce((acc, response) => {
    acc[response.platform] = response;
    return acc;
  }, {} as Record<string, AIResponse>);

  // Calculate sentiment based on content analysis
  const sentiment = responses.map(response => {
    const content = response.content.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['excellent', 'great', 'good', 'effective', 'successful', 'innovative', 'promising', 'beneficial', 'optimal', 'advanced'];
    const negativeWords = ['poor', 'bad', 'ineffective', 'failed', 'problematic', 'challenging', 'difficult', 'risk', 'threat', 'concern'];
    const neutralWords = ['however', 'although', 'consider', 'analysis', 'framework', 'approach', 'method', 'system', 'process'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    const neutralCount = neutralWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    
    const total = Math.max(1, positiveCount + negativeCount + neutralCount);
    
    return {
      platform: response.platform,
      positive: Math.round((positiveCount / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      negative: Math.round((negativeCount / total) * 100)
    };
  });

  // Extract keywords from all responses
  const allText = responses.map(r => r.content).join(' ').toLowerCase();
  const words = allText.match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq = words.reduce((freq, word) => {
    freq[word] = (freq[word] || 0) + 1;
    return freq;
  }, {} as Record<string, number>);
  
  // Get top keywords and their frequency per platform
  const topWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
  
  const keywords = topWords.map(word => {
    const platformCounts = {
      grok: (platformData.grok?.content.toLowerCase().match(new RegExp(word, 'g')) || []).length,
      claude: (platformData.claude?.content.toLowerCase().match(new RegExp(word, 'g')) || []).length,
      gemini: (platformData.gemini?.content.toLowerCase().match(new RegExp(word, 'g')) || []).length
    };
    
    return {
      word,
      ...platformCounts
    };
  });

  // Use actual response metrics
  const metrics = responses.map(response => ({
    platform: response.platform,
    confidence: Math.round(response.confidence > 1 ? response.confidence : response.confidence * 100),
    responseTime: response.responseTime,
    wordCount: response.wordCount
  }));

  // Calculate efficiency metrics
  const efficiency = responses.map(response => {
    const wordCount = response.wordCount;
    const avgWordsPerSentence = response.content.split(/[.!?]+/).filter(s => s.trim()).length;
    const conciseness = Math.max(0, Math.min(100, 100 - (wordCount / 10))); // Lower word count = higher conciseness
    const redundancy = Math.max(0, Math.min(50, avgWordsPerSentence > 0 ? (wordCount / avgWordsPerSentence) - 15 : 20));
    
    return {
      platform: response.platform,
      conciseness: Math.round(conciseness),
      redundancy: Math.round(redundancy)
    };
  });

  // Calculate risk metrics based on content analysis
  const risk = responses.map(response => {
    const content = response.content.toLowerCase();
    const hedgingWords = ['might', 'could', 'perhaps', 'possibly', 'may', 'seems', 'appears', 'likely'];
    const uncertainWords = ['uncertain', 'unclear', 'unknown', 'unsure', 'ambiguous'];
    const contradictionWords = ['however', 'but', 'although', 'nevertheless', 'contrary'];
    
    const hedgingCount = hedgingWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    const uncertainCount = uncertainWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    const contradictionCount = contradictionWords.reduce((count, word) => count + (content.match(new RegExp(word, 'g')) || []).length, 0);
    
    return {
      platform: response.platform,
      hallucination: Math.min(50, uncertainCount * 5), // Lower is better
      contradictions: Math.min(30, contradictionCount * 3), // Lower is better
      hedging: Math.min(100, 100 - (hedgingCount * 5)) // Higher confidence/less hedging is better
    };
  });

  // Calculate differentiation metrics
  const differentiation = responses.map((response, index) => {
    const otherResponses = responses.filter((_, i) => i !== index);
    const responseWords = new Set(response.content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []);
    const otherWords = new Set(otherResponses.flatMap(r => r.content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []));
    
    const uniqueWords = [...responseWords].filter(word => !otherWords.has(word)).length;
    const totalWords = responseWords.size;
    const originality = totalWords > 0 ? Math.round((uniqueWords / totalWords) * 100) : 50;
    
    // Simple metrics for divergence and contribution
    const divergence = Math.min(100, originality + Math.random() * 20);
    const contribution = Math.min(100, response.wordCount / 5 + originality / 2);
    
    return {
      platform: response.platform,
      originality: Math.round(originality),
      divergence: Math.round(divergence),
      contribution: Math.round(contribution)
    };
  });

  return {
    sentiment,
    keywords,
    metrics,
    efficiency,
    risk,
    differentiation
  };
}

// Original random mock data generation (fallback)
function generateRandomAnalysisData(): AnalysisData {
  return {
  sentiment: [
    { platform: 'Grok', positive: Math.floor(Math.random() * 20) + 35, neutral: Math.floor(Math.random() * 20) + 35, negative: Math.floor(Math.random() * 20) + 10 },
    { platform: 'Claude', positive: Math.floor(Math.random() * 20) + 30, neutral: Math.floor(Math.random() * 20) + 40, negative: Math.floor(Math.random() * 15) + 5 },
    { platform: 'Gemini', positive: Math.floor(Math.random() * 20) + 25, neutral: Math.floor(Math.random() * 20) + 45, negative: Math.floor(Math.random() * 15) + 5 }
  ],
  keywords: [
    { word: 'quantum', grok: Math.floor(Math.random() * 10) + 8, claude: Math.floor(Math.random() * 10) + 10, gemini: Math.floor(Math.random() * 10) + 12 },
    { word: 'encryption', grok: Math.floor(Math.random() * 8) + 4, claude: Math.floor(Math.random() * 8) + 3, gemini: Math.floor(Math.random() * 8) + 8 },
    { word: 'security', grok: Math.floor(Math.random() * 8) + 6, claude: Math.floor(Math.random() * 8) + 4, gemini: Math.floor(Math.random() * 8) + 10 },
    { word: 'algorithms', grok: Math.floor(Math.random() * 6) + 2, claude: Math.floor(Math.random() * 6) + 6, gemini: Math.floor(Math.random() * 6) + 8 },
    { word: 'cryptography', grok: Math.floor(Math.random() * 5) + 2, claude: Math.floor(Math.random() * 5) + 4, gemini: Math.floor(Math.random() * 5) + 6 }
  ],
  metrics: [
    { platform: 'Grok', confidence: Math.floor(Math.random() * 15) + 80, responseTime: Math.random() * 2 + 1.5, wordCount: Math.floor(Math.random() * 50) + 150 },
    { platform: 'Claude', confidence: Math.floor(Math.random() * 15) + 85, responseTime: Math.random() * 2 + 2.5, wordCount: Math.floor(Math.random() * 50) + 200 },
    { platform: 'Gemini', confidence: Math.floor(Math.random() * 15) + 82, responseTime: Math.random() * 2 + 2.0, wordCount: Math.floor(Math.random() * 50) + 220 }
  ],
  efficiency: [
    { platform: 'Grok', conciseness: Math.floor(Math.random() * 20) + 75, redundancy: Math.floor(Math.random() * 15) + 10 },
    { platform: 'Claude', conciseness: Math.floor(Math.random() * 20) + 65, redundancy: Math.floor(Math.random() * 15) + 20 },
    { platform: 'Gemini', conciseness: Math.floor(Math.random() * 20) + 70, redundancy: Math.floor(Math.random() * 15) + 15 }
  ],
  risk: [
    { platform: 'Grok', hallucination: Math.floor(Math.random() * 15) + 20, contradictions: Math.floor(Math.random() * 10) + 15, hedging: Math.floor(Math.random() * 20) + 70 },
    { platform: 'Claude', hallucination: Math.floor(Math.random() * 10) + 10, contradictions: Math.floor(Math.random() * 8) + 8, hedging: Math.floor(Math.random() * 20) + 80 },
    { platform: 'Gemini', hallucination: Math.floor(Math.random() * 12) + 15, contradictions: Math.floor(Math.random() * 10) + 12, hedging: Math.floor(Math.random() * 20) + 75 }
  ],
  differentiation: [
    { platform: 'Grok', originality: Math.floor(Math.random() * 20) + 60, divergence: Math.floor(Math.random() * 20) + 55, contribution: Math.floor(Math.random() * 20) + 65 },
    { platform: 'Claude', originality: Math.floor(Math.random() * 20) + 70, divergence: Math.floor(Math.random() * 20) + 65, contribution: Math.floor(Math.random() * 20) + 75 },
    { platform: 'Gemini', originality: Math.floor(Math.random() * 20) + 75, divergence: Math.floor(Math.random() * 20) + 70, contribution: Math.floor(Math.random() * 20) + 70 }
  ]
  };
}

// Function to generate unique fusion result for each conversation
export const generateMockFusionResult = (responses?: AIResponse[]): FusionResult => {
  // Calculate sources based on actual response word counts if provided
  let sources = {
    grok: Math.floor(Math.random() * 20) + 25,
    claude: Math.floor(Math.random() * 20) + 30,
    gemini: Math.floor(Math.random() * 20) + 20
  };
  
  if (responses && responses.length > 0) {
    const totalWords = responses.reduce((sum, r) => sum + r.wordCount, 0);
    if (totalWords > 0) {
      sources = {
        grok: Math.round((responses.find(r => r.platform === 'grok')?.wordCount || 0) / totalWords * 100),
        claude: Math.round((responses.find(r => r.platform === 'claude')?.wordCount || 0) / totalWords * 100),
        gemini: Math.round((responses.find(r => r.platform === 'gemini')?.wordCount || 0) / totalWords * 100)
      };
      
      // Normalize to ensure they add up to 100
      const total = sources.grok + sources.claude + sources.gemini;
      if (total > 0) {
        sources.grok = Math.round((sources.grok / total) * 100);
        sources.claude = Math.round((sources.claude / total) * 100);
        sources.gemini = 100 - sources.grok - sources.claude; // Ensure total = 100
      }
    }
  }
  
  return {
  content: `**Quantum Computing's Cybersecurity Revolution: A Comprehensive Analysis**

Quantum computing represents a fundamental paradigm shift that will simultaneously disrupt current cybersecurity foundations while enabling next-generation protection mechanisms.

**The Cryptographic Threat Landscape:**
Current encryption methods—including RSA, elliptic curve cryptography, and other public-key systems—rely on mathematical problems that are computationally intractable for classical computers. Quantum computers using Shor's algorithm can solve these problems exponentially faster, effectively rendering today's cryptographic infrastructure obsolete. Additionally, Grover's algorithm reduces the effective security of symmetric encryption by half.

**Timeline and Preparedness:**
While cryptographically relevant quantum computers may emerge within 15-20 years (with some estimates pointing to 2030-2040), the transition isn't binary. Organizations must begin preparing now through crypto-agility initiatives and post-quantum cryptography adoption.

**Quantum-Enhanced Security Opportunities:**
• **Quantum Key Distribution (QKD):** Provides information-theoretic security based on fundamental quantum mechanics principles
• **Quantum Random Number Generation:** Offers true randomness impossible to predict or reproduce  
• **Post-Quantum Algorithms:** NIST-standardized solutions like CRYSTALS-KYBER and CRYSTALS-Dilithium provide quantum-resistant protection

**Strategic Implementation Framework:**
1. Conduct quantum risk assessments for critical systems
2. Implement crypto-agile architectures capable of rapid algorithm deployment
3. Begin transitioning to NIST-approved post-quantum standards
4. Establish hybrid classical-quantum security measures during the transition period

The quantum cybersecurity landscape represents not just a technological upgrade, but a fundamental phase transition requiring proactive adaptation rather than reactive mitigation.`,
  confidence: Math.random() * 0.1 + 0.85,
  sources,
  keyInsights: [
    'Quantum computers will break current encryption within 15-20 years',
    'Post-quantum cryptography standards are already available from NIST',
    'Quantum Key Distribution offers theoretically unbreakable communication',
    'Organizations must start crypto-agility planning immediately'
  ]
  };
};