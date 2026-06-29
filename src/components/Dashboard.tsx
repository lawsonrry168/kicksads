"use client";

import React, { useState, useCallback } from "react";
import { PROVIDERS, AGENTS, type Provider } from "@/lib/providers";
import { generatePost, generateSlides, type SlideOutline, type BrandContext } from "@/lib/agents";
import AgentLog, { type LogEntry } from "./AgentLog";
import { type Lang, t, tArr } from "@/lib/i18n";

type TabId = "byok" | "routing" | "workflow" | "queue" | "slides" | "guide";

interface ProviderState {
  apiKey: string;
  selectedModel: string;
  connected: boolean;
  error: string;
  showKey: boolean;
  testing: boolean;
}

interface PostQueueItem {
  id: string;
  topic: string;
  platform: string;
  content: string;
  module: string;
  model: string;
  status: "pending" | "scheduled" | "published" | "failed";
  scheduledAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  instagram: "#e1306c",
  linkedin: "#0077b5",
  telegram: "#229ed9",
  twitter: "#1da1f2",
};

const STATUS_BADGE: Record<PostQueueItem["status"], string> = {
  pending: "badge-amber",
  scheduled: "badge-blue",
  published: "badge-green",
  failed: "badge-red",
};

const SIDEBAR_ITEMS: { id: TabId; icon: string; labelKey: "tab_byok"|"tab_routing"|"tab_workflow"|"tab_queue"|"tab_slides"|"tab_guide" }[] = [
  { id: "byok",     icon: "🔑", labelKey: "tab_byok" },
  { id: "routing",  icon: "⇄",  labelKey: "tab_routing" },
  { id: "workflow", icon: "◈",  labelKey: "tab_workflow" },
  { id: "queue",    icon: "≡",  labelKey: "tab_queue" },
  { id: "slides",   icon: "▦",  labelKey: "tab_slides" },
  { id: "guide",    icon: "?",  labelKey: "tab_guide" },
];


function GuideTab({ lang }: { lang: Lang }) {
  const sections = lang === "zh" ? [
    {
      icon: "🔑",
      title: "密鑰配置 — BYOK 設定",
      color: "var(--purple2)",
      steps: [
        "前往「密鑰配置」頁面，你會看到六個 AI 服務商卡片",
        "在每個服務商輸入欄貼上你自己的 API 金鑰（格式如 sk-ant-... / sk-proj-... / AIza...）",
        "點擊「測試」按鈕驗證金鑰有效性 — 綠色表示已連接",
        "金鑰只存在瀏覽器記憶體，重新整理頁面後需重新輸入",
        "右側「服務商」列表底部圓點顏色代表整體連接狀態",
      ],
      tips: "建議優先設定 DeepSeek（廣東話帖文最平）及 Gemini（簡報生成最快）",
    },
    {
      icon: "✦",
      title: "生成帖文 — 快速上手",
      color: "var(--teal2)",
      steps: [
        "在右側「生成帖文」面板填入主題，例如：「用 ChatGPT 幫老師備課」",
        "從「內容柱」下拉選單選擇內容方向（共 6 個 Pillar）",
        "點擊服務商按鈕選擇要使用的 AI（需先在密鑰配置設定金鑰）",
        "點擊「✦ 生成帖文」— 系統將以廣東話生成符合品牌聲調的帖文",
        "生成完成後，帖文自動加入「發布排程」排隊",
      ],
      tips: "DeepSeek V3 最適合大量生成；Anthropic Claude 用於品牌聲調要求高的內容",
    },
    {
      icon: "⇄",
      title: "路由設定 — 代理人分工",
      color: "var(--amber)",
      steps: [
        "「路由設定」頁面顯示六個 Agent 各自對應的服務商、模型及備用方案",
        "CMO Orchestrator → Anthropic Claude Sonnet（策略決策）",
        "Content Drafter → DeepSeek V3（廣東話草稿，成本最低）",
        "Visual Prompt Gen → OpenAI GPT-4o（視覺理解）",
        "Slides Maker → Google Gemini Flash（簡報生成）",
        "目前路由為固定設定，未來版本將支援動態切換",
      ],
      tips: "備用欄（Fallback）顯示主要服務商失敗時的後備方案",
    },
    {
      icon: "◈",
      title: "工作流程 — n8n 自動化",
      color: "var(--coral)",
      steps: [
        "「工作流程」頁面顯示兩條自動化 Pipeline 的視覺示意圖",
        "內容生成流程：排程觸發 → CMO 統籌 → 撰寫 → 視覺 Prompt → Telegram 審批 → Publer 發布",
        "簡報生成流程：Webhook 觸發 → Gemini 生成大綱 → Apps Script 建立 Google Slides",
        "匯入 n8n Workflow：開啟 n8n → Import → 選取 n8n/content-engine-workflow.json",
        "在 n8n 設定各服務商 Credentials，參考 n8n/README.md 完整指引",
      ],
      tips: "n8n 需要獨立安裝，可使用 n8n cloud 或本地 Docker 部署",
    },
    {
      icon: "≡",
      title: "發布排程 — 管理帖文隊列",
      color: "var(--blue)",
      steps: [
        "「發布排程」頁面列出所有待發布的帖文",
        "狀態說明：待審（橙）→ 已排程（藍）→ 已發布（綠）/ 失敗（紅）",
        "點擊「排程發布」將帖文推送至 Publer 隊列（需設定 Publer API 金鑰）",
        "「匯出排程 CSV」可下載完整排程表格",
        "「同步至試算表」可將隊列同步至 Google Sheets",
      ],
      tips: "Publer API 金鑰設定方式：登入 publer.io → Settings → API → 複製金鑰貼入右側「整合設定」",
    },
    {
      icon: "▦",
      title: "簡報生成 — 教學 Slide Deck",
      color: "var(--green)",
      steps: [
        "「簡報生成」頁面專為工作坊及學校教學設計",
        "填入主題（例：Prompt Engineering 入門）、目標學員（例：中學老師）",
        "選擇工具 / 課程名稱，再選擇 AI 服務商（建議 Gemini Flash）",
        "點擊「▦ 生成 16 頁簡報」— 系統輸出完整大綱含類型標籤",
        "可匯出 JSON 供 Apps Script 自動建立 Google Slides，或匯出 CSV 格式",
      ],
      tips: "16 頁結構：封面 + 議程 + 12 頁正文（示範/練習/總結）+ Q&A + 回顧",
    },
    {
      icon: "⬡",
      title: "整合設定 — 連接外部服務",
      color: "var(--text2)",
      steps: [
        "Publer：社交媒體排程平台，支援 Threads、IG、Facebook 等",
        "Telegram Bot：用於 n8n Workflow 的審批通知及確認訊息",
        "n8n Webhook：連接 n8n 自動化工作流程的觸發端點",
        "Google Sheets：存放主題 Backlog 及發布記錄",
        "Apps Script：Google Slides 自動生成腳本部署網址",
      ],
      tips: "所有整合均透過 .env.local 環境變量設定，參考 .env.example 檔案",
    },
    {
      icon: "💰",
      title: "費用追蹤 — 成本管理",
      color: "var(--amber)",
      steps: [
        "右側「費用追蹤」面板顯示今日、本週、本月累計費用",
        "各服務商費用分開列示，方便比較不同模型的成本效益",
        "DeepSeek V3：$0.00027/1K tokens（最低成本）",
        "Gemini 1.5 Flash：$0.0001/1K tokens（簡報最划算）",
        "Anthropic Claude Sonnet：$0.003/1K tokens（品質最高）",
      ],
      tips: "建議：大量草稿用 DeepSeek，最終潤稿及策略決策用 Claude",
    },
  ] : [
    {
      icon: "🔑",
      title: "BYOK Keys — API Setup",
      color: "var(--purple2)",
      steps: [
        "Go to the BYOK Keys tab — you'll see six AI provider cards",
        "Paste your own API key into each provider's input field (e.g. sk-ant-... / sk-proj-... / AIza...)",
        "Click the Test button to validate — green dot means connected",
        "Keys are stored in browser memory only; re-enter after page refresh",
        "The dot at the bottom of the sidebar shows overall connection status",
      ],
      tips: "Start with DeepSeek (cheapest for bulk posts) and Gemini (fastest for slides)",
    },
    {
      icon: "✦",
      title: "Generate Post — Quick Start",
      color: "var(--teal2)",
      steps: [
        "Fill in a topic in the Generate Post panel, e.g. 'Use ChatGPT to plan lessons'",
        "Choose a content pillar from the dropdown (6 pillars available)",
        "Click a provider button to select your AI (API key must be set first)",
        "Click '✦ Generate Post' — the system drafts a Cantonese post in brand voice",
        "After generation, the post is automatically added to the Post Queue",
      ],
      tips: "DeepSeek V3 is best for bulk generation; Claude is best for high-quality brand voice",
    },
    {
      icon: "⇄",
      title: "Routing — Agent Assignment",
      color: "var(--amber)",
      steps: [
        "The Routing tab shows each agent's assigned provider, model, and fallback",
        "CMO Orchestrator → Anthropic Claude Sonnet (strategy decisions)",
        "Content Drafter → DeepSeek V3 (Cantonese drafts, lowest cost)",
        "Visual Prompt Gen → OpenAI GPT-4o (visual understanding)",
        "Slides Maker → Google Gemini Flash (slide generation)",
        "Routing is currently fixed; dynamic switching coming in a future version",
      ],
      tips: "The Fallback column shows the backup provider if the primary fails",
    },
    {
      icon: "◈",
      title: "Workflow — n8n Automation",
      color: "var(--coral)",
      steps: [
        "The Workflow tab shows visual diagrams for two automation pipelines",
        "Content pipeline: schedule trigger → CMO → draft → visual prompt → Telegram approval → Publer publish",
        "Slides pipeline: webhook trigger → Gemini outline → Apps Script builds Google Slides",
        "Import to n8n: open n8n → Import → select n8n/content-engine-workflow.json",
        "Set provider credentials in n8n — see n8n/README.md for full guide",
      ],
      tips: "n8n requires separate installation; use n8n cloud or local Docker",
    },
    {
      icon: "≡",
      title: "Post Queue — Manage Scheduled Posts",
      color: "var(--blue)",
      steps: [
        "The Queue tab lists all posts waiting to be published",
        "Status: pending (orange) → scheduled (blue) → published (green) / failed (red)",
        "Click 'Schedule' to push a post to Publer queue (Publer API key required)",
        "'Export Queue CSV' downloads the full schedule table",
        "'Sync to Sheet' syncs the queue to Google Sheets",
      ],
      tips: "Get your Publer API key: log in to publer.io → Settings → API → copy key into Integrations",
    },
    {
      icon: "▦",
      title: "Slides — Teaching Slide Deck",
      color: "var(--green)",
      steps: [
        "The Slides tab is designed for workshops and school teaching",
        "Enter a topic (e.g. Prompt Engineering 101) and audience (e.g. Secondary teachers)",
        "Choose a tool/course name and AI provider (Gemini Flash recommended)",
        "Click '▦ Generate 16 Slides' — system outputs a full outline with type tags",
        "Export JSON for Apps Script to auto-build Google Slides, or export as CSV",
      ],
      tips: "16-slide structure: cover + agenda + 12 content slides (demo/exercise/summary) + Q&A + recap",
    },
    {
      icon: "⬡",
      title: "Integrations — External Services",
      color: "var(--text2)",
      steps: [
        "Publer: social media scheduling platform supporting Threads, IG, Facebook, etc.",
        "Telegram Bot: used in n8n Workflow for approval notifications",
        "n8n Webhook: trigger endpoint connecting to n8n automation workflows",
        "Google Sheets: stores topic backlog and publish records",
        "Apps Script: deployed URL for auto-generating Google Slides",
      ],
      tips: "All integrations are configured via .env.local environment variables — see .env.example",
    },
    {
      icon: "💰",
      title: "Cost Tracker — Usage Management",
      color: "var(--amber)",
      steps: [
        "The Cost Tracker panel shows today's, this week's, and this month's totals",
        "Costs are broken down by provider for easy model comparison",
        "DeepSeek V3: $0.00027/1K tokens (lowest cost)",
        "Gemini 1.5 Flash: $0.0001/1K tokens (best value for slides)",
        "Anthropic Claude Sonnet: $0.003/1K tokens (highest quality)",
      ],
      tips: "Recommended: use DeepSeek for bulk drafts, Claude for final polish and strategy",
    },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "20px" }}>?</span>
          <h2 style={{ margin: 0, fontSize: "16px", color: "var(--text1)", fontWeight: 700 }}>
            KickAds Content Engine — {lang === "zh" ? "完整使用說明" : "Complete Guide"}
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "var(--text3)", lineHeight: "1.6" }}>
          {t("guide_subtitle", lang)}
        </p>
        <div style={{
          marginTop: "12px",
          padding: "10px 14px",
          background: "rgba(124, 111, 255, 0.08)",
          border: "1px solid rgba(124, 111, 255, 0.25)",
          borderRadius: "6px",
          fontSize: "11px",
          color: "var(--purple2)",
          lineHeight: "1.7",
        }}>
          <strong>{lang === "zh" ? "快速開始：" : "Quick Start: "}</strong> {t("guide_quickstart", lang)}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {sections.map((s) => (
          <div
            key={s.title}
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Section header */}
            <div style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg4)",
            }}>
              <span style={{ fontSize: "14px" }}>{s.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: s.color }}>
                {s.title}
              </span>
            </div>
            {/* Steps */}
            <div style={{ padding: "12px 16px" }}>
              <ol style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {s.steps.map((step, i) => (
                  <li key={i} style={{ fontSize: "12px", color: "var(--text2)", lineHeight: "1.6" }}>
                    {step}
                  </li>
                ))}
              </ol>
              <div style={{
                marginTop: "10px",
                padding: "7px 10px",
                background: "rgba(20, 184, 166, 0.07)",
                border: "1px solid rgba(20, 184, 166, 0.2)",
                borderRadius: "4px",
                fontSize: "11px",
                color: "var(--teal2)",
              }}>
                💡 {s.tips}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* API Key quick reference */}
      <div style={{
        marginTop: "20px",
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "10px 16px", background: "var(--bg4)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text1)" }}>
            🗝 {lang === "zh" ? "API 金鑰取得方式" : "API Key Reference"}
          </span>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {(lang === "zh"
                  ? ["服務商", "金鑰格式", "免費額度", "取得網址"]
                  : ["Provider", "Key Format", "Free Tier", "URL"]
                ).map((h) => (
                  <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "var(--text3)", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(lang === "zh" ? [
                ["Anthropic", "sk-ant-...", "無免費版", "console.anthropic.com"],
                ["OpenAI", "sk-proj-...", "$5 新戶", "platform.openai.com"],
                ["Gemini", "AIza...", "每日免費", "aistudio.google.com"],
                ["DeepSeek", "sk-...", "有免費額度", "platform.deepseek.com"],
                ["Grok", "grok-...", "視乎計劃", "console.x.ai"],
                ["Mistral", "...", "有免費層", "console.mistral.ai"],
              ] : [
                ["Anthropic", "sk-ant-...", "No free tier", "console.anthropic.com"],
                ["OpenAI", "sk-proj-...", "$5 new user", "platform.openai.com"],
                ["Gemini", "AIza...", "Free daily quota", "aistudio.google.com"],
                ["DeepSeek", "sk-...", "Free credits", "platform.deepseek.com"],
                ["Grok", "grok-...", "Plan-dependent", "console.x.ai"],
                ["Mistral", "...", "Free tier", "console.mistral.ai"],
              ]).map(([name, fmt, free, url]) => (
                <tr key={name} style={{ borderBottom: "1px solid rgba(42,51,80,0.5)" }}>
                  <td style={{ padding: "6px 8px", color: "var(--text1)", fontWeight: 600 }}>{name}</td>
                  <td style={{ padding: "6px 8px", color: "var(--teal2)", fontFamily: "monospace" }}>{fmt}</td>
                  <td style={{ padding: "6px 8px", color: "var(--text3)" }}>{free}</td>
                  <td style={{ padding: "6px 8px", color: "var(--blue)", fontSize: "10px" }}>{url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Pillars */}
      <div style={{
        marginTop: "16px",
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "24px",
      }}>
        <div style={{ padding: "10px 16px", background: "var(--bg4)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text1)" }}>
            📊 {lang === "zh" ? "四條 Content Pillar 策略" : "Content Pillar Strategy"}
          </span>
        </div>
        <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {(lang === "zh" ? [
            { label: "AI 工具示範", pct: "40%", color: "var(--teal2)", desc: "Save-bait Carousel + Thread" },
            { label: "教育者視角", pct: "25%", color: "var(--purple2)", desc: "建立公信力，Thread + Reels" },
            { label: "Founder POV", pct: "20%", color: "var(--amber)", desc: "品牌信任，Long-form Thread" },
            { label: "B2B 學校 Proof", pct: "15%", color: "var(--coral)", desc: "轉化學校客戶，IG 單圖" },
          ] : [
            { label: "AI Tool Demo", pct: "40%", color: "var(--teal2)", desc: "Save-bait Carousel + Thread" },
            { label: "Educator POV", pct: "25%", color: "var(--purple2)", desc: "Build credibility, Thread + Reels" },
            { label: "Founder POV", pct: "20%", color: "var(--amber)", desc: "Brand trust, Long-form Thread" },
            { label: "B2B School Proof", pct: "15%", color: "var(--coral)", desc: "Convert school clients, IG single image" },
          ]).map((p) => (
            <div key={p.label} style={{
              padding: "10px",
              background: "var(--bg4)",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: p.color, fontWeight: 700 }}>{p.label}</span>
                <span style={{ fontSize: "13px", color: p.color, fontWeight: 800 }}>{p.pct}</span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text3)" }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function now(): string {
  return new Date().toLocaleTimeString("en-HK", { hour12: false });
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("byok");
  const [selectedAgent, setSelectedAgent] = useState<string>("content-drafter");
  const [lang, setLang] = useState<Lang>("zh");

  const [providerStates, setProviderStates] = useState<
    Record<string, ProviderState>
  >(() => {
    const initial: Record<string, ProviderState> = {};
    PROVIDERS.forEach((p) => {
      initial[p.id] = {
        apiKey: "",
        selectedModel: p.defaultModel,
        connected: false,
        error: "",
        showKey: false,
        testing: false,
      };
    });
    return initial;
  });

  const [queue, setQueue] = useState<PostQueueItem[]>([
    {
      id: "q1",
      topic: "用 ChatGPT 寫 lesson plan",
      platform: "facebook",
      content: "老師你試過用 AI 寫 lesson plan 未？今日分享一個 prompt...",
      module: "Content Drafter",
      model: "claude-3-5-sonnet",
      status: "scheduled",
      scheduledAt: "2026-06-27 09:00",
    },
    {
      id: "q2",
      topic: "Manus 自動化教學流程",
      platform: "instagram",
      content: "Manus 唔係普通 AI，佢係 agent framework...",
      module: "Content Drafter",
      model: "deepseek-chat",
      status: "pending",
      scheduledAt: "2026-06-27 14:00",
    },
    {
      id: "q3",
      topic: "AI prompt checklist for teachers",
      platform: "linkedin",
      content: "Share 返我哋整理嘅 10 個 teacher prompt...",
      module: "CMO Orchestrator",
      model: "gpt-4o",
      status: "published",
      scheduledAt: "2026-06-26 10:00",
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      time: "09:01:12",
      agent: "system",
      message: "KickAds 內容引擎已啟動",
      level: "info",
    },
    {
      time: "09:01:13",
      agent: "cmo-orchestrator",
      message: "就緒。等待任務排程。",
      level: "ok",
    },
  ]);

  // Generate post form state
  const [genTopic, setGenTopic] = useState("");
  const [genPillar, setGenPillar] = useState("AI 工具教育");
  const [genProvider, setGenProvider] = useState("anthropic");
  const [genResult, setGenResult] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  // Integration state
  const [integrations, setIntegrations] = useState({
    publerKey: "",
    telegramToken: "",
    n8nWebhookUrl: "",
    googleSheetsId: "",
    appsScriptUrl: "",
  });
  const [integrationExpanded, setIntegrationExpanded] = useState<string | null>(null);
  const [integrationTestState, setIntegrationTestState] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});

  function setIntegrationField(field: keyof typeof integrations, value: string) {
    setIntegrations((prev) => ({ ...prev, [field]: value }));
    // Reset test state when value changes
    setIntegrationTestState((prev) => ({ ...prev, [field]: "idle" }));
  }

  async function testIntegration(key: keyof typeof integrations, val: string) {
    if (!val) return;
    setIntegrationTestState((prev) => ({ ...prev, [key]: "testing" }));
    // Simulate async test with mock responses
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const mockResults: Record<string, "ok" | "fail"> = {
      publerKey: val.length > 8 ? "ok" : "fail",
      telegramToken: val.includes(":") ? "ok" : "fail",
      n8nWebhookUrl: val.startsWith("http") ? "ok" : "fail",
      googleSheetsId: val.length > 20 ? "ok" : "fail",
      appsScriptUrl: val.startsWith("http") ? "ok" : "fail",
    };
    setIntegrationTestState((prev) => ({ ...prev, [key]: mockResults[key] }));
  }

  // Brand context state
  const [brandInput, setBrandInput] = useState({
    name: "",
    referenceUrls: "",   // competitor / reference URLs, one per line
    keywords: "",
    audience: "",
    rawNotes: "",        // free-form user description
  });
  const [brand, setBrand] = useState<BrandContext | null>(null);
  const [brandAnalyzing, setBrandAnalyzing] = useState(false);
  const [brandError, setBrandError] = useState("");

  const handleAnalyzeBrand = async () => {
    const apiProvider = Object.entries(providerStates).find(([, s]) => s.connected && s.apiKey);
    if (!apiProvider) {
      setBrandError(lang === "zh" ? "請先設定並測試任一 AI 金鑰" : "Connect at least one AI provider first");
      return;
    }
    const [provider, state] = apiProvider;
    setBrandAnalyzing(true);
    setBrandError("");
    addLog("visual-prompt-gen", lang === "zh" ? "分析品牌素材中…" : "Analyzing brand materials…", "info");

    const analysisPrompt = `你係一個品牌策略師同視覺設計顧問。
根據以下資料，生成一份結構化品牌設定 JSON，用於指導社交媒體帖文撰寫同視覺 Prompt 生成。

品牌名稱：${brandInput.name || "未提供"}
目標受眾描述：${brandInput.audience || "未提供"}
品牌關鍵字 / 服務：${brandInput.keywords || "未提供"}
競對/參考網站：${brandInput.referenceUrls || "未提供"}
補充說明：${brandInput.rawNotes || "未提供"}

請回傳 pure JSON（不要 markdown code block），格式如下：
{
  "name": "品牌名稱",
  "tone": "語氣描述（例：專業但親切，地道廣東話，帶教育感）",
  "audience": "目標受眾（例：香港中學老師、教育工作者、30-50歲）",
  "colorPalette": "建議色彩方案（例：深藍 #1e3a5f, 紫色 #7c6fff, 白色 #ffffff）",
  "visualStyle": "視覺語言（例：flat design, 簡潔現代, 教育科技感, 少裝飾）",
  "competitors": "競對分析摘要（例：競對多用正式英文, 本品牌以廣東話親切感區分）",
  "keywords": "核心關鍵字標籤（例：#AI教育 #Prompt工程 #香港教師）",
  "referenceUrls": "${brandInput.referenceUrls}"
}`;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: analysisPrompt,
          pillar: "brand-analysis",
          provider,
          apiKey: state.apiKey,
          model: state.selectedModel,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      const raw: string = data.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(lang === "zh" ? "AI 未能生成有效 JSON" : "AI did not return valid JSON");
      const parsed = JSON.parse(jsonMatch[0]) as BrandContext;
      parsed.generatedAt = new Date().toLocaleString("zh-HK");
      setBrand(parsed);
      addLog("visual-prompt-gen", lang === "zh" ? "品牌設定已生成 ✓" : "Brand profile generated ✓", "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setBrandError(msg);
      addLog("visual-prompt-gen", `Brand analysis error: ${msg}`, "error");
    } finally {
      setBrandAnalyzing(false);
    }
  };

  // Slides form state
  const [slideTopic, setSlideTopic] = useState("");
  const [slideAudience, setSlideAudience] = useState("中學老師 / 教育工作者");
  const [slideTool, setSlideTool] = useState("AI Prompt Engineering");
  const [slideProvider, setSlideProvider] = useState("gemini");
  const [slideOutline, setSlideOutline] = useState<SlideOutline[]>([]);
  const [slideLoading, setSlideLoading] = useState(false);
  const [slideError, setSlideError] = useState("");

  const addLog = useCallback(
    (agent: string, message: string, level: LogEntry["level"] = "info") => {
      setLogs((prev) => [...prev, { time: now(), agent, message, level }]);
    },
    []
  );

  const updateProvider = (id: string, patch: Partial<ProviderState>) => {
    setProviderStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const testConnection = async (provider: Provider) => {
    const state = providerStates[provider.id];
    if (!state.apiKey.trim()) {
      updateProvider(provider.id, { error: "API key required", connected: false });
      return;
    }
    updateProvider(provider.id, { testing: true, error: "" });
    addLog("system", `Testing ${provider.name} connection...`, "info");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "connection test",
          pillar: "test",
          provider: provider.id,
          model: state.selectedModel,
          apiKey: state.apiKey,
        }),
      });
      if (res.ok) {
        updateProvider(provider.id, { connected: true, error: "", testing: false });
        addLog("system", `${provider.name} connected ✓`, "ok");
      } else {
        const data = await res.json();
        updateProvider(provider.id, {
          connected: false,
          error: data.error || "Connection failed",
          testing: false,
        });
        addLog("system", `${provider.name} failed: ${data.error}`, "error");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      updateProvider(provider.id, { connected: false, error: msg, testing: false });
      addLog("system", `${provider.name} error: ${msg}`, "error");
    }
  };

  const handleGenerate = async () => {
    if (!genTopic.trim()) return;
    const state = providerStates[genProvider];
    if (!state.apiKey.trim()) {
      setGenError(`${genProvider} 尚未設定 API 金鑰，請先至「密鑰配置」頁面設定。`);
      return;
    }
    setGenLoading(true);
    setGenError("");
    setGenResult("");
    addLog("content-drafter", `Generating post: "${genTopic}"`, "info");
    try {
      const content = await generatePost(
        genTopic,
        genPillar,
        genProvider,
        state.apiKey,
        brand ?? undefined
      );
      setGenResult(content);
      addLog("content-drafter", "Post generated successfully", "ok");
      setQueue((prev) => [
        {
          id: `q${Date.now()}`,
          topic: genTopic,
          platform: "facebook",
          content: content.slice(0, 80) + "...",
          module: "Content Drafter",
          model: state.selectedModel,
          status: "pending",
          scheduledAt: new Date(Date.now() + 86400000)
            .toISOString()
            .slice(0, 16)
            .replace("T", " "),
        },
        ...prev,
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      setGenError(msg);
      addLog("content-drafter", `Error: ${msg}`, "error");
    } finally {
      setGenLoading(false);
    }
  };

  const handleGenerateSlides = async () => {
    if (!slideTopic.trim()) return;
    const state = providerStates[slideProvider];
    if (!state.apiKey.trim()) {
      setSlideError(`${slideProvider} 尚未設定 API 金鑰，請先至「密鑰配置」頁面設定。`);
      return;
    }
    setSlideLoading(true);
    setSlideError("");
    setSlideOutline([]);
    addLog("slides-maker", `Generating slides: "${slideTopic}"`, "info");
    try {
      const result = await generateSlides(
        slideTopic,
        slideAudience,
        slideProvider,
        state.apiKey
      );
      setSlideOutline(result.outline);
      addLog("slides-maker", `Generated ${result.outline.length} slides`, "ok");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Slides generation failed";
      setSlideError(msg);
      addLog("slides-maker", `Error: ${msg}`, "error");
    } finally {
      setSlideLoading(false);
    }
  };

  const connectedCount = Object.values(providerStates).filter(
    (s) => s.connected
  ).length;

  const activeAgent = AGENTS.find((a) => a.id === selectedAgent);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
        fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "48px",
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "8px",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            background: "var(--purple)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: "700",
            color: "#fff",
            marginBottom: "8px",
          }}
        >
          K
        </div>
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={t(item.labelKey, lang)}
            style={{
              width: "38px",
              height: "38px",
              background:
                activeTab === item.id
                  ? "rgba(124,111,255,0.2)"
                  : "transparent",
              border:
                activeTab === item.id
                  ? "1px solid rgba(124,111,255,0.5)"
                  : "1px solid transparent",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              transition: "all 0.15s",
            }}
          >
            {item.icon}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background:
              connectedCount > 0 ? "var(--green)" : "var(--text3)",
            marginBottom: "12px",
            boxShadow:
              connectedCount > 0 ? "0 0 6px var(--green)" : "none",
          }}
          title={`${connectedCount} provider(s) connected`}
        />
      </aside>

      {/* Left panel */}
      <aside
        style={{
          width: "220px",
          background: "var(--bg2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Agents */}
        <div className="ide-panel-header">
          <span style={{ color: "var(--purple2)" }}>◈</span> {t("panel_agents", lang)}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {AGENTS.map((agent) => {
            const provState = providerStates[agent.provider];
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  borderLeft: `3px solid ${
                    selectedAgent === agent.id ? "var(--purple)" : "transparent"
                  }`,
                  background:
                    selectedAgent === agent.id
                      ? "rgba(124,111,255,0.08)"
                      : "transparent",
                  borderBottom: "1px solid var(--border)",
                  transition: "all 0.1s",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color:
                      selectedAgent === agent.id
                        ? "var(--text)"
                        : "var(--text2)",
                    fontWeight: selectedAgent === agent.id ? "600" : "400",
                    marginBottom: "2px",
                  }}
                >
                  {lang === "zh" ? agent.nameZh : agent.name}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: provState?.connected
                        ? "var(--green)"
                        : "var(--text3)",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  {agent.provider}
                </div>
              </div>
            );
          })}
        </div>

        {/* Provider status */}
        <div
          className="ide-panel-header"
          style={{ marginTop: "auto", borderTop: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--teal2)" }}>◉</span> {t("panel_providers", lang)}
        </div>
        <div style={{ overflowY: "auto", maxHeight: "180px" }}>
          {PROVIDERS.map((p) => {
            const state = providerStates[p.id];
            return (
              <div
                key={p.id}
                style={{
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "3px",
                    background: p.color,
                    color: p.textColor,
                    fontSize: "8px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    letterSpacing: "0",
                  }}
                >
                  {p.logo}
                </div>
                <span
                  style={{ fontSize: "11px", color: "var(--text2)", flex: 1 }}
                >
                  {p.name}
                </span>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: state.connected
                      ? "var(--green)"
                      : state.error
                      ? "var(--red)"
                      : "var(--text3)",
                    flexShrink: 0,
                  }}
                />
              </div>
            );
          })}
        </div>
      </aside>

      {/* Center */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            background: "var(--bg2)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "stretch",
            padding: "0 8px",
            gap: "2px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              fontSize: "11px",
              color: "var(--purple2)",
              fontWeight: "700",
              letterSpacing: "0.1em",
              borderRight: "1px solid var(--border)",
              marginRight: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            KICKADS
          </div>
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`ide-tab${activeTab === item.id ? " active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom:
                  activeTab === item.id
                    ? "2px solid var(--purple)"
                    : "2px solid transparent",
                padding: "8px 16px",
                fontSize: "12px",
                cursor: "pointer",
                color:
                  activeTab === item.id ? "var(--purple2)" : "var(--text3)",
                transition: "color 0.15s",
                fontFamily: "inherit",
              }}
            >
              {item.icon} {t(item.labelKey, lang).toUpperCase()}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            style={{
              padding: "3px 10px",
              fontSize: "11px",
              background: "var(--bg4)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              color: "var(--purple2)",
              cursor: "pointer",
              fontWeight: 700,
              letterSpacing: "0.5px",
              marginRight: "4px",
            }}
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 12px",
              fontSize: "11px",
              color: "var(--text3)",
            }}
          >
            <span
              style={{
                color: connectedCount > 0 ? "var(--green)" : "var(--text3)",
              }}
            >
              {connectedCount}/{PROVIDERS.length} {t("connected_count", lang)}
            </span>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {activeTab === "byok" && (
            <BYOKTab
              providers={PROVIDERS}
              states={providerStates}
              onUpdate={updateProvider}
              onTest={testConnection}
              genTopic={genTopic}
              genPillar={genPillar}
              genProvider={genProvider}
              genResult={genResult}
              genLoading={genLoading}
              genError={genError}
              onTopicChange={setGenTopic}
              onPillarChange={setGenPillar}
              onProviderChange={setGenProvider}
              onGenerate={handleGenerate}
              lang={lang}
              brandInput={brandInput}
              onBrandInputChange={(field, val) => setBrandInput((p) => ({ ...p, [field]: val }))}
              brand={brand}
              brandAnalyzing={brandAnalyzing}
              brandError={brandError}
              onAnalyzeBrand={handleAnalyzeBrand}
              onClearBrand={() => { setBrand(null); setBrandError(""); }}
            />
          )}
          {activeTab === "routing" && <RoutingTab lang={lang} />}
          {activeTab === "workflow" && <WorkflowTab lang={lang} />}
          {activeTab === "queue" && (
            <QueueTab queue={queue} onUpdateQueue={setQueue} lang={lang} />
          )}
          {activeTab === "slides" && (
            <SlidesTab
              topic={slideTopic}
              audience={slideAudience}
              tool={slideTool}
              provider={slideProvider}
              outline={slideOutline}
              loading={slideLoading}
              error={slideError}
              onTopicChange={setSlideTopic}
              onAudienceChange={setSlideAudience}
              onToolChange={setSlideTool}
              onProviderChange={setSlideProvider}
              onGenerate={handleGenerateSlides}
              lang={lang}
            />
          )}
          {activeTab === "guide" && <GuideTab lang={lang} />}
        </div>

        {/* Log panel */}
        <div
          style={{
            height: "140px",
            borderTop: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div className="ide-panel-header">
            <span style={{ color: "var(--teal)" }}>▶</span> {t("panel_log", lang)}
          </div>
          <div style={{ height: "calc(100% - 28px)" }}>
            <AgentLog logs={logs} />
          </div>
        </div>
      </main>

      {/* Right panel */}
      <aside
        style={{
          width: "260px",
          background: "var(--bg2)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Agent config */}
        <div className="ide-panel-header">
          <span style={{ color: "var(--amber)" }}>⚙</span> {t("panel_agent_config", lang)}
        </div>
        {activeAgent && (
          <div
            style={{ padding: "12px", borderBottom: "1px solid var(--border)" }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "var(--text)",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              {lang === "zh" ? activeAgent.nameZh : activeAgent.name}
            </div>
            <div
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                marginBottom: "8px",
              }}
            >
              {activeAgent.role}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "6px" }}>
              {activeAgent.task}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <ConfigRow label="Provider" value={activeAgent.provider} />
              <ConfigRow label="Model" value={activeAgent.model.split("-").slice(-2).join("-")} />
              <ConfigRow label="Fallback" value={activeAgent.fallback} />
              <ConfigRow
                label="Cost/1K"
                value={`$${activeAgent.costPer1K.toFixed(5)}`}
              />
            </div>
          </div>
        )}

        {/* Cost tracker */}
        <div className="ide-panel-header">
          <span style={{ color: "var(--coral)" }}>$</span> {t("panel_cost", lang)}
        </div>
        <div
          style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}
        >
          <CostRow label={t("cost_today", lang)} value="$0.012" accent="var(--green)" />
          <CostRow label={t("cost_week", lang)} value="$0.087" accent="var(--teal2)" />
          <CostRow label={t("cost_month", lang)} value="$0.234" accent="var(--amber)" />
          <CostRow label={t("cost_tokens", lang)} value="48,230" accent="var(--text2)" />
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("cost_by_prov", lang)}
            </div>
            {PROVIDERS.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  marginBottom: "3px",
                }}
              >
                <span style={{ color: "var(--text3)" }}>{p.name}</span>
                <span style={{ color: "var(--text2)" }}>
                  $0.000
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="ide-panel-header">
          <span style={{ color: "var(--blue)" }}>⬡</span> {t("panel_integrations", lang)}
        </div>
        <div style={{ padding: "10px 12px", overflowY: "auto", flex: 1 }}>
          {([
            { key: "publerKey", name: "Publer", placeholder: lang === "zh" ? "Publer API 金鑰" : "Publer API key", hint: "publer.io → Settings → API" },
            { key: "telegramToken", name: "Telegram Bot", placeholder: lang === "zh" ? "Bot Token (從 @BotFather 取得)" : "Bot Token (from @BotFather)", hint: "t.me/BotFather → /newbot" },
            { key: "n8nWebhookUrl", name: "n8n Webhook", placeholder: lang === "zh" ? "Webhook URL" : "Webhook URL", hint: "n8n → Webhook node → copy URL" },
            { key: "googleSheetsId", name: "Google Sheets", placeholder: lang === "zh" ? "試算表 ID" : "Spreadsheet ID", hint: "docs.google.com/spreadsheets/d/{ID}" },
            { key: "appsScriptUrl", name: "Apps Script", placeholder: lang === "zh" ? "部署網址" : "Deployed URL", hint: "script.google.com → Deploy → Web app URL" },
          ] as { key: keyof typeof integrations; name: string; placeholder: string; hint: string }[]).map(({ key, name, placeholder, hint }) => {
            const val = integrations[key];
            const isOpen = integrationExpanded === key;
            return (
              <div key={key} style={{ borderBottom: "1px solid var(--border)" }}>
                <div
                  onClick={() => setIntegrationExpanded(isOpen ? null : key)}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", cursor: "pointer" }}
                >
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: val ? "var(--green)" : "var(--text3)", flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "var(--text2)", flex: 1 }}>{name}</span>
                  <span style={{ fontSize: "10px", color: val ? "var(--green)" : "var(--text3)" }}>
                    {val ? (lang === "zh" ? "已設定" : "Set") : (lang === "zh" ? "未設定" : "Not set")}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--text3)" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div style={{ paddingBottom: "8px" }}>
                    <input
                      type={key === "publerKey" || key === "telegramToken" ? "password" : "text"}
                      value={val}
                      onChange={(e) => setIntegrationField(key, e.target.value)}
                      placeholder={placeholder}
                      style={{
                        width: "100%", boxSizing: "border-box", background: "var(--bg3)",
                        border: "1px solid var(--border)", borderRadius: "3px",
                        color: "var(--text1)", fontSize: "10px", padding: "5px 8px",
                        fontFamily: "monospace",
                      }}
                    />
                    <div style={{ fontSize: "9px", color: "var(--text3)", marginTop: "3px" }}>{hint}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                      {val && (
                        <button
                          onClick={() => testIntegration(key, val)}
                          disabled={integrationTestState[key] === "testing"}
                          className="ide-btn primary"
                          style={{ fontSize: "9px", padding: "3px 8px" }}
                        >
                          {integrationTestState[key] === "testing"
                            ? (lang === "zh" ? "測試中…" : "Testing…")
                            : (lang === "zh" ? "⚡ 測試連接" : "⚡ Test")}
                        </button>
                      )}
                      {integrationTestState[key] === "ok" && (
                        <span style={{ fontSize: "9px", color: "var(--green)" }}>✓ {lang === "zh" ? "連接成功" : "Connected"}</span>
                      )}
                      {integrationTestState[key] === "fail" && (
                        <span style={{ fontSize: "9px", color: "var(--red)" }}>✗ {lang === "zh" ? "連接失敗，請檢查輸入" : "Failed – check value"}</span>
                      )}
                      {val && (
                        <button
                          onClick={() => setIntegrationField(key, "")}
                          style={{ marginLeft: "auto", fontSize: "9px", color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          {lang === "zh" ? "清除" : "Clear"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              background: "var(--bg3)",
              borderRadius: "3px",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("quick_actions", lang)}
            </div>
            <button className="ide-btn" style={{ width: "100%", marginBottom: "4px", justifyContent: "center" }}>
              {t("export_csv", lang)}
            </button>
            <button className="ide-btn" style={{ width: "100%", justifyContent: "center" }}>
              {t("sync_sheet", lang)}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        marginBottom: "3px",
      }}
    >
      <span style={{ color: "var(--text3)" }}>{label}</span>
      <span style={{ color: "var(--purple2)" }}>{value}</span>
    </div>
  );
}

function CostRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "11px",
        marginBottom: "4px",
      }}
    >
      <span style={{ color: "var(--text3)" }}>{label}</span>
      <span style={{ color: accent, fontWeight: "600" }}>{value}</span>
    </div>
  );
}

function IntegrationRow({
  name,
  status,
}: {
  name: string;
  status: string;
}) {
  const ok = status === "connected" || status === "已連接" || (status !== "未設定" && status !== "not configured" && status !== "");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: ok ? "var(--green)" : "var(--text3)",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "11px", color: "var(--text2)", flex: 1 }}>
        {name}
      </span>
      <span style={{ fontSize: "10px", color: "var(--text3)" }}>{status}</span>
    </div>
  );
}

/* ─── Brand Panel ─────────────────────────────────────────── */

function BrandPanel({
  lang, brandInput, onBrandInputChange, brand, brandAnalyzing, brandError, onAnalyzeBrand, onClearBrand,
}: {
  lang: Lang;
  brandInput: { name: string; referenceUrls: string; keywords: string; audience: string; rawNotes: string };
  onBrandInputChange: (field: "name" | "referenceUrls" | "keywords" | "audience" | "rawNotes", val: string) => void;
  brand: BrandContext | null;
  brandAnalyzing: boolean;
  brandError: string;
  onAnalyzeBrand: () => void;
  onClearBrand: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const zh = lang === "zh";

  return (
    <div style={{ marginBottom: "12px", border: "1px solid rgba(124,111,255,0.35)", borderRadius: "4px", overflow: "hidden" }}>
      {/* Header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 10px", background: "rgba(124,111,255,0.08)", cursor: "pointer" }}
      >
        <span style={{ fontSize: "12px" }}>🎨</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--purple)", flex: 1 }}>
          {zh ? "品牌素材 & 視覺設定" : "Brand & Visual Profile"}
        </span>
        {brand && <span style={{ fontSize: "9px", color: "var(--green)" }}>● {zh ? "已載入" : "Active"}</span>}
        <span style={{ fontSize: "9px", color: "var(--text3)" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: "10px 10px 6px" }}>
          {/* Input fields */}
          {([
            { field: "name" as const, label: zh ? "品牌 / 帳號名稱" : "Brand / Account name", ph: "e.g. KickAds AI Education" },
            { field: "audience" as const, label: zh ? "目標受眾" : "Target audience", ph: zh ? "e.g. 香港中學老師、30-50歲" : "e.g. HK secondary school teachers" },
            { field: "keywords" as const, label: zh ? "品牌關鍵字 / 核心服務" : "Brand keywords / services", ph: zh ? "AI工具教育, Prompt工程, Manus" : "AI tools, prompt engineering" },
          ]).map(({ field, label, ph }) => (
            <div key={field} style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "9px", color: "var(--text3)", display: "block", marginBottom: "3px" }}>{label}</label>
              <input
                value={brandInput[field]}
                onChange={(e) => onBrandInputChange(field, e.target.value)}
                placeholder={ph}
                style={{ width: "100%", boxSizing: "border-box", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text1)", fontSize: "10px", padding: "4px 7px" }}
              />
            </div>
          ))}

          {/* Competitor URLs */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "9px", color: "var(--text3)", display: "block", marginBottom: "3px" }}>
              {zh ? "競對 / 參考網站（每行一個）" : "Competitor / reference sites (one per line)"}
            </label>
            <textarea
              value={brandInput.referenceUrls}
              onChange={(e) => onBrandInputChange("referenceUrls", e.target.value)}
              placeholder={zh ? "https://competitor.com\nhttps://reference.com" : "https://competitor.com\nhttps://reference.com"}
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text1)", fontSize: "10px", padding: "4px 7px", resize: "vertical", fontFamily: "monospace" }}
            />
          </div>

          {/* Free-form notes */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "9px", color: "var(--text3)", display: "block", marginBottom: "3px" }}>
              {zh ? "補充說明 / 設計偏好" : "Extra notes / design preferences"}
            </label>
            <textarea
              value={brandInput.rawNotes}
              onChange={(e) => onBrandInputChange("rawNotes", e.target.value)}
              placeholder={zh ? "例：色調偏深藍紫，扁平化設計，教育科技感，避免卡通風格…" : "e.g. Dark blue-purple tones, flat design, edtech aesthetic, avoid cartoonish…"}
              rows={3}
              style={{ width: "100%", boxSizing: "border-box", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "3px", color: "var(--text1)", fontSize: "10px", padding: "4px 7px", resize: "vertical" }}
            />
          </div>

          {/* Error */}
          {brandError && (
            <div style={{ fontSize: "9px", color: "var(--red)", marginBottom: "6px", padding: "4px 6px", background: "rgba(239,68,68,0.08)", borderRadius: "3px" }}>
              {brandError}
            </div>
          )}

          {/* Generated brand card */}
          {brand && (
            <div style={{ marginBottom: "8px", padding: "8px", background: "rgba(124,111,255,0.06)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: "3px" }}>
              <div style={{ fontSize: "9px", color: "var(--purple)", fontWeight: 700, marginBottom: "4px" }}>
                ✓ {zh ? "品牌設定" : "Brand Profile"} — {brand.name}
              </div>
              {[
                [zh ? "語氣" : "Tone", brand.tone],
                [zh ? "受眾" : "Audience", brand.audience],
                [zh ? "色彩" : "Colors", brand.colorPalette],
                [zh ? "視覺" : "Visual", brand.visualStyle],
                [zh ? "關鍵字" : "Keywords", brand.keywords],
                [zh ? "競對" : "Competitors", brand.competitors],
              ].map(([k, v]) => v ? (
                <div key={k} style={{ fontSize: "9px", marginBottom: "2px" }}>
                  <span style={{ color: "var(--text3)" }}>{k}：</span>
                  <span style={{ color: "var(--text2)" }}>{v}</span>
                </div>
              ) : null)}
              {brand.generatedAt && (
                <div style={{ fontSize: "8px", color: "var(--text3)", marginTop: "4px" }}>{zh ? "生成於" : "Generated"} {brand.generatedAt}</div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={onAnalyzeBrand}
              disabled={brandAnalyzing}
              className="ide-btn primary"
              style={{ flex: 1, fontSize: "10px", padding: "5px 8px" }}
            >
              {brandAnalyzing
                ? (zh ? "🔍 分析中…" : "🔍 Analyzing…")
                : (zh ? "🔍 分析並生成品牌設定" : "🔍 Analyze & Generate")}
            </button>
            {brand && (
              <button onClick={onClearBrand} className="ide-btn" style={{ fontSize: "10px", padding: "5px 8px" }}>
                {zh ? "清除" : "Clear"}
              </button>
            )}
          </div>
          <div style={{ fontSize: "8px", color: "var(--text3)", marginTop: "4px" }}>
            {zh ? "* 生成後品牌設定將自動注入所有帖文及視覺 Prompt 生成" : "* Brand profile auto-injects into all post & visual prompt generation"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── BYOK Tab ─────────────────────────────────────────────── */

interface BrandInputState {
  name: string;
  referenceUrls: string;
  keywords: string;
  audience: string;
  rawNotes: string;
}

interface BYOKTabProps {
  providers: Provider[];
  states: Record<string, ProviderState>;
  onUpdate: (id: string, patch: Partial<ProviderState>) => void;
  onTest: (provider: Provider) => void;
  genTopic: string;
  genPillar: string;
  genProvider: string;
  genResult: string;
  genLoading: boolean;
  genError: string;
  onTopicChange: (v: string) => void;
  onPillarChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onGenerate: () => void;
  lang: Lang;
  brandInput: BrandInputState;
  onBrandInputChange: (field: keyof BrandInputState, val: string) => void;
  brand: BrandContext | null;
  brandAnalyzing: boolean;
  brandError: string;
  onAnalyzeBrand: () => void;
  onClearBrand: () => void;
}

function BYOKTab({
  providers,
  states,
  onUpdate,
  onTest,
  brandInput,
  onBrandInputChange,
  brand,
  brandAnalyzing,
  brandError,
  onAnalyzeBrand,
  onClearBrand,
  genTopic,
  genPillar,
  genProvider,
  genResult,
  genLoading,
  genError,
  onTopicChange,
  onPillarChange,
  onProviderChange,
  onGenerate,
  lang,
}: BYOKTabProps) {
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Provider cards */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {providers.map((p) => {
            const state = states[p.id];
            return (
              <ProviderCard
                key={p.id}
                provider={p}
                state={state}
                onUpdate={(patch) => onUpdate(p.id, patch)}
                onTest={() => onTest(p)}
                lang={lang}
              />
            );
          })}
        </div>
      </div>

      {/* Generate panel */}
      <div
        style={{
          width: "320px",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div className="ide-panel-header">
          <span style={{ color: "var(--teal)" }}>✦</span> {t("panel_generate", lang)}
        </div>
        <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>

          {/* ── Brand Profile Panel ── */}
          <BrandPanel
            lang={lang}
            brandInput={brandInput}
            onBrandInputChange={onBrandInputChange}
            brand={brand}
            brandAnalyzing={brandAnalyzing}
            brandError={brandError}
            onAnalyzeBrand={onAnalyzeBrand}
            onClearBrand={onClearBrand}
          />

          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                display: "block",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("gen_topic", lang)}
            </label>
            <input
              className="ide-input"
              placeholder={t("gen_placeholder", lang)}
              value={genTopic}
              onChange={(e) => onTopicChange(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                display: "block",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("gen_pillar", lang)}
            </label>
            <select
              className="ide-input"
              value={genPillar}
              onChange={(e) => onPillarChange(e.target.value)}
              style={{ appearance: "none" }}
            >
              {tArr("pillars", lang).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                fontSize: "10px",
                color: "var(--text3)",
                display: "block",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {t("gen_provider", lang)}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onProviderChange(p.id)}
                  style={{
                    padding: "3px 8px",
                    fontSize: "10px",
                    background:
                      genProvider === p.id
                        ? "rgba(124,111,255,0.2)"
                        : "var(--bg3)",
                    border: `1px solid ${
                      genProvider === p.id ? "var(--purple)" : "var(--border)"
                    }`,
                    borderRadius: "3px",
                    color:
                      genProvider === p.id ? "var(--purple2)" : "var(--text3)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <button
            className="ide-btn primary"
            onClick={onGenerate}
            disabled={genLoading || !genTopic.trim()}
            style={{
              width: "100%",
              justifyContent: "center",
              marginBottom: "10px",
              opacity: genLoading || !genTopic.trim() ? 0.6 : 1,
              cursor:
                genLoading || !genTopic.trim() ? "not-allowed" : "pointer",
            }}
          >
            {genLoading ? t("gen_loading", lang) : t("gen_btn", lang)}
          </button>
          {genError && (
            <div
              style={{
                padding: "8px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid var(--red)",
                borderRadius: "3px",
                fontSize: "11px",
                color: "var(--red)",
                marginBottom: "10px",
              }}
            >
              {genError}
            </div>
          )}
          {/* Brand indicator in gen panel */}
          {brand && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", padding: "4px 8px", background: "rgba(124,111,255,0.08)", border: "1px solid rgba(124,111,255,0.3)", borderRadius: "3px" }}>
              <span style={{ fontSize: "9px", color: "var(--purple)" }}>🎨</span>
              <span style={{ fontSize: "9px", color: "var(--purple)", flex: 1 }}>{lang === "zh" ? `品牌設定已載入：${brand.name}` : `Brand loaded: ${brand.name}`}</span>
              <button onClick={onClearBrand} style={{ fontSize: "9px", color: "var(--text3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lang === "zh" ? "清除" : "Clear"}</button>
            </div>
          )}

          {genResult && (
            <div
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border2)",
                borderRadius: "3px",
                padding: "10px",
                fontSize: "12px",
                color: "var(--text)",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {genResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderCard({
  provider,
  state,
  onUpdate,
  onTest,
  lang,
}: {
  provider: Provider;
  state: ProviderState;
  onUpdate: (patch: Partial<ProviderState>) => void;
  onTest: () => void;
  lang: Lang;
}) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: `1px solid ${
          state.connected
            ? "rgba(34,197,94,0.4)"
            : state.error
            ? "rgba(239,68,68,0.4)"
            : "var(--border)"
        }`,
        borderRadius: "4px",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "4px",
            background: provider.color,
            color: provider.textColor,
            fontSize: "11px",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {provider.logo}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              color: "var(--text)",
              fontWeight: "600",
            }}
          >
            {provider.name}
          </div>
          <div style={{ fontSize: "10px", color: "var(--text3)" }}>
            {state.selectedModel}
          </div>
        </div>
        <div>
          {state.connected ? (
            <span className="badge badge-green">{t("badge_connected", lang)}</span>
          ) : state.error ? (
            <span className="badge badge-red">{t("badge_error", lang)}</span>
          ) : (
            <span className="badge" style={{ background: "var(--bg4)", color: "var(--text3)", border: "1px solid var(--border)" }}>
              {t("badge_idle", lang)}
            </span>
          )}
        </div>
      </div>

      {/* Key input */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              className="ide-input"
              type={state.showKey ? "text" : "password"}
              placeholder={`${provider.envKey}=...`}
              value={state.apiKey}
              onChange={(e) => onUpdate({ apiKey: e.target.value, connected: false, error: "" })}
              style={{ paddingRight: "32px" }}
            />
            <button
              onClick={() => onUpdate({ showKey: !state.showKey })}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text3)",
                fontSize: "12px",
                padding: "0",
              }}
            >
              {state.showKey ? "◉" : "◎"}
            </button>
          </div>
          <button
            className="ide-btn"
            onClick={onTest}
            disabled={state.testing}
            style={{ flexShrink: 0, opacity: state.testing ? 0.7 : 1 }}
          >
            {state.testing ? t("badge_testing", lang) : t("badge_test", lang)}
          </button>
        </div>
        {state.error && (
          <div
            style={{
              fontSize: "10px",
              color: "var(--red)",
              marginBottom: "6px",
            }}
          >
            ✗ {state.error}
          </div>
        )}

        {/* Model pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {provider.models.map((m) => (
            <button
              key={m}
              onClick={() => onUpdate({ selectedModel: m })}
              style={{
                padding: "2px 7px",
                fontSize: "9px",
                background:
                  state.selectedModel === m
                    ? "rgba(124,111,255,0.2)"
                    : "var(--bg4)",
                border: `1px solid ${
                  state.selectedModel === m
                    ? "var(--purple)"
                    : "var(--border)"
                }`,
                borderRadius: "2px",
                color:
                  state.selectedModel === m
                    ? "var(--purple2)"
                    : "var(--text3)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.1s",
              }}
            >
              {m.split("-").slice(-2).join("-")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Routing Tab ──────────────────────────────────────────── */

function RoutingTab({ lang }: { lang: Lang }) {
  return (
    <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
      <div
        style={{
          fontSize: "11px",
          color: "var(--text3)",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {t("routing_title", lang)}
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border2)" }}>
            {[t("routing_agent",lang), t("routing_role",lang), t("routing_provider",lang), t("routing_model",lang), t("routing_fallback",lang), t("routing_task",lang), "$/1K"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    color: "var(--text3)",
                    fontWeight: "400",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {AGENTS.map((agent, i) => {
            const provider = PROVIDERS.find((p) => p.id === agent.provider);
            return (
              <tr
                key={agent.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                }}
              >
                <td style={{ padding: "8px 10px", color: "var(--text)", fontWeight: "600" }}>
                  {lang === "zh" ? agent.nameZh : agent.name}
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <span className="badge badge-purple">{lang === "zh" ? agent.roleZh : agent.role}</span>
                </td>
                <td style={{ padding: "8px 10px" }}>
                  {provider && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "3px",
                          background: provider.color,
                          color: provider.textColor,
                          fontSize: "7px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {provider.logo}
                      </div>
                      <span style={{ color: "var(--text2)" }}>{provider.name}</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: "8px 10px", color: "var(--teal2)", fontSize: "11px" }}>
                  {agent.model}
                </td>
                <td style={{ padding: "8px 10px", color: "var(--text3)", fontSize: "11px" }}>
                  {agent.fallback}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    color: "var(--text2)",
                    fontSize: "11px",
                    maxWidth: "200px",
                  }}
                >
                  {lang === "zh" ? agent.taskZh : agent.task}
                </td>
                <td style={{ padding: "8px 10px", color: "var(--amber)", fontWeight: "600" }}>
                  ${agent.costPer1K.toFixed(5)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Workflow Tab ─────────────────────────────────────────── */

function WorkflowTab({ lang }: { lang: Lang }) {
  const contentNodes = tArr("workflow_nodes_content", lang);
  const slidesNodes = tArr("workflow_nodes_slides", lang);
  const contentSteps = tArr("workflow_content_steps", lang);
  const slidesSteps = tArr("workflow_slides_steps", lang);
  const nodeIcons = ["◈", "✦", "◉", "⇥", "⬡"];
  const nodeColors = ["var(--purple)", "var(--teal)", "var(--amber)", "var(--green)", "var(--blue)"];
  const slideNodeIcons = ["▦", "▦", "{ }", "↗"];
  const slideNodeColors = ["var(--teal)", "var(--blue)", "var(--purple)", "var(--amber)"];
  return (
    <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
      <PipelineSection
        title={t("workflow_content_title", lang)}
        color="var(--purple)"
        nodes={contentNodes.map((label, i) => ({ label, color: nodeColors[i] ?? "var(--purple)", icon: nodeIcons[i] ?? "◈" }))}
        steps={contentSteps}
      />
      <div style={{ height: "20px" }} />
      <PipelineSection
        title={t("workflow_slides_title", lang)}
        color="var(--teal)"
        nodes={slidesNodes.map((label, i) => ({ label, color: slideNodeColors[i] ?? "var(--teal)", icon: slideNodeIcons[i] ?? "▦" }))}
        steps={slidesSteps}
      />
    </div>
  );
}

function PipelineSection({
  title,
  color,
  nodes,
  steps,
}: {
  title: string;
  color: string;
  nodes: { label: string; color: string; icon: string }[];
  steps: string[];
}) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: `1px solid var(--border)`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          borderLeft: `3px solid ${color}`,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "12px", color, fontWeight: "700" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {nodes.map((node, i) => (
            <React.Fragment key={i}>
              <div
                className="pipeline-node"
                style={{
                  borderColor: node.color,
                  background: `${node.color}15`,
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    marginBottom: "4px",
                    color: node.color,
                  }}
                >
                  {node.icon}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "var(--text2)",
                    whiteSpace: "pre-line",
                    lineHeight: "1.4",
                  }}
                >
                  {node.label}
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className="pipeline-arrow">→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: "12px" }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                marginBottom: "4px",
                fontSize: "11px",
              }}
            >
              <span style={{ color, minWidth: "16px", fontWeight: "700" }}>
                {i + 1}.
              </span>
              <span style={{ color: "var(--text2)" }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Queue Tab ─────────────────────────────────────────────── */

function QueueTab({
  queue,
  onUpdateQueue,
  lang,
}: {
  queue: PostQueueItem[];
  onUpdateQueue: (q: PostQueueItem[]) => void;
  lang: Lang;
}) {
  return (
    <div style={{ overflowY: "auto", padding: "16px", flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "var(--text3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {t("queue_title", lang)}（共 {queue.length} {t("queue_items", lang)}）
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["pending", "scheduled", "published", "failed"] as const).map(
            (s) => (
              <span key={s} className={`badge ${STATUS_BADGE[s]}`}>
                {queue.filter((q) => q.status === s).length} {s === "pending" ? t("queue_pending", lang) : s === "scheduled" ? t("queue_scheduled_s", lang) : s === "published" ? t("queue_published", lang) : t("queue_failed", lang)}
              </span>
            )
          )}
        </div>
      </div>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border2)" }}>
            {[t("queue_platform",lang), t("queue_topic",lang), t("queue_preview",lang), t("queue_module",lang), t("queue_model",lang), t("queue_scheduled",lang), t("queue_status",lang), ""].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    color: "var(--text3)",
                    fontWeight: "400",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {queue.map((item, i) => (
            <tr
              key={item.id}
              style={{
                borderBottom: "1px solid var(--border)",
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              }}
            >
              <td style={{ padding: "8px 10px" }}>
                <span
                  className="badge"
                  style={{
                    background: `${PLATFORM_COLORS[item.platform]}20`,
                    color: PLATFORM_COLORS[item.platform] || "var(--text2)",
                    border: `1px solid ${PLATFORM_COLORS[item.platform] || "var(--border)"}40`,
                  }}
                >
                  {item.platform}
                </span>
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  color: "var(--text)",
                  maxWidth: "160px",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.topic}
                </div>
              </td>
              <td
                style={{
                  padding: "8px 10px",
                  color: "var(--text2)",
                  maxWidth: "200px",
                  fontSize: "11px",
                }}
              >
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.content}
                </div>
              </td>
              <td style={{ padding: "8px 10px", color: "var(--text3)", fontSize: "11px" }}>
                {item.module}
              </td>
              <td style={{ padding: "8px 10px", color: "var(--teal2)", fontSize: "10px" }}>
                {item.model}
              </td>
              <td style={{ padding: "8px 10px", color: "var(--text3)", fontSize: "11px", whiteSpace: "nowrap" }}>
                {item.scheduledAt}
              </td>
              <td style={{ padding: "8px 10px" }}>
                <span className={`badge ${STATUS_BADGE[item.status]}`}>
                  {item.status}
                </span>
              </td>
              <td style={{ padding: "8px 10px" }}>
                {item.status === "pending" && (
                  <button
                    className="ide-btn success"
                    style={{ fontSize: "10px", padding: "3px 8px" }}
                    onClick={() => {
                      const updated = queue.map((q) =>
                        q.id === item.id ? { ...q, status: "scheduled" as const } : q
                      );
                      onUpdateQueue(updated);
                    }}
                  >
                    {t("queue_schedule_btn", lang)}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Slides Tab ────────────────────────────────────────────── */

const SLIDE_TYPE_COLORS: Record<string, string> = {
  title: "var(--purple)",
  content: "var(--teal)",
  demo: "var(--amber)",
  exercise: "var(--coral)",
  summary: "var(--green)",
};

interface SlidesTabProps {
  topic: string;
  audience: string;
  tool: string;
  provider: string;
  outline: SlideOutline[];
  loading: boolean;
  error: string;
  onTopicChange: (v: string) => void;
  onAudienceChange: (v: string) => void;
  onToolChange: (v: string) => void;
  onProviderChange: (v: string) => void;
  onGenerate: () => void;
  lang: Lang;
}

function SlidesTab({
  topic,
  audience,
  tool,
  provider,
  outline,
  loading,
  error,
  onTopicChange,
  onAudienceChange,
  onToolChange,
  onProviderChange,
  onGenerate,
  lang,
}: SlidesTabProps) {
  const slideProviders = ["gemini", "anthropic", "openai", "deepseek"];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Form */}
      <div
        style={{
          width: "280px",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div className="ide-panel-header">
          <span style={{ color: "var(--blue)" }}>▦</span> {t("panel_slides_cfg", lang)}
        </div>
        <div style={{ padding: "12px", overflowY: "auto", flex: 1 }}>
          <FormField label={t("slides_topic", lang)}>
            <input
              className="ide-input"
              placeholder="e.g. AI Prompt Engineering 101"
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
            />
          </FormField>
          <FormField label={t("slides_audience", lang)}>
            <input
              className="ide-input"
              value={audience}
              onChange={(e) => onAudienceChange(e.target.value)}
            />
          </FormField>
          <FormField label={t("slides_tool", lang)}>
            <input
              className="ide-input"
              value={tool}
              onChange={(e) => onToolChange(e.target.value)}
            />
          </FormField>
          <FormField label={t("slides_provider", lang)}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {slideProviders.map((p) => (
                <button
                  key={p}
                  onClick={() => onProviderChange(p)}
                  style={{
                    padding: "5px 10px",
                    fontSize: "11px",
                    background:
                      provider === p
                        ? "rgba(124,111,255,0.2)"
                        : "var(--bg3)",
                    border: `1px solid ${
                      provider === p ? "var(--purple)" : "var(--border)"
                    }`,
                    borderRadius: "3px",
                    color: provider === p ? "var(--purple2)" : "var(--text3)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "all 0.1s",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </FormField>
          <button
            className="ide-btn primary"
            onClick={onGenerate}
            disabled={loading || !topic.trim()}
            style={{
              width: "100%",
              justifyContent: "center",
              marginTop: "8px",
              opacity: loading || !topic.trim() ? 0.6 : 1,
              cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t("slides_loading", lang) : t("slides_gen_btn", lang)}
          </button>
          {error && (
            <div
              style={{
                marginTop: "8px",
                padding: "8px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid var(--red)",
                borderRadius: "3px",
                fontSize: "11px",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          )}
          {outline.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text3)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {t("slides_export", lang)}
              </div>
              <button
                className="ide-btn success"
                style={{ width: "100%", justifyContent: "center", marginBottom: "4px" }}
                onClick={() => {
                  const json = JSON.stringify(outline, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${topic.slice(0, 30).replace(/\s/g, "-")}-slides.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                ↓ Export JSON
              </button>
              <button
                className="ide-btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => {
                  const csv = [
                    "Number,Type,Title,Content",
                    ...outline.map(
                      (s) =>
                        `${s.number},"${s.type}","${s.title.replace(/"/g, '""')}","${s.content.replace(/"/g, '""')}"`
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${topic.slice(0, 30).replace(/\s/g, "-")}-slides.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                ↓ Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Outline */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {outline.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text3)",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "48px", opacity: 0.3 }}>▦</div>
            <div style={{ fontSize: "13px" }}>{t("slides_empty", lang)}</div>
          </div>
        ) : (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "14px",
              }}
            >
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: "600" }}>
                {topic}
              </div>
              <span className="badge badge-teal">{outline.length} slides</span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {Object.entries(SLIDE_TYPE_COLORS).map(([type, color]) => {
                  const count = outline.filter((s) => s.type === type).length;
                  if (!count) return null;
                  return (
                    <span
                      key={type}
                      className="badge"
                      style={{
                        background: `${color}15`,
                        color,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      {count} {type}
                    </span>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "8px",
              }}
            >
              {outline.map((slide) => {
                const color = SLIDE_TYPE_COLORS[slide.type] || "var(--text3)";
                return (
                  <div
                    key={slide.number}
                    style={{
                      background: "var(--bg3)",
                      border: `1px solid ${color}40`,
                      borderLeft: `3px solid ${color}`,
                      borderRadius: "3px",
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          color,
                          fontWeight: "700",
                          minWidth: "20px",
                        }}
                      >
                        {String(slide.number).padStart(2, "0")}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: `${color}15`,
                          color,
                          border: `1px solid ${color}30`,
                          fontSize: "9px",
                        }}
                      >
                        {slide.type}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text)",
                        fontWeight: "600",
                        marginBottom: "4px",
                        lineHeight: "1.4",
                      }}
                    >
                      {slide.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text2)",
                        lineHeight: "1.5",
                      }}
                    >
                      {slide.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <label
        style={{
          fontSize: "10px",
          color: "var(--text3)",
          display: "block",
          marginBottom: "4px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
