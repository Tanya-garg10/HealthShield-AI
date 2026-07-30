import React, { useState, useEffect } from 'react';
import { X, History, Trash2, ArrowRight, Heart, BookmarkCheck } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);

  // Load favorites from localStorage
  const loadFavorites = () => {
    try {
      const raw = localStorage.getItem('healthshield_favorites');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(parsed);
        }
      } else {
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }
  };

  useEffect(() => {
    loadFavorites();
    window.addEventListener('healthshield_favorites_updated', loadFavorites);
    return () => {
      window.removeEventListener('healthshield_favorites_updated', loadFavorites);
    };
  }, []);

  const handleRemoveFavorite = (e: React.MouseEvent, favId: string) => {
    e.stopPropagation();
    try {
      const updated = favorites.filter((f) => f.id !== favId);
      setFavorites(updated);
      localStorage.setItem('healthshield_favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('healthshield_favorites_updated'));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'history' ? history : favorites;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Fact-Check Vault</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            id="close-history-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-history"
          >
            <History className="h-3.5 w-3.5" />
            <span>Recent History ({history.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-slate-800 text-rose-300 shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            id="tab-favorites"
          >
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-400" />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {currentList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              {activeTab === 'history' ? (
                <>
                  <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No previous fact-checks saved yet.</p>
                  <p className="mt-1">Claims you verify will appear here for easy access.</p>
                </>
              ) : (
                <>
                  <Heart className="h-10 w-10 mx-auto mb-2 text-rose-500/30" />
                  <p className="text-slate-400 font-semibold">No favorites saved yet.</p>
                  <p className="mt-1 text-slate-500">Click the 'Save to Favorites' heart button on any report card to bookmark important claims here.</p>
                </>
              )}
            </div>
          ) : (
            currentList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-xl transition-all cursor-pointer group space-y-2 relative"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Saved'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      item.result.verdict === 'True' || item.result.verdict === 'Mostly True'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.result.verdict === 'False'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.result.verdict}
                    </span>
                    {activeTab === 'favorites' && (
                      <button
                        onClick={(e) => handleRemoveFavorite(e, item.id)}
                        className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                  "{item.claimSummary}"
                </p>

                <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform pt-1">
                  <span className="flex items-center gap-1">
                    {activeTab === 'favorites' && <BookmarkCheck className="h-3 w-3 text-rose-400" />}
                    View Full Report
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {activeTab === 'history' && history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
            <span className="text-xs text-slate-400">{history.length} items in history</span>
            <button
              onClick={onClearHistory}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              id="clear-history-action"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear History
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
