"""
Extrai features acústicas de todos os arquivos WAV do dataset SVD
"""

import pandas as pd
from pathlib import Path
from features.acoustic_features_ml import VoiceAnalyzerML
from tqdm import tqdm

def extract_features_from_dataset():
    """Extract features from all WAV files in the SVD dataset"""
    
    # Initialize analyzer without model (just for feature extraction)
    analyzer = VoiceAnalyzerML()
    
    # Path to data folder
    data_dir = Path('data')
    
    # Find all WAV files
    wav_files = []
    
    # Tentar diferentes estruturas
    patterns = [
        'processed/all/*.wav',  # Estrutura atual
        '*/a.wav',              # SVD padrão
        '*/*.wav',              # Qualquer WAV
    ]
    
    for pattern in patterns:
        wav_files = list(data_dir.glob(pattern))
        if len(wav_files) > 0:
            print(f"✓ Encontrados arquivos em: {pattern}")
            break
    
    print(f"✓ Encontrados {len(wav_files)} arquivos de áudio")
    
    all_features = []
    errors = []
    
    for wav_file in tqdm(wav_files, desc="Extraindo features"):
        try:
            # Extract patient ID from path
            patient_id = wav_file.parent.name
            
            # Extract acoustic features
            features = analyzer.extract_features(str(wav_file))
            
            # Flatten features into a single row
            feature_row = {
                'patient_id': patient_id,
                'f0_mean': features['fundamental_frequency']['mean'],
                'f0_std': features['fundamental_frequency']['std'],
                'jitter_local': features['jitter']['local'],
                'jitter_rap': features['jitter']['rap'],
                'jitter_ppq5': features['jitter']['ppq5'],
                'shimmer_local': features['shimmer']['local'],
                'shimmer_apq3': features['shimmer']['apq3'],
                'shimmer_apq5': features['shimmer']['apq5'],
                'hnr_mean': features['hnr']['mean'],
                'hnr_std': features['hnr']['std'],
                'duration': features['duration']
            }
            
            all_features.append(feature_row)
            
        except Exception as e:
            errors.append((str(wav_file), str(e)))
            continue
    
    # Create DataFrame
    df = pd.DataFrame(all_features)
    
    # Save to CSV
    output_path = 'data/svd_features.csv'
    df.to_csv(output_path, index=False)
    
    print(f"\n✓ Features extraídas e salvas em {output_path}")
    print(f"Total de amostras: {len(df)}")
    print(f"Erros: {len(errors)}")
    
    if errors:
        print("\n❌ Arquivos com erro:")
        for file, error in errors[:5]:
            print(f"  - {file}: {error}")
    
    print("\n📊 Estatísticas das features:")
    print(df.describe())
    
    return df

if __name__ == '__main__':
    print("🔬 Extraindo features acústicas do dataset SVD...")
    print("Isso pode levar alguns minutos...\n")
    extract_features_from_dataset()
    print("\n✅ Pronto! Agora execute: python train_model.py")

