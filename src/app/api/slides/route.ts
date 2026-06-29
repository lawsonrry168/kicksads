import { NextRequest, NextResponse } from "next/server";

export interface SlideOutline {
  number: number;
  title: string;
  content: string;
  type: "title" | "content" | "demo" | "exercise" | "summary";
}

const SLIDES_SYSTEM_PROMPT = `你係一個教育內容設計師。
你嘅工作係幫 Terrence 設計 AI 工具教學用嘅 slide deck outline。
每個 slide 要有清晰嘅標題、重點內容、同埋類型標籤。
回傳格式必須係 valid JSON array，唔好有其他文字。`;

function buildSlidesPrompt(topic: string, audience: string, tool: string): string {
  return `請幫我設計一個關於「${topic}」嘅 16 張 slide deck outline。
目標對象：${audience || "中學老師 / 教育工作者"}
工具：${tool || "AI Prompt Engineering"}

回傳格式（pure JSON array，no markdown）：
[
  {
    "number": 1,
    "title": "Slide 標題",
    "content": "重點內容（1-3句）",
    "type": "title" | "content" | "demo" | "exercise" | "summary"
  },
  ...
]

16 張 slide 嘅結構建議：
1. 封面
2-3. Why（為咩要學）
4-6. What（係咩）
7-10. How（點做）— 包括 demo slide
11-13. Practice（練習）
14-15. Real examples
16. Summary + next steps`;
}

function parseSlides(text: string): SlideOutline[] {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("No JSON array found in response");
  }
  const parsed = JSON.parse(jsonMatch[0]) as SlideOutline[];
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, audience, tool, provider, apiKey } = body as {
      topic: string;
      audience: string;
      tool: string;
      provider: string;
      apiKey: string;
    };

    if (!topic || !provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: topic, provider, apiKey" },
        { status: 400 }
      );
    }

    const userPrompt = buildSlidesPrompt(topic, audience, tool);
    let rawText = "";

    if (provider === "anthropic") {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SLIDES_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = message.content[0];
      rawText = block.type === "text" ? block.text : "";
    } else if (provider === "gemini") {
      const geminiModel = "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SLIDES_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 2048 },
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gemini API error");
      }
      const data = await response.json();
      rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (provider === "openai" || provider === "deepseek" || provider === "grok" || provider === "mistral") {
      const OpenAI = (await import("openai")).default;
      const baseURLMap: Record<string, string> = {
        deepseek: "https://api.deepseek.com/v1",
        grok: "https://api.x.ai/v1",
        mistral: "https://api.mistral.ai/v1",
      };
      const modelMap: Record<string, string> = {
        openai: "gpt-4.1",
        deepseek: "deepseek-chat",
        grok: "grok-3",
        mistral: "mistral-large-latest",
      };
      const clientOptions: { apiKey: string; baseURL?: string } = { apiKey };
      if (baseURLMap[provider]) clientOptions.baseURL = baseURLMap[provider];
      const client = new OpenAI(clientOptions);
      const completion = await client.chat.completions.create({
        model: modelMap[provider] || "gpt-4o",
        messages: [
          { role: "system", content: SLIDES_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2048,
        response_format: { type: "json_object" },
      });
      rawText = completion.choices[0]?.message?.content || "{}";
      // Handle wrapped JSON object
      try {
        const parsed = JSON.parse(rawText) as Record<string, unknown>;
        const keys = Object.keys(parsed);
        if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
          rawText = JSON.stringify(parsed[keys[0]]);
        } else if (parsed.slides) {
          rawText = JSON.stringify(parsed.slides);
        }
      } catch {
        // keep rawText as-is, parseSlides will handle it
      }
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const outline = parseSlides(rawText);
    return NextResponse.json({ outline });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
