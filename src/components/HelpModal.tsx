/**
 * Help & Controls Guide Modal
 */

import React from 'react';
import { X, Keyboard, Smartphone, Lightbulb, Zap, ShieldAlert } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div
      id="help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              PANDUAN & KONTROL BALAP
            </h2>
            <p className="text-xs text-slate-400">
              Pelajari teknik kemudi, drift, dan tips menguasai sirkuit
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 my-6 overflow-y-auto pr-1">
          {/* Desktop Controls */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-3">
              <Keyboard className="w-4 h-4" />
              Kontrol Keyboard (Desktop / Laptop)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Akselerasi (Maju)</div>
                <div className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded inline-block">
                  W atau ↑
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Rem / Mundur</div>
                <div className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded inline-block">
                  S atau ↓
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Belok Kiri / Kanan</div>
                <div className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded inline-block">
                  A / D atau ← / →
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Rem Tangan (Drift)</div>
                <div className="font-mono text-xs font-bold text-amber-400 bg-slate-900 px-2 py-1 rounded inline-block">
                  SPASI
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Nitro Booster</div>
                <div className="font-mono text-xs font-bold text-cyan-400 bg-slate-900 px-2 py-1 rounded inline-block">
                  SHIFT atau N
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-800 p-3 rounded-xl">
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Reset Posisi Mobil</div>
                <div className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded inline-block">
                  R
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Touch Controls */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-3">
              <Smartphone className="w-4 h-4" />
              Kontrol Sentuh (Smartphone / Tablet)
            </div>
            <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-xl text-xs text-slate-300 leading-relaxed">
              Tersedia tombol virtual di layar: tombol panah di sisi kiri untuk belok, serta pedal GAS, REM, tombol DRIFT, dan NITRO di sisi kanan. Mendukung multi-touch sehingga kamu bisa menekan gas dan belok bersamaan!
            </div>
          </div>

          {/* Tips & Tricks */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-3">
              <Lightbulb className="w-4 h-4" />
              Tips & Trik Balapan
            </div>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ambil Tabung Nitro:</strong> Tabung biru N₂O tersebar di lintasan dan akan otomatis respawn. Gunakan nitro di lintasan lurus untuk melesat menyalip lawan!
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Waspada Tumpahan Minyak & Batu:</strong> Genangan minyak membuat mobilmu melintir berputar tak terkendali. Hindari batu cadas di pinggir jalan agar tidak mental!
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Teknik Drifting:</strong> Saat mendekati tikungan tajam, tahan tombol Spasi / Drift sambil membelokkan kemudi untuk slide dan menjaga kecepatan tanpa terlempar keluar jalur.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-900/60 transition-all active:scale-95"
          >
            SAYA SIAP BALAPAN
          </button>
        </div>
      </div>
    </div>
  );
};
