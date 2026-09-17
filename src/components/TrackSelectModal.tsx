/**
 * Track Selection Modal
 */

import React from 'react';
import { TrackTheme } from '../types/game';
import { TRACK_THEMES } from '../game/tracks';
import { X, Flag, Check, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface TrackSelectModalProps {
  selectedTrack: TrackTheme;
  onSelectTrack: (track: TrackTheme) => void;
  onClose: () => void;
}

export const TrackSelectModal: React.FC<TrackSelectModalProps> = ({
  selectedTrack,
  onSelectTrack,
  onClose
}) => {
  return (
    <div
      id="track-select-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              PILIH LINTASAN / TRACK
            </h2>
            <p className="text-sm text-slate-400">
              Pilih sirkuit dengan karakteristik jalan dan tantangan cuaca yang berbeda
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Track Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 overflow-y-auto pr-1">
          {TRACK_THEMES.map((track) => {
            const isSelected = track.id === selectedTrack.id;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track)}
                className={`group rounded-2xl p-5 cursor-pointer border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-400 shadow-xl shadow-cyan-950/50 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Visual Banner Accent */}
                <div
                  className="h-28 rounded-xl mb-4 p-3 flex flex-col justify-between relative overflow-hidden shadow-inner"
                  style={{
                    background: `linear-gradient(135deg, ${track.previewGradient[0]}, ${track.previewGradient[1]})`
                  }}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1">
                      <Flag className="w-3 h-3" />
                      {track.laps} Laps
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase ${
                        track.difficulty === 'Mudah'
                          ? 'bg-emerald-500 text-slate-950'
                          : track.difficulty === 'Sedang'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {track.difficulty}
                    </span>
                  </div>

                  {/* Surface preview badge */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-white/50 shadow-md"
                      style={{ backgroundColor: track.roadColor }}
                    />
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {track.name}
                    </span>
                  </div>
                </div>

                {/* Info & Description */}
                <div>
                  <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors">
                    {track.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {track.description}
                  </p>

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      {track.obstacles.length} Rintangan
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      {track.nitroPickups.length} Booster Nitro
                    </span>
                  </div>
                </div>

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-900/60 transition-all active:scale-95"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};
