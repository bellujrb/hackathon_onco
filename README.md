# 🎤 Voice Check - Sistema de Rastreamento de Câncer de Laringe

Sistema completo de análise de voz via WhatsApp para rastreamento de câncer de laringe usando IA.

## 📦 Arquitetura

```
voice-check-oncologia/
├── frontend/          # Next.js + Tailwind CSS
├── model/             # FastAPI + Python ML
└── whatsapp-ia/       # NestJS + WhatsApp + Gemini AI
```

## 🚀 Fluxo Completo (100% Automático)

1. **Usuário** envia mensagem no WhatsApp (texto ou áudio)
2. **LLM Gemini** detecta intenção automaticamente
3. **whatsapp-ia** cria sessão e envia link: `https://app.com/teste?session=ABC123`
4. **Usuário** abre link e grava áudio
5. **Frontend** → **Model** analisa áudio
6. **Frontend** envia resultado via webhook para **whatsapp-ia**
7. **Gemini AI** explica resultado em linguagem simples
8. **Bot** envia explicação AUTOMATICAMENTE no WhatsApp
9. **Usuário** recebe tudo sem precisar pedir!

✨ **Totalmente automático** - Zero fricção para o usuário!

## 🛠️ Tecnologias

### Frontend
- ⚡ **Next.js 14** (App Router)
- 🎨 **Tailwind CSS** 
- 🎤 **Web Audio API**
- 📱 **Design Responsivo**

### Model (Backend Python)
- 🚀 **FastAPI**
- 🔬 **Parselmouth** (Praat wrapper)
- 🧠 **Scikit-learn** (ML)
- 💾 **Redis** (Cache)

### WhatsApp + IA
- 🤖 **NestJS**
- 💬 **Baileys** (WhatsApp)
- 🧠 **Google Gemini AI**
- ☁️ **Vercel** (Deploy)

## 📋 Iniciar Desenvolvimento

### ⚡ Opção 1: Script Automático (Recomendado)

```bash
cd voice-check-oncologia
./start-dev.sh  # Inicia tudo de uma vez!
```

### 🔧 Opção 2: Manual (3 Terminais)

**Terminal 1: Model (Python)**
```bash
cd model
source venv/bin/activate
uvicorn app:app --reload --port 8000
```

**Terminal 2: Frontend (Next.js)**
```bash
cd frontend
npm run dev  # http://localhost:3000
```

**Terminal 3: WhatsApp IA (NestJS)**
```bash
cd whatsapp-ia
npm run dev  # http://localhost:3001
```

### 📱 Conectar WhatsApp

Escaneie o QR Code que aparece no Terminal 3!

### 🛑 Parar Tudo

```bash
./stop-dev.sh
```

## 🌐 Deploy

### Frontend (Vercel)
```bash
cd frontend
vercel --prod
```

### Model (Railway/Render)
```bash
cd model
# Configurar em railway.app ou render.com
```

### WhatsApp IA (Vercel Serverless)
```bash
cd whatsapp-ia
vercel --prod
```

## 📚 Documentação

- 📘 [Quick Start](./QUICK-START.md) - Início rápido
- 🔄 [Fluxo Completo](./FLUXO-COMPLETO.md) - Detalhes técnicos
- 🎨 [Frontend](./frontend/README.md)
- 🔬 [Model](./model/README.md)
- 🤖 [WhatsApp IA](./whatsapp-ia/README.md)

## 🔐 Variáveis de Ambiente

Copie os arquivos `.env.example` em cada pasta e configure:

- `GOOGLE_API_KEY` - Gemini AI
- `MODEL_API_URL` - URL do backend Python
- `FRONTEND_URL` - URL do frontend
- `REDIS_URL` - URL do Redis (opcional)

## 👨‍💻 Desenvolvido por

João Rubens Belluzzi Neto

## 📄 Licença

MIT

