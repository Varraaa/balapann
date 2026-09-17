/**
 * Settings Modal
 */

import React from 'react';
import { GameSettings } from '../types/game';
import { X, Volume2, Music, Bot, Flag, Smartphone, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetRecords: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetRecords,
  onClose
}) => {
  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              PENGATURAN GAME
            </h2>
            <p className="text-xs text-slate-400">
              Konfigurasi audio, tingkat kesulitan AI, dan jumlah putaran
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings options list */}
        <div className="space-y-5 my-6 overflow-y-auto pr-1">
          {/* Sound FX */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-bold text-sm">Efek Suara (SFX)</div>
                <div className="text-xs text-slate-400">Suara mesin, tabrakan, drift & nitro</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Background Music */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-purple-400" />
              <div>
                <div className="font-bold text-sm">Musik Latar (BGM)</div>
                <div className="text-xs text-slate-400">Retro arcade synthwave</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.musicEnabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* AI Difficulty */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-sm">Tingkat Kesulitan AI Lawan</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => {
                const labels = { easy: 'Mudah', medium: 'Sedang', hard: 'Sulit' };
                const isSelected = settings.difficulty === diff;
                return (
                  <button
                    key={diff}
                    onClick={() => onUpdateSettings({ difficulty: diff })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {labels[diff]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Laps Count */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-5 h-5 text-emerald-400" />
              <div className="font-bold text-sm">Jumlah Putaran (Laps)</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 5].map((laps) => {
                const isSelected = settings.laps === laps;
                return (
                  <button
                    key={laps}
                    onClick={() => onUpdateSettings({ laps })}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-md'
                        : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {laps} Laps
                  </button>
                );
              })}
            </div>
          </div>

          {/* Touch Controls Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="font-bold text-sm">Kontrol Virtual di Layar</div>
                <div className="text-xs text-slate-400">Tombol kemudi & pedal sentuh</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ touchControls: !settings.touchControls })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.touchControls ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.touchControls ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reset Best Lap Records */}
          <div className="pt-2">
            <button
              onClick={onResetRecords}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset Rekor Waktu Terbaik
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-900/60 transition-all active:scale-95"
          >
            SIMPAN & TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
