# AetherMed AI Training & Research

This directory contains the Python scripts and model structures for the AetherMed AI medical prediction system.

## 🧠 AI Pipeline Architecture

The production application uses a **Hybrid AI Pipeline**:
1.  **Real-Time Grounding:** Uses Google Gemini with **Google Search Grounding** to access the latest medical data from WHO, CDC, and DrugBank.
2.  **Official Records:** Integrates the **OpenFDA API** for official drug labels, side effects, and warnings.
3.  **Custom Models (Optional):** The scripts in this directory allow for training custom Random Forest or Neural Network models on specific datasets (e.g., Kaggle).

## ⚙️ Training Scripts

### `training_scripts.py`
-   **`train_disease_model(dataset_path)`**: Trains a Random Forest classifier on a symptom-disease dataset.
-   **`generate_medicine_mapping(dataset_path)`**: Creates a rule-based mapping from diseases to recommended medicines.
-   **`extract_medicines_nlp(text)`**: Placeholder for a BERT-based NER model for prescription extraction.

## 📊 Datasets
To train these models, you should collect datasets from:
-   **Kaggle:** [Disease Symptom Prediction Dataset](https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset)
-   **OpenFDA:** [Drug Label API](https://open.fda.gov/apis/drug/label/)
-   **DrugBank:** [Drug & Medicine Data](https://go.drugbank.com/)

## 🚀 Deployment
The production app is built with **TypeScript/Express** for high-performance real-time analysis. If you wish to deploy the custom Python models, you can wrap them in a **FastAPI** service and update the `src/services/` logic to point to your new endpoints.
