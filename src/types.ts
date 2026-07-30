export interface VerificationResult {
  verdict: 'True' | 'Mostly True' | 'Misleading' | 'False' | 'Not Enough Evidence';
  confidence: number;
  riskScore: 'Low' | 'Medium' | 'High';
  riskReason: string;
  shareRecommendation: 'Safe to Share' | 'Do Not Forward';
  mainClaim: string;
  explanation: string;
  whyReasoning: string;
  possibleRisks: string;
  correctMedicalAdvice: string;
  trustedSources: string[];
  emergencyAdvice: string;
  detectedLanguage: string;
  whatsappShareCardText: string;
}

export interface SampleClaim {
  id: string;
  title: string;
  claimText: string;
  category: 'Viral WhatsApp' | 'Ayurvedic/Herbal' | 'Vaccines' | 'Chronic Illness' | 'Seasonal/Dengue';
  expectedVerdict: 'False' | 'Misleading' | 'True' | 'Not Enough Evidence';
  riskLevel: 'High' | 'Medium' | 'Low';
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  claimSummary: string;
  result: VerificationResult;
  inputType: 'text' | 'image' | 'voice';
}

export type SupportedLanguage =
  | 'auto'
  | 'English'
  | 'Hindi (हिंदी)'
  | 'Hinglish'
  | 'Bengali (বাংলা)'
  | 'Tamil (தமிழ்)'
  | 'Telugu (తెలుగు)'
  | 'Marathi (मराठी)'
  | 'Gujarati (ગુજરાતી)';
