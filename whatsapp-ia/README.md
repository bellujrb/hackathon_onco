# 🤖 WhatsApp IA - Voice Check

Bot WhatsApp com Gemini AI para análise de voz e detecção de câncer de laringe.

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

## 📱 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `teste` | Inicia novo teste de voz e envia link |
| `resultado` | Busca e explica o resultado do teste |
| `ajuda` | Mostra menu de ajuda |

## 🔄 Fluxo Completo

```
1. Usuário → "quero fazer teste"
2. Bot → Cria sessão e envia link
3. Usuário → Acessa link e grava áudio
4. Frontend → Envia para Model (Python)
5. Model → Analisa e salva em cache
6. Usuário → Volta ao WhatsApp, digita "resultado"
7. Bot → Busca do cache
8. Gemini AI → Explica em linguagem simples
9. Bot → Envia explicação detalhada
```

## 🛠️ Tecnologias

- **NestJS** - Framework Node.js
- **Baileys** - WhatsApp Web API
- **Google Gemini AI** - Explicações inteligentes
- **Axios** - Requisições HTTP
- **TypeScript** - Tipagem estática

## 📡 APIs Integradas

### Model API (Python)
```typescript
GET /api/result/{session_id}
// Busca resultado da análise
```

### Gemini AI
```typescript
// Explica resultados em linguagem simples
aiService.explainResult(result)
```

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# API Key do Google Gemini
GOOGLE_API_KEY=AIzaSy...

# URLs dos serviços
FRONTEND_URL=https://voice-check.vercel.app
MODEL_API_URL=https://model-api.railway.app

# Porta do servidor
PORT=3001
```

## 🏗️ Estrutura

```
whatsapp-ia/
├── src/
│   ├── ai/              # Integração com Gemini
│   │   ├── ai.service.ts
│   │   └── ai.module.ts
│   ├── session/         # Gerenciamento de sessões
│   │   ├── session.service.ts
│   │   └── session.module.ts
│   ├── whatsapp/        # Bot WhatsApp
│   │   ├── whatsapp.service.ts
│   │   └── whatsapp.module.ts
│   ├── app.module.ts
│   └── main.ts
├── auth/                # Credenciais WhatsApp (auto-gerado)
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
- Digite "teste" para criar nova

### "Resultado não encontrado"
- Usuário ainda não completou o teste
- Cache expirou
- Model API offline

## 📚 Documentação

- [Baileys](https://github.com/WhiskeySockets/Baileys)
- [NestJS](https://docs.nestjs.com)
- [Gemini AI](https://ai.google.dev)

## 👨‍💻 Desenvolvido por

João Rubens Belluzzi Neto

## 📄 Licença

MIT

