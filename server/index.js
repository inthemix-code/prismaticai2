// server/index.js - Express.js backend proxy for Claude API
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    claudeConfigured: !!process.env.CLAUDE_API_KEY
  });
});

// Claude API proxy endpoint
app.post('/api/claude', async (req, res) => {
  try {
    const { prompt, maxTokens = 1000 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        success: false 
      });
    }

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: 'Claude API key not configured on server',
        success: false 
      });
    }

    console.log('🤖 Making Claude API request...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Claude API error: ${response.status} - ${errorText}`,
        success: false 
      });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    console.log('✅ Claude API success, response length:', content.length);

    res.json({
      success: true,
      content,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Complete workflow endpoint - Claude answers prompt AND analyzes all responses
app.post('/api/claude/complete-analysis', async (req, res) => {
  try {
    const { originalPrompt, otherResponses } = req.body;
    
    if (!originalPrompt || !otherResponses || !Array.isArray(otherResponses)) {
      return res.status(400).json({ 
        error: 'originalPrompt and otherResponses array are required',
        success: false 
      });
    }

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: 'Claude API key not configured on server',
        success: false 
      });
    }

    console.log('🔄 Starting complete Claude workflow...');

    // STEP 1: Get Claude's own response to the original prompt
    console.log('📝 Getting Claude\'s response to original prompt...');
    const claudeResponseCall = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1200,
        messages: [
          {
            role: 'user',
            content: originalPrompt
          }
        ]
      })
    });

    if (!claudeResponseCall.ok) {
      const errorText = await claudeResponseCall.text();
      console.error('Claude response API error:', claudeResponseCall.status, errorText);
      return res.status(claudeResponseCall.status).json({ 
        error: `Claude response API error: ${claudeResponseCall.status} - ${errorText}`,
        success: false 
      });
    }

    const claudeResponseData = await claudeResponseCall.json();
    const claudeResponse = claudeResponseData.content[0]?.text || '';

    console.log('✅ Claude response completed, length:', claudeResponse.length);

    // STEP 2: Now analyze ALL responses including Claude's own
    const allResponses = [
      ...otherResponses,
      {
        platform: 'claude',
        content: claudeResponse,
        confidence: 90, // Claude tends to be confident
        responseTime: 2500, // Estimate
        wordCount: claudeResponse.split(' ').length
      }
    ];

    console.log('🔍 Analyzing all responses including Claude\'s own...');

    const analysisPrompt = `I need you to perform a comprehensive analysis. Here's what happened:

**Original Prompt:** "${originalPrompt}"

**All AI Responses (including my own previous response):**

${allResponses.map((response, index) => `
**${response.platform.toUpperCase()} Response:**
${response.content}

**Metadata:**
- Confidence: ${response.confidence}%
- Response Time: ${response.responseTime}ms
- Word Count: ${response.wordCount}
`).join('\n---\n')}

Please provide a comprehensive meta-analysis including:

1. **Self-Assessment**: How does my own response (Claude) compare to the others? What are its strengths and limitations?

2. **Comparative Analysis**: How do all responses differ in approach, depth, accuracy, and style?

3. **Cross-Model Insights**: What unique perspectives does each AI bring? Where do they complement or contradict each other?

4. **Quality Assessment**: Which responses are most/least accurate, comprehensive, or useful?

5. **Gap Analysis**: What important aspects are missing across all responses?

6. **Synthesis Recommendations**: How could the best elements from all responses be combined?

7. **Meta-Commentary**: What does this comparison reveal about different AI approaches to this type of question?

Be objective and critical, including honest assessment of my own response's limitations.`;

    const analysisCall = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2500,
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    });

    if (!analysisCall.ok) {
      const errorText = await analysisCall.text();
      console.error('Claude analysis API error:', analysisCall.status, errorText);
      return res.status(analysisCall.status).json({ 
        error: `Claude analysis API error: ${analysisCall.status} - ${errorText}`,
        success: false 
      });
    }

    const analysisData = await analysisCall.json();
    const analysis = analysisData.content[0]?.text || '';

    console.log('✅ Complete analysis finished:', {
      claudeResponseLength: claudeResponse.length,
      analysisLength: analysis.length,
      totalResponsesAnalyzed: allResponses.length
    });

    res.json({
      success: true,
      claudeResponse,
      analysis,
      allResponses,
      originalPrompt,
      totalResponsesAnalyzed: allResponses.length,
      usage: {
        responseTokens: claudeResponseData.usage,
        analysisTokens: analysisData.usage
      }
    });

  } catch (error) {
    console.error('❌ Complete analysis server error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Legacy analysis endpoint (for backwards compatibility)
app.post('/api/claude/analyze', async (req, res) => {
  try {
    const { originalPrompt, responses } = req.body;
    
    if (!originalPrompt || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ 
        error: 'originalPrompt and responses array are required',
        success: false 
      });
    }

    // Create analysis prompt for Claude
    const analysisPrompt = `Please analyze these AI responses to the prompt: "${originalPrompt}"

Here are the responses from different AI models:

${responses.map((response, index) => `
**${response.platform.toUpperCase()} Response:**
${response.content}

**Metadata:**
- Confidence: ${response.confidence}%
- Response Time: ${response.responseTime}ms
- Word Count: ${response.wordCount}
`).join('\n---\n')}

Please provide a comprehensive analysis including:

1. **Comparative Assessment**: How do these responses differ in approach, depth, and quality?

2. **Strengths and Weaknesses**: What are the key strengths and limitations of each response?

3. **Accuracy and Reliability**: Which responses seem most accurate and well-reasoned?

4. **Style and Approach**: How do the different AI models' communication styles compare?

5. **Synthesis Recommendations**: Based on these responses, what would be the most comprehensive and accurate answer?

6. **Key Insights**: What important points emerged across the responses, and what might be missing?

Please provide your analysis in a structured, detailed format.`;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: 'Claude API key not configured on server',
        success: false 
      });
    }

    console.log('🔍 Making Claude analysis request...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000, // More tokens for detailed analysis
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude Analysis API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Claude Analysis API error: ${response.status} - ${errorText}`,
        success: false 
      });
    }

    const data = await response.json();
    const analysis = data.content[0]?.text || '';

    console.log('✅ Claude analysis success, analysis length:', analysis.length);

    res.json({
      success: true,
      analysis,
      originalPrompt,
      responseCount: responses.length,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('❌ Analysis server error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Claude synthesis endpoint - for creating unified responses
app.post('/api/claude/synthesize', async (req, res) => {
  try {
    const { originalPrompt, responses } = req.body;
    
    if (!originalPrompt || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ 
        error: 'originalPrompt and responses array are required',
        success: false 
      });
    }

    const synthesisPrompt = `Create a comprehensive, unified response by synthesizing these AI responses to: "${originalPrompt}"

Available responses:

${responses.map((response, index) => `
**Source ${index + 1} (${response.platform}):**
${response.content}
`).join('\n')}

Please create a synthesis that:
1. **Combines the best insights** from all responses
2. **Resolves any contradictions** by providing balanced perspectives
3. **Fills in gaps** where responses were incomplete
4. **Maintains accuracy** while being comprehensive
5. **Uses clear, professional structure**

Format your synthesis as a complete, standalone response that incorporates the strengths of all input responses while being more comprehensive than any individual response.`;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({ 
        error: 'Claude API key not configured on server',
        success: false 
      });
    }

    console.log('🔄 Making Claude synthesis request...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: synthesisPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude Synthesis API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Claude Synthesis API error: ${response.status} - ${errorText}`,
        success: false 
      });
    }

    const data = await response.json();
    const synthesis = data.content[0]?.text || '';

    console.log('✅ Claude synthesis success, synthesis length:', synthesis.length);

    res.json({
      success: true,
      synthesis,
      originalPrompt,
      sourceCount: responses.length,
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('❌ Synthesis server error:', error);
    res.status(500).json({ 
      error: error.message,
      success: false 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Prismatic AI Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Claude configured: ${!!process.env.CLAUDE_API_KEY}`);
  console.log(`🌐 CORS enabled for frontend development`);
});

module.exports = app;