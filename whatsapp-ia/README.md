# 🤖 WhatsApp IA - Voice Check

Bot WhatsApp inteligente com IA para triagem de câncer de laringe através de análise vocal.

## 🏗️ Arquitetura

Este projeto é composto por **3 módulos** integrados:

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  whatsapp-ia │ ───► │   frontend   │ ───► │    model     │
│   (NestJS)   │ ◄─── │   (Next.js)  │ ◄─── │   (Python)   │
└──────────────┘      └──────────────┘      └──────────────┘
     Bot IA          Interface Web      Análise de Voz
```

### Módulos:

- **whatsapp-ia** (este repo): Bot WhatsApp com conversação IA e transcrição de áudio
- **frontend**: Interface web para gravação de áudio
- **model**: API Python com modelo ML para análise vocal

## 🚀 Iniciar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Iniciar em desenvolvimento
npm run dev
```

Na primeira execução, escaneie o QR Code no terminal com WhatsApp.

## 🔄 Fluxo Completo

```
1. Usuário → Manda mensagem no WhatsApp
2. Bot IA → Conversa e detecta intenção de fazer teste
3. Bot → Cria sessão e envia link do frontend
4. Usuário → Clica no link e grava áudio "aaah"
5. Frontend → Envia áudio para Model API (Python)
6. Model → Analisa voz e envia resultado via webhook
7. Bot → Recebe webhook automaticamente
8. Bot + LangGraph AI → Gera explicação personalizada
9. Bot → Envia resultado no WhatsApp (automático)
```

**Novo:** O resultado volta **automaticamente** para o WhatsApp via webhook!

## 💬 Exemplos de Uso

### Mensagem de Texto
```
Usuário: "Oi, quero fazer o teste"
Bot: "Pronto! 🎤

*Link do teste:* https://...

Clique, grave o som "aaah" por 3-5 segundos, e o resultado volta aqui!"
```

### Mensagem de Áudio
```
Usuário: [áudio "Oi, quero fazer o teste"]
Bot: [transcreve automaticamente e responde como texto]
```

### Após completar o teste
```
[Usuário grava áudio no frontend]
[Model analisa e envia webhook]
Bot: "Recebi seu teste! Analisando... 🔍"
Bot: [aguarda 2s]
Bot: "🟢 *BAIXO RISCO*

Sua análise não identificou sinais de preocupação...

📊 *Dados Analisados:*
🎵 Frequência vocal: 180.5 Hz
📈 Estabilidade vocal (Jitter): 0.45%
..."
```

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js modular
- **Baileys** - WhatsApp Web API (conexão oficial)
- **LangChain + OpenAI** - Agentes conversacionais inteligentes
- **LangGraph** - Orquestração de múltiplos agentes IA
- **OpenAI Whisper** - Transcrição de áudio em tempo real
- **TypeScript** - Tipagem estática e segurança

## ✨ Funcionalidades

### 🎤 Transcrição de Áudio
- Usuário pode mandar **áudio de voz** no WhatsApp
- Bot transcreve automaticamente usando **OpenAI Whisper**
- Processa como se fosse mensagem de texto
- Totalmente transparente para o usuário

### 🤖 Conversação Inteligente
- Agentes IA conversam naturalmente
- Detectam intenção (fazer teste, tirar dúvidas, etc)
- Mantêm histórico de conversa
- Explicações personalizadas dos resultados

### 🔗 Pipeline Automatizada
- Link gerado automaticamente por sessão
- Webhook retorna resultado direto no WhatsApp
- Sem necessidade do usuário pedir resultado

## 📡 APIs e Integrações

### Webhook (recebe do Model)
```
POST /api/webhook/result
Body: { sessionId, result }
```

### Endpoints Internos
```typescript
// SessionService - Gerencia sessões temporárias
createSession(whatsappId) → sessionId
getSession(sessionId) → { whatsappId, createdAt }

// ConversationAgent - Detecta intenção
detectIntent(message) → 'send_test_link' | 'general_conversation'

// ResultAnalysisAgent - Explica resultados
explainResult(result) → mensagem formatada

// AudioTranscriptionService - Transcreve áudios
transcribe(audioBuffer) → texto
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# OpenAI (obrigatório para transcrição de áudio e conversação)
OPENAI_API_KEY=sk-...

# URLs dos serviços
FRONTEND_URL=https://voice-check.vercel.app
MODEL_API_URL=https://model-api.railway.app

# Porta do servidor
PORT=3001
```

## 🏗️ Estrutura do Projeto

```
whatsapp-ia/
├── src/
│   ├── langgraph/              # Sistema de Agentes IA
│   │   ├── agents/
│   │   │   ├── conversation.agent.ts    # Conversação geral
│   │   │   ├── result-analysis.agent.ts # Análise de resultados
│   │   │   └── base/
│   │   │       └── base-agent.ts        # Agente base
│   │   ├── services/
│   │   │   └── openai-model.service.ts  # Cliente OpenAI
│   │   ├── types/
│   │   │   └── agent.types.ts           # Tipos TypeScript
│   │   └── langgraph.module.ts
│   │
│   ├── whatsapp/               # Bot WhatsApp
│   │   ├── whatsapp.service.ts          # Lógica principal
│   │   ├── whatsapp.controller.ts       # Webhook endpoint
│   │   ├── audio-transcription.service.ts # Whisper API
│   │   └── whatsapp.module.ts
│   │
│   ├── session/                # Gerenciamento de sessões
│   │   ├── session.service.ts
│   │   └── session.module.ts
│   │
│   ├── app.module.ts           # Módulo raiz
│   └── main.ts                 # Bootstrap
│
├── auth/                       # Credenciais WhatsApp (auto-gerado)
├── temp/                       # Arquivos temporários de áudio
├── dist/                       # Build compilado
├── package.json
└── tsconfig.json
```

## 📦 Build

```bash
# Compilar
npm run build

# Executar produção
npm run start:prod
```

## 🚀 Deploy

### Opção 1: VPS/Servidor Dedicado

```bash
# No servidor
git clone <repo>
cd whatsapp-ia
npm install
npm run build

# Configurar .env com credenciais

# Rodar com PM2
npm install -g pm2
pm2 start npm --name "whatsapp-ia" -- run start:prod
pm2 save
pm2 startup
```

### Opção 2: Railway

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

## 🔐 Segurança

- ✅ Sessões expiram em 24h
- ✅ Validação de session_id
- ✅ Rate limiting recomendado
- ✅ Logs de todas as operações

## 🧪 Teste Local

1. **Inicie todos os serviços:**

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

# Terminal 3: WhatsApp IA
cd ../whatsapp-ia
npm install
npm run dev
```

2. **Escaneie QR Code**
3. **Envie "teste" no WhatsApp**
4. **Acesse link, grave áudio**
5. **Digite "resultado"**

## 📝 Logs

```bash
# Ver logs em tempo real
pm2 logs whatsapp-ia

# Logs específicos
tail -f logs/app.log
```

## ⚠️ Troubleshooting

### QR Code não aparece
- Apague pasta `auth/`
- Reinicie o servidor

### "Sessão não encontrada"
- Sessão expirou (24h)
- Envie mensagem pedindo novo teste

### Transcrição de áudio não funciona
- Verifique se `OPENAI_API_KEY` está no `.env`
- Verifique se o diretório `temp/` existe
- Reinicie o servidor após configurar

### Resultado não chega automaticamente
- Verifique se Model API está enviando webhook corretamente
- Verifique logs: `pm2 logs whatsapp-ia`
- Endpoint webhook: `POST /api/webhook/result`

### Bot não responde
- Verifique conexão WhatsApp (QR Code válido)
- Verifique `OPENAI_API_KEY` configurada
- Verifique logs de erro no console

## 📚 Documentação

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [NestJS](https://docs.nestjs.com) - Framework Node.js
- [LangChain](https://js.langchain.com) - Framework de Agentes IA
- [OpenAI](https://platform.openai.com/docs) - API GPT e Whisper
- [LangGraph](https://langchain-ai.github.io/langgraphjs/) - Orquestração de Agentes

## 👨‍💻 Desenvolvido por

Voice Check 
## 📄 Licença

MIT

