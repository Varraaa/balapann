/**
 * Race Finish / Podium Results Screen
 */

import React from 'react';
import { CarState, TrackTheme } from '../types/game';
import { Trophy, RotateCcw, Compass, Home, Clock, Award, Zap } from 'lucide-react';

interface RaceFinishModalProps {
  playerCar: CarState;
  allCars: CarState[];
  theme: TrackTheme;
  onRestart: () => void;
  onChangeTrack: () => void;
  onMainMenu: () => void;
}

export const RaceFinishModal: React.FC<RaceFinishModalProps> = ({
  playerCar,
  allCars,
  theme,
  onRestart,
  onChangeTrack,
  onMainMenu
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const isWinner = playerCar.rank === 1;
  const bestLap = playerCar.lapTimes.length > 0 ? Math.min(...playerCar.lapTimes) : playerCar.totalRaceTime;

  // Sort all cars by finish rank
  const sortedCars = [...allCars].sort((a, b) => a.rank - b.rank);

  return (
    <div
      id="race-finish-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-30 pointer-events-none ${
            isWinner ? 'bg-amber-400' : 'bg-cyan-500'
          }`}
        />

        {/* Title Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg ${
              isWinner
                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/40'
                : 'bg-slate-800 text-cyan-400 border border-slate-700'
            }`}
          >
            <Trophy className="w-9 h-9" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-1">
            {isWinner ? 'JUARA PERTAMA!' : `FINISH DI POSISI #${playerCar.rank}`}
          </h2>
          <p className="text-slate-400 text-sm">
            {theme.name} • {theme.laps} Putaran
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-7 h-7 text-cyan-400 flex-shrink-0" />
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400">Total Waktu</div>
              <div className="text-xl font-mono font-black text-white">
                {formatTime(playerCar.totalRaceTime)}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-7 h-7 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400">Lap Terbaik</div>
              <div className="text-xl font-mono font-black text-amber-400">
                {formatTime(bestLap)}
              </div>
            </div>
          </div>
        </div>

        {/* Standings Leaderboard */}
        <div className="mb-6 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            Hasil Akhir Pembalap
          </div>

          <div className="space-y-2">
            {sortedCars.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  c.isPlayer
                    ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                      c.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : c.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : c.rank === 3
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.rank}
                  </span>
                  <span className="font-bold text-sm">
                    {c.name} {c.isPlayer && '(Kamu)'}
                  </span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {c.lapTimes.length > 0 ? formatTime(c.totalRaceTime) : '--:--.--'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            id="btn-restart-race"
            onClick={onRestart}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all active:scale-95 shadow-lg shadow-cyan-950"
          >
            <RotateCcw className="w-5 h-5 mb-1" />
            <span className="text-xs">Balap Lagi</span>
          </button>

          <button
            id="btn-change-track"
            onClick={onChangeTrack}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all active:scale-95"
          >
            <Compass className="w-5 h-5 mb-1" />
            <span className="text-xs">Pilih Track</span>
          </button>

          <button
            id="btn-return-menu"
            onClick={onMainMenu}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition-all active:scale-95"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Menu Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
};
