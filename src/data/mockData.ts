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

// Function to generate unique analysis data for each conversation
export const generateMockAnalysisData = (): AnalysisData => ({
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
});

// Function to generate unique fusion result for each conversation
export const generateMockFusionResult = (): FusionResult => ({
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
  sources: {
    grok: Math.floor(Math.random() * 20) + 25,
    claude: Math.floor(Math.random() * 20) + 30,
    gemini: Math.floor(Math.random() * 20) + 20
  },
  keyInsights: [
    'Quantum computers will break current encryption within 15-20 years',
    'Post-quantum cryptography standards are already available from NIST',
    'Quantum Key Distribution offers theoretically unbreakable communication',
    'Organizations must start crypto-agility planning immediately'
  ]
});