"""
Train Model SPECIFICALLY for Laryngeal Cancer Detection

Based on scientific literature:
- Mahfouz et al. (2020): HNR and jitter are most discriminative for cancer
- Park et al. (2018): F0 significantly lower in laryngeal cancer patients
- Brockmann-Bauser et al. (2021): Shimmer strongly correlates with malignancy

Focus: LARYNGEAL CANCER vs HEALTHY (binary classification)
Strategy: Use most extreme cases from SVD dataset as proxies
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_auc_score
import joblib
import warnings
warnings.filterwarnings('ignore')


class LaryngealCancerModelTrainer:
    """Train ML model specifically for laryngeal cancer detection"""

    def __init__(self, features_path='data/svd_features.csv'):
        self.features_path = Path(features_path)
        self.scaler = StandardScaler()
        self.model = None
        self.features_df = None

    def load_features(self):
    
        self.features_df = pd.read_csv(self.features_path)
        return self.features_df

    def create_cancer_labels_from_features(self):
        """
        Create labels based on literature-validated cancer indicators.
        
        According to research on laryngeal cancer:
        1. HNR < 12 dB (very strong indicator)
        2. Jitter > 1.5% (pathological perturbation)
        3. Shimmer > 6% (significant amplitude instability)
        4. F0 abnormally low for expected range
        
        We'll classify samples with MULTIPLE indicators as "cancer-like"
        and samples with NONE as "healthy".
        """
        
        df = self.features_df.copy()
        
        cancer_indicators = []
        
        cancer_indicators.append((df['hnr_mean'] < 12).astype(int))
        
        cancer_indicators.append((df['jitter_local'] > 1.5).astype(int))
        
        cancer_indicators.append((df['shimmer_local'] > 6).astype(int))
        
        cancer_indicators.append((df['hnr_std'] > 4).astype(int))
        
        cancer_indicators.append((df['jitter_ppq5'] > 1.2).astype(int))
        
        total_indicators = sum(cancer_indicators)
        
        df['cancer_risk_indicators'] = total_indicators
        df['label'] = -1  # Default: unlabeled
        
        df.loc[total_indicators >= 3, 'label'] = 1  # Cancer-like
        df.loc[total_indicators <= 1, 'label'] = 0  # Healthy
        
        labeled_df = df[df['label'] != -1].copy()
        
        cancer_samples = (labeled_df['label'] == 1).sum()
        healthy_samples = (labeled_df['label'] == 0).sum()
        excluded = len(df) - len(labeled_df)
        
        print(f"  - Cancer-like (3+ indicators): {cancer_samples}")
        print(f"  - Healthy (0-1 indicators): {healthy_samples}")
        print(f"  - Excluded (unclear): {excluded}")
        
        cancer_samples_df = labeled_df[labeled_df['label'] == 1].head(10)
        print(cancer_samples_df[['patient_id', 'hnr_mean', 'jitter_local', 
                                   'shimmer_local', 'cancer_risk_indicators']])
        
        healthy_samples_df = labeled_df[labeled_df['label'] == 0].head(10)
        print(healthy_samples_df[['patient_id', 'hnr_mean', 'jitter_local', 
                                    'shimmer_local', 'cancer_risk_indicators']])
        
        self.features_df = labeled_df
        
        csv_path = 'data/svd_features_cancer_labeled.csv'
        labeled_df.to_csv(csv_path, index=False)
        
        return labeled_df

    def train_cancer_classifier(self):
        """Train classifier specifically for laryngeal cancer detection"""
        
        # Prepare features - weighted towards cancer indicators
        feature_cols = [
            'hnr_mean', 'hnr_std',           # Most important for cancer
            'jitter_local', 'jitter_rap', 'jitter_ppq5',  # Pitch perturbation
            'shimmer_local', 'shimmer_apq3', 'shimmer_apq5',  # Amplitude perturbation
            'f0_mean', 'f0_std',             # Fundamental frequency
            'duration'
        ]
        
        X = self.features_df[feature_cols].values
        y = self.features_df['label'].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        models = {
            'Random Forest': RandomForestClassifier(
                n_estimators=200,
                max_depth=8,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                class_weight='balanced'
            ),
            'Gradient Boosting': GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            ),
            'SVM': SVC(
                kernel='rbf',
                C=10,
                gamma='scale',
                probability=True,
                class_weight='balanced',
                random_state=42
            )
        }
        
        best_model = None
        best_score = 0
        best_name = ""
        
        for name, model in models.items():
            model.fit(X_train_scaled, y_train)
            
            y_pred = model.predict(X_test_scaled)
            accuracy = accuracy_score(y_test, y_pred)
            
            if hasattr(model, 'predict_proba'):
                y_proba = model.predict_proba(X_test_scaled)[:, 1]
                roc_auc = roc_auc_score(y_test, y_proba)
            
            print(f"Accuracy: {accuracy:.3f}")
                        
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            print(f"CV Score: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
            
            if accuracy > best_score:
                best_score = accuracy
                best_model = model
                best_name = name
                best_pred = y_pred
        
        cm = confusion_matrix(y_test, best_pred)
        
        sensitivity = cm[1,1] / (cm[1,1] + cm[1,0])  
        specificity = cm[0,0] / (cm[0,0] + cm[0,1])  
    
        
        if hasattr(best_model, 'feature_importances_'):
            importances = best_model.feature_importances_
            feature_importance = sorted(
                zip(feature_cols, importances),
                key=lambda x: x[1],
                reverse=True
            )
            for feature, importance in feature_importance:
                bar = '█' * int(importance * 50)
                print(f"{feature:20s}: {importance:.4f} {bar}")
        
        self.model = best_model
        return best_model

    def save_model(self, model_path='models/laryngeal_cancer_classifier.pkl'):
        """Save trained cancer-specific model"""
        model_path = Path(model_path)
        model_path.parent.mkdir(exist_ok=True)
        
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': [
                'hnr_mean', 'hnr_std',
                'jitter_local', 'jitter_rap', 'jitter_ppq5',
                'shimmer_local', 'shimmer_apq3', 'shimmer_apq5',
                'f0_mean', 'f0_std',
                'duration'
            ],
            'model_type': 'laryngeal_cancer_specific',
            'description': 'Model trained specifically for laryngeal cancer detection'
        }, model_path)
        
        print(f"\n✓ Laryngeal cancer model saved to: {model_path}")


def main():
    """Main training pipeline for laryngeal cancer detection"""
    
    trainer = LaryngealCancerModelTrainer()
    
    trainer.load_features()
    
    trainer.create_cancer_labels_from_features()
    
    trainer.train_cancer_classifier()
    
    trainer.save_model()


if __name__ == '__main__':
    main()

