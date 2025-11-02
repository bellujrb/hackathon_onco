# 🎨 Frontend - Voice Check

Interface Next.js moderna para captura e análise de voz.

## 🚀 Iniciar

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

## 📱 Páginas

### `/` - Home
Página inicial com informações sobre o sistema.

### `/teste?session=ABC123` - Teste de Voz
Página de captura de áudio com:
- ✅ Gravação via Web Audio API
- ✅ Upload para backend Python
- ✅ Exibição de resultados em tempo real
- ✅ Design responsivo e moderno
- ✅ Feedback visual durante análise

## 🎨 Tecnologias

- **Next.js 14** (App Router)
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **Axios** para requisições HTTP
- **Web Audio API** para gravação

## 🔧 Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:8000  # URL do backend Python
```

## 📦 Build para Produção

```bash
npm run build
npm start
```

## 🌐 Deploy na Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Configurar na Vercel:
1. Adicionar variável: `NEXT_PUBLIC_API_URL` com URL do backend em produção
2. Deploy automático a cada push no GitHub

## 🎯 Fluxo de Uso

1. Usuário recebe link do WhatsApp: `https://app.com/teste?session=ABC123`
2. Abre no navegador
3. Clica em "Iniciar Gravação"
4. Grava áudio sustentando "aaah" por 3-5 segundos
5. Frontend envia para backend Python
6. Resultado é exibido instantaneamente
7. Resultado é salvo em cache com `session_id`
8. Usuário volta ao WhatsApp
9. Bot busca resultado e LLM explica

## 🎨 Componentes

### RecordButton
- Estados: idle, recording, analyzing
- Feedback visual com animações
- Tratamento de erros

### ResultDisplay  
- Cards coloridos baseados em risco
- Grid com métricas acústicas
- Lista de fatores de risco
- Recomendações claras

## 🔒 Segurança

- Validação de session_id
- Timeout de sessão (24h)
- CORS configurado
- Sanitização de inputs

## 📱 Responsividade

- ✅ Mobile-first design
- ✅ Tablet otimizado
- ✅ Desktop com layout expandido

