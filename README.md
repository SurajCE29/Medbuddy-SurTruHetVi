# AetherMed AI
### *Futuristic AI-powered medical diagnostic and wellness platform with 3D visualizations and predictive health analytics.*

---

## 🩺 The Problem & Solution
**The Problem:** Medical reports, prescriptions, and diagnostic data are often dense, technical, and difficult for patients to interpret without immediate professional consultation. Furthermore, localized medical context—such as medicine availability in specific regions (e.g., India) or culturally relevant dietary advice—is frequently missing from generic AI health tools.

**The Solution:** **AetherMed AI** bridges this gap by providing a high-fidelity, multimodal platform that translates complex medical data into actionable insights. By leveraging advanced LLMs, the app offers instant report analysis, localized Indian diet planning, CDSCO-aware medicine checks, and real-time first-aid guidance, all wrapped in a premium, glassmorphic 3D interface.

---

## 🏗 Technical Architecture

### System Workflow
The application follows a streamlined data flow to ensure low latency and high accuracy:
> **User Input** (Report Upload/Symptoms) $\rightarrow$ **React Frontend** (State Management) $\rightarrow$ **Gemini API** (Multimodal Processing) $\rightarrow$ **Structured JSON Output** $\rightarrow$ **UI Rendering** (Dashboard/PDF Export).

### The Reasoning Engine
The **System Instructions** serve as the core logic "engine" for AetherMed AI. They define the model's persona as a world-class medical expert while enforcing strict operational constraints:
*   **Data Extraction:** Forcing the model to output valid JSON schemas for seamless UI integration.
*   **Localization:** Injecting Indian-specific medical knowledge (CDSCO regulations, regional diets like Dal/Khichdi).
*   **Safety Rails:** Ensuring every response includes medical disclaimers and prioritizes emergency protocols when high-risk symptoms are detected.

---

## 💻 Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Motion (Framer Motion) |
| **Backend** | Node.js, Express (Full-Stack Proxy) |
| **Database & Auth** | Firebase Firestore (NoSQL), Firebase Authentication |
| **AI Model** | **Gemini 3.1 Flash** (via `@google/genai` SDK) |
| **Visualization** | Three.js (Medical Scene), Lucide React (Icons) |
| **Utilities** | jsPDF (Report Generation), Axios |

---

## 🧠 Key AI Capabilities

*   **Multimodal Document Processing:** Utilizes Gemini's vision capabilities to parse handwritten prescriptions and complex lab report PDFs with high OCR accuracy.
*   **Structured Output Generation:** Employs `responseMimeType: "application/json"` and `responseSchema` to ensure the model returns deterministic data structures for diet plans and medicine lists.
*   **Context Window Management:** Efficiently manages patient history and family profiles within the prompt context to provide personalized longitudinal health insights.
*   **Zero-Shot Medical Reasoning:** Leverages the model's extensive pre-trained medical knowledge to identify potential drug interactions and localized medicine alternatives.

---

## 🚀 Installation & Setup

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/aethermed-ai.git
    cd aethermed-ai
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory and add your credentials:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    # Firebase configuration is typically loaded from firebase-applet-config.json
    ```

4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

---

## 🗺 Future Roadmap

*   **Vertex AI Migration:** Scaling the inference engine to Google Cloud Vertex AI for enhanced security, monitoring, and model tuning.
*   **RAG Integration:** Implementing a Vector Database (e.g., Pinecone or Weaviate) to enable Retrieval-Augmented Generation across years of patient medical history.
*   **IoT Wearable Sync:** Real-time integration with Apple HealthKit and Google Fit to provide proactive health alerts based on live vitals.

---

*Disclaimer: AetherMed AI is an experimental tool and should not replace professional medical advice. Always consult with a qualified healthcare provider.*
