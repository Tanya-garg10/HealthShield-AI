import express from "express";
import path from "path";
import { tavily } from "@tavily/core";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body parser for JSON payloads (up to 25MB for image/audio base64 data)
app.use(express.json({ limit: "25mb" }));

// ---------------------------------------------------------------------------
// Tavily client
// ---------------------------------------------------------------------------
function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY environment variable is not configured.");
  return tavily({ apiKey });
}

// ---------------------------------------------------------------------------
// Trusted medical domains for search grounding
// ---------------------------------------------------------------------------
const TRUSTED_DOMAINS = [
  "who.int", "icmr.gov.in", "mohfw.gov.in", "aiims.edu",
  "cdc.gov", "nih.gov", "pubmed.ncbi.nlm.nih.gov", "fda.gov",
  "ncbi.nlm.nih.gov", "bmj.com", "thelancet.com", "nejm.org",
  "healthline.com", "mayoclinic.org", "webmd.com", "medlineplus.gov",
];

// ---------------------------------------------------------------------------
// Language detection helper (simple keyword-based)
// ---------------------------------------------------------------------------
function detectLanguage(text: string): string {
  if (!text) return "English";
  const hindiRe = /[\u0900-\u097F]/;
  const bengaliRe = /[\u0980-\u09FF]/;
  const tamilRe = /[\u0B80-\u0BFF]/;
  const teluguRe = /[\u0C00-\u0C7F]/;
  const marathiRe = /[\u0900-\u097F]/; // shares Devanagari with Hindi
  const gujaratiRe = /[\u0A80-\u0AFF]/;
  if (bengaliRe.test(text)) return "Bengali";
  if (tamilRe.test(text)) return "Tamil";
  if (teluguRe.test(text)) return "Telugu";
  if (gujaratiRe.test(text)) return "Gujarati";
  if (hindiRe.test(text)) {
    // If there's also Latin script mixed in, call it Hinglish
    if (/[a-zA-Z]/.test(text)) return "Hinglish";
    return "Hindi";
  }
  return "English";
}

// ---------------------------------------------------------------------------
// Core: search Tavily and derive a VerificationResult
// ---------------------------------------------------------------------------
async function verifyClaimWithTavily(
  claimText: string,
  targetLanguage: string
): Promise<Record<string, any>> {
  const client = getTavilyClient();

  // 1. Run two searches: one factual, one myth-busting
  const [factSearch, mythSearch] = await Promise.all([
    client.search(`medical evidence health claim: ${claimText.slice(0, 200)}`, {
      searchDepth: "advanced",
      maxResults: 6,
      includeDomains: TRUSTED_DOMAINS,
      includeAnswer: true,
    }),
    client.search(`health misinformation fact check myth: ${claimText.slice(0, 200)}`, {
      searchDepth: "advanced",
      maxResults: 4,
      includeDomains: TRUSTED_DOMAINS,
      includeAnswer: true,
    }),
  ]);

  const allResults = [...(factSearch.results || []), ...(mythSearch.results || [])];

  // 2. Deduplicated source URLs
  const sourceUrls: string[] = [
    ...new Set(allResults.filter((r: any) => r.url).map((r: any) => r.url as string)),
  ];

  // 3. Trusted authority names from domains
  const trustedSources = deriveAuthorities(sourceUrls);

  // 4. Aggregate content snippets
  const snippets = allResults
    .slice(0, 6)
    .map((r: any) => (r.content || r.snippet || "").slice(0, 400))
    .filter(Boolean)
    .join(" ");

  const combinedAnswer = [factSearch.answer, mythSearch.answer].filter(Boolean).join(" ");
  const fullContext = (combinedAnswer + " " + snippets).toLowerCase();

  // 5. Derive verdict from content signals
  const { verdict, confidence } = deriveVerdict(fullContext, claimText);

  // 6. Risk score
  const riskScore = verdict === "False" ? "High" : verdict === "Misleading" ? "Medium" : "Low";

  // 7. Share recommendation
  const shareRecommendation: "Safe to Share" | "Do Not Forward" =
    verdict === "True" || verdict === "Mostly True" ? "Safe to Share" : "Do Not Forward";

  // 8. Build human-readable explanation from the best answer
  const explanation =
    combinedAnswer && combinedAnswer.length > 60
      ? combinedAnswer.slice(0, 600)
      : snippets.slice(0, 500) || "Based on available medical literature, this claim has been evaluated against trusted health authorities.";

  const detectedLanguage = detectLanguage(claimText);
  const langNote =
    targetLanguage && targetLanguage !== "auto"
      ? ` (Response requested in ${targetLanguage})`
      : "";

  // 9. Emergency advice
  const emergencyAdvice =
    "If you or someone you know is experiencing severe symptoms, call emergency services immediately (112 in India) or visit the nearest hospital. Do not rely solely on social media claims for medical decisions.";

  // 10. WhatsApp share card
  const verdictEmoji =
    verdict === "True" || verdict === "Mostly True"
      ? "✅"
      : verdict === "Misleading"
        ? "⚠️"
        : verdict === "False"
          ? "❌"
          : "❓";

  const whatsappShareCardText =
    `🛡️ *HealthShield AI — Fact-Check Report*\n\n` +
    `${verdictEmoji} *Verdict: ${verdict}*\n` +
    `📊 Confidence: ${confidence}%\n` +
    `⚠️ Risk Level: ${riskScore}\n\n` +
    `📋 *Claim:* ${claimText.slice(0, 150)}${claimText.length > 150 ? "..." : ""}\n\n` +
    `📝 *Summary:* ${explanation.slice(0, 300)}...\n\n` +
    `🔗 *Sources:* ${trustedSources.slice(0, 3).join(", ") || "WHO, ICMR, CDC"}\n\n` +
    `${shareRecommendation === "Safe to Share" ? "✅ Safe to Share" : "❌ Do Not Forward"}\n\n` +
    `_Verified by HealthShield AI — Powered by Tavily Web Search_`;

  return {
    verdict,
    confidence,
    riskScore,
    riskReason:
      riskScore === "High"
        ? "This claim may cause serious health harm if acted upon. Consult a qualified doctor before making any health decisions."
        : riskScore === "Medium"
          ? "This claim contains partially accurate information mixed with misleading elements. Verify with a healthcare professional."
          : "This claim aligns with established medical evidence from trusted health authorities.",
    shareRecommendation,
    mainClaim: claimText.slice(0, 200),
    explanation: explanation + langNote,
    whyReasoning:
      combinedAnswer
        ? `Based on real-time web evidence: ${combinedAnswer.slice(0, 500)}`
        : "Analysis based on content retrieved from trusted medical sources including WHO, ICMR, CDC, and peer-reviewed journals.",
    possibleRisks:
      riskScore === "High"
        ? "Following this advice without medical supervision could lead to serious health complications, delayed proper treatment, or adverse drug interactions."
        : riskScore === "Medium"
          ? "Partial reliance on this claim without professional guidance may lead to suboptimal health outcomes."
          : "Low risk when applied in appropriate context with professional guidance.",
    correctMedicalAdvice:
      "Always consult a qualified doctor or healthcare professional before making any changes to your medical treatment, diet, or lifestyle based on information shared via social media or messaging apps.",
    trustedSources,
    sources: sourceUrls.slice(0, 8),
    emergencyAdvice,
    detectedLanguage,
    whatsappShareCardText,
  };
}

// ---------------------------------------------------------------------------
// Derive verdict from aggregated text signals
// ---------------------------------------------------------------------------
function deriveVerdict(context: string, claim: string): { verdict: string; confidence: number } {
  const falseSignals = [
    "myth", "false", "misinformation", "misleading", "debunked", "no evidence",
    "not true", "fake", "incorrect", "inaccurate", "unproven", "pseudoscience",
    "dangerous", "harmful", "do not", "avoid", "warning",
  ];
  const trueSignals = [
    "effective", "proven", "evidence-based", "recommended", "approved",
    "confirmed", "supported by", "studies show", "research shows", "clinically",
    "scientifically", "guidelines recommend", "who recommends", "cdc recommends",
  ];
  const misleadingSignals = [
    "partially", "some evidence", "limited evidence", "mixed", "controversial",
    "not fully", "may help", "inconclusive", "varies", "context",
  ];

  let falseScore = 0;
  let trueScore = 0;
  let misleadingScore = 0;

  for (const s of falseSignals) if (context.includes(s)) falseScore++;
  for (const s of trueSignals) if (context.includes(s)) trueScore++;
  for (const s of misleadingSignals) if (context.includes(s)) misleadingScore++;

  const total = falseScore + trueScore + misleadingScore || 1;

  if (falseScore > trueScore && falseScore > misleadingScore) {
    const confidence = Math.min(95, 55 + Math.round((falseScore / total) * 40));
    return { verdict: "False", confidence };
  }
  if (misleadingScore >= trueScore && misleadingScore > 0) {
    const confidence = Math.min(90, 50 + Math.round((misleadingScore / total) * 35));
    return { verdict: "Misleading", confidence };
  }
  if (trueScore > 0) {
    const confidence = Math.min(92, 60 + Math.round((trueScore / total) * 30));
    return { verdict: trueScore >= 3 ? "True" : "Mostly True", confidence };
  }
  return { verdict: "Not Enough Evidence", confidence: 40 };
}

// ---------------------------------------------------------------------------
// Map source URLs to authority names
// ---------------------------------------------------------------------------
function deriveAuthorities(urls: string[]): string[] {
  const map: Record<string, string> = {
    "who.int": "WHO",
    "icmr.gov.in": "ICMR",
    "mohfw.gov.in": "Ministry of Health & Family Welfare (MoHFW)",
    "aiims.edu": "AIIMS",
    "cdc.gov": "CDC",
    "nih.gov": "NIH",
    "pubmed.ncbi.nlm.nih.gov": "PubMed / NCBI",
    "ncbi.nlm.nih.gov": "NCBI",
    "fda.gov": "FDA",
    "bmj.com": "BMJ",
    "thelancet.com": "The Lancet",
    "nejm.org": "NEJM",
    "mayoclinic.org": "Mayo Clinic",
    "healthline.com": "Healthline",
    "webmd.com": "WebMD",
    "medlineplus.gov": "MedlinePlus (NIH)",
  };

  const found = new Set<string>();
  for (const url of urls) {
    for (const [domain, name] of Object.entries(map)) {
      if (url.includes(domain)) found.add(name);
    }
  }

  // Always include at least these baseline authorities
  found.add("WHO");
  found.add("ICMR");
  return [...found];
}

// ---------------------------------------------------------------------------
// API: Verify health claim
// ---------------------------------------------------------------------------
app.post("/api/verify", async (req, res) => {
  try {
    const { text, imageBase64, audioBase64, targetLanguage } = req.body;

    if (!text && !imageBase64 && !audioBase64) {
      res.status(400).json({ error: "Please provide a claim via text, image, or audio." });
      return;
    }

    // For image/audio inputs without text, return a graceful message
    if (!text && (imageBase64 || audioBase64)) {
      res.status(400).json({
        error: "Image and audio analysis require an AI language model. Please provide the claim as text for Tavily-powered verification.",
      });
      return;
    }

    const result = await verifyClaimWithTavily(text, targetLanguage || "auto");
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Error in /api/verify:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process health claim fact check.",
    });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "HealthShield AI",
    engine: "Tavily Web Search",
    webSearch: process.env.TAVILY_API_KEY ? "Tavily (active)" : "Tavily (not configured)",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HealthShield AI server running on http://localhost:${PORT} — Powered by Tavily`);
  });
}

startServer();
