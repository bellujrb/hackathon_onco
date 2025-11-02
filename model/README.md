# 🔬 Model - Backend Python

API FastAPI para análise acústica de voz e detecção de câncer de laringe.

## 🚀 Iniciar

```bash
# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar servidor
uvicorn app:app --reload --port 8000
```

## 📡 Endpoints

### `POST /api/analyze/{session_id}`
Analisa arquivo de áudio e salva resultado em cache

**Body**: `multipart/form-data`
- `audio`: arquivo de áudio (WAV, MP3, OGG, WEBM, M4A)

**Response**:
```json
{
  "success": true,
  "features": {
    "fundamentalFrequency": { "mean": 150.2, "std": 12.5 },
    "jitter": { "local": 1.2, "rap": 0.8, "ppq5": 0.9 },
    "shimmer": { "local": 3.4, "apq3": 2.1, "apq5": 2.3 },
    "hnr": { "mean": 18.5, "std": 2.1 },
    "duration": 3.2
  },
  "riskAssessment": {
    "riskLevel": "BAIXO RISCO",
    "riskScore": 8,
    "riskFactors": [],
    "recommendation": "Parâmetros vocais dentro da normalidade...",
    "color": "green",
    "confidence": 90
  }
}
```

### `GET /api/result/{session_id}`
Busca resultado do cache

### `GET /api/session/{session_id}/status`
Verifica status da sessão

## 🔬 Algoritmo

### Parâmetros Analisados
- **HNR** (Harmonics-to-Noise Ratio): Qualidade vocal
- **F0** (Frequência Fundamental): Pitch da voz
- **Jitter**: Perturbação de frequência
- **Shimmer**: Perturbação de amplitude

### Thresholds (ULTRA CONSERVADORES)
- HNR < 4 dB = Patologia severa
- Jitter > 6% = Instabilidade extrema
- Shimmer > 20% = Perturbação severa
- F0 < 70 Hz ou > 300 Hz = Anormalidade significativa

### Scoring
- **0 indicadores severos** → 5-8 pontos (BAIXO RISCO)
- **1 indicador severo** → 15 pontos (BAIXO RISCO)
- **2 indicadores severos** → 30 pontos (BAIXO RISCO)
- **3 indicadores severos** → 45 pontos (MODERADO)
- **4+ indicadores severos** → 75+ pontos (ALTO RISCO)

## 💾 Cache

- **Redis** (se disponível) ou memória
- Expiração: 24 horas
- Key: `session:{session_id}`

## 🌐 Deploy

### Railway
```bash
railway login
railway init
railway up
```

### Render
1. Conectar repositório
2. Configurar build: `pip install -r requirements.txt`
3. Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`

