import express from "express";
import path from "path";
import OpenAI from "openai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser for JSON payloads (up to 25MB for image/audio base64 data)
app.use(express.json({ limit: "25mb" }));

// Initialize OpenRouter Client
function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not configured.");
  }
  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

const HEALTH_SHIELD_MASTER_PROMPT = `# ROLE
You are HealthShield AI, an expert healthcare misinformation verifier for India powered by OpenRouter's Claude 3.5 Sonnet Beta.
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

IMPORTANT: Always respond in valid JSON format. Your response must be a JSON object with all required fields.

Reply adhering strictly to the requested language preference or match the user's input language.`;

const healthShieldResponseSchema = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      description: "Must be exactly one of: 'True', 'Mostly True', 'Misleading', 'False', or 'Not Enough Evidence'",
    },
    confidence: {
      type: "number",
      description: "Confidence percentage integer from 0 to 100",
    },
    riskScore: {
      type: "string",
      description: "Must be exactly one of: 'Low', 'Medium', or 'High'",
    },
    riskReason: {
      type: "string",
      description: "Clear 1-2 sentence explanation for the assigned misinformation risk score",
    },
    shareRecommendation: {
      type: "string",
      description: "Must be exactly one of: 'Safe to Share' or 'Do Not Forward'",
    },
    mainClaim: {
      type: "string",
      description: "Concise summary of the primary health claim being analyzed",
    },
    explanation: {
      type: "string",
      description: "Simple language explanation of why the claim is true, misleading, or false, understandable by non-medical readers",
    },
    whyReasoning: {
      type: "string",
      description: "Deeper medical/scientific rationale and facts behind the verdict",
    },
    possibleRisks: {
      type: "string",
      description: "Potential health or medical harms if someone acts on this false or misleading advice",
    },
    correctMedicalAdvice: {
      type: "string",
      description: "Scientifically accurate health guidance on what people should actually do instead",
    },
    trustedSources: {
      type: "array",
      items: { type: "string" },
      description: "List of relevant trusted medical bodies like WHO, ICMR, AIIMS, MoHFW, CDC",
    },
    sources: {
      type: "array",
      items: { type: "string" },
      description: "Specific source references, web links, or guidelines (e.g., 'WHO COVID-19 Mythbusters', 'ICMR Dengue Guidelines', 'AIIMS Clinical Advisory')",
    },
    emergencyAdvice: {
      type: "string",
      description: "Standard advice if symptoms are severe or urgent medical attention is required",
    },
    detectedLanguage: {
      type: "string",
      description: "Language detected (e.g. English, Hinglish, Hindi, Tamil, Bengali, Marathi)",
    },
    whatsappShareCardText: {
      type: "string",
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
    "sources",
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

    const openrouter = getOpenRouterClient();

    let promptText = "Analyze and fact-check the following health claim forwarded on social media/messaging apps. Please provide your response in JSON format.\n\n";

    if (text) {
      promptText += `FORWARDED CLAIM TEXT:\n"${text}"\n\n`;
    }

    if (targetLanguage && targetLanguage !== "auto") {
      promptText += `PREFERRED RESPONSE LANGUAGE: ${targetLanguage}. Please provide the explanation, main claim, and advice in ${targetLanguage} while keeping medical terms accurate.\n\n`;
    }

    if (imageBase64) {
      promptText += "IMAGE DATA: Analyze the provided image for any health claims, medical text, or misinformation.\n\n";
    }

    if (audioBase64) {
      promptText += "AUDIO DATA: Transcribe and analyze any health claims in the audio.\n\n";
    }

    promptText += "Ensure your response is a valid JSON object with all required fields.";

    const response = await openrouter.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet:beta",
      messages: [
        {
          role: "system",
          content: HEALTH_SHIELD_MASTER_PROMPT,
        },
        {
          role: "user",
          content: promptText,
        },
      ],
      response_format: {
        type: "json_object",
      },
      temperature: 0.2,
    });

    const responseText = response.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response received from OpenRouter verification model.");
    }

    const parsedResult = JSON.parse(responseText);
    res.json({ success: true, result: parsedResult });
  } catch (error: any) {
    console.error("Error in /api/verify:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process health claim fact check with OpenRouter (Claude 3.5 Sonnet Beta).",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "HealthShield AI", ai: "OpenRouter (Claude 3.5 Sonnet Beta)" });
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
    console.log(`HealthShield AI server running on http://localhost:${PORT} with OpenRouter (Claude 3.5 Sonnet Beta)`);
  });
}

startServer();
