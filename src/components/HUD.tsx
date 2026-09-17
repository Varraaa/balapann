/**
 * In-Game Heads-Up Display (HUD) with Realistic Telemetry & Dual Split-Screen support
 */

import React from 'react';
import { CarState, GameMode, TrackTheme } from '../types/game';
import { Minimap } from './Minimap';
import { Volume2, VolumeX, Zap, AlertTriangle, RotateCcw, Copy, Wifi, Thermometer } from 'lucide-react';

interface HUDProps {
  playerCar: CarState;
  player2Car?: CarState | null;
  allCars: CarState[];
  theme: TrackTheme;
  countdown: number; // 3, 2, 1, 0 (0 = GO / Racing)
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetCar: () => void;
  onQuitToMenu: () => void;
  gameMode?: GameMode;
  roomCode?: string;
}

export const HUD: React.FC<HUDProps> = ({
  playerCar,
  player2Car,
  allCars,
  theme,
  countdown,
  soundEnabled,
  onToggleSound,
  onResetCar,
  onQuitToMenu,
  gameMode = 'single_player',
  roomCode
}) => {
  const isSplitScreen = gameMode === 'split_screen' && !!player2Car;

  // Format seconds to mm:ss.ms
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const bestLap = playerCar.lapTimes.length > 0 ? Math.min(...playerCar.lapTimes) : null;

  // Rank badge styling
  const rankColors: Record<number, string> = {
    1: 'from-amber-400 to-yellow-600 text-amber-950 border-amber-300',
    2: 'from-slate-300 to-slate-400 text-slate-900 border-slate-200',
    3: 'from-amber-700 to-amber-800 text-amber-100 border-amber-600',
    4: 'from-slate-700 to-slate-800 text-slate-300 border-slate-600'
  };

  const rankText = (rank: number) => {
    if (rank === 1) return '1ST';
    if (rank === 2) return '2ND';
    if (rank === 3) return '3RD';
    return `${rank}TH`;
  };

  // Helper to render telemetry cockpit gauge
  const renderCockpitCluster = (car: CarState, label?: string, accentColor = '#06b6d4') => {
    const speedKmh = Math.round(car.speed * 0.32);
    const rpm = car.telemetry?.rpm || Math.min(8500, Math.max(1000, speedKmh * 38 + 1200));
    const gear = car.telemetry?.gear || (speedKmh > 165 ? '5' : speedKmh > 115 ? '4' : speedKmh > 65 ? '3' : speedKmh > 25 ? '2' : speedKmh > 2 ? '1' : 'N');
    const rpmPercent = Math.min(100, Math.max(0, ((rpm - 1000) / (8500 - 1000)) * 100));
    const isRedline = rpm > 7200;
    
    // Average tire temp
    const avgTireTemp = Math.round(car.telemetry?.tireTemp ?? 82);

    let tireColorClass = 'text-emerald-400';
    let tireLabel = 'OPTIMAL';
    if (avgTireTemp < 65) {
      tireColorClass = 'text-sky-400';
      tireLabel = 'DINGIN';
    } else if (avgTireTemp > 105) {
      tireColorClass = 'text-rose-400 animate-pulse';
      tireLabel = 'OVERHEAT';
    }

    return (
      <div className="flex items-end gap-2.5">
        {/* Nitro Bottle Meter */}
        <div className="flex flex-col items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/70 p-2 rounded-2xl shadow-xl">
          <div className="text-[8px] tracking-wider text-cyan-300 font-black flex items-center gap-1 mb-1">
            <Zap className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400" />
            NOS
          </div>
          <div className="w-6 h-24 bg-slate-950 rounded-lg p-1 relative overflow-hidden border border-slate-800">
            <div
              className={`w-full absolute bottom-1 left-1 right-1 rounded-md transition-all duration-100 ${
                car.isNitroActive
                  ? 'bg-gradient-to-t from-cyan-400 to-white animate-pulse shadow-[0_0_12px_#38bdf8]'
                  : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
              }`}
              style={{
                height: `${Math.max(0, Math.min(100, car.nitroRemaining))}%`,
                width: 'calc(100% - 8px)'
              }}
            />
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-300 mt-1">
            {Math.round(car.nitroRemaining)}%
          </span>
        </div>

        {/* Digital Motorsport Tachometer & Speedometer */}
        <div className="flex flex-col items-center justify-between w-36 md:w-44 h-32 md:h-36 rounded-3xl bg-slate-950/95 backdrop-blur-md border-2 border-slate-700 shadow-2xl p-2.5 relative overflow-hidden">
          {/* Header label */}
          <div className="flex items-center justify-between w-full z-10 px-1">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
              {label || car.name}
            </span>
            <div className="flex items-center gap-1">
              <Thermometer className={`w-3 h-3 ${tireColorClass}`} />
              <span className={`text-[9px] font-mono font-black ${tireColorClass}`}>
                {avgTireTemp}°C ({tireLabel})
              </span>
            </div>
          </div>

          {/* RPM LED Shift Lights Bar */}
          <div className="w-full z-10 my-1">
            <div className="flex gap-1 justify-between mb-1">
              {[...Array(10)].map((_, i) => {
                const lit = (i + 1) * 10 <= rpmPercent;
                let color = 'bg-slate-800';
                if (lit) {
                  if (i < 5) color = 'bg-emerald-500 shadow-[0_0_6px_#10b981]';
                  else if (i < 8) color = 'bg-amber-400 shadow-[0_0_6px_#f59e0b]';
                  else color = 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse';
                }
                return <div key={i} className={`flex-1 h-1.5 rounded-sm ${color}`} />;
              })}
            </div>
          </div>

          {/* Gear & Speed center */}
          <div className="flex items-baseline justify-center gap-2 z-10">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400">GEAR</span>
              <span className={`text-2xl md:text-3xl font-black font-mono leading-none ${isRedline ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {gear}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-black font-mono text-white tracking-tight leading-none">
                {speedKmh}
              </span>
              <span className="text-[9px] font-bold text-cyan-400 tracking-wider">KM/H</span>
            </div>
          </div>

          {/* Bottom Telemetry strip: RPM number & Drift */}
          <div className="flex items-center justify-between w-full z-10 px-1">
            <span className="text-[9px] font-mono text-slate-400">
              {Math.round(rpm)} <span className="text-[8px]">RPM</span>
            </span>
            {car.isDrifting ? (
              <span className="text-[9px] font-black text-amber-400 animate-pulse uppercase tracking-wider">
                DRIFT!
              </span>
            ) : car.telemetry?.turboBoost && car.telemetry.turboBoost > 0.3 ? (
              <span className="text-[8px] font-mono text-cyan-400 font-bold">
                BOOST +{Math.round(car.telemetry.turboBoost * 18)}psi
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-6">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Position & Lap or Split-Screen Badge */}
        <div className="flex items-center gap-2.5">
          {/* Position Badge */}
          <div
            id="hud-position-badge"
            className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-2xl bg-gradient-to-br shadow-xl border-2 flex flex-col items-center justify-center font-black ${
              rankColors[playerCar.rank] || rankColors[4]
            }`}
          >
            <span className="text-[9px] tracking-wider uppercase font-bold opacity-80 leading-tight">
              Posisi
            </span>
            <span className="text-xl md:text-3xl font-extrabold tracking-tight leading-none">
              {rankText(playerCar.rank)}
            </span>
          </div>

          {/* Lap Counter */}
          <div
            id="hud-lap-badge"
            className="px-3.5 py-1.5 md:px-4 md:py-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-white"
          >
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
              Lap
            </span>
            <span className="text-lg md:text-2xl font-black text-amber-400">
              {playerCar.currentLap > theme.laps ? theme.laps : playerCar.currentLap}{' '}
              <span className="text-xs text-slate-400">/ {theme.laps}</span>
            </span>
          </div>

          {/* Online Mabar Room Code Indicator */}
          {roomCode && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-black pointer-events-auto">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              KAMAR: {roomCode}
            </div>
          )}
        </div>

        {/* Center: Timing Display */}
        <div
          id="hud-timer"
          className="flex flex-col items-center px-4 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-lg text-white"
        >
          <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
            Waktu Lap
          </div>
          <div className="text-lg md:text-2xl font-mono font-black text-cyan-400 tracking-wider">
            {formatTime(playerCar.currentLapTime)}
          </div>
          {bestLap && (
            <div className="text-[10px] font-mono text-emerald-400">
              Terbaik: {formatTime(bestLap)}
            </div>
          )}
        </div>

        {/* Right: Quick Controls & Minimap */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              id="hud-btn-reset"
              onClick={onResetCar}
              title="Reset Mobil (R)"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md backdrop-blur-sm transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="hud-btn-sound"
              onClick={onToggleSound}
              title="Toggle Audio"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow-md backdrop-blur-sm transition-transform active:scale-95"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
            <button
              id="hud-btn-quit"
              onClick={onQuitToMenu}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-800/80 hover:bg-rose-900/60 text-slate-200 border border-slate-700 shadow-md backdrop-blur-sm transition-colors"
            >
              Keluar
            </button>
          </div>

          <Minimap theme={theme} cars={allCars} playerCar={playerCar} />
        </div>
      </div>

      {/* Center Alert Warnings */}
      <div className="flex flex-col items-center justify-center pointer-events-none">
        {/* Countdown overlay */}
        {countdown > 0 && (
          <div className="animate-bounce text-6xl md:text-8xl font-black text-amber-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            {countdown}
          </div>
        )}
        {countdown === 0 && playerCar.totalRaceTime < 1.4 && (
          <div className="animate-pulse text-5xl md:text-7xl font-black text-emerald-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            GASPOL! GO!
          </div>
        )}

        {/* Wrong Way Warning */}
        {playerCar.wrongWay && (
          <div className="px-5 py-2.5 rounded-2xl bg-rose-600/90 border-2 border-white text-white font-black text-base md:text-lg animate-pulse shadow-2xl flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
            SALAH ARAH! PUTAR BALIK!
          </div>
        )}

        {/* Oil Slick Spin Warning */}
        {playerCar.spinTimer > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-600/90 border border-white text-white font-bold text-xs md:text-sm animate-bounce shadow-xl">
            LICIN! KENA MINYAK!
          </div>
        )}

        {/* Offroad indicator */}
        {playerCar.offroad && playerCar.speed > 60 && (
          <div className="px-3 py-1 rounded-lg bg-orange-900/80 text-orange-200 text-xs font-semibold backdrop-blur-sm border border-orange-600/40">
            Keluar Jalur (Grip Berkurang)
          </div>
        )}
      </div>

      {/* Bottom Gauges */}
      <div className="flex items-end justify-between w-full">
        {/* In Split-Screen mode, show Player 1 on left, Player 2 on right */}
        {isSplitScreen && player2Car ? (
          <>
            {renderCockpitCluster(playerCar, 'P1: KAMU (WASD)', '#0284c7')}
            <div className="hidden md:flex flex-col items-center px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-700 text-xs font-bold text-white">
              <span className="text-[10px] text-cyan-400 font-mono">HEAD-TO-HEAD</span>
              <span>{playerCar.rank < player2Car.rank ? 'P1 Memimpin!' : player2Car.rank < playerCar.rank ? 'P2 Memimpin!' : 'Posisi Sama!'}</span>
            </div>
            {renderCockpitCluster(player2Car, 'P2: TEMAN (PANAH)', '#ea580c')}
          </>
        ) : (
          /* Single Player or Online Mabar */
          <>
            <div className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-cyan-400 font-mono text-sm font-bold">
              {formatTime(playerCar.currentLapTime)}
            </div>
            <div className="ml-auto">
              {renderCockpitCluster(playerCar, 'TELEMETRI MOBIL')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
