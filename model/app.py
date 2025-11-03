"""
FastAPI for Laryngeal Cancer Voice Scanner

Receives audio recordings and returns acoustic analysis with risk assessment.
Based on hackathon_onco backend - EXACT same analysis logic.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
import traceback
import subprocess
import httpx
from dotenv import load_dotenv

from features.acoustic_features_ml import VoiceAnalyzerML

load_dotenv()

app = FastAPI(
    title="Voice Check API",
    description="API para análise de voz e detecção de câncer de laringe",
    version="2.0.0"
)

# CORS - Permitir todas as origens sem credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Mudado para False para funcionar com allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Inicializar analyzer com modelo ML
analyzer = VoiceAnalyzerML(model_path='models/laryngeal_cancer_classifier.pkl')
if analyzer.model_loaded:
    print("✓ Using LARYNGEAL CANCER-SPECIFIC ML MODEL (96.9% accuracy)")
else:
    print("✓ Using RULE-BASED classification (ultra conservative)")

WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://localhost:3001")


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def convert_to_wav(input_path, output_path):
    """
    Convert audio file to WAV format compatible with Praat/Parselmouth.
    Uses ffmpeg - SAME as hackathon_onco
    """
    try:
        result = subprocess.run([
            'ffmpeg', '-y', '-i', input_path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            output_path
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            return True
        else:
            print(f"ffmpeg error: {result.stderr}")
            return False
            
    except FileNotFoundError:           
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_file(input_path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(output_path, format='wav')
            return True
        except Exception as e:
            print(f"Conversion error: {e}")
            return False
    except Exception as e:
        print(f"Unexpected error in conversion: {e}")
        return False


@app.get("/")
def root():
    return {
        "message": "Voice Check API - Laryngeal Cancer Detection",
        "version": "2.0.0",
        "status": "online"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        'status': 'healthy',
        'message': 'Laryngeal Cancer Scanner API is running'
    }


@app.post("/api/analyze/{session_id}")
async def analyze_voice(
    session_id: str,
    audio: UploadFile = File(...)
):
    """
    Analyze voice recording and return risk assessment.
    EXACT SAME LOGIC as hackathon_onco + webhook to WhatsApp
    
    Expects:
        - audio file
        - session_id in path
    
    Returns:
        JSON with features, risk level, and recommendations
    """
    try:
        if not audio.filename:
            raise HTTPException(400, 'No audio file provided')

        if not allowed_file(audio.filename):
            raise HTTPException(400, f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}')

        # Save file
        filename = audio.filename.replace(' ', '_')
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        
        with open(filepath, 'wb') as f:
            content = await audio.read()
            f.write(content)

        try:
            wav_filepath = filepath
            # SEMPRE converter - MESMO comportamento do hackathon_onco
            if not filepath.endswith('.wav') or True:  
                wav_filepath = os.path.join(UPLOAD_FOLDER, 'converted_' + os.path.splitext(filename)[0] + '.wav')
                print(f"Converting {filepath} to {wav_filepath}")
                
                if not convert_to_wav(filepath, wav_filepath):
                    raise HTTPException(400, 'Failed to convert audio to WAV format. Please ensure the audio is valid.')
                
                if os.path.exists(filepath) and filepath != wav_filepath:
                    os.remove(filepath)
                
                filepath = wav_filepath
            
            # EXTRACT FEATURES - EXACTLY like hackathon_onco
            print(f"🔍 Extracting features from: {filepath}")
            features = analyzer.extract_features(filepath)

            # CLASSIFY RISK - EXACTLY like hackathon_onco
            print(f"📊 Classifying risk...")
            risk_assessment = analyzer.classify_risk(features)

            # Converter snake_case para camelCase (compatibilidade TypeScript)
            response = {
                'success': True,
                'features': {
                    'fundamentalFrequency': features['fundamental_frequency'],
                    'jitter': features['jitter'],
                    'shimmer': features['shimmer'],
                    'hnr': features['hnr'],
                    'duration': features['duration']
                },
                'riskAssessment': {
                    'riskLevel': risk_assessment['risk_level'],
                    'riskScore': risk_assessment['risk_score'],
                    'riskFactors': risk_assessment['risk_factors'],
                    'recommendation': risk_assessment['recommendation'],
                    'color': risk_assessment['color'],
                    'confidence': risk_assessment.get('confidence', 90)
                }
            }

            print(f"✅ Analysis complete - Risk: {risk_assessment['risk_level']} ({risk_assessment['risk_score']}/100)")

            # ✨ WEBHOOK - Send result to WhatsApp IA automatically
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    webhook_response = await client.post(
                        f"{WHATSAPP_API_URL}/api/webhook/result",
                        json={
                            "sessionId": session_id,
                            "result": response
                        }
                    )
                    print(f"📤 Webhook sent to WhatsApp IA: {webhook_response.status_code}")
            except Exception as webhook_error:
                print(f"⚠️ Webhook error (non-blocking): {webhook_error}")

            return response

        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(500, f'Error processing audio: {str(e)}')


@app.get("/info")
def get_info():
    """Return information about the scanner and methodology"""
    return {
        'name': 'Voice Check - Laryngeal Cancer Scanner',
        'version': '2.0.0',
        'description': 'AI-powered voice analysis SPECIFICALLY for laryngeal cancer risk assessment',
        'model_type': 'Rule-based Cancer Detection',
        'based_on': 'Diagnostic Acoustics Distinguish Vocal Fold Lesions (Frontiers in Digital Health, 2025)',
        'cancer_indicators': [
            'HNR < 4 dB (extremely low harmonic-to-noise ratio)',
            'Jitter > 6% (extreme pitch perturbation)',
            'Shimmer > 20% (extreme amplitude instability)',
            'F0 < 70 Hz or > 300 Hz (abnormal fundamental frequency)'
        ],
        'features_analyzed': [
            'Fundamental Frequency (F0)',
            'Jitter (pitch perturbation)',
            'Shimmer (amplitude perturbation)',
            'Harmonics-to-Noise Ratio (HNR)'
        ],
        'instructions': [
            '1. Find a quiet environment',
            '2. Hold phone/microphone 10-15cm from mouth',
            '3. Take a deep breath',
            '4. Sustain the vowel "ah" (as in "father") for 3-5 seconds at comfortable pitch',
            '5. Keep volume and pitch steady',
            '6. Submit recording for analysis'
        ],
        'disclaimer': 'This tool is for screening purposes only and does NOT replace professional medical diagnosis. Always consult an ENT specialist for proper evaluation.'
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print("Starting Voice Check API...")
    print(f"Server running on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
