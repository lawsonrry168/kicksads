# Cantonese AI Education Content Engine — n8n Workflow

A complete n8n automation workflow for generating, reviewing, and publishing Cantonese AI education content, plus a separate pipeline for generating 16-slide Google Slides presentations with matching prompt packs.

---

## Workflows Included

### Workflow 1: Content Generation Pipeline
Runs daily at 09:00 HKT. Fetches a topic from Google Sheets, drafts Cantonese content via DeepSeek, generates visual prompts via GPT-4o, sends to Telegram for human approval, then schedules the approved post via Publer.

### Workflow 2: Slides Generation Pipeline
Triggered via HTTP POST webhook. Generates a 16-slide outline via Gemini 2.0 Flash, builds the Google Slides deck via Apps Script, generates a prompt pack PDF via Claude Haiku, and delivers the link to Telegram.

---

## Environment Variables Required

Set these in your n8n instance under **Settings > Environment Variables** (or in your `.env` file / Docker compose environment):

| Variable | Description | Example |
|---|---|---|
| `SHEET_URL` | Full URL to your Google Sheets JSON API endpoint (publish sheet as JSON) | `https://sheets.googleapis.com/v4/spreadsheets/SHEET_ID/values/Sheet1?key=API_KEY` |
| `DEEPSEEK_API_KEY` | DeepSeek API key from platform.deepseek.com | `sk-...` |
| `OPENAI_API_KEY` | OpenAI API key from platform.openai.com | `sk-...` |
| `TELEGRAM_CHAT_ID` | Telegram chat or channel ID to send drafts and notifications | `-1001234567890` |
| `PUBLER_API_KEY` | Publer API key from app.publer.io/profile/api | `pub_...` |
| `GEMINI_API_KEY` | Google AI Studio API key from aistudio.google.com | `AIza...` |
| `APPS_SCRIPT_URL` | Deployed Google Apps Script web app URL | `https://script.google.com/macros/s/SCRIPT_ID/exec` |
| `ANTHROPIC_API_KEY` | Anthropic API key from console.anthropic.com | `sk-ant-...` |
| `LOGO_URL` | (Optional) URL to your brand logo for slide branding | `https://yourdomain.com/logo.png` |
| `GOOGLE_SHARE_EMAIL` | (Optional) Google account email to share generated slides with | `you@gmail.com` |

---

## How to Import

1. Open your n8n instance (self-hosted or n8n Cloud).
2. Go to **Workflows** in the left sidebar.
3. Click the **Import** button (top-right area, or via the `+` menu → Import from file).
4. Select `content-engine-workflow.json` from this directory.
5. Click **Import**.
6. The workflow will appear with both pipelines visible on the canvas.

---

## How to Configure Credentials

The workflow uses inline `{{$env.VARIABLE_NAME}}` references rather than n8n credential objects, so no credential objects need to be created. However, if you prefer to use n8n's credential store:

### Option A: Environment Variables (Recommended for self-hosted)
Add all variables from the table above to your n8n environment before starting the instance. For Docker:
```yaml
environment:
  - DEEPSEEK_API_KEY=sk-...
  - OPENAI_API_KEY=sk-...
  - TELEGRAM_CHAT_ID=-1001234567890
  # ... etc
```

### Option B: n8n Credentials Store
1. Go to **Credentials** in the left sidebar.
2. Create a new **HTTP Header Auth** credential for each API:
   - DeepSeek: Header name `Authorization`, value `Bearer YOUR_KEY`
   - OpenAI: Header name `Authorization`, value `Bearer YOUR_KEY`
   - Publer: Header name `Authorization`, value `Bearer YOUR_KEY`
   - Anthropic: Header name `x-api-key`, value `YOUR_KEY`
3. Update the corresponding HTTP Request nodes in the workflow to reference these credentials instead of `$env` expressions.

---

## Google Sheets Setup

Your topic backlog sheet should have columns in this order:
- **Column A**: Topic title (e.g. `點解AI唔係萬能？`)
- **Column B**: Notes / context (optional)
- **Column C**: Status — leave blank or write `pending` for new topics; the workflow will process these first

Publish the sheet as a JSON API:
1. In Google Sheets: **Extensions > Apps Script** (or use Sheets API v4 with a service account).
2. Or use the Sheets API: `https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sheet1?key={API_KEY}`
3. Set `SHEET_URL` to the full API endpoint URL.

---

## Google Apps Script Setup

The Slides pipeline posts to a Google Apps Script web app that creates the presentation. You need to deploy your own Apps Script:

1. Go to [script.google.com](https://script.google.com) and create a new project.
2. Write a `doPost(e)` function that:
   - Parses the JSON body (`outline`, `topic`, `branding`)
   - Creates a Google Slides presentation using `SlidesApp`
   - Returns a JSON response with `{ slidesUrl: "..." }`
3. Deploy as a **Web App** (Execute as: Me, Who has access: Anyone).
4. Copy the deployment URL into `APPS_SCRIPT_URL`.

---

## Telegram Bot Setup

1. Message [@BotFather](https://t.me/botfather) on Telegram and create a bot with `/newbot`.
2. Copy the bot token.
3. Add the bot to your target channel or group as an admin.
4. Get the chat ID:
   - For a group: add the bot, send a message, then call `https://api.telegram.org/bot{TOKEN}/getUpdates` to find the `chat.id`.
   - For a channel: prefix the channel username with `-100` (e.g. `-1001234567890`).
5. In n8n, create a **Telegram** credential with your bot token, then update all three Telegram nodes in the workflow to use this credential.

---

## Triggering the Slides Pipeline

Send a POST request to your n8n webhook URL:

```bash
curl -X POST https://YOUR_N8N_INSTANCE/webhook/generate-slides \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI倫理同香港教育",
    "audience": "中學生（中四至中六）",
    "objectives": "了解AI倫理基本概念，識別日常生活中嘅AI倫理問題",
    "theme": "modern-cantonese"
  }'
```

---

## Content Pillar Distribution

The workflow automatically assigns content pillars with the following weights:

| Pillar | Weight | Description |
|---|---|---|
| Education（教育） | 40% | In-depth educational content |
| Inspiration（啟發） | 25% | Motivational and success stories |
| Product（產品） | 20% | Feature highlights and use cases |
| Community（社群） | 15% | Community building and engagement |

---

## Workflow Architecture

```
[Daily 09:00 HKT]
       │
       ▼
[Fetch Google Sheets Topics]
       │
       ▼
[Pick Next Topic + Assign Pillar]
       │
       ▼
[DeepSeek: Generate Cantonese Draft]
       │
       ▼
[GPT-4o: Generate Visual Prompts]
       │
       ▼
[Telegram: Send Draft for Approval]
       │
       ▼
[IF: callback_data == "approve"]
    ├─ YES → [Publer: Schedule Post] → [Telegram: Success]
    └─ NO  → (end — no action)


[POST /webhook/generate-slides]
       │
       ▼
[Gemini 2.0 Flash: 16-Slide Outline]
       │
       ▼
[Apps Script: Create Google Slides]
       │
       ▼
[Claude Haiku: Generate Prompt Pack]
       │
       ▼
[Telegram: Send Slides Link]
```

---

## Notes

- The Telegram approval step requires the bot to receive callback query updates. If using a webhook-based bot setup, ensure the n8n Telegram node is polling or receiving webhook updates correctly.
- DeepSeek API base URL is `https://api.deepseek.com/v1` (OpenAI-compatible).
- Claude model `claude-haiku-4-5-20251001` is used for the prompt pack generation. Update to a newer Haiku model if this version is retired.
- All LLM prompts are written in Traditional Chinese / Cantonese (廣東話) to match the target audience.
