/**
 * Main Menu Component with Mode Selection (Solo, Split-Screen Mabar, Online Mabar)
 * and Realism Weather Controls
 */

import React from 'react';
import { CarStats, TrackTheme, WeatherType } from '../types/game';
import {
  Play,
  Car,
  Flag,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  Users,
  Globe,
  Sun,
  CloudRain,
  Moon,
  Sunset,
  Zap
} from 'lucide-react';

interface MainMenuProps {
  selectedCar: CarStats;
  selectedTrack: TrackTheme;
  bestLap: number | null;
  soundEnabled: boolean;
  weather: WeatherType;
  onChangeWeather: (w: WeatherType) => void;
  onToggleSound: () => void;
  onStartSingleRace: () => void;
  onOpenSplitScreen: () => void;
  onOpenOnlineMabar: () => void;
  onOpenCarSelect: () => void;
  onOpenTrackSelect: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedCar,
  selectedTrack,
  bestLap,
  soundEnabled,
  weather,
  onChangeWeather,
  onToggleSound,
  onStartSingleRace,
  onOpenSplitScreen,
  onOpenOnlineMabar,
  onOpenCarSelect,
  onOpenTrackSelect,
  onOpenSettings,
  onOpenHelp
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const weatherOptions: { id: WeatherType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'clear',
      label: 'Cerah (Clear)',
      desc: 'Grip ban optimal 100%, visibilitas tinggi',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-400/40 bg-amber-950/20'
    },
    {
      id: 'rain',
      label: 'Hujan (Wet)',
      desc: 'Aspal basah licin, grip 78%, semprotan air',
      icon: <CloudRain className="w-4 h-4 text-sky-400" />,
      color: 'border-sky-400/40 bg-sky-950/20'
    },
    {
      id: 'sunset',
      label: 'Senja (Sunset)',
      desc: 'Nuansa senja hangat, pencahayaan dramatis',
      icon: <Sunset className="w-4 h-4 text-orange-400" />,
      color: 'border-orange-400/40 bg-orange-950/20'
    },
    {
      id: 'night',
      label: 'Malam (Night)',
      desc: 'Sorot lampu mobil tajam, rem berpijar',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      color: 'border-indigo-400/40 bg-indigo-950/20'
    }
  ];

  return (
    <div
      id="main-menu-screen"
      className="relative w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto"
    >
      {/* Background Animated Neon Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
            Realism & Multiplayer Edition
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="menu-btn-sound"
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Audio Mute / Unmute"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-400" />
            )}
          </button>
          <button
            id="menu-btn-help"
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            Bantuan & Kontrol
          </button>
        </div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-4 max-w-5xl mx-auto w-full">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-black tracking-wider uppercase mb-2 shadow-lg shadow-cyan-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          SIMULASI BALAP 2D REALISTIS + MABAR
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl">
          APEX RACER <span className="text-cyan-400">2D</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg leading-relaxed">
          Fisika transfer bobot, simulasi suhu ban & rem berpijar, suara mesin turbo dinamis, dan fitur mabar bareng teman!
        </p>

        {/* Selected Config Cards Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-5">
          {/* Active Car Card */}
          <div
            onClick={onOpenCarSelect}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border-2 border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer flex items-center justify-between text-left shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl border-2 border-white/20 shadow-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: selectedCar.bodyColor }}
              >
                <div
                  className="w-3.5 h-6 rounded-sm shadow-sm"
                  style={{ backgroundColor: selectedCar.accentColor }}
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Mobil Balap
                </span>
                <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                  {selectedCar.name}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Speed: {Math.round(selectedCar.maxSpeed * 0.32)} km/h
                </span>
              </div>
            </div>
            <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
              Ganti
            </span>
          </div>

          {/* Active Track Card */}
          <div
            onClick={onOpenTrackSelect}
            className="group p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border-2 border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer flex items-center justify-between text-left shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl shadow-md flex items-center justify-center flex-shrink-0 border border-white/20 text-white font-black text-xs"
                style={{
                  background: `linear-gradient(135deg, ${selectedTrack.previewGradient[0]}, ${selectedTrack.previewGradient[1]})`
                }}
              >
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                  Lintasan
                </span>
                <span className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                  {selectedTrack.name}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedTrack.difficulty} • {selectedTrack.laps} Putaran
                </span>
              </div>
            </div>
            <span className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/40">
              Ganti
            </span>
          </div>
        </div>

        {/* Realism Weather Selector */}
        <div className="w-full max-w-xl mt-4 p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Simulasi Cuaca & Permukaan Trek:
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              {weather === 'rain' ? 'Slick Wet Track' : 'Dry Tarmac'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {weatherOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChangeWeather(opt.id)}
                className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  weather === opt.id
                    ? `${opt.color} border-cyan-400 text-white shadow-lg`
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {opt.icon}
                  <span className="text-xs font-bold truncate">{opt.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 leading-tight line-clamp-2">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Best Lap Record */}
        {bestLap && (
          <div className="flex items-center gap-2 mt-3 px-4 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-amber-400" />
            Rekor Lap Terbaik di {selectedTrack.name}:{' '}
            <span className="font-mono font-black text-white">{formatTime(bestLap)}</span>
          </div>
        )}

        {/* Game Mode Launch Cards */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
          {/* Mode 1: Solo Race */}
          <button
            id="btn-mode-solo"
            onClick={onStartSingleRace}
            className="group p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-cyan-950/60 hover:to-slate-900/90 border-2 border-cyan-500/40 hover:border-cyan-400 text-left transition-all active:scale-95 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 border border-cyan-500/30">
                <Play className="w-5 h-5 fill-cyan-400" />
              </div>
              <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors">
                Balapan Solo (AI)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Karier balapan solo melawan 3 pembalap AI cerdas dengan sistem lap dan catatan waktu terbaik.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Main Sekarang</span>
              <span>→</span>
            </div>
          </button>

          {/* Mode 2: Split-Screen Mabar */}
          <button
            id="btn-mode-splitscreen"
            onClick={onOpenSplitScreen}
            className="group p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-orange-950/60 hover:to-slate-900/90 border-2 border-orange-500/40 hover:border-orange-400 text-left transition-all active:scale-95 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2 border border-orange-500/30">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white group-hover:text-orange-400 transition-colors">
                Mabar 1 Layar (Split)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                2 Pemain langsung di 1 komputer/laptop! Layar terbelah dua (WASD vs Tombol Panah).
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-bold text-orange-400">
              <span>P1 vs P2</span>
              <span>→</span>
            </div>
          </button>

          {/* Mode 3: Online P2P Mabar */}
          <button
            id="btn-mode-online"
            onClick={onOpenOnlineMabar}
            className="group p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-emerald-950/60 hover:to-slate-900/90 border-2 border-emerald-500/40 hover:border-emerald-400 text-left transition-all active:scale-95 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 border border-emerald-500/30">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                Mabar Online (P2P)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Buat kode kamar unik dan kirim ke teman untuk balapan bersama di beda tab atau laptop!
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-bold text-emerald-400">
              <span>Buka Kamar</span>
              <span>→</span>
            </div>
          </button>
        </div>

        {/* Secondary Navigation Row */}
        <div className="flex items-center justify-center gap-3 mt-4 w-full max-w-md">
          <button
            id="btn-nav-cars"
            onClick={onOpenCarSelect}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Car className="w-4 h-4 text-cyan-400" />
            Pilih Mobil
          </button>

          <button
            id="btn-nav-tracks"
            onClick={onOpenTrackSelect}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Flag className="w-4 h-4 text-amber-400" />
            Pilih Track
          </button>

          <button
            id="btn-nav-settings"
            onClick={onOpenSettings}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Settings className="w-4 h-4 text-purple-400" />
            Pengaturan
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 border-t border-slate-900 pt-3 max-w-6xl mx-auto w-full gap-2">
        <span>Apex Racer 2D • Top-Down Racing Simulation & Multiplayer</span>
        <span>Mendukung Keyboard (WASD & Panah), Kontrol Sentuh Mobile & WebRTC P2P</span>
      </div>
    </div>
  );
};
