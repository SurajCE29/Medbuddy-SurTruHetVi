import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const predictDisease = async (symptoms: string, file?: { data: string, mimeType: string }) => {
  const parts: any[] = [
    { text: `You are an advanced Medical Diagnostic Ensemble Model (XGBoost + Random Forest + MLP) specializing in Indian healthcare. 
    Your goal is to analyze symptoms and provide potential diseases with high accuracy (95%+ target).
    
    IMPORTANT:
    1. Consider common diseases prevalent in India (e.g., Dengue, Malaria, Typhoid, seasonal flu, etc. if symptoms match).
    2. Provide precautions that are practical in an Indian context.
    3. Include model reasoning based on medical datasets like WHO and CDC.

    For each prediction, you MUST provide:
    1. disease: The name of the condition.
    2. probability: A numerical confidence score (0-100) based on symptom match and grounded data.
    3. description: A brief medical overview.
    4. precautions: A list of immediate actions.
    5. sideEffects: Potential complications if untreated.
    6. modelReasoning: A brief explanation of why the ensemble model selected this (e.g., "High correlation with symptom X and Y in WHO datasets").

    Use Google Search to cross-reference symptoms with the latest WHO and CDC data.
    Symptoms: ${symptoms}` }
  ];

  if (file) {
    parts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            disease: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING },
            modelReasoning: { type: Type.STRING }
          },
          required: ["disease", "probability", "precautions", "sideEffects", "description", "modelReasoning"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const getMedicineAdvice = async (disease: string, file?: { data: string, mimeType: string }) => {
  const parts: any[] = [
    { text: `You are a Clinical Pharmacologist AI specialized in the Indian pharmaceutical market.
    Suggest common medicines for ${disease} that are available in India. 
    
    For each medicine, you MUST:
    1. name: Brand or generic name.
    2. dosage: Typical dosage.
    3. warnings: Safety warnings.
    4. sideEffects: Common side effects.
    5. is_available_in_india: Boolean, check if it's commonly available in Indian pharmacies (Apollo, 1mg, etc.).
    6. alternative_generic_names: Suggest 2-3 common generic alternatives available in India if the primary one is rare or expensive.
    
    Cross-reference with the latest CDSCO (India) and WHO guidelines via Google Search.` }
  ];

  if (file) {
    parts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dosage: { type: Type.STRING },
            warnings: { type: Type.STRING },
            sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
            is_available_in_india: { type: Type.BOOLEAN },
            alternative_generic_names: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "dosage", "warnings", "sideEffects", "is_available_in_india", "alternative_generic_names"]
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};

export const getDietPlan = async (disease: string, file?: { data: string, mimeType: string }) => {
  const parts: any[] = [
    { text: `You are a professional Indian clinical nutritionist. Provide a personalized India-focused diet plan for someone with ${disease}. 
    
    Your response MUST include:
    1. overview: A brief summary of the diet's goal.
    2. what_to_eat: Suggest Indian foods (e.g., dal, roti, rice, khichdi, curd, seasonal fruits, buttermilk, poha, idli).
    3. what_to_avoid: Junk food, fried food (pakoras, samosas), spicy food, cold drinks, sugary sweets, and disease-specific restrictions.
    4. nutrition_requirements: 
       - calories: Daily calorie range (e.g., "1800-2200 kcal/day").
       - protein: Daily protein range (e.g., "50-70g/day").
    5. meals: Categorized into Breakfast, Lunch, Dinner, and Snacks with Indian food items.
    
    Use Google Search to find the best Indian dietary practices for this condition.` }
  ];

  if (file) {
    parts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING },
          what_to_eat: { type: Type.ARRAY, items: { type: Type.STRING } },
          what_to_avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
          nutrition_requirements: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.STRING },
              protein: { type: Type.STRING }
            },
            required: ["calories", "protein"]
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                food: { type: Type.STRING },
                nutrition: { type: Type.STRING }
              },
              required: ["time", "food", "nutrition"]
            }
          }
        },
        required: ["overview", "what_to_eat", "what_to_avoid", "nutrition_requirements", "meals"]
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const analyzeMedicineImage = async (file: { data: string, mimeType: string }, manualInput?: string) => {
  const parts: any[] = [
    {
      text: `You are a highly accurate Medical AI specialized in prescription analysis and medicine identification. 
      Your task is to analyze the provided image of a prescription, medicine strip, or bottle and extract ALL medicines mentioned.
      
      1. FULL TEXT OCR: Extract the COMPLETE text from the image, preserving layout and structure.
      2. MULTI-MEDICINE DETECTION: Identify EVERY medicine mentioned in the text. Look for brand names, generic names, and dosages (mg, ml, etc.).
      3. CLEANING & CORRECTION: Correct any OCR errors using medical knowledge (e.g., "Paracetaml" -> "Paracetamol").
      4. VALIDATION: Cross-check each identified medicine with standard medical databases (DrugBank, OpenFDA) via Google Search.
      5. DETAILED ANALYSIS: For each medicine, provide its purpose, typical dosage, and side effects.
      6. CONFIDENCE: Assign a confidence score (0-100) for each medicine based on clarity and database match.
      
      ${manualInput ? `Additional context from user: ${manualInput}` : ""}
      
      Return the result in the following JSON format:
      {
        "raw_ocr_text": "complete text extracted from image",
        "medicines": [
          {
            "medicine_name": "Corrected Medicine Name",
            "confidence": 95,
            "uses": ["Use 1", "Use 2"],
            "dosage": "Typical dosage info",
            "side_effects": ["Effect 1", "Effect 2"],
            "alternatives": ["Alt 1", "Alt 2"],
            "uncertain_words": ["word1", "word2"],
            "is_available_in_india": true,
            "india_warning": "Optional warning if not available"
          }
        ]
      }`
    },
    {
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          raw_ocr_text: { type: Type.STRING },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                medicine_name: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                uses: { type: Type.ARRAY, items: { type: Type.STRING } },
                dosage: { type: Type.STRING },
                side_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
                alternatives: { type: Type.ARRAY, items: { type: Type.STRING } },
                uncertain_words: { type: Type.ARRAY, items: { type: Type.STRING } },
                is_available_in_india: { type: Type.BOOLEAN },
                india_warning: { type: Type.STRING }
              },
              required: ["medicine_name", "confidence", "uses", "dosage", "side_effects", "alternatives", "uncertain_words", "is_available_in_india"]
            }
          }
        },
        required: ["raw_ocr_text", "medicines"]
      }
    }
  });
  
  return JSON.parse(response.text || "{}");
};

export const analyzeMedicalDocument = async (file: { data: string, mimeType: string }, age: number, language: string) => {
  const parts: any[] = [
    {
      text: `You are an expert Medical AI Assistant. Analyze the provided medical document (prescription, lab report, scan, or discharge summary) for a patient aged ${age}.
      
      Provide the analysis in the following language: ${language}.
      
      Your task:
      1. DIAGNOSIS: Identify any diseases or conditions mentioned or implied.
      2. MEDICINES: List all medicines prescribed.
      3. DOSAGE & FREQUENCY: For each medicine, extract the dosage and frequency (e.g., "Twice a day after meals").
      4. SIDE EFFECTS: Provide common side effects for each prescribed medicine based on medical databases.
      5. EXPLANATION: Explain the condition(s) in simple, easy-to-understand terms for a layperson.
      6. FOLLOW-UP: Suggest any recommended follow-up visits, tests, or precautions.
      7. RISK LEVEL: Assess the risk level (Low, Medium, High) based on the findings.
      
      Return the result in the following JSON format:
      {
        "diagnosis": "Detected disease(s)",
        "medicines": ["Medicine 1", "Medicine 2"],
        "medicine_availability": [
          { "name": "Medicine 1", "is_available_in_india": true, "warning": "" }
        ],
        "frequency": ["Frequency for Med 1", "Frequency for Med 2"],
        "side_effects": ["Side effects for Med 1", "Side effects for Med 2"],
        "disease_explanation": "Simple explanation of the condition",
        "diet_plan": {
          "what_to_eat": ["dal", "roti"],
          "what_to_avoid": ["spicy food"],
          "calories": "2000 kcal",
          "protein": "60g"
        },
        "follow_up": "Suggested follow-up actions",
        "risk_level": "Low | Medium | High",
        "reminders": [
          { "medicine": "Med 1", "times": ["Morning", "Night"] }
        ]
      }`
    },
    {
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    }
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          medicines: { type: Type.ARRAY, items: { type: Type.STRING } },
          medicine_availability: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                is_available_in_india: { type: Type.BOOLEAN },
                warning: { type: Type.STRING }
              },
              required: ["name", "is_available_in_india"]
            }
          },
          frequency: { type: Type.ARRAY, items: { type: Type.STRING } },
          side_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
          disease_explanation: { type: Type.STRING },
          diet_plan: {
            type: Type.OBJECT,
            properties: {
              what_to_eat: { type: Type.ARRAY, items: { type: Type.STRING } },
              what_to_avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              calories: { type: Type.STRING },
              protein: { type: Type.STRING }
            },
            required: ["what_to_eat", "what_to_avoid", "calories", "protein"]
          },
          follow_up: { type: Type.STRING },
          risk_level: { type: Type.STRING },
          reminders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                medicine: { type: Type.STRING },
                times: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        },
        required: ["diagnosis", "medicines", "medicine_availability", "frequency", "side_effects", "disease_explanation", "diet_plan", "follow_up", "risk_level", "reminders"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const getFirstAid = async (injury: string, file?: { data: string, mimeType: string }) => {
  const parts: any[] = [
    { text: `You are an emergency medical responder in India. Provide step-by-step first aid instructions for a ${injury}. If a document or image is provided, use it for context.
    
    IMPORTANT:
    1. Provide clear, numbered steps.
    2. Mention Indian emergency numbers (102 for Ambulance, 108 for Emergency Services).
    3. Suggest items commonly found in Indian households for immediate relief if applicable.` }
  ];

  if (file) {
    parts.push({
      inlineData: {
        data: file.data,
        mimeType: file.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.NUMBER },
            instruction: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "[]");
};
