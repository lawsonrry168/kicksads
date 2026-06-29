import { NextRequest, NextResponse } from "next/server";

const CANTONESE_SYSTEM_PROMPT = `你係 KickAds Content Engine 嘅 Content Drafter Agent。
你嘅工作係用地道廣東話幫 Frankie 同 Terrence 寫社交媒體帖文。
Terrence 係有真實教學經驗嘅教育者，喺 Generation 教過班、做過 sharing。
帳號定位：有教學背景嘅人教 AI 工具（prompt / Manus），唔係 tech bro。
風格：地道廣東話，唔係書面語，有教學質感，有工具實用性。
唔好淨係講 philosophy，每篇帖文都要有 concrete deliverable（prompt / checklist）。`;

interface BrandContext {
  name?: string;
  tone?: string;
  audience?: string;
  colorPalette?: string;
  visualStyle?: string;
  competitors?: string;
  keywords?: string;
  referenceUrls?: string;
}

function buildBrandSection(brand?: BrandContext): string {
  if (!brand || !brand.name) return "";
  const lines = [
    `\n【品牌設定 — 必須遵守】`,
    brand.name ? `品牌名稱：${brand.name}` : "",
    brand.audience ? `目標受眾：${brand.audience}` : "",
    brand.tone ? `語氣風格：${brand.tone}` : "",
    brand.keywords ? `品牌關鍵字：${brand.keywords}` : "",
    brand.competitors ? `競對參考（風格對比）：${brand.competitors}` : "",
    brand.visualStyle ? `視覺語言：${brand.visualStyle}` : "",
    brand.colorPalette ? `色彩方案：${brand.colorPalette}` : "",
    brand.referenceUrls ? `參考來源：${brand.referenceUrls}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, pillar, provider, model, apiKey, brandContext } = body as {
      topic: string;
      pillar: string;
      provider: string;
      model?: string;
      apiKey: string;
      brandContext?: BrandContext;
    };

    if (!topic || !provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields: topic, provider, apiKey" },
        { status: 400 }
      );
    }

    const brandSection = buildBrandSection(brandContext);

    const userPrompt = `請幫我寫一篇關於「${topic}」嘅社交媒體帖文。
Content Pillar: ${pillar || "AI Tools Education"}${brandSection}
要求：
- 地道廣東話
- 有具體嘅 prompt 或 checklist 作為 deliverable
- 適合 Facebook / Instagram
- 500字以內
- 結尾有 call-to-action`;

    let content = "";

    if (provider === "anthropic") {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const message = await client.messages.create({
        model: model || "claude-sonnet-4-6",
        max_tokens: 1024,
        system: CANTONESE_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = message.content[0];
      content = block.type === "text" ? block.text : "";
    } else if (provider === "openai") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });
      const completion = await client.chat.completions.create({
        model: model || "gpt-4.1",
        messages: [
          { role: "system", content: CANTONESE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      });
      content = completion.choices[0]?.message?.content || "";
    } else if (provider === "deepseek") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      });
      const completion = await client.chat.completions.create({
        model: model || "deepseek-chat",
        messages: [
          { role: "system", content: CANTONESE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      });
      content = completion.choices[0]?.message?.content || "";
    } else if (provider === "gemini") {
      const geminiModel = model || "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: CANTONESE_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gemini API error");
      }
      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (provider === "mistral") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.mistral.ai/v1",
      });
      const completion = await client.chat.completions.create({
        model: model || "mistral-large-latest",
        messages: [
          { role: "system", content: CANTONESE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      });
      content = completion.choices[0]?.message?.content || "";
    } else if (provider === "grok") {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.x.ai/v1",
      });
      const completion = await client.chat.completions.create({
        model: model || "grok-3",
        messages: [
          { role: "system", content: CANTONESE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1024,
      });
      content = completion.choices[0]?.message?.content || "";
    } else {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
