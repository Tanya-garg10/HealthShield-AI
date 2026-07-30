import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { VerificationReportCard } from './components/VerificationReportCard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { TrendingRadar } from './components/TrendingRadar';
import { ClaimTrendChart } from './components/ClaimTrendChart';
import { Footer } from './components/Footer';
import { VerificationResult, HistoryItem, SupportedLanguage, SampleClaim } from './types';
import { AlertCircle, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<VerificationResult | null>(null);

  // Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('healthshield_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('healthshield_history', JSON.stringify(history));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [history]);

  // Handle Verification API Request
  const handleVerify = async (payload: {
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          targetLanguage: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Server encountered an error during claim analysis.');
      }

      const result: VerificationResult = data.result;
      setActiveResult(result);

      // Save to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        claimSummary: result.mainClaim || payload.text || 'Multimodal Health Claim',
        result,
        inputType: payload.imageBase64 ? 'image' : payload.audioBase64 ? 'voice' : 'text',
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]); // Keep last 20

      // Smooth scroll to report
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Unable to complete fact check. Please verify your connection or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select claim from Trending Radar
  const handleSelectTrendingClaim = (sample: SampleClaim) => {
    handleVerify({ text: sample.claimText });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('healthshield_history');
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <Header
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-4 w-4" /> Official Track 1 Healthcare Fact-Checker
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Stop Health Rumors Before They Spread.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Verify WhatsApp messages, viral videos, herbal remedy claims, and image screenshots. Get instant evidence-based answers backed by ICMR, WHO, AIIMS & Ministry of Health.
            </p>
          </div>
        </div>

        {/* Input Form Panel */}
        <InputPanel
          onVerify={handleVerify}
          isLoading={isLoading}
          selectedLanguage={selectedLanguage}
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-xl flex items-start gap-3 text-rose-200 text-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-300">Fact-Check Error</p>
              <p className="text-xs text-rose-200 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Active Fact Check Report Result */}
        <div ref={reportRef}>
          {activeResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Fact-Check Analysis Report
                </h3>
                <button
                  onClick={() => {
                    setActiveResult(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Verify New Claim
                </button>
              </div>

              <VerificationReportCard result={activeResult} />
            </div>
          )}
        </div>

        {/* 7-Day Trend Visualization */}
        <ClaimTrendChart history={history} />

        {/* India Health Rumor Radar */}
        <TrendingRadar onSelectClaim={handleSelectTrendingClaim} />

      </main>

      {/* Footer */}
      <Footer />

      {/* Past History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={(item) => {
          setActiveResult(item.result);
          setTimeout(() => {
            reportRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        onClearHistory={handleClearHistory}
      />

    </div>
  );
}
