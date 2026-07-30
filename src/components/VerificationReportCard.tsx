import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Share2,
  Copy,
  Check,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
  BookOpen,
  Sparkles,
  Award,
  ArrowRight,
  FileDown,
  Loader2,
  Printer,
  Gauge,
  Heart,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { VerificationResult } from '../types';

interface VerificationReportCardProps {
  result: VerificationResult;
}

export const VerificationReportCard: React.FC<VerificationReportCardProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isRiskAnalysisOpen, setIsRiskAnalysisOpen] = useState(false);
  const [isSourceLinksOpen, setIsSourceLinksOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('healthshield_favorites');
      if (!raw) return false;
      const favorites = JSON.parse(raw);
      return Array.isArray(favorites) && favorites.some(
        (item: any) => item.result?.mainClaim === result.mainClaim || item.claimSummary === result.mainClaim
      );
    } catch {
      return false;
    }
  });

  const [userFeedback, setUserFeedback] = useState<'helpful' | 'not_helpful' | null>(() => {
    try {
      const saved = localStorage.getItem(`healthshield_feedback_${result.mainClaim.slice(0, 40)}`);
      return (saved as 'helpful' | 'not_helpful') || null;
    } catch {
      return null;
    }
  });
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleFeedback = (type: 'helpful' | 'not_helpful') => {
    const newFeedback = userFeedback === type ? null : type;
    setUserFeedback(newFeedback);
    try {
      if (newFeedback) {
        localStorage.setItem(`healthshield_feedback_${result.mainClaim.slice(0, 40)}`, newFeedback);
        setFeedbackMsg(newFeedback === 'helpful' ? 'Thank you! Glad this report was helpful.' : 'Thanks for your feedback! We will refine future AI responses.');
      } else {
        localStorage.removeItem(`healthshield_feedback_${result.mainClaim.slice(0, 40)}`);
        setFeedbackMsg(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const reportCardRef = useRef<HTMLDivElement>(null);

  // Sync isFavorite status if result prop changes or if custom event fires
  useEffect(() => {
    const syncFavoriteStatus = () => {
      try {
        const raw = localStorage.getItem('healthshield_favorites');
        if (!raw) {
          setIsFavorite(false);
          return;
        }
        const favorites = JSON.parse(raw);
        const exists = Array.isArray(favorites) && favorites.some(
          (item: any) => item.result?.mainClaim === result.mainClaim || item.claimSummary === result.mainClaim
        );
        setIsFavorite(exists);
      } catch {
        setIsFavorite(false);
      }
    };

    syncFavoriteStatus();
    window.addEventListener('healthshield_favorites_updated', syncFavoriteStatus);
    return () => {
      window.removeEventListener('healthshield_favorites_updated', syncFavoriteStatus);
    };
  }, [result.mainClaim]);

  const handleToggleFavorite = () => {
    try {
      const raw = localStorage.getItem('healthshield_favorites');
      let favorites = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(favorites)) favorites = [];

      const existingIndex = favorites.findIndex(
        (item: any) => item.result?.mainClaim === result.mainClaim || item.claimSummary === result.mainClaim
      );

      if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        setIsFavorite(false);
      } else {
        // Add to favorites
        const newFav = {
          id: `fav_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          claimSummary: result.mainClaim || 'Fact Check Result',
          result: result,
          savedAt: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        };
        favorites.unshift(newFav);
        setIsFavorite(true);
      }

      localStorage.setItem('healthshield_favorites', JSON.stringify(favorites));
      window.dispatchEvent(new Event('healthshield_favorites_updated'));
    } catch (err) {
      console.error('Failed to update favorites in localStorage:', err);
    }
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(result.whatsappShareCardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleWebShare = async () => {
    if (canWebShare) {
      try {
        await navigator.share({
          title: `HealthShield AI Fact-Check: ${result.claimText.slice(0, 50)}...`,
          text: result.whatsappShareCardText,
          url: window.location.href,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Web Share error:', err);
          handleCopyWhatsApp();
        }
      }
    } else {
      handleCopyWhatsApp();
    }
  };

  const handleShareOnWhatsApp = () => {
    const textToShare = encodeURIComponent(result.whatsappShareCardText);
    window.open(`https://api.whatsapp.com/send?text=${textToShare}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrintReport = async () => {
    setIsRiskAnalysisOpen(true);
    setIsSourceLinksOpen(true);
    await new Promise((resolve) => setTimeout(resolve, 150));
    window.print();
  };

  useEffect(() => {
    const handleBeforePrint = () => {
      setIsRiskAnalysisOpen(true);
      setIsSourceLinksOpen(true);
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  const handleDownloadPdf = async () => {
    if (!reportCardRef.current) return;
    setIsGeneratingPdf(true);
    setIsRiskAnalysisOpen(true);
    setIsSourceLinksOpen(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const element = reportCardRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
        windowWidth: 1200,
        ignoreElements: (el) => el.classList.contains('no-print'),
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const claimSlug = (result.mainClaim || 'health-fact-check')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);

      pdf.save(`HealthShield-FactCheck-${claimSlug || 'report'}.pdf`);
    } catch (err) {
      console.error('PDF export failed, falling back to print dialog:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!reportCardRef.current) return;
    setIsGeneratingImage(true);
    setIsRiskAnalysisOpen(true);
    setIsSourceLinksOpen(true);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const element = reportCardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
        windowWidth: 1200,
        ignoreElements: (el) => el.classList.contains('no-print'),
      });

      const imgData = canvas.toDataURL('image/png');
      const claimSlug = (result.mainClaim || 'health-fact-check')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);

      const link = document.createElement('a');
      link.href = imgData;
      link.download = `HealthShield-FactCheck-${claimSlug || 'report'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Verdict visual configurations
  const getVerdictBadge = () => {
    switch (result.verdict) {
      case 'True':
      case 'Mostly True':
        return {
          bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300',
          icon: <CheckCircle2 className="h-7 w-7 text-emerald-400" />,
          titleColor: 'text-emerald-300',
          symbol: '✅',
        };
      case 'Misleading':
        return {
          bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          icon: <AlertTriangle className="h-7 w-7 text-amber-400" />,
          titleColor: 'text-amber-300',
          symbol: '⚠️',
        };
      case 'False':
        return {
          bg: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
          icon: <XCircle className="h-7 w-7 text-rose-400" />,
          titleColor: 'text-rose-300',
          symbol: '❌',
        };
      case 'Not Enough Evidence':
      default:
        return {
          bg: 'bg-sky-950/80 border-sky-500/50 text-sky-300',
          icon: <HelpCircle className="h-7 w-7 text-sky-400" />,
          titleColor: 'text-sky-300',
          symbol: '❓',
        };
    }
  };

  const verdictBadge = getVerdictBadge();

  // Risk Score Badge
  const getRiskScoreBadge = () => {
    switch (result.riskScore) {
      case 'High':
        return {
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: '🔴',
        };
      case 'Medium':
        return {
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: '🟡',
        };
      case 'Low':
      default:
        return {
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: '🟢',
        };
    }
  };

  const riskBadge = getRiskScoreBadge();

  // Confidence Score Gauge Helper
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) {
      return {
        label: 'High Certainty',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        barGradient: 'from-teal-500 via-emerald-400 to-emerald-300',
        textColor: 'text-emerald-400',
        reliabilityNote: 'Backed by strong consensus from WHO / ICMR',
      };
    } else if (confidence >= 60) {
      return {
        label: 'Moderate Certainty',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barGradient: 'from-amber-500 via-yellow-400 to-amber-300',
        textColor: 'text-amber-400',
        reliabilityNote: 'Supported by partial consensus or indirect medical data',
      };
    } else {
      return {
        label: 'Low Certainty',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barGradient: 'from-rose-500 via-amber-500 to-rose-400',
        textColor: 'text-rose-400',
        reliabilityNote: 'Limited medical research available; proceed cautiously',
      };
    }
  };

  const confidenceBadge = getConfidenceBadge(result.confidence);

  // Extract combined list of sources
  const sourcesList = [
    ...(result.trustedSources || []),
  ].filter((src, idx, self) => Boolean(src) && self.indexOf(src) === idx);

  // Helper for generating external target URL
  const getSourceLink = (source: string) => {
    if (!source) return 'https://www.icmr.gov.in/';
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }
    const urlMatch = source.match(/https?:\/\/[^\s]+/);
    if (urlMatch) return urlMatch[0];

    const s = source.toLowerCase();
    if (s.includes('icmr')) return 'https://www.icmr.gov.in/';
    if (s.includes('who') || s.includes('world health')) return 'https://www.who.int/';
    if (s.includes('mohfw') || s.includes('ministry') || s.includes('health ministry')) return 'https://www.mohfw.gov.in/';
    if (s.includes('aiims')) return 'https://www.aiims.edu/';
    if (s.includes('cdc')) return 'https://www.cdc.gov/';
    if (s.includes('fda')) return 'https://www.fda.gov/';
    if (s.includes('pubmed') || s.includes('ncbi')) return 'https://pubmed.ncbi.nlm.nih.gov/';
    if (s.includes('lancet')) return 'https://www.thelancet.com/';
    return `https://www.google.com/search?q=${encodeURIComponent(source + ' medical research fact check')}`;
  };

  // Helper for display chip label
  const getSourceLabel = (source: string) => {
    if (!source) return 'Official Medical Source';
    if (source.startsWith('http://') || source.startsWith('https://')) {
      try {
        const url = new URL(source);
        return url.hostname.replace(/^www\./, '');
      } catch {
        return source.slice(0, 30);
      }
    }
    return source;
  };

  return (
    <div
      ref={reportCardRef}
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-6 animate-slide-up relative"
      id="fact-check-report-card"
    >
      
      {/* 1. HERO VERDICT HEADER */}
      <div className={`p-6 border-b ${verdictBadge.bg} transition-all`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 shadow-inner">
              {verdictBadge.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest font-bold text-slate-400">
                  HealthShield Fact-Check Verdict
                </span>
                {result.detectedLanguage && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    🌐 {result.detectedLanguage}
                  </span>
                )}
              </div>
              <h2 className={`text-2xl sm:text-3xl font-extrabold ${verdictBadge.titleColor} flex items-center gap-2 mt-0.5`}>
                <span>{verdictBadge.symbol}</span>
                <span>{result.verdict}</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
            {/* Save to Favorites Heart Icon Button */}
            <button
              onClick={handleToggleFavorite}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer group no-print ${
                isFavorite
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-rose-950/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 shadow-slate-950/40'
              }`}
              title={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
              id="toggle-favorite-btn-header"
            >
              <Heart
                className={`h-4 w-4 transition-transform ${
                  isFavorite
                    ? 'text-rose-400 fill-rose-500 scale-110'
                    : 'text-slate-400 group-hover:text-rose-400 group-hover:scale-110'
                }`}
              />
              <span>{isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}</span>
            </button>

            {/* Web Share / System Share Sheet Button */}
            <button
              onClick={handleWebShare}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-950/40 transition-all cursor-pointer no-print"
              title="Share report via system share sheet (Telegram, Signal, Messages, Twitter, Mail, etc.)"
              id="web-share-sheet-btn-header"
            >
              <Share2 className="h-4 w-4" />
              <span>{canWebShare ? 'Share via Apps...' : copied ? 'Text Copied!' : 'Share / Copy'}</span>
            </button>

            {/* Share on WhatsApp Direct Button */}
            <button
              onClick={handleShareOnWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer no-print"
              title="Share fact-check directly on WhatsApp"
              id="share-whatsapp-btn-header"
            >
              <Share2 className="h-4 w-4" />
              <span>WhatsApp</span>
            </button>

            {/* Download Report as Image (PNG) Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-950/40 transition-all cursor-pointer disabled:opacity-50 no-print"
              title="Download clean shareable PNG image of report for social media"
              id="download-image-report-btn"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating PNG...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  <span>Save as Image (PNG)</span>
                </>
              )}
            </button>

            {/* Download Report as PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/40 transition-all cursor-pointer disabled:opacity-50 no-print"
              title="Download official fact-check PDF report"
              id="download-pdf-report-btn"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Download Report as PDF</span>
                </>
              )}
            </button>

            {/* Print Report Button */}
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow-md border border-slate-700 shadow-slate-950/40 transition-all cursor-pointer no-print"
              title="Print fact-check report in clean format"
              id="print-report-btn-header"
            >
              <Printer className="h-4 w-4 text-cyan-400" />
              <span>Print Report</span>
            </button>

            {/* Forward Recommendation Callout */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-right min-w-[150px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Forward Recommendation
              </p>
              <div className={`text-xs sm:text-sm font-extrabold mt-0.5 flex items-center justify-end gap-1.5 ${
                result.shareRecommendation === 'Safe to Share' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <span>{result.shareRecommendation === 'Safe to Share' ? '✅' : '❌'}</span>
                <span>{result.shareRecommendation}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="px-6 space-y-6 pb-6">

        {/* 2. KEY FACT CHECK METRICS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Confidence Score Gauge Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Gauge className="h-4 w-4 text-teal-400" />
                Confidence Score
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${confidenceBadge.badgeColor}`}>
                {confidenceBadge.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold ${confidenceBadge.textColor}`}>
                  {result.confidence}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">AI Reliability</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.confidence >= 80 ? 'High Evidence' : result.confidence >= 50 ? 'Moderate' : 'Uncertain'}
              </span>
            </div>

            {/* Color-Coded Meter Progress Bar with Ticks */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/80 relative">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${confidenceBadge.barGradient} transition-all duration-1000 ease-out`}
                  style={{ width: `${Math.min(100, Math.max(10, result.confidence))}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-slate-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 truncate mt-0.5" title={confidenceBadge.reliabilityNote}>
              {confidenceBadge.reliabilityNote}
            </p>
          </div>

          {/* Misinformation Risk Score */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>Misinformation Risk</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${riskBadge.color}`}>
                {riskBadge.icon} {result.riskScore}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-1" title={result.riskReason}>
              {result.riskReason}
            </p>
          </div>

          {/* Copy WhatsApp Action */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-200">Share Fact-Check</p>
              <p className="text-[11px] text-slate-400">Copy formatted response</p>
            </div>
            <button
              onClick={handleCopyWhatsApp}
              className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
              id="copy-whatsapp-btn"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy for WhatsApp
                </>
              )}
            </button>
          </div>

        </div>

        {/* 3. EXTRACTED MAIN CLAIM */}
        <div className="bg-slate-950/90 border border-slate-800/90 p-4 rounded-xl space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" /> Extracted Health Claim
          </p>
          <p className="text-sm font-semibold text-slate-100 italic">
            "{result.mainClaim}"
          </p>
        </div>

        {/* 4. SIMPLE EXPLANATION */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-400" /> Explanation (Simple Language)
          </h3>
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm leading-relaxed space-y-3">
            <p>{result.explanation}</p>

            {/* Clickable Verification Sources Chips directly under the summary text */}
            {sourcesList.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <ExternalLink className="h-3.5 w-3.5 text-teal-400" /> Verification Sources:
                </span>
                {sourcesList.map((source, idx) => (
                  <a
                    key={idx}
                    href={getSourceLink(source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-teal-200 text-xs font-semibold border border-teal-500/30 hover:border-teal-400/60 transition-all cursor-pointer shadow-sm group/chip"
                    title={`Verify source: ${getSourceLabel(source)}`}
                  >
                    <span>{getSourceLabel(source)}</span>
                    <ExternalLink className="h-3 w-3 text-teal-400/80 group-hover/chip:text-teal-200 group-hover/chip:translate-x-0.5 group-hover/chip:-translate-y-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 5. COLLAPSIBLE DETAILED RISK ANALYSIS & SCIENTIFIC EVIDENCE */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-sm">
          <button
            onClick={() => setIsRiskAnalysisOpen(!isRiskAnalysisOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/80 transition-colors cursor-pointer group"
            id="toggle-risk-analysis-btn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors flex items-center gap-2">
                  Detailed Risk Analysis & Scientific Evidence
                </h3>
                <p className="text-xs text-slate-400">
                  Underlying scientific rationale, potential health harms, and evidence-based guidance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                {isRiskAnalysisOpen ? 'Collapse' : 'Expand Analysis'}
              </span>
              <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700 text-slate-400 group-hover:text-slate-200">
                {isRiskAnalysisOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </button>

          {(isRiskAnalysisOpen || isGeneratingPdf) && (
            <div className="p-4 pt-3 border-t border-slate-800/80 space-y-4 animate-fade-in bg-slate-950/90 collapsible-content">
              {/* Scientific Reasoning */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <Award className="h-4 w-4 text-teal-400" /> Scientific Evidence & Rationale
                </h4>
                <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-xl text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {result.whyReasoning}
                </div>
              </div>

              {/* Potential Health Risks */}
              {result.possibleRisks && (
                <div className="bg-rose-950/30 border border-rose-500/30 p-3.5 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Potential Health Risks
                  </h4>
                  <p className="text-xs sm:text-sm text-rose-200 leading-relaxed">
                    {result.possibleRisks}
                  </p>
                </div>
              )}

              {/* Correct Medical Guidance */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-xl space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Evidence-Based Medical Guidance
                </h4>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  {result.correctMedicalAdvice}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 6. COLLAPSIBLE SOURCE LINKS & MEDICAL AUTHORITIES */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/70 shadow-sm">
          <button
            onClick={() => setIsSourceLinksOpen(!isSourceLinksOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/80 transition-colors cursor-pointer group"
            id="toggle-source-links-btn"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors flex items-center gap-2">
                  Source Links & Verified Authorities
                </h3>
                <p className="text-xs text-slate-400">
                  {sourcesList.length > 0 ? `${sourcesList.length} verified medical authorities` : 'Trusted health bodies (WHO, ICMR, MoHFW)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                {isSourceLinksOpen ? 'Collapse' : `View Authorities (${sourcesList.length})`}
              </span>
              <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-slate-700 text-slate-400 group-hover:text-slate-200">
                {isSourceLinksOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </button>

          {(isSourceLinksOpen || isGeneratingPdf) && (
            <div className="p-4 pt-3 border-t border-slate-800/80 space-y-3 animate-fade-in bg-slate-950/90 collapsible-content">
              <p className="text-xs font-semibold text-slate-300">
                Official Clinical Guidelines & Verified Medical Research Sources:
              </p>
              <div className="flex flex-wrap gap-2">
                {sourcesList.length > 0 ? (
                  sourcesList.map((source, i) => (
                    <a
                      key={i}
                      href={getSourceLink(source)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 hover:text-teal-200 text-xs font-semibold border border-teal-500/30 hover:border-teal-400/60 transition-all cursor-pointer shadow-sm group/chip"
                      title={`Open official verification source: ${getSourceLabel(source)}`}
                    >
                      <span>{getSourceLabel(source)}</span>
                      <ExternalLink className="h-3 w-3 text-teal-400/80 group-hover/chip:text-teal-200 group-hover/chip:translate-x-0.5 group-hover/chip:-translate-y-0.5 transition-transform" />
                    </a>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">WHO, ICMR, MoHFW</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 7. EMERGENCY GUIDANCE CALLOUT */}
        <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl space-y-1">
          <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> Emergency Guidance
          </p>
          <p className="text-xs text-amber-200 leading-relaxed">
            {result.emergencyAdvice || 'If symptoms are severe or urgent, seek immediate medical care from a registered physician or go to the nearest emergency hospital.'}
          </p>
        </div>

        {/* 8. HELPFUL / NOT HELPFUL FEEDBACK BOX */}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <div className="space-y-0.5 text-center sm:text-left">
            <p className="text-xs font-bold text-slate-200">Was this fact-check report helpful?</p>
            <p className="text-[11px] text-slate-400">Your feedback helps refine AI source verification & medical claim accuracy.</p>
            {feedbackMsg && (
              <p className="text-[11px] font-semibold text-teal-400 animate-fade-in pt-0.5">
                {feedbackMsg}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleFeedback('helpful')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                userFeedback === 'helpful'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
              id="feedback-helpful-btn"
              title="Mark fact-check as helpful"
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${userFeedback === 'helpful' ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-400'}`} />
              <span>Helpful</span>
            </button>

            <button
              onClick={() => handleFeedback('not_helpful')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                userFeedback === 'not_helpful'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
              id="feedback-not-helpful-btn"
              title="Mark fact-check as not helpful"
            >
              <ThumbsDown className={`h-3.5 w-3.5 ${userFeedback === 'not_helpful' ? 'text-rose-400 fill-rose-400/20' : 'text-slate-400'}`} />
              <span>Not Helpful</span>
            </button>
          </div>
        </div>

        {/* 9. RAW WHATSAPP CARD PREVIEW BOX */}
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 no-print">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Share Card Preview</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadImage}
                disabled={isGeneratingImage}
                className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                id="download-image-btn-preview"
                title="Download as clean PNG Image"
              >
                <ImageIcon className="h-3.5 w-3.5" /> Download PNG
              </button>
              <button
                onClick={handleWebShare}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                id="share-system-btn-preview"
                title="Share via System Share Sheet"
              >
                <Share2 className="h-3.5 w-3.5" /> {canWebShare ? 'System Share Sheet' : 'Share Text'}
              </button>
              <button
                onClick={handleShareOnWhatsApp}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                id="share-whatsapp-btn-preview"
              >
                <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
              </button>
              <button
                onClick={handleCopyWhatsApp}
                className="text-slate-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                id="copy-text-btn-preview"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
          <pre className="text-xs font-mono text-emerald-300 bg-slate-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
            {result.whatsappShareCardText}
          </pre>
        </div>

      </div>
    </div>
  );
};
