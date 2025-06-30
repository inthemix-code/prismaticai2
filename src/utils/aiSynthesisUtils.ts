import { AIResponse } from '../types';

/**
 * Creates a synthesis prompt for combining multiple AI responses
 */
export function createSynthesisPrompt(originalPrompt: string, responses: AIResponse[]): string {
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

/**
 * Calculates confidence score for synthesis quality
 */
export function calculateSynthesisConfidence(content: string, responses: AIResponse[]): number {
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

/**
 * Extracts key insights from synthesized content
 */
export function extractKeyInsights(content: string): string[] {
  const insights: string[] = [];
  
  // Look for bullet points
  const bulletMatches = content.match(/[•\-\*]\s+([^\n]+)/g);
  if (bulletMatches) {
    insights.push(...bulletMatches.map(match => 
      match.replace(/^[•\-\*]\s+/, '').trim()
    ).slice(0, 2));
  }
  
  // Look for numbered points
  const numberedMatches = content.match(/\d+\.\s+([^\n]+)/g);
  if (numberedMatches) {
    insights.push(...numberedMatches.map(match => 
      match.replace(/^\d+\.\s+/, '').trim()
    ).slice(0, 2));
  }
  
  // Look for sentences with strong indicators
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const strongIndicators = ['key', 'important', 'critical', 'essential', 'significant', 'primary', 'fundamental'];
  
  for (const sentence of sentences) {
    if (strongIndicators.some(indicator => 
      sentence.toLowerCase().includes(indicator)) && insights.length < 4
    ) {
      insights.push(sentence.trim());
    }
  }
  
  // Fallback: use first few sentences if no insights found
  if (insights.length === 0) {
    insights.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  
  return insights.slice(0, 4).filter(insight => insight.length > 10);
}

/**
 * Calculates source attribution based on response word counts
 */
export function calculateSourceAttribution(responses: AIResponse[]): {
  grok: number;
  claude: number;
  gemini: number;
} {
  const totalWords = responses.reduce((sum, r) => sum + r.wordCount, 0);
  
  if (totalWords === 0) {
    // Default distribution if no words
    return { grok: 33, claude: 34, gemini: 33 };
  }
  
  const sources = {
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
  
  return sources;
}