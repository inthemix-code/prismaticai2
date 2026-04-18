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
  action: "query" | "synthesize" | "stream" | "synthesize_structured";
  model?: "claude" | "grok" | "gemini";
  prompt: string;
  responses?: AIResponse[];
  systemPersona?: string;
  memoryFacts?: string[];
}

function calculateConfidence(content: string): number {
  let confidence = 0.82;
  const wordCount = content.split(" ").length;
  if (wordCount > 50) confidence += 0.04;
  if (wordCount > 150) confidence += 0.04;
  if (content.includes("**") || content.includes("##")) confidence += 0.02;
  return Math.min(0.97, confidence);
}

function augmentPrompt(prompt: string, systemPersona?: string, memoryFacts?: string[]): string {
  const parts: string[] = [];
  if (systemPersona && systemPersona.trim()) parts.push(`[Project context: ${systemPersona.trim()}]`);
  if (memoryFacts && memoryFacts.length > 0) {
    parts.push(`[Relevant pinned facts:\n${memoryFacts.map((f) => `- ${f}`).join("\n")}]`);
  }
  parts.push(prompt);
  return parts.join("\n\n");
}

async function queryClaude(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  const startTime = Date.now();
  if (!apiKey) throw new Error("Claude API key not configured");

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
  return {
    id: crypto.randomUUID(),
    platform: "claude",
    content,
    confidence: calculateConfidence(content),
    responseTime: (Date.now() - startTime) / 1000,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function queryGrok(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("GROK_API_KEY");
  const startTime = Date.now();
  if (!apiKey) throw new Error("Grok API key not configured");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
  return {
    id: crypto.randomUUID(),
    platform: "grok",
    content,
    confidence: calculateConfidence(content),
    responseTime: (Date.now() - startTime) / 1000,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function queryGemini(prompt: string): Promise<AIResponse> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const startTime = Date.now();
  if (!apiKey) throw new Error("Gemini API key not configured");

  const tryModel = (model: string): Promise<Response> =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
      }),
    });

  let response = await tryModel("gemini-1.5-flash");
  if (!response.ok) response = await tryModel("gemini-1.5-pro");
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return {
    id: crypto.randomUUID(),
    platform: "gemini",
    content,
    confidence: calculateConfidence(content),
    responseTime: (Date.now() - startTime) / 1000,
    wordCount: content.split(" ").length,
    loading: false,
    timestamp: Date.now(),
  };
}

async function streamClaude(prompt: string, send: (chunk: string) => void): Promise<void> {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  if (!apiKey) throw new Error("Claude API key not configured");

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
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok || !response.body) throw new Error(`Claude stream error ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === "content_block_delta" && json.delta?.text) send(json.delta.text);
      } catch { /* ignore */ }
    }
  }
}

async function streamGrok(prompt: string, send: (chunk: string) => void): Promise<void> {
  const apiKey = Deno.env.get("GROK_API_KEY");
  if (!apiKey) throw new Error("Grok API key not configured");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-3-latest",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1200,
      temperature: 0.7,
      stream: true,
    }),
  });
  if (!response.ok || !response.body) throw new Error(`Grok stream error ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) send(delta);
      } catch { /* ignore */ }
    }
  }
}

async function streamGemini(prompt: string, send: (chunk: string) => void): Promise<void> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Gemini API key not configured");

  const tryModel = (model: string): Promise<Response> =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
        }),
      },
    );

  let response = await tryModel("gemini-1.5-flash");
  if (!response.ok) response = await tryModel("gemini-1.5-pro");
  if (!response.ok || !response.body) throw new Error(`Gemini stream error ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (delta) send(delta);
      } catch { /* ignore */ }
    }
  }
}

function handleStream(body: RequestBody): Response {
  const { model, prompt, systemPersona, memoryFacts } = body;
  if (!model) {
    return new Response(JSON.stringify({ error: "model required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const finalPrompt = augmentPrompt(prompt, systemPersona, memoryFacts);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      try {
        send("start", { model, t: Date.now() });
        const onChunk = (text: string) => send("delta", { text });
        if (model === "claude") await streamClaude(finalPrompt, onChunk);
        else if (model === "grok") await streamGrok(finalPrompt, onChunk);
        else if (model === "gemini") await streamGemini(finalPrompt, onChunk);
        send("done", { t: Date.now() });
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "unknown" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

async function synthesize(prompt: string, responses: AIResponse[]): Promise<{ content: string; confidence: number }> {
  const valid = responses.filter((r) => r.content && !r.error);
  if (valid.length === 0) throw new Error("No valid responses to synthesize");

  const responseText = valid
    .map((r, i) => `=== ${r.platform.toUpperCase()} (Response ${i + 1}) ===\n${r.content}`)
    .join("\n\n");

  const synthesisPrompt = `You are an expert AI response synthesizer. The user asked: "${prompt}"

Here are responses from ${valid.length} different AI models:

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
        },
      );
      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (content) return { content, confidence: calculateConfidence(content) };
      }
    } catch { /* fall through */ }
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
      if (content) return { content, confidence: calculateConfidence(content) };
    }
  }

  throw new Error("No API keys configured for synthesis");
}

async function synthesizeStructured(prompt: string, responses: AIResponse[]) {
  const valid = responses.filter((r) => r.content && !r.error);
  if (valid.length === 0) throw new Error("No valid responses to synthesize");

  const responseText = valid
    .map((r) => `=== MODEL: ${r.platform} ===\n${r.content}`)
    .join("\n\n");

  const structuredPrompt = `You are synthesizing multiple AI responses into ONE answer with sentence-level source attribution.

User question: "${prompt}"

Model responses:
${responseText}

Return ONLY valid JSON (no prose, no markdown fences) matching this shape:
{
  "sentences": [
    {
      "text": "One complete sentence of the unified answer.",
      "supported_by": ["claude", "grok", "gemini"],
      "contested_by": []
    }
  ],
  "disagreements": [
    {
      "topic": "Short label of the contested claim",
      "positions": [{ "model": "claude", "stance": "short description" }],
      "resolution": "How you arbitrated and why"
    }
  ]
}

Rules:
- Every sentence must list at least one supporting model from [claude, grok, gemini]
- Only list models that were actually present in the input
- Use "contested_by" only when a model directly disagreed
- Keep sentences self-contained and factual
- Produce 6-14 sentences total`;

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: structuredPrompt }] }],
            generationConfig: {
              maxOutputTokens: 2400,
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.sentences && Array.isArray(parsed.sentences)) return parsed;
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }
  throw new Error("Structured synthesis failed");
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
    const { action, model, prompt, responses, systemPersona, memoryFacts } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "stream") return handleStream(body);

    if (action === "query") {
      if (!model) {
        return new Response(JSON.stringify({ error: "model is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const finalPrompt = augmentPrompt(prompt, systemPersona, memoryFacts);
      let result: AIResponse;
      if (model === "claude") result = await queryClaude(finalPrompt);
      else if (model === "grok") result = await queryGrok(finalPrompt);
      else if (model === "gemini") result = await queryGemini(finalPrompt);
      else {
        return new Response(JSON.stringify({ error: "Unknown model" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "synthesize") {
      if (!responses || responses.length === 0) {
        return new Response(JSON.stringify({ error: "responses required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await synthesize(prompt, responses);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "synthesize_structured") {
      if (!responses || responses.length === 0) {
        return new Response(JSON.stringify({ error: "responses required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await synthesizeStructured(prompt, responses);
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
