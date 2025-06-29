const fetch = require('node-fetch');

exports.handler = async (event, context) => {
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
    const { prompt, model = 'claude-3-sonnet-20240229', max_tokens = 1000 } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Prompt is required',
          success: false 
        })
      };
    }

    console.log('🤖 Claude proxy: Making API request...');
    const startTime = Date.now();

    // Call Claude API
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
      })
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Claude API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: {
          id: `claude-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          platform: 'claude',
          content,
          confidence: calculateConfidence(content),
          responseTime,
          wordCount: content.split(' ').length,
          loading: false,
          timestamp: Date.now()
        }
      })
    };

  } catch (error) {
    console.error('❌ Claude proxy error:', error);
    
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

// Helper function to calculate confidence
function calculateConfidence(content) {
  let confidence = 85; // Base confidence for real Claude responses

  const wordCount = content.split(' ').length;
  if (wordCount > 100) confidence += 5;
  if (wordCount > 200) confidence += 5;

  // Claude tends to be well-structured
  if (content.includes('**') || content.includes('##')) confidence += 3;
  if (content.includes('•') || content.includes('-')) confidence += 2;

  return Math.max(75, Math.min(95, confidence));
}