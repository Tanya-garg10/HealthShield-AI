import React from 'react';
import { ShieldCheck, History, Sparkles } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface HeaderProps {
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onOpenHistory,
  historyCount,
}) => {
  const languages: SupportedLanguage[] = [
    'auto',
    'English',
    'Hindi (हिंदी)',
    'Hinglish',
    'Bengali (বাংলা)',
    'Tamil (தமிழ்)',
    'Telugu (తెలుగు)',
    'Marathi (मराठी)',
    'Gujarati (ગુજરાતી)',
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo and Tagline */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-900/40 border border-emerald-400/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  HealthShield <span className="text-emerald-400">AI</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <Sparkles className="h-3 w-3" /> Track 1: Health Misinformation
                </span>
              </div>
              <p className="text-xs text-slate-400">
                India’s AI Verification Shield against WhatsApp & Social Media Health Rumors
              </p>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center flex-wrap gap-2.5 sm:justify-end">
            
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs font-medium text-emerald-300 focus:outline-none cursor-pointer pr-1"
                id="language-select-header"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang} className="bg-slate-900 text-slate-200">
                    {lang === 'auto' ? '🌐 Auto-Detect Language' : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Fact Check History Button */}
            <button
              onClick={onOpenHistory}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              id="history-btn"
            >
              <History className="h-3.5 w-3.5 text-emerald-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                  {historyCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
