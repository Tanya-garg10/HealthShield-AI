import React, { useState, useRef } from 'react';
import { MessageSquareText, Image as ImageIcon, Mic, Sparkles, Upload, Trash2, StopCircle, Play, Pause, Clipboard, Send } from 'lucide-react';
import { SampleClaim, SupportedLanguage } from '../types';
import { SAMPLE_CLAIMS } from '../data/sampleClaims';

interface InputPanelProps {
  onVerify: (payload: {
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    audioBase64?: string;
    audioMimeType?: string;
  }) => void;
  isLoading: boolean;
  selectedLanguage: SupportedLanguage;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onVerify, isLoading, selectedLanguage }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice'>('text');
  
  // Text state
  const [inputText, setInputText] = useState('');

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Clipboard Paste
  const handlePasteClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setInputText(clipboardText);
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // Handle Image Upload
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setImagePreview(resultStr);
      const base64Data = resultStr.split(',')[1];
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Handle Audio Upload
  const handleAudioFile = (file: File) => {
    if (!file.type.startsWith('audio/')) return;
    setAudioMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setAudioUrl(URL.createObjectURL(file));
      const base64Data = resultStr.split(',')[1];
      setAudioBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Start Mic Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioMimeType('audio/webm');
        setAudioUrl(URL.createObjectURL(audioBlob));

        const reader = new FileReader();
        reader.onloadend = () => {
          const resultStr = reader.result as string;
          const base64Data = resultStr.split(',')[1];
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access was denied or is not supported in this environment.');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Reset inputs
  const clearInputs = () => {
    setInputText('');
    setImagePreview(null);
    setImageBase64(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setIsRecording(false);
  };

  // Select preset sample claim
  const handleSelectSample = (sample: SampleClaim) => {
    setActiveTab('text');
    setInputText(sample.claimText);
  };

  // Submit Handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !imageBase64 && !audioBase64) return;

    onVerify({
      text: inputText.trim() || undefined,
      imageBase64: imageBase64 || undefined,
      imageMimeType: imageBase64 ? imageMimeType : undefined,
      audioBase64: audioBase64 || undefined,
      audioMimeType: audioBase64 ? audioMimeType : undefined,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Input Mode Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            id="tab-text"
          >
            <MessageSquareText className="h-4 w-4" />
            <span>Forwarded Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            id="tab-image"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Image / Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'voice'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            id="tab-voice"
          >
            <Mic className="h-4 w-4" />
            <span>Voice Note</span>
          </button>

        </div>

        {(inputText || imagePreview || audioUrl) && (
          <button
            type="button"
            onClick={clearInputs}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Clear all inputs"
            id="clear-input-btn"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* TAB 1: TEXT INPUT */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label htmlFor="claim-text-input" className="font-medium text-slate-300">
                Paste WhatsApp message, tweet, or health claim:
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Clipboard className="h-3.5 w-3.5" /> Paste Clipboard
              </button>
            </div>
            
            <div className="relative">
              <textarea
                id="claim-text-input"
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='e.g. "Drinking hot water every 15 minutes kills coronavirus. Forward to all family groups!" or "Papaya leaf juice permanently cures Dengue fever..."'
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/80 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
              />
            </div>
          </div>
        )}

        {/* TAB 2: IMAGE UPLOAD / OCR */}
        {activeTab === 'image' && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300">
              Upload WhatsApp screenshot, viral poster, or medicine packaging image:
            </label>

            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFile(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center bg-slate-950/60 hover:bg-slate-950 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                  className="hidden"
                  id="image-file-input"
                />
                <div className="mx-auto h-12 w-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:scale-105 transition-all">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-200">
                  Click to browse or drag & drop image
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPG, PNG, WEBP. OCR will automatically extract health claims.
                </p>
              </div>
            ) : (
              <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800 flex items-center gap-4">
                <img
                  src={imagePreview}
                  alt="Claim Screenshot Preview"
                  className="h-24 w-24 object-cover rounded-lg border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> Image Loaded & Ready for OCR Fact-Check
                  </p>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    Gemini vision will extract and verify text from this screenshot.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                    }}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}

            {/* Optional extra text comment alongside image */}
            <div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Optional: Add extra context or question about this image..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        )}

        {/* TAB 3: VOICE NOTE INPUT */}
        {activeTab === 'voice' && (
          <div className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800 text-center">
            <p className="text-xs text-slate-300">
              Record a spoken health claim or upload a audio voice note (Hindi, Hinglish, English, or regional languages):
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
                  id="start-mic-btn"
                >
                  <Mic className="h-4 w-4 animate-pulse" />
                  <span>Start Microphone Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-3 rounded-xl bg-slate-800 border border-rose-500/50 text-rose-400 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
                  id="stop-mic-btn"
                >
                  <StopCircle className="h-4 w-4 animate-spin text-rose-500" />
                  <span>Stop Recording ({recordingSeconds}s)</span>
                </button>
              )}

              <span className="text-xs text-slate-500">OR</span>

              <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer transition-colors inline-flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-400" />
                <span>Upload Audio File</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && handleAudioFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {audioUrl && (
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl inline-flex flex-col items-center gap-2 max-w-sm mx-auto w-full">
                <p className="text-xs text-emerald-400 font-medium">
                  🎙️ Voice Note Captured
                </p>
                <audio src={audioUrl} controls className="w-full h-8" />
              </div>
            )}

            <div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Optional: Add context for this voice claim..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        )}

        {/* PRESET SAMPLE CLAIM CHIPS */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400">
              Popular Viral Claims in India (Click to test):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CLAIMS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/80 transition-all hover:border-emerald-500/50 cursor-pointer text-left truncate max-w-xs"
                title={sample.claimText}
              >
                🔥 {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !imageBase64 && !audioBase64)}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="submit-verify-btn"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Fact-Checking Claim against WHO & ICMR Database...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Fact-Check Claim with HealthShield AI</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
