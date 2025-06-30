const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Add CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get Claude API key from environment variables
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      console.error('CLAUDE_API_KEY not found in environment variables');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('CLAUDE')));
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Claude API key not configured in Netlify environment variables. Please add CLAUDE_API_KEY to your site settings.',
          success: false,
          hint: 'Go to Netlify Dashboard > Site Settings > Environment Variables and add CLAUDE_API_KEY'
        })
      };
    }

    // Validate Claude API key format
    if (!claudeApiKey.startsWith('sk-ant-api')) {
      console.error('Invalid Claude API key format');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid Claude API key format. Key should start with sk-ant-api',
          success: false 
        })
      };
    }

    // Parse request body safely
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          success: false 
        })
      };
    }

    const { originalPrompt, responses } = requestBody;
    
    if (!originalPrompt || !responses || !Array.isArray(responses)) {
      return {
        statusCode: 400,
        headers,
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

    // Call Claude API for synthesis with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for synthesis

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ 
          role: 'user', 
          content: synthesisPrompt 
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude synthesis API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
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
      confidence: `${Math.round(confidence * 100)}%`
    });

    // Return synthesis result
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          content,
          confidence
        }
      })
    };

  } catch (error) {
    console.error('❌ Claude synthesis error:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ 
          error: 'Synthesis timeout - Claude API took too long to respond',
          success: false 
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
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
    .filter(r => !r.error && r.content && r.content.trim())
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