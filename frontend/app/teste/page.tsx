'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function TestePageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!sessionId) {
      setError('Sessão inválida! Por favor, use o link enviado pelo WhatsApp.')
    }
    checkApiStatus()
  }, [sessionId])

  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 })
      console.log('✅ API Status:', response.data)
      setApiStatus('online')
    } catch (err) {
      console.error('❌ API não está acessível:', err)
      setApiStatus('offline')
      setError('Servidor de análise está offline. Por favor, tente novamente mais tarde.')
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
    } catch (err) {
      setError('Erro ao acessar o microfone. Permita o acesso e tente novamente.')
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const uploadAudio = async (audioBlob: Blob) => {
    if (!sessionId) {
      setError('Sessão inválida!')
      return
    }

    console.log('📤 Iniciando upload do áudio...')
    console.log('Session ID:', sessionId)
    console.log('Audio Blob:', {
      size: audioBlob.size,
      type: audioBlob.type
    })
    console.log('API URL:', `${API_URL}/api/analyze/${sessionId}`)

    setIsAnalyzing(true)
    setError(null)

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')

    try {
      console.log('⏳ Enviando requisição...')
      const response = await axios.post(
        `${API_URL}/api/analyze/${sessionId}`,
        formData,
        {
          timeout: 60000, // 60 segundos de timeout
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
            console.log(`📊 Upload: ${percentCompleted}%`)
          }
        }
      )
      
      console.log('✅ Análise enviada com sucesso:', response.data)

      // Análise completa! Backend enviará resultado automaticamente
      setCompleted(true)
    } catch (err: any) {
      console.error('❌ Erro completo:', err)
      console.error('Response:', err.response)
      
      let errorMessage = 'Erro ao processar áudio. Tente novamente.'
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.message) {
        errorMessage = `Erro: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const openWhatsApp = () => {
    const whatsappNumber = '5513936181426'
    const message = 'Resultado'
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (error && !sessionId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sessão Inválida</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎤 Teste de Voz</h1>
          <p className="text-gray-600">Rastreamento de Câncer de Laringe</p>
          
          {/* API Status Indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'online' ? 'bg-green-500 animate-pulse' : 
              apiStatus === 'offline' ? 'bg-red-500' : 
              'bg-yellow-500 animate-pulse'
            }`}></div>
            <span className="text-xs text-gray-500">
              {apiStatus === 'online' ? 'Servidor Online' : 
               apiStatus === 'offline' ? 'Servidor Offline' : 
               'Verificando servidor...'}
            </span>
          </div>
        </div>

        {!completed && (
          <>
            <div className="bg-primary-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-primary-700 mb-3">📋 Instruções:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li>1. Encontre um ambiente silencioso</li>
                <li>2. Posicione-se a 10-15cm do microfone</li>
                <li>3. Respire fundo</li>
                <li>4. Clique em gravar e sustente "aaah" por 3-5 segundos</li>
                <li>5. Mantenha volume e tom constantes</li>
              </ol>
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing || apiStatus === 'offline'}
              className={`w-full py-4 rounded-full font-semibold text-lg transition-all ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : isAnalyzing || apiStatus === 'offline'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600 text-white hover:shadow-lg'
              }`}
            >
              {isRecording ? '⏹️ Parar Gravação' : 
               isAnalyzing ? '⏳ Processando...' : 
               apiStatus === 'offline' ? '❌ Servidor Offline' :
               '🎤 Iniciar Gravação'}
            </button>

            {isRecording && (
              <p className="text-center mt-4 text-gray-600 font-medium">
                🔴 Gravando... Sustente "aaah"
              </p>
            )}

            {isAnalyzing && (
              <div className="mt-6 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                <p className="mt-4 text-gray-600">Analisando sua voz...</p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </>
        )}

        {completed && (
          <div className="space-y-6 text-center">
            <div className="bg-green-50 border-4 border-green-500 rounded-2xl p-8 animate-pulse">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-800 mb-3">Análise Concluída!</h2>
              <p className="text-green-700">
                Seu resultado foi processado e enviado automaticamente para o WhatsApp.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <p className="text-blue-800 font-medium mb-4">
                🔔 Abra seu WhatsApp agora para receber a análise completa explicada pela IA!
              </p>
              <button
                onClick={openWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Voltar ao WhatsApp
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Após abrir o WhatsApp, você receberá a análise detalhada com explicação da IA.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function TestePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </main>
    }>
      <TestePageContent />
    </Suspense>
  )
}
