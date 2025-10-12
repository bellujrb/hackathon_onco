# 🎤 Scanner de Câncer de Laringe

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![React](https://img.shields.io/badge/react-19.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15.5.4-black.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

Sistema de detecção precoce de câncer de laringe através de análise vocal com inteligência artificial. Baseado em pesquisas científicas publicadas na revista *Frontiers in Digital Health* (2025).

- **Frontend Hospedado:** https://hackathon-onco.vercel.app
- **Backend Hospedado:** https://hackathon-onco.onrender.com

## 🎯 Sobre o Projeto

Este projeto foi desenvolvido durante um hackathon e utiliza técnicas de Machine Learning para analisar características acústicas da voz humana e identificar possíveis sinais de lesões nas cordas vocais, incluindo câncer de laringe.

### 🔬 Embasamento Científico

O modelo é baseado no paper:
- **"Diagnostic Acoustics Distinguish Vocal Fold Lesions"** (Frontiers in Digital Health, 2025)
- **Dataset:** Bridge2AI-Voice - 12.523 amostras | Saarbrücken Voice Database (SVD) - 140 amostras

## ✨ Funcionalidades

- 🎙️ **Gravação de Voz:** Interface intuitiva para captura de áudio
- 🤖 **Análise por IA:** Processamento em tempo real com modelo especializado
- 📈 **Métricas Acústicas:** Análise de F0, Jitter, Shimmer e HNR
- 🎨 **Interface Moderna:** Design responsivo com Tailwind CSS e Radix UI
- ⚡ **Resultados Instantâneos:** Feedback imediato com visualizações claras

## 🏗️ Arquitetura

```
hackathon_onco/
├── backend/                    # API Flask (Python)
│   ├── app.py                 # Servidor principal
│   ├── features/              # Módulos de extração de features
│   │   ├── __init__.py
│   │   └── acoustic_features_ml.py
│   ├── train_laryngeal_cancer_model.py
│   └── requirements.txt
├── frontend/                   # Aplicação Next.js
│   ├── app/                   # Páginas e layouts
│   │   ├── page.tsx          # Página principal
│   │   └── layout.tsx
│   ├── components/            # Componentes React
│   │   └── ui/               # Componentes UI (shadcn/ui)
│   └── package.json
├── data/                      # Dataset de áudio
│   ├── *.wav                 # Arquivos de áudio
│   ├── *.egg                 # Dados EGG
│   └── *.nsp                 # Dados nasométricos
└── models/                    # Modelos treinados (gerados)
    ├── laryngeal_cancer_classifier.pkl
    └── svd_classifier.pkl
```

## 🚀 Tecnologias

### Backend
- **Flask** - Framework web
- **Flask-CORS** - Habilitar CORS
- **Praat-Parselmouth** - Análise acústica
- **NumPy & SciPy** - Processamento numérico
- **Librosa** - Análise de áudio
- **Scikit-learn** - Machine Learning
- **Pandas** - Manipulação de dados

### Frontend
- **Next.js 15** - Framework React
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- **Python** 3.8 ou superior
- **Node.js** 18 ou superior
- **npm** ou **yarn**
- **ffmpeg** (opcional, para conversão de áudio)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/hackathon_onco.git
cd hackathon_onco
```

### 2. Configurar o Backend

```bash
cd backend

# Criar ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Treinar o modelo (primeira vez)
python train_laryngeal_cancer_model.py
```

### 3. Configurar o Frontend

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install
```

## ▶️ Executando o Projeto

### Iniciar o Backend

```bash
cd backend
python app.py
```

O servidor estará rodando em `http://localhost:5002`

### Iniciar o Frontend

```bash
cd frontend
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🎯 Como Usar

1. **Acesse a aplicação** no navegador
2. **Permita o acesso ao microfone** quando solicitado
3. **Siga as instruções na tela:**
   - Encontre um ambiente silencioso
   - Posicione o microfone 10-15cm da boca
   - Respire fundo
   - Sustente a vogal **"AAAH"** por 3-5 segundos
   - Mantenha volume e tom constantes
4. **Clique em "Parar"** após a gravação
5. **Clique em "Analisar Voz"** para obter o resultado
6. **Visualize os resultados:**
   - Nível de risco (Baixo/Moderado/Alto)
   - Score de risco (0-100%)
   - Métricas acústicas detalhadas
   - Fatores de risco identificados
   - Recomendações

## 🔬 Metodologia

### Extração de Features

O sistema extrai características acústicas usando a biblioteca Parselmouth (interface Python para Praat):

```python
# Exemplo de features extraídas
- Frequência Fundamental (F0) - média e desvio padrão
- Jitter (%) - perturbação do período vocal
- Shimmer (%) - variação na amplitude
- HNR (dB) - relação harmônicos-ruído
- Duração do áudio
```

### Classificação

- **Modelo:** SVM (Support Vector Machine)
- **Treinamento:** Baseado em indicadores médicos da literatura
- **Validação:** Dataset Saarbrücken Voice Database

## ⚠️ Aviso Importante

**Esta ferramenta é APENAS para triagem e NÃO substitui diagnóstico médico profissional.**

- Os resultados são indicativos e não definitivos
- Sempre consulte um **otorrinolaringologista** para avaliação adequada
- Não tome decisões médicas baseadas exclusivamente nesta ferramenta
- Em caso de resultado de alto risco, procure atendimento médico imediatamente

