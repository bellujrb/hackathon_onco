"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, Square, Play, Activity, AlertCircle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

interface RiskAssessment {
  risk_level: string
  risk_score: number
  color: "green" | "orange" | "red"
  recommendation: string
  features_summary: {
    HNR: string
    F0: string
    Jitter: string
    Shimmer: string
  }
  risk_factors: string[]
}

interface AnalysisResult {
  features: Record<string, number>
  risk_assessment: RiskAssessment
}

export default function VoiceScanner() {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" | null }>({
    message: "",
    type: null,
  })
  const [results, setResults] = useState<AnalysisResult | null>(null)
  const [apiConnected, setApiConnected] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioBlobRef = useRef<Blob | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check API connectivity
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(() => setApiConnected(true))
      .catch(() => {
        setApiConnected(false)
        setStatus({
          message: "Não foi possível conectar ao servidor. Certifique-se de que o backend está rodando.",
          type: "error",
        })
      })
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        audioBlobRef.current = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setHasRecording(true)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setStatus({ message: 'Gravando... Sustente "AAAH" por 3-5 segundos', type: "info" })

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setStatus({ message: "Erro ao acessar microfone. Permita o acesso ao microfone.", type: "error" })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      setStatus({ message: 'Gravação concluída! Clique em "Analisar Voz" para obter o resultado.', type: "success" })
    }
  }

  const playRecording = () => {
    if (audioBlobRef.current) {
      const audio = new Audio(URL.createObjectURL(audioBlobRef.current))
      audio.play()
    }
  }

  const analyzeVoice = async () => {
    if (!audioBlobRef.current) {
      setStatus({ message: "Nenhuma gravação disponível.", type: "error" })
      return
    }

    try {
      setIsAnalyzing(true)
      setStatus({ message: "Analisando sua voz... Por favor, aguarde.", type: "info" })

      const formData = new FormData()
      formData.append("audio", audioBlobRef.current, "recording.wav")

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao processar áudio")
      }

      const data: AnalysisResult = await response.json()
      setResults(data)
      setStatus({ message: "Análise concluída!", type: "success" })

      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Analysis error:", error)
      setStatus({
        message: `Erro na análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        type: "error",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setResults(null)
    setHasRecording(false)
    setRecordingTime(0)
    setStatus({ message: "", type: null })
    audioBlobRef.current = null
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Scanner de Câncer de Laringe</h1>
          </div>
          <p className="text-center text-muted-foreground mt-2 text-sm md:text-base">
            Detecção precoce através de análise vocal com IA
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
        {/* Info Card */}
        <Card className="p-6 md:p-8 mb-6 bg-card/50 backdrop-blur">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">Como funciona?</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Esta ferramenta analisa sua voz para detectar sinais precoces de lesões nas cordas vocais, incluindo câncer
            de laringe. Baseada em pesquisas científicas publicadas em 2025.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Mic className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Grave sua voz</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Activity className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Análise de IA</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <span className="text-sm font-medium">Resultado instantâneo</span>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="p-6 md:p-8 mb-6 bg-card/50 backdrop-blur">
          <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">Instruções para gravação:</h3>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-semibold text-primary flex-shrink-0">1.</span>
              <span>Encontre um ambiente silencioso</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-primary flex-shrink-0">2.</span>
              <span>Posicione o microfone 10-15cm da boca</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-primary flex-shrink-0">3.</span>
              <span>Respire fundo</span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-primary flex-shrink-0">4.</span>
              <span>
                Sustente a vogal <strong className="text-foreground">"AAAH"</strong> (como em "pá") por 3-5 segundos
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-semibold text-primary flex-shrink-0">5.</span>
              <span>Mantenha volume e tom constantes</span>
            </li>
          </ol>
        </Card>

        {/* Recording Section */}
        <Card className="p-8 md:p-12 mb-6 bg-card/50 backdrop-blur">
          {/* Waveform */}
          <div className="flex justify-center items-center gap-2 h-20 mb-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 bg-primary rounded-full transition-all duration-300",
                  isRecording ? "animate-wave" : "h-5",
                )}
                style={{
                  animationDelay: isRecording ? `${i * 0.1}s` : undefined,
                  height: isRecording ? undefined : "20px",
                }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-8">
            <div className="text-5xl md:text-6xl font-bold text-primary font-mono">{formatTime(recordingTime)}</div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button onClick={startRecording} disabled={isRecording || !apiConnected} className="flex-1" size="lg">
              <Mic className="mr-2 h-5 w-5" />
              Iniciar Gravação
            </Button>

            <Button onClick={stopRecording} disabled={!isRecording} variant="secondary" className="flex-1" size="lg">
              <Square className="mr-2 h-5 w-5" />
              Parar
            </Button>

            <Button
              onClick={playRecording}
              disabled={!hasRecording || isRecording}
              variant="secondary"
              className="flex-1"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Reproduzir
            </Button>
          </div>

          <Button
            onClick={analyzeVoice}
            disabled={!hasRecording || isAnalyzing || isRecording}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? "Analisando..." : "Analisar Voz"}
          </Button>

          {/* Status */}
          {status.message && (
            <div
              className={cn(
                "mt-6 p-4 rounded-lg flex items-start gap-3",
                status.type === "info" && "bg-blue-50 text-blue-900 border border-blue-200",
                status.type === "success" && "bg-green-50 text-green-900 border border-green-200",
                status.type === "error" && "bg-red-50 text-red-900 border border-red-200",
              )}
            >
              {status.type === "info" && <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              {status.type === "success" && <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              {status.type === "error" && <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}
        </Card>

        {/* Results Section */}
        {results && (
          <div id="results" className="space-y-6">
            <Card className="p-8 md:p-12 bg-card/50 backdrop-blur">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">Resultado da Análise</h2>

              {/* Risk Card */}
              <div
                className={cn(
                  "p-8 rounded-xl border-4 mb-8 text-center",
                  results.risk_assessment.color === "green" && "bg-green-50 border-green-500",
                  results.risk_assessment.color === "orange" && "bg-orange-50 border-orange-500",
                  results.risk_assessment.color === "red" && "bg-red-50 border-red-500",
                )}
              >
                <div
                  className={cn(
                    "text-3xl md:text-4xl font-bold mb-6",
                    results.risk_assessment.color === "green" && "text-green-700",
                    results.risk_assessment.color === "orange" && "text-orange-700",
                    results.risk_assessment.color === "red" && "text-red-700",
                  )}
                >
                  {results.risk_assessment.risk_level}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        results.risk_assessment.color === "green" && "bg-green-500",
                        results.risk_assessment.color === "orange" && "bg-orange-500",
                        results.risk_assessment.color === "red" && "bg-red-500",
                      )}
                      style={{ width: `${results.risk_assessment.risk_score}%` }}
                    />
                  </div>
                  <span className="text-2xl font-bold text-foreground">{results.risk_assessment.risk_score}%</span>
                </div>

                <p className="text-base md:text-lg text-foreground leading-relaxed">
                  {results.risk_assessment.recommendation}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-6 bg-muted/50 rounded-xl text-center">
                  <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">HNR (Harmonia/Ruído)</h4>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {results.risk_assessment.features_summary.HNR}
                  </div>
                  <p className="text-xs text-muted-foreground">Relação harmônicos/ruído</p>
                </div>

                <div className="p-6 bg-muted/50 rounded-xl text-center">
                  <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">
                    Frequência Fundamental
                  </h4>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {results.risk_assessment.features_summary.F0}
                  </div>
                  <p className="text-xs text-muted-foreground">Frequência média da voz</p>
                </div>

                <div className="p-6 bg-muted/50 rounded-xl text-center">
                  <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">Jitter</h4>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {results.risk_assessment.features_summary.Jitter}
                  </div>
                  <p className="text-xs text-muted-foreground">Variação no pitch</p>
                </div>

                <div className="p-6 bg-muted/50 rounded-xl text-center">
                  <h4 className="text-xs md:text-sm font-semibold text-muted-foreground mb-2">Shimmer</h4>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {results.risk_assessment.features_summary.Shimmer}
                  </div>
                  <p className="text-xs text-muted-foreground">Variação na amplitude</p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="p-6 bg-muted/50 rounded-xl mb-6">
                <h4 className="text-lg font-semibold mb-4 text-foreground">
                  {results.risk_assessment.risk_factors.length > 0 ? "Fatores de Risco Identificados:" : "Análise:"}
                </h4>
                {results.risk_assessment.risk_factors.length > 0 ? (
                  <ul className="space-y-2">
                    {results.risk_assessment.risk_factors.map((factor, index) => (
                      <li key={index} className="flex gap-3 text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    Todos os parâmetros vocais estão dentro dos valores esperados para uma voz saudável.
                  </p>
                )}
              </div>

              <Button onClick={resetAnalysis} variant="secondary" className="w-full" size="lg">
                Nova Análise
              </Button>
            </Card>
          </div>
        )}

        {/* Disclaimer */}
        <Card className="p-6 bg-red-50 border-2 border-red-500">
          <div className="flex gap-3">
            <AlertCircle className="h-6 w-6 text-red-700 flex-shrink-0" />
            <div>
              <strong className="text-red-900 block mb-2">⚠️ AVISO IMPORTANTE:</strong>
              <p className="text-red-800 text-sm leading-relaxed">
                Esta ferramenta é apenas para triagem e NÃO substitui diagnóstico médico profissional. Sempre consulte
                um otorrinolaringologista para avaliação adequada.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground space-y-2">
          <p>Baseado em Papers Cientificos</p>
          <p>Dataset: Saarbrücken Voice Database e Bridge2AI-Voice</p>
        </footer>
      </main>
    </div>
  )
}

