# KickAds Content Engine
> AI 驅動嘅內容生成系統 · 教育行業專用 · BYOK 多模型支援

---

## 系統概覽

KickAds Content Engine 係一個 IDE 風格嘅前端 Dashboard，專為 AI 教育內容生產設計。系統支援六大主流 AI 服務商，讓你用自己嘅 API 金鑰直接驅動各個代理人（Agent），自動生成廣東話帖文、教學簡報及 B2B 素材。

### 核心功能

| 功能 | 說明 |
|------|------|
| **BYOK 多模型** | 填入自己嘅 API 金鑰，支援 Anthropic、OpenAI、Gemini、DeepSeek、Grok、Mistral |
| **Agent 路由** | 每個代理人獨立指定服務商及模型，按任務最優化成本 |
| **廣東話帖文生成** | 一鍵生成符合品牌聲調嘅 Threads / IG 帖文草稿 |
| **簡報大綱生成** | 輸入主題即自動生成 16 頁教學簡報結構 |
| **發布排程** | 整合 Publer API，管理多平台發布時間表 |
| **n8n Workflow** | 視覺化 Pipeline，連接 Google Sheets、Telegram Bot、Publer |

---

## 快速開始

### 系統需求

- Node.js 18 或以上
- npm 9 或以上
- 至少一個 AI 服務商嘅 API 金鑰

### 安裝步驟

```bash
# 1. 複製環境變量範本
cp .env.example .env.local

# 2. 安裝依賴套件
npm install

# 3. 啟動開發伺服器
npm run dev
```

瀏覽器開啟 `http://localhost:3000`

---

## 環境變量設定

喺 `.env.local` 填入你嘅 API 金鑰：

```env
# Anthropic Claude（推薦用於策略層及品牌聲調內容）
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI（推薦用於視覺 Prompt 生成）
OPENAI_API_KEY=sk-proj-...

# Google Gemini（推薦用於簡報生成，成本極低）
GEMINI_API_KEY=AIza...

# DeepSeek（推薦用於大量廣東話帖文草稿，成本最低）
DEEPSEEK_API_KEY=sk-...

# xAI Grok（選填）
GROK_API_KEY=...

# Mistral（選填）
MISTRAL_API_KEY=...

# Publer 自動發布
PUBLER_API_KEY=...

# Telegram 審批通知
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Google Apps Script（簡報生成）
APPS_SCRIPT_URL=https://script.google.com/...

# Google Sheets（主題 Backlog）
SHEET_URL=https://sheets.googleapis.com/...

# n8n Workflow
N8N_WEBHOOK_URL=http://your-n8n-instance/webhook/...
```

> **安全提示**：API 金鑰只存喺你嘅本地環境或瀏覽器 state，唔會上傳至任何第三方伺服器。

---

## Dashboard 功能說明

### 🔑 密鑰配置（BYOK）

六張服務商卡片，各自管理：
- **API 金鑰輸入**：密碼模式顯示，可切換明文
- **連線測試**：點擊「測試」按鈕即時驗證金鑰有效性
- **模型選擇**：每個服務商提供多個可選模型
- **生成帖文**：填入主題 → 選擇內容柱 → 選擇服務商 → 點擊「生成帖文」

**推薦 API 金鑰優先級：**
1. **DeepSeek** — 廣東話草稿（成本 $0.00027/1K，最划算）
2. **Google Gemini** — 簡報生成（$0.0001/1K）
3. **Anthropic Claude** — 品牌聲調把關、策略決策

### ⇄ 路由設定

顯示每個代理人對應嘅服務商、模型、備用方案及每千 Token 費用。

| 代理人 | 預設服務商 | 原因 |
|--------|-----------|------|
| CMO 統籌代理 | Anthropic Claude Sonnet | 策略判斷，需要高質素 |
| 內容撰寫代理 | DeepSeek V3 | 大量廣東話草稿，成本優先 |
| 視覺 Prompt 生成 | OpenAI GPT-4o | 視覺理解能力強 |
| 簡報生成代理 | Google Gemini Flash | 結構化輸出，成本極低 |
| 發布代理 | DeepSeek V3 | Caption 潤飾，低成本 |
| 學校 Outreach | Anthropic Claude Haiku | Email 草稿，質素夠用 |

### ◈ 工作流程

兩條自動化 Pipeline 視覺圖：

**內容生成流程：**
```
CMO 統籌 → 內容撰寫 → 視覺 Prompt → Telegram 審批 → Publer 排程
```

**簡報生成流程：**
```
表單輸入 → Gemini 生成大綱 → 16頁 JSON → Google Slides / 匯出
```

### ≡ 發布排程

- 管理所有待發布帖文
- 狀態：**待審** / **已排程** / **已發布** / **失敗**
- 點擊「排程發布」將帖文推送至 Publer 隊列

### ▦ 簡報生成

1. 填入**主題**（例：AI Prompt Engineering 101）
2. 設定**目標學員**（例：中學老師）
3. 選擇 **AI 服務商**（建議：Gemini Flash，速度快成本低）
4. 點擊「生成 16 頁簡報」
5. 檢視大綱後可**匯出 JSON** 或 **匯出 CSV**

---

## n8n Workflow 設定

### 匯入 Workflow

1. 打開你嘅 n8n instance（`http://localhost:5678` 或 cloud）
2. 點擊 **Import** → 選擇 `n8n/content-engine-workflow.json`
3. 點擊每個 HTTP Request 節點，填入環境變量

### 必填 Credentials

在 n8n 嘅 **Credentials** 頁面設定：

| 名稱 | 類型 | 用途 |
|------|------|------|
| DeepSeek API | HTTP Header Auth | 廣東話帖文草稿 |
| OpenAI API | HTTP Header Auth | 視覺 Prompt |
| Anthropic API | HTTP Header Auth | Claude 模型呼叫 |
| Gemini API | Query Auth | 簡報大綱生成 |
| Telegram Bot | Telegram API | 審批通知 |
| Publer API | HTTP Header Auth | 帖文排程發布 |

### Google Sheets 主題 Backlog 格式

試算表需包含以下欄位：

| 欄 A | 欄 B | 欄 C | 欄 D |
|------|------|------|------|
| topic | pillar | status | scheduled_at |
| 用 ChatGPT 備課 | AI 工具教育 | pending | |

---

## Vercel 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel

# 設定環境變量（在 Vercel Dashboard 的 Settings > Environment Variables）
```

或直接連接 GitHub repo，Vercel 會自動偵測 Next.js 並部署。

**重要**：生產環境唔好將 API 金鑰直接放喺前端 state，建議喺 Vercel 設定 Server-side 環境變量，並修改 API Routes 讀取 `process.env`。

---

## 內容策略快速參考

### 四條 Content Pillar

| Pillar | 比例 | 目標 | 格式 |
|--------|------|------|------|
| AI 工具示範 | 40% | 獲得 Save / Share | Carousel + Thread |
| 教育者視角 | 25% | 建立 Credibility | Thread + Reels |
| Founder POV | 20% | 品牌信任 | Long-form Thread |
| B2B Proof | 15% | 學校 / 企業轉化 | IG 單圖 + Thread |

### 最佳發布時段（HK）

- **晚上 8–10pm**：老師下班後，主力時段
- **午飯 12–1pm**：補充時段

### 每週固定內容

- **週一**：AI 教育週報（anchor content，養 email list）

---

## 內容模組說明

系統內建 8 個 Preset Content Modules，對應不同輸出類型：

| 模組 | 格式 | 適用場景 |
|------|------|---------|
| Save-bait Carousel | IG + Threads | 工具示範，引流 |
| Problem→Solution Thread | Threads | 教育者視角 |
| Teaching Slide Deck | 簡報 PDF | 工作坊交付物 |
| Proof Drop | IG 單圖 | B2B social proof |
| Founder POV | Long-form Thread | 品牌建立 |
| Case Study Thread | Threads + Reels | Manus 示範 |
| School Taster 1-pager | PDF | 學校 outreach |
| AI Grant Checklist | Lead magnet | Email capture |

---

## 代理人設計原則

1. **CMO 統籌代理**：只做決策層，唔做生產層
2. **BYOK 安全原則**：金鑰只存喺 client state，唔持久化
3. **成本優先路由**：大量生產任務優先用 DeepSeek（$0.00027/1K）
4. **備用鏈**：Primary 失敗 → 同服務商重試 → Claude Haiku → Telegram 警報
5. **廣東話優先**：所有面向受眾嘅內容預設廣東話輸出

---

## 技術架構

```
Next.js 14 (App Router)
├── src/app/               # 頁面及 API Routes
│   ├── api/generate/      # 多服務商 LLM 呼叫
│   ├── api/publish/       # Publer API 整合
│   └── api/slides/        # 簡報大綱生成
├── src/components/
│   ├── Dashboard.tsx      # 主介面（IDE 風格）
│   └── AgentLog.tsx       # 代理日誌面板
└── src/lib/
    ├── providers.ts       # 六大服務商配置
    └── agents.ts          # Agent 呼叫函數

n8n/
└── content-engine-workflow.json  # 可直接匯入嘅 Workflow

content/
├── brand-voice-spec.md   # 品牌聲調規範
└── post-backlog-14.md    # 頭 14 條帖文草稿
```

---

## 常見問題

**Q: API 金鑰安全嗎？**
A: 金鑰只存喺瀏覽器 state，頁面重載後清空。唔會記錄至伺服器或 localStorage。

**Q: 點樣加新服務商？**
A: 修改 `src/lib/providers.ts` 加入新 Provider，再喺 `src/app/api/generate/route.ts` 加對應嘅呼叫邏輯。

**Q: 生成嘅帖文語氣唔對？**
A: 修改 `src/app/api/generate/route.ts` 入面嘅 `CANTONESE_SYSTEM_PROMPT`，參考 `content/brand-voice-spec.md`。

**Q: n8n Workflow 唔識設定？**
A: 參考 `n8n/README.md`，入面有完整嘅逐步設定指引。

---

*KickAds · 內部使用 · 2026-06*
