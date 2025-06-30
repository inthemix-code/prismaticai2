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

    const { prompt, model = 'claude-3-5-sonnet-20241022', max_tokens = 1000 } = requestBody;
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Prompt is required',
          success: false 
        })
      };
    }

    console.log('🤖 Claude proxy: Making API request...');
    const startTime = Date.now();

    // Call Claude API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens,
        messages: [{ 
          role: 'user', 
          content: prompt 
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Claude API error: ${response.status}`,
          details: errorText,
          success: false 
        })
      };
    }

    const data = await response.json();
    const content = data.content[0]?.text || 'No response';

    console.log('✅ Claude proxy: Success', {
      responseTime: `${responseTime}ms`,
      contentLength: content.length
    });

    // Return formatted response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          id: `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          platform: 'claude',
          content,
          confidence: calculateConfidence(content) / 100,
          responseTime,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      })
    };

  } catch (error) {
    console.error('❌ Claude proxy error:', error);
    
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return {
        statusCode: 408,
        headers,
        body: JSON.stringify({ 
          error: 'Request timeout - Claude API took too long to respond',
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

// Helper function to calculate confidence
function calculateConfidence(content) {
  let confidence = 85; // Base confidence percentage for real Claude responses

  const wordCount = content.split(' ').length;
  if (wordCount > 100) confidence += 5;
  if (wordCount > 200) confidence += 5;

  // Claude tends to be well-structured
  if (content.includes('**') || content.includes('##')) confidence += 3;
  if (content.includes('•') || content.includes('-')) confidence += 2;

  return Math.max(75, Math.min(95, confidence));
}