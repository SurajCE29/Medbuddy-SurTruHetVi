import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, f1_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os

# Try to import XGBoost, fallback if not available in environment
try:
    from xgboost import XGBClassifier
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

# ------------------------------------------------------------------
# 1. ADVANCED ENSEMBLE TRAINING PIPELINE
# ------------------------------------------------------------------

def train_optimized_model(dataset_path):
    """
    Trains a high-accuracy Ensemble model (XGBoost + RF + MLP).
    Goal: 95%+ Accuracy with strong generalization.
    """
    print("🚀 Initializing Advanced Training Pipeline...")
    df = pd.read_csv(dataset_path)
    
    # --- DATA QUALITY & PREPROCESSING ---
    df.drop_duplicates(inplace=True)
    df.fillna(method='ffill', inplace=True) # Handle missing values
    
    X = df.drop('Disease', axis=1)
    y = df['Disease']
    
    # Encode Target
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Feature Scaling for Neural Networks
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    
    # --- MODEL SELECTION & HYPERPARAMETER TUNING ---
    
    # 1. Random Forest (Baseline Strong)
    rf = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42)
    
    # 2. MLP Neural Network (Complex Patterns)
    mlp = MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=500, alpha=0.0001, solver='adam', random_state=42)
    
    # 3. XGBoost (High Performance)
    if XGB_AVAILABLE:
        xgb = XGBClassifier(n_estimators=200, learning_rate=0.05, max_depth=6, use_label_encoder=False, eval_metric='mlogloss')
        
        # --- ENSEMBLE LEARNING (Voting Classifier) ---
        ensemble = VotingClassifier(
            estimators=[('rf', rf), ('mlp', mlp), ('xgb', xgb)],
            voting='soft' # Use probabilities for better confidence
        )
    else:
        ensemble = VotingClassifier(
            estimators=[('rf', rf), ('mlp', mlp)],
            voting='soft'
        )

    print("⚙️ Running 10-Fold Cross-Validation...")
    cv_scores = cross_val_score(ensemble, X_train, y_train, cv=10)
    print(f"Mean CV Accuracy: {np.mean(cv_scores):.4f}")

    # Fit Final Model
    ensemble.fit(X_train, y_train)
    
    # --- EVALUATION ---
    y_pred = ensemble.predict(X_test)
    print("\n--- FINAL EVALUATION ---")
    print(f"Test Accuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(f"F1 Score (Weighted): {f1_score(y_test, y_pred, average='weighted'):.4f}")
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=le.classes_))
    
    # --- ERROR ANALYSIS ---
    errors = X_test[y_pred != y_test]
    print(f"Total Prediction Errors: {len(errors)}")

    # --- SAVE ARTIFACTS ---
    if not os.path.exists('models/versioned'): os.makedirs('models/versioned')
    joblib.dump(ensemble, 'models/optimized_ensemble_v1.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(le, 'models/label_encoder.pkl')
    print("✅ Optimized Model & Artifacts Saved.")

# ------------------------------------------------------------------
# 2. FEATURE ENGINEERING: SYMPTOM EMBEDDINGS (NLP)
# ------------------------------------------------------------------

def generate_symptom_vectors(symptoms_list):
    """
    Converts raw symptom text into numerical vectors using a mock embedding logic.
    In production, use Sentence-BERT or Word2Vec.
    """
    # Mock vectorization logic
    return np.random.rand(len(symptoms_list), 128)

if __name__ == "__main__":
    print("AetherMed AI Optimization Pipeline v2.0")
    # train_optimized_model('datasets/high_quality_medical_data.csv')
