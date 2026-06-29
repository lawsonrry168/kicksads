export interface Provider {
  id: string;
  name: string;
  logo: string;
  color: string;
  textColor: string;
  envKey: string;
  models: string[];
  apiBase: string;
  defaultModel: string;
}

export interface Agent {
  id: string;
  name: string;
  nameZh: string;
  role: string;
  roleZh: string;
  provider: string;
  model: string;
  fallback: string;
  task: string;
  taskZh: string;
  costPer1K: number;
}

export const PROVIDERS: Provider[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "AN",
    color: "#c85c2a",
    textColor: "#ffffff",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      "claude-opus-4-8",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
    ],
    apiBase: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-6",
  },
  {
    id: "openai",
    name: "OpenAI",
    logo: "OA",
    color: "#10a37f",
    textColor: "#ffffff",
    envKey: "OPENAI_API_KEY",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini"],
    apiBase: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  {
    id: "gemini",
    name: "Gemini",
    logo: "GM",
    color: "#4285f4",
    textColor: "#ffffff",
    envKey: "GEMINI_API_KEY",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-pro",
    ],
    apiBase: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    logo: "DS",
    color: "#1e40af",
    textColor: "#93c5fd",
    envKey: "DEEPSEEK_API_KEY",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder-v2"],
    apiBase: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
  {
    id: "grok",
    name: "Grok",
    logo: "GK",
    color: "#1c1c1c",
    textColor: "#e5e5e5",
    envKey: "GROK_API_KEY",
    models: ["grok-3", "grok-3-mini", "grok-2-1212", "grok-beta"],
    apiBase: "https://api.x.ai/v1",
    defaultModel: "grok-3",
  },
  {
    id: "mistral",
    name: "Mistral",
    logo: "MI",
    color: "#ff7000",
    textColor: "#ffffff",
    envKey: "MISTRAL_API_KEY",
    models: [
      "mistral-large-latest",
      "mistral-medium-3",
      "mistral-small-latest",
      "codestral-latest",
    ],
    apiBase: "https://api.mistral.ai/v1",
    defaultModel: "mistral-large-latest",
  },
];

export const AGENTS: Agent[] = [
  {
    id: "cmo-orchestrator",
    name: "CMO Orchestrator",
    nameZh: "CMO 統籌代理",
    role: "Strategy & Routing",
    roleZh: "策略及路由",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    fallback: "openai",
    task: "Plan content calendar, route tasks to agents, enforce brand voice",
    taskZh: "制定內容日曆，分配任務，執行品牌聲調",
    costPer1K: 0.003,
  },
  {
    id: "content-drafter",
    name: "Content Drafter",
    nameZh: "內容撰寫代理",
    role: "Post Writing",
    roleZh: "帖文撰寫",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallback: "deepseek",
    task: "Write Cantonese social posts with concrete prompts/checklists",
    taskZh: "以廣東話撰寫社交帖文，包含具體提示及清單",
    costPer1K: 0.003,
  },
  {
    id: "visual-prompt-gen",
    name: "Visual Prompt Gen",
    nameZh: "視覺 Prompt 代理",
    role: "Image Prompting",
    roleZh: "圖像提示生成",
    provider: "openai",
    model: "gpt-4.1",
    fallback: "gemini",
    task: "Generate Midjourney/DALL-E prompts for post visuals",
    taskZh: "生成 Midjourney / DALL-E 圖像提示詞",
    costPer1K: 0.005,
  },
  {
    id: "slides-maker",
    name: "Slides Maker",
    nameZh: "簡報生成代理",
    role: "Slide Outline",
    roleZh: "簡報大綱",
    provider: "gemini",
    model: "gemini-2.5-flash",
    fallback: "anthropic",
    task: "Create 16-slide educational outlines for Canva/Google Slides",
    taskZh: "建立 16 頁教學簡報大綱，適用於 Canva / Google Slides",
    costPer1K: 0.00125,
  },
  {
    id: "publisher-agent",
    name: "Publisher Agent",
    nameZh: "發布代理",
    role: "Scheduling & Publishing",
    roleZh: "排程及發布",
    provider: "openai",
    model: "gpt-4.1-mini",
    fallback: "deepseek",
    task: "Schedule and push content to Publer, Telegram, n8n webhooks",
    taskZh: "排程並推送內容至 Publer、Telegram、n8n",
    costPer1K: 0.00015,
  },
  {
    id: "school-outreach",
    name: "School Outreach",
    nameZh: "學校拓展代理",
    role: "B2B Messaging",
    roleZh: "B2B 訊息",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    fallback: "mistral",
    task: "Draft outreach emails/messages for school partnerships",
    taskZh: "起草學校合作拓展電郵及訊息",
    costPer1K: 0.00025,
  },
];
