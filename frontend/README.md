# Scanner de Câncer de Laringe - Frontend

Frontend da aplicação de detecção precoce de câncer de laringe através de análise vocal com IA.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS 4** - Estilização
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js 18+ ou superior
- npm, yarn, pnpm ou bun

## 🔧 Instalação

1. Instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
# ou
bun install
```

2. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## 🏃 Executando o projeto

### Modo de desenvolvimento

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build para produção

```bash
npm run build
npm start
# ou
yarn build
yarn start
# ou
pnpm build
pnpm start
# ou
bun build
bun start
```

## 📁 Estrutura do projeto

```
frontend/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial (VoiceScanner)
│   └── globals.css        # Estilos globais
├── components/
│   └── ui/                # Componentes shadcn/ui
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   └── utils.ts           # Funções utilitárias
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## 🔗 Backend

Este frontend se conecta com o backend Flask. Certifique-se de que o backend está rodando antes de usar a aplicação.

Veja as instruções do backend em `/backend/README.md`

## 📱 Funcionalidades

- 🎤 Gravação de áudio do navegador
- 📊 Análise em tempo real de características vocais
- 🎨 Interface responsiva e moderna
- 📈 Visualização de resultados com métricas detalhadas
- ⚠️ Avaliação de risco com código de cores
- 🔄 Suporte para múltiplas análises

## 🎨 Design

O design foi otimizado para aplicações médicas/saúde:
- Cores calmas e profissionais (azul)
- Alta legibilidade
- Interface intuitiva
- Feedback visual claro

## 📄 Licença

Este projeto é para fins educacionais.

## ⚠️ Aviso Legal

Esta ferramenta é apenas para triagem e NÃO substitui diagnóstico médico profissional. Sempre consulte um otorrinolaringologista para avaliação adequada.

