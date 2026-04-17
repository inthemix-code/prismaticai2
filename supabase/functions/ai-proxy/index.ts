import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIResponse {
  id: string;
  platform: "claude" | "grok" | "gemini";
  content: string;
  confidence: number;
  responseTime: number;
  wordCount: number;
  loading: boolean;
  error?: string;
  timestamp: number;
  isMock?: boolean;
}

interface RequestBody {
  action: "query" | "synthesize";
  model?: "claude" | "grok" | "gemini";
  prompt: string;
  responses?: AIResponse[];
}

function calculateConfidence(content: string): number {
  let confidence = 0.82;
  const wordCount = content.split(" ").length;
  if (wordCount > 50) confidence += 0.04;
  if (wordCount > 150) confidence += 0.04;
  if (content.includes("**") || content.includes("##")) confidence += 0.02;
  return Math.min(0.97, confidence);
}

async function queryClaude(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  const startTime = Date.now();

  if (!apiKey) {
    throw new Error("Claude API key not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content: string = data.content[0]?.text ?? "";
  const responseTime = (Date.now() - startTime) / 1000;

  return {
    id: crypto.randomUUID(),
    platform: "claude",
    content,
    confidence: calculateConfidence(content),
    responseTime,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function queryGrok(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("GROK_API_KEY");
  const startTime = Date.now();

  if (!apiKey) {
    throw new Error("Grok API key not configured");
  }

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3-latest",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Grok API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content: string = data.choices[0]?.message?.content ?? "";
  const responseTime = (Date.now() - startTime) / 1000;

  return {
    id: crypto.randomUUID(),
    platform: "grok",
    content,
    confidence: calculateConfidence(content),
    responseTime,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function queryGemini(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const startTime = Date.now();

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const tryModel = async (model: string): Promise<Response> => {
    return fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
        }),
      }
    );
  };

  let response = await tryModel("gemini-1.5-flash");
  if (!response.ok) {
    response = await tryModel("gemini-1.5-pro");
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const responseTime = (Date.now() - startTime) / 1000;

  return {
    id: crypto.randomUUID(),
    platform: "gemini",
    content,
    confidence: calculateConfidence(content),
    responseTime,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function synthesize(
  prompt: string,
  responses: AIResponse[]
): Promise<{ content: string; confidence: number }> {
  const validResponses = responses.filter((r) => r.content && !r.error);
  if (validResponses.length === 0) {
    throw new Error("No valid responses to synthesize");
  }

  const responseText = validResponses
    .map(
      (r, i) =>
        `=== ${r.platform.toUpperCase()} (Response ${i + 1}) ===\n${r.content}`
    )
    .join("\n\n");

  const synthesisPrompt = `You are an expert AI response synthesizer. The user asked: "${prompt}"

Here are responses from ${validResponses.length} different AI models:

${responseText}

Your task: Create a comprehensive, unified synthesis that:
1. Combines the strongest insights from all responses
2. Resolves any contradictions by presenting multiple perspectives
3. Structures information clearly with headers where appropriate
4. Adds value beyond simply summarizing - provide a cohesive, authoritative answer

Respond with the synthesized answer only, no meta-commentary about the synthesis process.`;

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  const claudeKey = Deno.env.get("CLAUDE_API_KEY");

  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: synthesisPrompt }] }],
            generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const content =
          data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (content) {
          return { content, confidence: calculateConfidence(content) };
        }
      }
    } catch {
      // fall through to Claude
    }
  }

  if (claudeKey) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{ role: "user", content: synthesisPrompt }],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.content[0]?.text ?? "";
      if (content) {
        return { content, confidence: calculateConfidence(content) };
      }
    }
  }

  throw new Error("No API keys configured for synthesis");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: RequestBody = await req.json();
    const { action, model, prompt, responses } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "query") {
      if (!model) {
        return new Response(
          JSON.stringify({ error: "model is required for query action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let result: AIResponse;
      if (model === "claude") {
        result = await queryClaude(prompt);
      } else if (model === "grok") {
        result = await queryGrok(prompt);
      } else if (model === "gemini") {
        result = await queryGemini(prompt);
      } else {
        return new Response(JSON.stringify({ error: "Unknown model" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (action === "synthesize") {
      if (!responses || responses.length === 0) {
        return new Response(
          JSON.stringify({ error: "responses are required for synthesis" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const result = await synthesize(prompt, responses);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'query' or 'synthesize'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
