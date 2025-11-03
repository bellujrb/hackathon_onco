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
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta gravação de áudio ou o site precisa estar em HTTPS.')
      }
      
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
    const filename = `recording-${Date.now()}.webm`
    formData.append('audio', audioBlob, filename)
    
    console.log('FormData details:', {
      filename,
      hasFile: formData.has('audio'),
      blobType: audioBlob.type
    })

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
      
      // Redirecionar para WhatsApp após 2 segundos
      setTimeout(() => {
        const whatsappNumber = '5513936181426'
        const message = 'Resultado'
        const url = `https://wa.me/${whatsappNumber}`
        window.location.href = url
      }, 2000)
    } catch (err: any) {
      console.error('❌ Erro completo:', err)
      console.error('Response:', err.response)
      console.error('Response data:', err.response?.data)
      console.error('Response status:', err.response?.status)
      
      let errorMessage = 'Erro ao processar áudio. Tente novamente.'
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data)
      } else if (err.message) {
        errorMessage = `Erro: ${err.message}`
      }
      
      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
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
            <div className="bg-green-50 border-4 border-green-500 rounded-2xl p-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-800 mb-3">Análise Concluída!</h2>
              <p className="text-green-700 mb-4">
                Seu resultado foi processado e enviado para o WhatsApp.
              </p>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <p className="text-green-600 mt-4 font-medium">
                Redirecionando para o WhatsApp...
              </p>
            </div>
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
