import React from 'react';
import { ShieldCheck, AlertCircle, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">HealthShield AI</p>
              <p className="text-xs text-slate-400">
                Track 1 Healthcare – Fighting Health Misinformation in India
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Verified Sources:</span>
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">WHO</span>
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">ICMR</span>
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">AIIMS</span>
            <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">MoHFW</span>
          </div>
        </div>

        {/* Medical Guardrail Disclaimer */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs space-y-1.5 text-slate-400 leading-relaxed">
          <p className="font-bold text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> Healthcare Guardrail & Disclaimer
          </p>
          <p>
            HealthShield AI is an automated health misinformation verifier designed for educational and informational purposes only. It does not provide individualized clinical diagnosis, treatment plans, or personal medical advice.
          </p>
          <p>
            Never disregard professional medical advice or delay seeking care because of information verified on this platform. In case of severe illness, medical emergencies, or high fever, immediately consult a registered medical doctor or visit your nearest hospital.
          </p>
        </div>

        {/* Bottom copyright */}
        <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
          <span>Powered by OpenRouter (Claude 3.5 Sonnet Beta)</span>
          <span>•</span>
          <span>Built for India Health Misinformation Track 1</span>
        </div>

      </div>
    </footer>
  );
};
