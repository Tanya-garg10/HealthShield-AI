import React from 'react';
import { Flame, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { SampleClaim } from '../types';
import { SAMPLE_CLAIMS } from '../data/sampleClaims';

interface TrendingRadarProps {
  onSelectClaim: (claim: SampleClaim) => void;
}

export const TrendingRadar: React.FC<TrendingRadarProps> = ({ onSelectClaim }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-1.5">
              India Health Rumor Radar
            </h3>
            <p className="text-xs text-slate-400">
              Top forwarded claims circulating on social media & WhatsApp groups
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SAMPLE_CLAIMS.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectClaim(item)}
            className="bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-xl transition-all cursor-pointer group flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {item.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.riskLevel === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Risk: {item.riskLevel}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 italic">
                "{item.claimText}"
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Fact-check this claim</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
