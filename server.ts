import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser for JSON payloads (up to 25MB for image/audio base64 data)
app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const HEALTH_SHIELD_MASTER_PROMPT = `# ROLE
You are HealthShield AI, an expert healthcare misinformation verifier for India.
Your mission is to verify health-related claims shared through WhatsApp, SMS, social media, images, or voice transcripts.
You explain medical information in simple language that anyone can understand.

# GUARDRAILS & CORE RULES
- You NEVER create panic.
- You NEVER shame the user or forwarder.
- You NEVER diagnose individual diseases.
- You NEVER replace a doctor or medical practitioner.
- If miracle cures are mentioned, state clearly that no scientifically proven evidence exists.
- If vaccines are involved, explain evidence calmly and scientifically.
- If prescription medicines are mentioned, emphasize NEVER to stop or alter prescribed medicines without consulting a doctor.
- Never fabricate references or citations. Only mention real trusted health authorities (WHO, ICMR, AIIMS, Ministry of Health & Family Welfare MoHFW, CDC, FDA).

# TASK & PROCESS
Analyze the provided claim (text, image description/OCR, voice transcript, mixed Hinglish/Hindi/English/Regional languages).
Determine verdict, confidence score (0-100%), misinformation risk score (Low/Medium/High), share recommendation (Safe to Share / Do Not Forward), main claim, simple explanation, scientific reasoning, potential risks, correct evidence-based advice, trusted sources, and emergency advice.

Reply adhering strictly to the requested language preference or match the user's input language.`;

const healthShieldResponseSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: {
      type: Type.STRING,
      description: "Must be exactly one of: 'True', 'Mostly True', 'Misleading', 'False', or 'Not Enough Evidence'",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence percentage integer from 0 to 100",
    },
    riskScore: {
      type: Type.STRING,
      description: "Must be exactly one of: 'Low', 'Medium', or 'High'",
    },
    riskReason: {
      type: Type.STRING,
      description: "Clear 1-2 sentence explanation for the assigned misinformation risk score",
    },
    shareRecommendation: {
      type: Type.STRING,
      description: "Must be exactly one of: 'Safe to Share' or 'Do Not Forward'",
    },
    mainClaim: {
      type: Type.STRING,
      description: "Concise summary of the primary health claim being analyzed",
    },
    explanation: {
      type: Type.STRING,
      description: "Simple language explanation of why the claim is true, misleading, or false, understandable by non-medical readers",
    },
    whyReasoning: {
      type: Type.STRING,
      description: "Deeper medical/scientific rationale and facts behind the verdict",
    },
    possibleRisks: {
      type: Type.STRING,
      description: "Potential health or medical harms if someone acts on this false or misleading advice",
    },
    correctMedicalAdvice: {
      type: Type.STRING,
      description: "Scientifically accurate health guidance on what people should actually do instead",
    },
    trustedSources: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of relevant trusted medical bodies like WHO, ICMR, AIIMS, MoHFW, CDC",
    },
    sources: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific source references, web links, or guidelines (e.g., 'WHO COVID-19 Mythbusters', 'ICMR Dengue Guidelines', 'AIIMS Clinical Advisory')",
    },
    emergencyAdvice: {
      type: Type.STRING,
      description: "Standard advice if symptoms are severe or urgent medical attention is required",
    },
    detectedLanguage: {
      type: Type.STRING,
      description: "Language detected (e.g. English, Hinglish, Hindi, Tamil, Bengali, Marathi)",
    },
    whatsappShareCardText: {
      type: Type.STRING,
      description: "Formatted ready-to-copy WhatsApp message with emojis and clear verdict for sharing in family groups to stop rumors",
    },
  },
  required: [
    "verdict",
    "confidence",
    "riskScore",
    "riskReason",
    "shareRecommendation",
    "mainClaim",
    "explanation",
    "whyReasoning",
    "possibleRisks",
    "correctMedicalAdvice",
    "trustedSources",
    "emergencyAdvice",
    "detectedLanguage",
    "whatsappShareCardText",
  ],
};

// API Endpoint for Fact Checking
app.post("/api/verify", async (req, res) => {
  try {
    const { text, imageBase64, imageMimeType, audioBase64, audioMimeType, targetLanguage } = req.body;

    if (!text && !imageBase64 && !audioBase64) {
      res.status(400).json({ error: "Please provide a claim via text, image, or audio." });
      return;
    }

    const ai = getGeminiClient();

    let userPromptParts: any[] = [];

    let promptText = "Analyze and fact-check the following health claim forwarded on social media/messaging apps:\n\n";

    if (text) {
      promptText += `FORWARDED CLAIM TEXT:\n"${text}"\n\n`;
    }

    if (targetLanguage && targetLanguage !== "auto") {
      promptText += `PREFERRED RESPONSE LANGUAGE: ${targetLanguage}. Please provide the explanation, main claim, and advice in ${targetLanguage} while keeping medical terms accurate.\n\n`;
    }

    userPromptParts.push({ text: promptText });

    if (imageBase64) {
      userPromptParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || "image/jpeg",
        },
      });
      userPromptParts.push({
        text: "Perform OCR if there is text in the image, examine any visual health claims, packaging, or screenshots, and fact-check them thoroughly.",
      });
    }

    if (audioBase64) {
      userPromptParts.push({
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType || "audio/webm",
        },
      });
      userPromptParts.push({
        text: "Transcribe the spoken voice message in the audio file and fact-check any health claims made in it.",
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: { parts: userPromptParts },
      config: {
        systemInstruction: HEALTH_SHIELD_MASTER_PROMPT,
        responseMimeType: "application/json",
        responseSchema: healthShieldResponseSchema,
        temperature: 0.2, // Low temperature for high fact checking accuracy
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini verification model.");
    }

    const parsedResult = JSON.parse(responseText);
    res.json({ success: true, result: parsedResult });
  } catch (error: any) {
    console.error("Error in /api/verify:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process health claim fact check.",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "HealthShield AI" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HealthShield AI server running on http://localhost:${PORT}`);
  });
}

startServer();
