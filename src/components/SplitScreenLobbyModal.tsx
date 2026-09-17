import React, { useState } from 'react';
import { CarStats, TrackTheme, WeatherType } from '../types/game';
import { AVAILABLE_CARS, TRACK_THEMES } from '../game/tracks';
import { Users, Play, Sun, CloudRain, Moon, Sunset, Check, ArrowRight } from 'lucide-react';

interface SplitScreenLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSplitScreen: (
    p1Car: CarStats,
    p2Car: CarStats,
    track: TrackTheme,
    laps: number,
    weather: WeatherType
  ) => void;
}

export const SplitScreenLobbyModal: React.FC<SplitScreenLobbyModalProps> = ({
  isOpen,
  onClose,
  onStartSplitScreen
}) => {
  const [p1CarId, setP1CarId] = useState<string>(AVAILABLE_CARS[0].id);
  const [p2CarId, setP2CarId] = useState<string>(AVAILABLE_CARS[1].id);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(TRACK_THEMES[0].id);
  const [laps, setLaps] = useState<number>(3);
  const [weather, setWeather] = useState<WeatherType>('clear');

  if (!isOpen) return null;

  const p1Car = AVAILABLE_CARS.find((c) => c.id === p1CarId) || AVAILABLE_CARS[0];
  const p2Car = AVAILABLE_CARS.find((c) => c.id === p2CarId) || AVAILABLE_CARS[1];
  const selectedTrack = TRACK_THEMES.find((t) => t.id === selectedTrackId) || TRACK_THEMES[0];

  const handleStart = () => {
    onStartSplitScreen(p1Car, p2Car, selectedTrack, laps, weather);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md">
      <div
        id="splitscreen-lobby-modal"
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Mabar 2 Pemain (Layar Belah / Split-Screen)
              </h2>
              <p className="text-xs text-slate-400">
                Balapan head-to-head langsung di satu layar komputer atau laptop bersama teman!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Dual Player Vehicle Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Player 1 Setup */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border-2 border-cyan-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 text-xs font-black rounded-lg bg-cyan-500 text-slate-950 tracking-wider">
                  PEMAIN 1 (P1)
                </span>
                <span className="text-[11px] text-cyan-300 font-mono">
                  Kontrol: WASD + SPASI + SHIFT
                </span>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1.5 font-bold">Pilih Mobil P1:</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_CARS.map((car) => (
                    <button
                      key={`p1_${car.id}`}
                      onClick={() => setP1CarId(car.id)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center gap-2 ${
                        p1CarId === car.id
                          ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: car.bodyColor }}
                      />
                      <span className="font-bold truncate">{car.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* P1 Controls reminder badge */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gas & Rem / Mundur:</span>
                  <span className="font-mono font-bold text-cyan-300">W / S</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Belok Kiri / Kanan:</span>
                  <span className="font-mono font-bold text-cyan-300">A / D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Handbrake / Drift:</span>
                  <span className="font-mono font-bold text-cyan-300">Spasi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nitro Booster:</span>
                  <span className="font-mono font-bold text-cyan-300">Shift Kiri</span>
                </div>
              </div>
            </div>

            {/* Player 2 Setup */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border-2 border-orange-500/40 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 text-xs font-black rounded-lg bg-orange-500 text-slate-950 tracking-wider">
                  PEMAIN 2 (P2)
                </span>
                <span className="text-[11px] text-orange-300 font-mono">
                  Kontrol: PANAH + NUM0 / ENTER
                </span>
              </div>

              <div className="mb-3">
                <label className="text-xs text-slate-400 block mb-1.5 font-bold">Pilih Mobil P2:</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_CARS.map((car) => (
                    <button
                      key={`p2_${car.id}`}
                      onClick={() => setP2CarId(car.id)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all flex items-center gap-2 ${
                        p2CarId === car.id
                          ? 'bg-orange-950/60 border-orange-400 text-white shadow-lg'
                          : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                        style={{ backgroundColor: car.bodyColor }}
                      />
                      <span className="font-bold truncate">{car.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* P2 Controls reminder badge */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 text-[11px] space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gas & Rem / Mundur:</span>
                  <span className="font-mono font-bold text-orange-300">↑ / ↓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Belok Kiri / Kanan:</span>
                  <span className="font-mono font-bold text-orange-300">← / →</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Handbrake / Drift:</span>
                  <span className="font-mono font-bold text-orange-300">Num0 / /</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nitro Booster:</span>
                  <span className="font-mono font-bold text-orange-300">Enter / RShift</span>
                </div>
              </div>
            </div>
          </div>

          {/* Track & Environment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Track Selector */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs text-slate-400 font-bold block mb-2">Lintasan Sirkuit</label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
              >
                {TRACK_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Lap count */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs text-slate-400 font-bold block mb-2">Jumlah Putaran (Lap)</label>
              <div className="flex gap-2">
                {[2, 3, 5].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLaps(l)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                      laps === l
                        ? 'bg-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {l} Lap
                  </button>
                ))}
              </div>
            </div>

            {/* Weather / Simulation Realism */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <label className="text-xs text-slate-400 font-bold block mb-2">Kondisi Cuaca (Fisika Realistis)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setWeather('clear')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    weather === 'clear' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Cerah
                </button>
                <button
                  onClick={() => setWeather('rain')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    weather === 'rain' ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5" /> Hujan
                </button>
                <button
                  onClick={() => setWeather('sunset')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    weather === 'sunset' ? 'bg-orange-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  <Sunset className="w-3.5 h-3.5" /> Senja
                </button>
                <button
                  onClick={() => setWeather('night')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    weather === 'night' ? 'bg-indigo-500 text-slate-950' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Malam
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 md:p-6 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            Batal
          </button>
          <button
            id="splitscreen-btn-start"
            onClick={handleStart}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl flex items-center gap-2 transition-transform active:scale-95"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Mulai Balapan Mabar 2 Pemain!
          </button>
        </div>
      </div>
    </div>
  );
};
