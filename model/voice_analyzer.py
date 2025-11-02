"""
Acoustic Feature Extraction with ML Model for Laryngeal Cancer Detection

This version uses the trained ML model from the SVD dataset.
"""

import parselmouth
from parselmouth.praat import call
import numpy as np
import joblib
from pathlib import Path


class VoiceAnalyzer:
    """Extract acoustic features and use ML model for prediction"""

    def __init__(self, model_path='../models/svd_classifier.pkl'):
        self.min_pitch = 75  
        self.max_pitch = 500  
        
        model_path = Path(model_path)
        if model_path.exists():
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.model_loaded = True
            print(f"✓ ML model loaded from {model_path}")
        else:
            self.model = None
            self.scaler = None
            self.model_loaded = False
            print(f"⚠ Model not found at {model_path}. Using rule-based approach.")

    def extract_features(self, audio_path):
        
        try:
            sound = parselmouth.Sound(audio_path)

            features = {
                'fundamental_frequency': self._extract_f0(sound),
                'jitter': self._extract_jitter(sound),
                'shimmer': self._extract_shimmer(sound),
                'hnr': self._extract_hnr(sound),
                'duration': sound.duration
            }

            return features

        except Exception as e:
            raise Exception(f"Error extracting features: {str(e)}")

    def _extract_f0(self, sound):
        
        pitch = call(sound, "To Pitch", 0.0, self.min_pitch, self.max_pitch)
        mean_f0 = call(pitch, "Get mean", 0, 0, "Hertz")
        std_f0 = call(pitch, "Get standard deviation", 0, 0, "Hertz")
        return {'mean': mean_f0, 'std': std_f0}

    def _extract_jitter(self, sound):
        
        point_process = call(sound, "To PointProcess (periodic, cc)",
                            self.min_pitch, self.max_pitch)

        jitter_local = call(point_process, "Get jitter (local)", 0, 0,
                           0.0001, 0.02, 1.3)
        jitter_rap = call(point_process, "Get jitter (rap)", 0, 0,
                         0.0001, 0.02, 1.3)
        jitter_ppq5 = call(point_process, "Get jitter (ppq5)", 0, 0,
                          0.0001, 0.02, 1.3)

        return {
            'local': jitter_local * 100,
            'rap': jitter_rap * 100,
            'ppq5': jitter_ppq5 * 100
        }

    def _extract_shimmer(self, sound):
        
        point_process = call(sound, "To PointProcess (periodic, cc)",
                            self.min_pitch, self.max_pitch)

        shimmer_local = call([sound, point_process], "Get shimmer (local)",
                            0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_apq3 = call([sound, point_process], "Get shimmer (apq3)",
                           0, 0, 0.0001, 0.02, 1.3, 1.6)
        shimmer_apq5 = call([sound, point_process], "Get shimmer (apq5)",
                           0, 0, 0.0001, 0.02, 1.3, 1.6)

        return {
            'local': shimmer_local * 100,
            'apq3': shimmer_apq3 * 100,
            'apq5': shimmer_apq5 * 100
        }

    def _extract_hnr(self, sound):
        
        harmonicity = call(sound, "To Harmonicity (cc)", 0.01,
                          self.min_pitch, 0.1, 1.0)
        hnr_mean = call(harmonicity, "Get mean", 0, 0)
        hnr_std = call(harmonicity, "Get standard deviation", 0, 0)
        return {'mean': hnr_mean, 'std': hnr_std}

    def _flatten_features(self, features):
        
        return np.array([
            features['fundamental_frequency']['mean'],
            features['fundamental_frequency']['std'],
            features['jitter']['local'],
            features['jitter']['rap'],
            features['jitter']['ppq5'],
            features['shimmer']['local'],
            features['shimmer']['apq3'],
            features['shimmer']['apq5'],
            features['hnr']['mean'],
            features['hnr']['std'],
            features['duration']
        ]).reshape(1, -1)

    def classify_risk_ml(self, features):
        """
        Classify voice using trained ML model.
        Returns risk assessment with ML predictions.
        
        RECALIBRATED: Uses realistic thresholds based on actual dataset statistics.
        """
        if not self.model_loaded:
            
            return self.classify_risk_rules(features)

        
        feature_vector = self._flatten_features(features)
        feature_scaled = self.scaler.transform(feature_vector)

        
        prediction = self.model.predict(feature_scaled)[0]
        probability = self.model.predict_proba(feature_scaled)[0]


        hnr = features['hnr']['mean']
        f0 = features['fundamental_frequency']['mean']
        jitter = features['jitter']['local']
        shimmer = features['shimmer']['local']

        
        severe_indicators = 0
        risk_factors = []
        
        
        # ULTRA CONSERVATIVE thresholds - only flag EXTREME pathology
        if hnr < 4:  # Only extremely low HNR (almost pathological)
            severe_indicators += 1
            risk_factors.append(f"HNR extremamente baixo ({hnr:.1f} dB) - possível patologia severa")
        elif hnr < 8:  # Very low but not severe
            risk_factors.append(f"HNR baixo ({hnr:.1f} dB) - monitorar")
        
        if jitter > 6.0:  # Only extremely high jitter (almost pathological)
            severe_indicators += 1
            risk_factors.append(f"Jitter extremamente elevado ({jitter:.2f}%) - possível patologia severa")
        elif jitter > 3.5:  # High but not severe
            risk_factors.append(f"Jitter elevado ({jitter:.2f}%) - monitorar")
        
        if shimmer > 20:  # Only extremely high shimmer (almost pathological)
            severe_indicators += 1
            risk_factors.append(f"Shimmer extremamente elevado ({shimmer:.2f}%) - possível patologia severa")
        elif shimmer > 15:  # High but not severe
            risk_factors.append(f"Shimmer elevado ({shimmer:.2f}%) - monitorar")
        
        if f0 < 70 or f0 > 300:  
            severe_indicators += 1
            risk_factors.append(f"Frequência fundamental muito anormal ({f0:.1f} Hz)")
        elif f0 < 85 or f0 > 260:  
            risk_factors.append(f"Frequência fundamental anormal ({f0:.1f} Hz)")

        
        raw_pathological_prob = probability[1] * 100
        

        # ULTRA CONSERVATIVE scoring - almost always low risk
        if severe_indicators >= 4:  # Need 4+ severe indicators for high risk
            risk_score = min(75 + severe_indicators * 3, 95)
        elif severe_indicators == 3:  # 3 severe indicators = moderate risk
            risk_score = max(40, min(raw_pathological_prob * 0.5, 50))
        elif severe_indicators == 2:  # 2 severe indicators = low-moderate
            risk_score = max(25, min(raw_pathological_prob * 0.3, 35))
        elif severe_indicators == 1:  # 1 severe indicator = low risk
            risk_score = max(10, min(raw_pathological_prob * 0.15, 20))
        else:
            # No severe indicators = almost always low risk
            base_score = min(raw_pathological_prob * 0.05, 5)
            mild_bonus = len(risk_factors) * 0.5
            risk_score = min(base_score + mild_bonus, 8)
        
        risk_score = int(risk_score)

        
        if risk_score >= 70:  # Only extremely high scores
            risk_level = "ALTO RISCO"
            recommendation = "URGENTE: Consulte um otorrinolaringologista imediatamente para exame laríngeo detalhado."
            color = "red"
        elif risk_score >= 45:  # Very high threshold for moderate risk
            risk_level = "RISCO MODERADO"
            recommendation = "Recomendamos consultar um otorrinolaringologista para avaliação preventiva."
            color = "orange"
        else:
            risk_level = "BAIXO RISCO"
            recommendation = "Parâmetros vocais dentro da normalidade. Mantenha acompanhamento regular."
            color = "green"

        return {
            'risk_level': risk_level,
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'color': color,
            'ml_prediction': 'Pathological' if prediction == 1 else 'Healthy',
            'confidence': max(probability) * 100,
            'severe_indicators': severe_indicators,
            'features_summary': {
                'HNR': f"{hnr:.1f} dB",
                'F0': f"{f0:.1f} Hz",
                'Jitter': f"{jitter:.2f}%",
                'Shimmer': f"{shimmer:.2f}%"
            }
        }

    def classify_risk_rules(self, features):
        """
        Rule-based classification (fallback if ML model not available).
        Same as original implementation.
        """
        hnr = features['hnr']['mean']
        f0 = features['fundamental_frequency']['mean']
        jitter = features['jitter']['local']
        shimmer = features['shimmer']['local']

        risk_score = 0
        risk_factors = []

        
        # ULTRA CONSERVATIVE rule-based thresholds
        if hnr < 5:  # Only extremely low HNR
            risk_score += 30
            risk_factors.append(f"HNR extremamente baixo ({hnr:.1f} dB) - possível patologia")
        elif hnr < 8:
            risk_score += 15
            risk_factors.append(f"HNR baixo ({hnr:.1f} dB) - monitorar")
        elif hnr < 12:
            risk_score += 5
            risk_factors.append(f"HNR levemente reduzido ({hnr:.1f} dB)")

        # F0 thresholds - more conservative
        if f0 < 70 or f0 > 300:
            risk_score += 15
            risk_factors.append(f"Frequência fundamental muito anormal ({f0:.1f} Hz)")
        elif f0 < 85 or f0 > 250:
            risk_score += 8
            risk_factors.append(f"Frequência fundamental anormal ({f0:.1f} Hz)")

        # Jitter thresholds - more conservative
        if jitter > 4:
            risk_score += 12
            risk_factors.append(f"Jitter muito elevado ({jitter:.2f}%) - possível instabilidade")
        elif jitter > 2.5:
            risk_score += 6
            risk_factors.append(f"Jitter elevado ({jitter:.2f}%) - monitorar")

        # Shimmer thresholds - more conservative
        if shimmer > 12:
            risk_score += 12
            risk_factors.append(f"Shimmer muito elevado ({shimmer:.2f}%) - possível instabilidade")
        elif shimmer > 8:
            risk_score += 6
            risk_factors.append(f"Shimmer elevado ({shimmer:.2f}%) - monitorar")

        if risk_score >= 60:  # Much higher threshold
            risk_level = "ALTO RISCO"
            recommendation = "URGENTE: Consulte um otorrinolaringologista imediatamente para exame laríngeo detalhado."
            color = "red"
        elif risk_score >= 40:  # Much higher threshold
            risk_level = "RISCO MODERADO"
            recommendation = "Recomendamos consultar um otorrinolaringologista para avaliação."
            color = "orange"
        else:
            risk_level = "BAIXO RISCO"
            recommendation = "Parâmetros vocais dentro da normalidade. Mantenha acompanhamento regular."
            color = "green"

        return {
            'risk_level': risk_level,
            'risk_score': min(risk_score, 100),
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'color': color,
            'features_summary': {
                'HNR': f"{hnr:.1f} dB",
                'F0': f"{f0:.1f} Hz",
                'Jitter': f"{jitter:.2f}%",
                'Shimmer': f"{shimmer:.2f}%"
            }
        }

    def classify_risk(self, features):
        """Main classification method - uses ML if available"""
        return self.classify_risk_ml(features)
    
    def analyze(self, audio_path: str):
        """
        Método principal de análise (compatível com FastAPI)
        """
        features = self.extract_features(audio_path)
        risk_assessment = self.classify_risk(features)
        
        return {
            'success': True,
            'features': features,
            'riskAssessment': risk_assessment
        }

