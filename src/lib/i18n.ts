export type Lang = "zh" | "en";

export const i18n = {
  // Sidebar tabs
  tab_byok:     { zh: "密鑰配置", en: "BYOK Keys" },
  tab_routing:  { zh: "路由設定", en: "Routing" },
  tab_workflow: { zh: "工作流程", en: "Workflow" },
  tab_queue:    { zh: "發布排程", en: "Queue" },
  tab_slides:   { zh: "簡報生成", en: "Slides" },
  tab_guide:    { zh: "使用說明", en: "Guide" },

  // Left panel headers
  panel_agents:    { zh: "代理人",   en: "AGENTS" },
  panel_providers: { zh: "服務商",   en: "PROVIDERS" },
  connected_count: { zh: "已連接",   en: "connected" },

  // Right panel headers
  panel_agent_config: { zh: "代理設定",  en: "AGENT CONFIG" },
  panel_cost:         { zh: "費用追蹤",  en: "COST TRACKER" },
  panel_integrations: { zh: "整合設定",  en: "INTEGRATIONS" },
  panel_log:          { zh: "代理日誌",  en: "AGENT LOG" },
  panel_generate:     { zh: "生成帖文",  en: "GENERATE POST" },
  panel_slides_cfg:   { zh: "簡報設定",  en: "SLIDES CONFIG" },

  // Cost rows
  cost_today:   { zh: "今日",        en: "Today" },
  cost_week:    { zh: "本週",        en: "This week" },
  cost_month:   { zh: "本月",        en: "This month" },
  cost_tokens:  { zh: "累計 Tokens", en: "Total tokens" },
  cost_by_prov: { zh: "各服務商費用", en: "By Provider" },

  // Quick actions
  quick_actions:  { zh: "快捷操作",     en: "Quick Actions" },
  export_csv:     { zh: "⇥ 匯出排程 CSV", en: "⇥ Export Queue CSV" },
  sync_sheet:     { zh: "↻ 同步至試算表", en: "↻ Sync to Sheet" },

  // Integration statuses
  not_configured: { zh: "未設定",   en: "not configured" },

  // Provider badge statuses
  badge_connected: { zh: "已連接", en: "connected" },
  badge_error:     { zh: "錯誤",   en: "error" },
  badge_idle:      { zh: "待機",   en: "idle" },
  badge_test:      { zh: "測試",   en: "Test" },
  badge_testing:   { zh: "...",    en: "..." },

  // Generate panel
  gen_topic:     { zh: "主題",    en: "Topic" },
  gen_pillar:    { zh: "內容柱",  en: "Pillar" },
  gen_provider:  { zh: "服務商",  en: "Provider" },
  gen_btn:       { zh: "✦ 生成帖文",   en: "✦ Generate Post" },
  gen_loading:   { zh: "⟳ 生成中...",  en: "⟳ Generating..." },
  gen_placeholder: { zh: "例：用 ChatGPT 幫老師備課", en: "e.g. Use ChatGPT to plan lessons" },

  // Routing tab
  routing_title: { zh: "代理人 → 服務商路由對照表", en: "Agent → Provider Routing Table" },
  routing_agent:    { zh: "代理人", en: "Agent" },
  routing_role:     { zh: "角色",   en: "Role" },
  routing_provider: { zh: "服務商", en: "Provider" },
  routing_model:    { zh: "模型",   en: "Model" },
  routing_fallback: { zh: "備用",   en: "Fallback" },
  routing_task:     { zh: "任務說明", en: "Task" },

  // Queue tab
  queue_title:     { zh: "帖文排程", en: "Post Queue" },
  queue_items:     { zh: "筆",       en: "items" },
  queue_platform:  { zh: "平台",     en: "Platform" },
  queue_topic:     { zh: "主題",     en: "Topic" },
  queue_preview:   { zh: "內容預覽", en: "Preview" },
  queue_module:    { zh: "模組",     en: "Module" },
  queue_model:     { zh: "模型",     en: "Model" },
  queue_scheduled: { zh: "發布時間", en: "Scheduled" },
  queue_status:    { zh: "狀態",     en: "Status" },
  queue_schedule_btn: { zh: "排程發布", en: "Schedule" },
  queue_pending:   { zh: "待審",   en: "pending" },
  queue_scheduled_s: { zh: "已排程", en: "scheduled" },
  queue_published: { zh: "已發布", en: "published" },
  queue_failed:    { zh: "失敗",   en: "failed" },

  // Workflow tab
  workflow_content_title: { zh: "內容生成流程",  en: "Content Generation Pipeline" },
  workflow_slides_title:  { zh: "簡報生成流程",  en: "Slides Generation Pipeline" },
  workflow_content_steps: {
    zh: [
      "從排程隊列取得主題及內容柱分類",
      "以廣東話起稿，包含具體可用的 deliverable",
      "生成 Midjourney / DALL-E 視覺圖片提示詞",
      "透過 Publer API 排程，Telegram 發送通知",
      "帖文發布後，記錄至 Google Sheet",
    ],
    en: [
      "Receive topic + pillar from queue",
      "Draft Cantonese post with concrete deliverable",
      "Generate visual prompt for Midjourney/DALL-E",
      "Schedule via Publer API, notify via Telegram",
      "Post published, log to Google Sheet",
    ],
  },
  workflow_slides_steps: {
    zh: [
      "輸入主題、目標學員及工具類型",
      "Gemini / Claude 生成結構化 16 頁簡報大綱",
      "JSON 大綱含類型標籤（示範 / 練習 / 總結）",
      "匯出至 Canva 模板或透過 API 生成 Google Slides",
    ],
    en: [
      "Topic + audience + tool input",
      "Gemini/Claude generates structured 16-slide outline",
      "JSON outline with type tags (demo/exercise/summary)",
      "Export to Canva template or Google Slides via API",
    ],
  },
  workflow_nodes_content: {
    zh: ["CMO\n統籌代理", "內容\n撰寫代理", "視覺\nPrompt生成", "發布\n代理", "Publer /\nTelegram"],
    en: ["CMO\nOrchestrator", "Content\nDrafter", "Visual\nPrompt Gen", "Publisher\nAgent", "Publer /\nTelegram"],
  },
  workflow_nodes_slides: {
    zh: ["表單\n輸入", "Gemini\n生成大綱", "16頁\nJSON", "Google\nSlides"],
    en: ["Form\nInput", "Gemini\nOutline", "16-Slide\nJSON", "Google\nSlides"],
  },

  // Slides tab
  slides_topic:     { zh: "主題",        en: "Topic" },
  slides_audience:  { zh: "目標學員",    en: "Audience" },
  slides_tool:      { zh: "工具 / 課程", en: "Tool / Course" },
  slides_provider:  { zh: "AI 服務商",   en: "AI Provider" },
  slides_gen_btn:   { zh: "▦ 生成 16 頁簡報", en: "▦ Generate 16 Slides" },
  slides_loading:   { zh: "⟳ 生成中...",      en: "⟳ Generating..." },
  slides_empty:     { zh: "輸入主題後，即可生成 16 頁簡報大綱", en: "Enter a topic and generate your 16-slide outline" },
  slides_export:    { zh: "匯出格式", en: "Export" },

  // Content pillars
  pillars: {
    zh: ["AI 工具教育", "Prompt 工程", "Manus 自動化", "學校合作", "成功案例", "幕後製作"],
    en: ["AI Tools Education", "Prompt Engineering", "Manus Automation", "School Partnership", "Case Study", "Behind the Scenes"],
  },

  // Agent config right panel
  agent_config_provider: { zh: "服務商", en: "Provider" },
  agent_config_model:    { zh: "模型",   en: "Model" },
  agent_config_fallback: { zh: "備用",   en: "Fallback" },
  agent_config_cost:     { zh: "費用/1K", en: "Cost/1K" },

  // Log messages
  log_init:  { zh: "KickAds 內容引擎已啟動", en: "KickAds Content Engine initialized" },
  log_ready: { zh: "就緒。等待任務排程。",   en: "Ready. Awaiting task queue." },

  // Guide tab
  guide_subtitle: { zh: "AI 驅動嘅香港教育內容生產系統 · BYOK 多模型 · 廣東話優先 · 一鍵排程發布", en: "AI-powered HK education content engine · BYOK multi-model · Cantonese-first · one-click scheduling" },
  guide_quickstart: { zh: "快速開始：密鑰配置 → 填入 API 金鑰 → 測試連線 → 右側輸入主題 → 生成帖文", en: "Quick start: BYOK Keys → Enter API key → Test connection → Enter topic → Generate Post" },
};

export function t(key: keyof typeof i18n, lang: Lang): string {
  const entry = i18n[key];
  if (!entry) return key;
  if (typeof (entry as any)[lang] === "string") return (entry as any)[lang];
  return key;
}

export function tArr(key: keyof typeof i18n, lang: Lang): string[] {
  const entry = i18n[key] as any;
  if (!entry) return [];
  return entry[lang] ?? [];
}
