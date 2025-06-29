export const handler = async (event, _context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Get Claude API key from environment variables
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Claude API key not configured',
          success: false 
        })
      };
    }

    // Parse request body
    const { originalPrompt, responses } = JSON.parse(event.body);
    
    if (!originalPrompt || !responses || !Array.isArray(responses)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Original prompt and responses array are required',
          success: false 
        })
      };
    }

    console.log('🧠 Claude synthesis: Starting synthesis...');
    const startTime = Date.now();

    // Create synthesis prompt
    const synthesisPrompt = createSynthesisPrompt(originalPrompt, responses);

    // Call Claude API for synthesis
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ 
          role: 'user', 
          content: synthesisPrompt 
        }]
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude synthesis API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Claude synthesis API error: ${response.status}`,
          details: errorText,
          success: false 
        })
      };
    }

    const data = await response.json();
    const content = data.content[0]?.text || 'No synthesis available';

    // Calculate confidence based on synthesis quality
    const confidence = calculateSynthesisConfidence(content, responses);

    console.log('✅ Claude synthesis: Success', {
      responseTime: `${responseTime}ms`,
      contentLength: content.length,
      confidence: `${confidence}%`
    });

    // Return synthesis result
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          content,
          confidence: confidence / 100
        }
      })
    };

  } catch (error) {
    console.error('❌ Claude synthesis error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        success: false 
      })
    };
  }
};

// Helper function to create synthesis prompt
function createSynthesisPrompt(originalPrompt, responses) {
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

// Helper function to calculate synthesis confidence
function calculateSynthesisConfidence(content, responses) {
  let confidence = 80; // Base confidence for successful real synthesis

  // Content quality indicators
  if (content.length > 1000) confidence += 5;
  if (content.length > 2000) confidence += 3;
  
  // Structure quality (headings, bullets, formatting)
  if (content.includes('**') || content.includes('##')) confidence += 4;
  if (content.includes('•') || content.includes('1.') || content.includes('-')) confidence += 3;
  
  // Number of source responses
  confidence += Math.min(responses.length * 1, 5);
  
  // Balanced analysis indicators
  const balanceWords = ['however', 'although', 'while', 'whereas', 'on the other hand'];
  const hasBalance = balanceWords.some(word => content.toLowerCase().includes(word));
  if (hasBalance) confidence += 2;
  
  // Actionable content indicators
  const actionWords = ['recommend', 'should', 'implement', 'consider', 'strategy'];
  const hasAction = actionWords.some(word => content.toLowerCase().includes(word));
  if (hasAction) confidence += 2;

  return Math.min(confidence, 96); // Cap at 96% for real synthesis
}