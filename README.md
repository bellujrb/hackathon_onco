# 🤖 WhatsApp AI - Voice Check

Intelligent WhatsApp AI Whatsapp with AI for laryngeal cancer screening through voice analysis.

## 🏗️ Architecture

This project consists of **3 integrated modules**:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  whatsapp-ia │ ───► │   frontend   │ ───► │    model     │
│   (NestJS)   │ ◄─── │   (Next.js)  │ ◄─── │   (Python)   │
└──────────────┘      └──────────────┘      └──────────────┘
    AI AI Whatsapp           Web Interface      Voice Analysis
```

### Modules:

- **whatsapp-ia** (this repo): WhatsApp AI Whatsapp with AI conversation and audio transcription
- **frontend**: Web interface for audio recording
- **model**: Python API with ML model for voice analysis

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Start in development mode
npm run dev
```

On first run, scan the QR Code in the terminal with WhatsApp.

## 🔄 Complete Flow

```
1. User → Sends message on WhatsApp
2. AI Whatsapp → Converses and detects test intent
3. AI Whatsapp → Creates session and sends frontend link
4. User → Clicks link and records "aaah" audio
5. Frontend → Sends audio to Model API (Python)
6. Model → Analyzes voice and sends result via webhook
7. AI Whatsapp → Receives webhook automatically
8. AI Whatsapp + LangGraph AI → Generates personalized explanation
9. AI Whatsapp → Sends result on WhatsApp (automatic)
```

**New:** Results return **automatically** to WhatsApp via webhook!

## 💬 Usage Examples

### Text Message
```
User: "Hi, I want to take the test"
AI Whatsapp: "Ready! 🎤

*Test link:* https://...

Click, record the sound "aaah" for 3-5 seconds, and the result will come back here!"
```

### Voice Message
```
User: [audio "Hi, I want to take the test"]
AI Whatsapp: [automatically transcribes and responds as text]
```

### After completing the test
```2
[User records audio on frontend]
[Model analyzes and sends webhook]
AI Whatsapp: "Got your test! Analyzing... 🔍"
AI Whatsapp: [waits 2s]
AI Whatsapp: "🟢 *LOW RISK*

Your analysis did not identify signs of concern...

📊 *Analyzed Data:*
🎵 Vocal frequency: 180.5 Hz
📈 Vocal stability (Jitter): 0.45%
..."
```

## 🛠️ Technologies

- **NestJS** - Modular Node.js framework
- **Baileys** - WhatsApp Web API (official connection)
- **LangChain + OpenAI** - Intelligent conversational agents
- **LangGraph** - Multi-agent orchestration
- **OpenAI Whisper** - Real-time audio transcription
- **TypeScript** - Static typing and safety

## ✨ Features

### 🎤 Audio Transcription
- User can send **voice messages** on WhatsApp
- AI Whatsapp automatically transcribes using **OpenAI Whisper**
- Processes as if it were a text message
- Completely transparent to the user

### 🤖 Intelligent Conversation
- AI agents converse naturally
- Detect intent (take test, ask questions, etc)
- Maintain conversation history
- Personalized result explanations

### 🔗 Automated Pipeline
- Link automatically generated per session
- Webhook returns result directly to WhatsApp
- No need for user to request result

## 📡 APIs and Integrations

### Webhook (receives from Model)
```
POST /api/webhook/result
Body: { sessionId, result }
```

### Internal Endpoints
```typescript
// SessionService - Manages temporary sessions
createSession(whatsappId) → sessionId
getSession(sessionId) → { whatsappId, createdAt }

// ConversationAgent - Detects intent
detectIntent(message) → 'send_test_link' | 'general_conversation'

// ResultAnalysisAgent - Explains results
explainResult(result) → formatted message

// AudioTranscriptionService - Transcribes audios
transcribe(audioBuffer) → text
```

## ⚙️ Configuration

### Environment Variables

```env
# OpenAI (required for audio transcription and conversation)
OPENAI_API_KEY=sk-...

# Service URLs
FRONTEND_URL=https://voice-check.vercel.app
MODEL_API_URL=https://model-api.railway.app

# Server port
PORT=3001
```

## 🏗️ Project Structure

```
whatsapp-ia/
├── src/
│   ├── langgraph/              # AI Agents System
│   │   ├── agents/
│   │   │   ├── conversation.agent.ts    # General conversation
│   │   │   ├── result-analysis.agent.ts # Results analysis
│   │   │   └── base/
│   │   │       └── base-agent.ts        # Base agent
│   │   ├── services/
│   │   │   └── openai-model.service.ts  # OpenAI client
│   │   ├── types/
│   │   │   └── agent.types.ts           # TypeScript types
│   │   └── langgraph.module.ts
│   │
│   ├── whatsapp/               # WhatsApp AI Whatsapp
│   │   ├── whatsapp.service.ts          # Main logic
│   │   ├── whatsapp.controller.ts       # Webhook endpoint
│   │   ├── audio-transcription.service.ts # Whisper API
│   │   └── whatsapp.module.ts
│   │
│   ├── session/                # Session Management
│   │   ├── session.service.ts
│   │   └── session.module.ts
│   │
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Bootstrap
│
├── auth/                       # WhatsApp credentials (auto-generated)
├── temp/                       # Temporary audio files
├── dist/                       # Compiled build
├── package.json
└── tsconfig.json
```

## 📦 Build

```bash
# Compile
npm run build

# Run production
npm run start:prod
```

## 🚀 Deploy

### Option 1: VPS/Dedicated Server

```bash
# On the server
git clone <repo>
cd whatsapp-ia
npm install
npm run build

# Configure .env with credentials

# Run with PM2
npm install -g pm2
pm2 start npm --name "whatsapp-ia" -- run start:prod
pm2 save
pm2 startup
```

### Option 2: Railway

```bash
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

## 🔐 Security

- ✅ Sessions expire in 24h
- ✅ session_id validation
- ✅ Rate limiting recommended
- ✅ Logs of all operations

## 🧪 Local Testing

1. **Start all services:**

```bash
# Terminal 1: Model (Python)
cd ../model
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

# Terminal 2: Frontend
cd ../frontend
npm install
npm run dev

# Terminal 3: WhatsApp AI
cd ../whatsapp-ia
npm install
npm run dev
```

2. **Scan QR Code**
3. **Send "test" on WhatsApp**
4. **Access link, record audio**
5. **Result arrives automatically**

## 📝 Logs

```bash
# View logs in real-time
pm2 logs whatsapp-ia

# Specific logs
tail -f logs/app.log
```

## ⚠️ Troubleshooting

### QR Code doesn't appear
- Delete `auth/` folder
- Restart the server

### "Session not found"
- Session expired (24h)
- Send message requesting new test

### Audio transcription doesn't work
- Check if `OPENAI_API_KEY` is in `.env`
- Check if `temp/` directory exists
- Restart server after configuring

### Result doesn't arrive automatically
- Check if Model API is sending webhook correctly
- Check logs: `pm2 logs whatsapp-ia`
- Webhook endpoint: `POST /api/webhook/result`

### AI Whatsapp doesn't respond
- Check WhatsApp connection (valid QR Code)
- Check `OPENAI_API_KEY` configured
- Check error logs in console

## 📚 Documentation

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [NestJS](https://docs.nestjs.com) - Node.js Framework
- [LangChain](https://js.langchain.com) - AI Agents Framework
- [OpenAI](https://platform.openai.com/docs) - GPT and Whisper API
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) - Agent Orchestration

## 👨‍💻 Developed by

Voice Check Team

## 📄 License

MIT
