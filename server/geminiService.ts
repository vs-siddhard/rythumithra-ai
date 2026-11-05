import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

export const ai = new GoogleGenAI({
  apiKey: apiKey || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface CropDiagnosticResponse {
  cropName: string;
  isPlantLeaf: boolean;
  diseaseDetected: string;
  confidenceScore: number;
  severity: "Low" | "Moderate" | "Severe";
  remedies: {
    organic: string[];
    chemical: string[];
  };
  preventiveMeasures: string[];
  localizedSummaryAudioScript: string;
}

/**
 * Multimodal Computer Vision Crop Diagnostics using gemini-3.8-flash
 */
export async function diagnoseCropLeaf(
  base64Image: string,
  mimeType: string = "image/jpeg",
  userContext?: string
): Promise<CropDiagnosticResponse> {
  // Strip data URL header if present
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

  const prompt = `You are the Lead Plant Pathologist and Multimodal Agronomist at RythuMithra Agricultural Institute.
Examine this field leaf capture carefully against the PlantVillage and global phytopathology standards.
Identify the crop, inspect lesion shape, halo chlorosis, necrotic margins, and fungal/bacterial signs.
Additional farmer context: ${userContext || "None provided"}.

If the image is not a plant leaf or crop sample, set isPlantLeaf to false and provide guidance.
Provide organic bio-control solutions (e.g., Neem kernel extract, Trichoderma, Pseudomonas fluorescens)
and chemical remediation (standard technical compound names, active ingredient dosage, application safety).
Also generate a concise, encouraging spoken audio script suitable for TTS advisory to a smallholder farmer.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cropName: {
            type: Type.STRING,
            description: "Crop name e.g. Paddy (Rice), Tomato, Cotton, Chilli, Maize, Wheat",
          },
          isPlantLeaf: {
            type: Type.BOOLEAN,
            description: "Whether the image is a plant or crop leaf",
          },
          diseaseDetected: {
            type: Type.STRING,
            description: "Pathology identified e.g. Bacterial Leaf Blight, Early Blight, Cotton Leaf Curl, or Healthy",
          },
          confidenceScore: {
            type: Type.NUMBER,
            description: "Confidence between 0.0 and 1.0",
          },
          severity: {
            type: Type.STRING,
            description: "Severity level: Low, Moderate, or Severe",
            enum: ["Low", "Moderate", "Severe"],
          },
          remedies: {
            type: Type.OBJECT,
            properties: {
              organic: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Organic and bio-control remedies",
              },
              chemical: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Standard chemical remedies with active ingredient dosages",
              },
            },
            required: ["organic", "chemical"],
          },
          preventiveMeasures: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Agronomic preventative actions and irrigation adjustments",
          },
          localizedSummaryAudioScript: {
            type: Type.STRING,
            description: "Short spoken audio script for TTS advisory",
          },
        },
        required: [
          "cropName",
          "isPlantLeaf",
          "diseaseDetected",
          "confidenceScore",
          "severity",
          "remedies",
          "preventiveMeasures",
          "localizedSummaryAudioScript",
        ],
      },
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as CropDiagnosticResponse;
  } catch (err) {
    console.error("Failed to parse diagnostic JSON:", text, err);
    throw new Error("Invalid response format from diagnostic model");
  }
}

/**
 * Low-Latency Instant Agri Advisory using gemini-3.1-flash-lite
 */
export async function fastAgriQuery(
  query: string,
  context?: {
    location?: string;
    crop?: string;
    marketPrice?: number;
    weatherCondition?: string;
    language?: string;
  }
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const lang = context?.language || "en";
  const systemInstruction = `You are RythuMithra Instant AI Advisory Assistant.
Provide fast, high-accuracy, practical agronomic and market advice to smallholder farmers.
Respond in language code '${lang}'. Keep responses clear, bulleted, actionable, and under 120 words.`;

  const contextStr = context ? `Context: Location=${context.location || "Local"}, Crop=${context.crop || "All"}, Weather=${context.weatherCondition || "Standard"}.` : "";

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: `${contextStr}\nFarmer Query: ${query}`,
    config: {
      systemInstruction,
    },
  });

  const latencyMs = Date.now() - startTime;
  return {
    text: response.text || "Advisory currently unavailable. Please verify connection.",
    latencyMs,
  };
}

/**
 * Complex Agronomy & Tank-Mix Analysis using gemini-4-argon (with fallback to gemini-3.8-flash)
 */
export async function complexAgronomyAnalysis(
  crop: string,
  chemicals: string[],
  soilProfile: string,
  irrigationType: string
): Promise<{ analysis: string; safetyScore: number; tankMixVerdict: string }> {
  const prompt = `Perform a comprehensive agronomic analysis:
Crop: ${crop}
Target Chemicals/Fertilizers: ${chemicals.join(", ")}
Soil Profile & Depth Moisture: ${soilProfile}
Irrigation Method: ${irrigationType}

Evaluate:
1. Tank-mix compatibility and chemical antagonism (phytotoxicity risk).
2. Soil microbial impact and pH buffering capacity.
3. Pre-harvest interval (PHI) and maximum residue limits (MRL).
4. Step-by-step application protocol with worker safety.

Output a strict JSON object with:
- "analysis": comprehensive multi-paragraph markdown breakdown
- "safetyScore": number 0-100
- "tankMixVerdict": "SAFE" | "CAUTION" | "HAZARDOUS"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-4-argon",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.warn("Falling back to gemini-3.8-flash for complex agronomy analysis:", e);
    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    return JSON.parse(fallbackResponse.text || "{}");
  }
}

/**
 * Text-to-Speech Synthesis using gemini-3.8-flash-tts
 * Returns base64 encoded audio/wav
 */
export async function synthesizeSpeechAudio(
  text: string,
  voiceName: string = "Kore",
  language: string = "en"
): Promise<{ audioBase64: string; mimeType: string }> {
  // Voice personas: Kore, Puck, Charon, Fenrir, Zephyr
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash-tts",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: text,
            speechMetadata: {
              speaker: "RythuMithraAgronomist",
              style: "Warm, authoritative, empathetic agricultural advisor speaking clearly for rural audio",
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
        },
      },
    },
  });

  const base64Audio =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio returned from gemini-3.8-flash-tts");
  }

  return {
    audioBase64: base64Audio,
    mimeType: "audio/wav",
  };
}

/**
 * Analog Telephony IVR Query Resolution (Twilio/Exotel Webhook Core)
 * Connects ASR Transcribed regional speech to Gemini NLU and generates TTS audio
 */
export async function processTelephonyVoiceQuery(
  transcribedQuery: string,
  callerDialect: string = "te",
  marketContext?: string
): Promise<{
  intent: string;
  spokenReply: string;
  audioBase64: string;
}> {
  const prompt = `You are the Automated Voice Agronomist on the RythuMithra Kisan Toll-Free Hotline (1800-180-1551).
A farmer has called in over an analog 2G/PSTN connection.
Caller Dialect: ${callerDialect} (te=Telugu, hi=Hindi, ta=Tamil, en=English).
Farmer Transcribed Query: "${transcribedQuery}".
Current Market & Weather Context: ${marketContext || "All major mandis operating normally. Monsoon humidity moderate."}.

Task:
1. Classify intent into one of: MARKET_PRICE, WEATHER_SPRAY, CROP_DISEASE, FERTILIZER, GENERAL_QUERY.
2. Formulate a concise, clear spoken response (under 60 words) directly answering their question in their dialect (${callerDialect}). Speak as if talking to a respected farmer with practical guidance.

Return JSON:
{
  "intent": "...",
  "spokenReply": "..."
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  let parsed = { intent: "GENERAL_QUERY", spokenReply: "రైతుమిత్ర సేవకు స్వాగతం. మీ ప్రశ్నకు సమాధానం సిద్ధం చేయబడుతోంది." };
  try {
    parsed = JSON.parse(response.text || "{}");
  } catch (err) {
    console.error("Failed to parse telephony intent JSON", err);
  }

  // Synthesize voice using gemini-3.8-flash-tts
  const ttsResult = await synthesizeSpeechAudio(parsed.spokenReply, "Kore", callerDialect);

  return {
    intent: parsed.intent,
    spokenReply: parsed.spokenReply,
    audioBase64: ttsResult.audioBase64,
  };
}
