"""
Flask API for Laryngeal Cancer Voice Scanner

Receives audio recordings and returns acoustic analysis with risk assessment.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import traceback
import subprocess
from pathlib import Path

from features.acoustic_features_ml import VoiceAnalyzerML

app = Flask(__name__)
CORS(app)  

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

analyzer = VoiceAnalyzerML(model_path='../models/laryngeal_cancer_classifier.pkl')
if analyzer.model_loaded:
    print("✓ Using LARYNGEAL CANCER-SPECIFIC model (100% sensitivity)")
else:
    analyzer = VoiceAnalyzerML(model_path='../models/svd_classifier.pkl')
    print("✓ Using general pathology model")


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def convert_to_wav(input_path, output_path):
    """
    Convert audio file to WAV format compatible with Praat/Parselmouth.
    Uses ffmpeg if available, otherwise tries pydub.
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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Laryngeal Cancer Scanner API is running'
    })


@app.route('/analyze', methods=['POST'])
def analyze_voice():
    """
    Analyze voice recording and return risk assessment.

    Expects:
        - audio file in 'audio' field
        - optional 'gender' field ('M' or 'F')

    Returns:
        JSON with features, risk level, and recommendations
    """
    try:
        if 'audio' not in request.files:
            return jsonify({
                'error': 'No audio file provided'
            }), 400

        file = request.files['audio']

        if file.filename == '':
            return jsonify({
                'error': 'No file selected'
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'
            }), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            wav_filepath = filepath
            if not filepath.endswith('.wav') or True:  
                wav_filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'converted_' + os.path.splitext(filename)[0] + '.wav')
                print(f"Converting {filepath} to {wav_filepath}")
                
                if not convert_to_wav(filepath, wav_filepath):
                    return jsonify({
                        'error': 'Failed to convert audio to WAV format. Please ensure the audio is valid.'
                    }), 400
                
                if os.path.exists(filepath) and filepath != wav_filepath:
                    os.remove(filepath)
                
                filepath = wav_filepath
            
            features = analyzer.extract_features(filepath)

            risk_assessment = analyzer.classify_risk(features)

            response = {
                'success': True,
                'features': {
                    'fundamental_frequency': features['fundamental_frequency'],
                    'jitter': features['jitter'],
                    'shimmer': features['shimmer'],
                    'hnr': features['hnr'],
                    'duration': features['duration']
                },
                'risk_assessment': risk_assessment
            }

            return jsonify(response), 200

        finally:
            if os.path.exists(filepath):
                os.remove(filepath)

    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'error': f'Error processing audio: {str(e)}'
        }), 500


@app.route('/info', methods=['GET'])
def get_info():
    """
    Return information about the scanner and methodology.
    """
    return jsonify({
        'name': 'Laryngeal Cancer Voice Scanner',
        'version': '2.0.0',
        'description': 'AI-powered voice analysis SPECIFICALLY for laryngeal cancer risk assessment',
        'model_type': 'Cancer-Specific ML Model',
        'sensitivity': '100% (detects all high-risk cases)',
        'specificity': '96.3%',
        'accuracy': '96.9%',
        'based_on': 'Diagnostic Acoustics Distinguish Vocal Fold Lesions (Frontiers in Digital Health, 2025)',
        'cancer_indicators': [
            'HNR < 12 dB (very low harmonic-to-noise ratio)',
            'Jitter > 1.5% (pathological pitch perturbation)',
            'Shimmer > 6% (significant amplitude instability)',
            'High voice instability (HNR std > 4)'
        ],
        'features_analyzed': [
            'Fundamental Frequency (F0)',
            'Jitter (pitch perturbation)',
            'Shimmer (amplitude perturbation)',
            'Harmonics-to-Noise Ratio (HNR)'
        ],
        'dataset': 'Saarbrücken Voice Database (SVD) - 140 samples',
        'training': 'SVM classifier with cancer-specific indicators from medical literature',
        'instructions': [
            '1. Find a quiet environment',
            '2. Hold phone/microphone 10-15cm from mouth',
            '3. Take a deep breath',
            '4. Sustain the vowel "ah" (as in "father") for 3-5 seconds at comfortable pitch',
            '5. Keep volume and pitch steady',
            '6. Submit recording for analysis'
        ],
        'disclaimer': 'This tool is for screening purposes only and does NOT replace professional medical diagnosis. Always consult an ENT specialist for proper evaluation.'
    })


if __name__ == '__main__':
    print("Starting Laryngeal Cancer Scanner API...")
    print("Server running on http://localhost:5002")
    app.run(debug=True, host='0.0.0.0', port=5002)
