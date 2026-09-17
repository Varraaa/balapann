/**
 * Car Selection Modal
 */

import React, { useState } from 'react';
import { CarStats } from '../types/game';
import { AVAILABLE_CARS } from '../game/tracks';
import { Check, X, Gauge, Zap, Compass, Wind } from 'lucide-react';

interface CarSelectModalProps {
  selectedCar: CarStats;
  onSelectCar: (car: CarStats) => void;
  onClose: () => void;
}

export const CarSelectModal: React.FC<CarSelectModalProps> = ({
  selectedCar,
  onSelectCar,
  onClose
}) => {
  const [activeCarId, setActiveCarId] = useState<string>(selectedCar.id);
  const currentCar = AVAILABLE_CARS.find((c) => c.id === activeCarId) || AVAILABLE_CARS[0];

  const handleConfirm = () => {
    onSelectCar(currentCar);
    onClose();
  };

  return (
    <div
      id="car-select-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 shadow-2xl text-white relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              PILIH MOBIL BALAP
            </h2>
            <p className="text-sm text-slate-400">
              Sesuaikan dengan gaya balapmu: Top Speed, Drift, atau Akselerasi Kilat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Car list + Selected Car detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-6 overflow-y-auto pr-1">
          {/* Car Grid / List (Left 5 cols) */}
          <div className="md:col-span-5 space-y-3">
            {AVAILABLE_CARS.map((car) => {
              const isSelected = car.id === activeCarId;
              return (
                <div
                  key={car.id}
                  onClick={() => setActiveCarId(car.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border-2 flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Car Color Dot Indicator */}
                    <div
                      className="w-9 h-9 rounded-xl border-2 border-white/20 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: car.bodyColor }}
                    >
                      <div
                        className="w-3 h-5 rounded-sm"
                        style={{ backgroundColor: car.accentColor }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{car.name}</div>
                      <div className="text-[11px] text-slate-400 capitalize">{car.modelStyle}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Car Showcase (Right 7 cols) */}
          <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            {/* Top View Visualizer */}
            <div className="flex flex-col items-center justify-center py-6 bg-radial from-slate-800/40 to-transparent rounded-xl border border-slate-800/50 mb-4 relative">
              {/* Top-down Car Canvas Graphic */}
              <div
                className="w-36 h-20 rounded-xl relative shadow-2xl transition-all duration-300 flex items-center justify-center"
                style={{
                  backgroundColor: currentCar.bodyColor,
                  boxShadow: `0 10px 30px ${currentCar.bodyColor}40`
                }}
              >
                {/* Windshield */}
                <div
                  className="w-14 h-12 rounded-lg"
                  style={{ backgroundColor: currentCar.glassColor }}
                />
                {/* Racing Stripe */}
                <div
                  className="absolute inset-x-0 h-3"
                  style={{ backgroundColor: currentCar.accentColor }}
                />
                {/* Headlights */}
                <div className="absolute right-0 top-2 w-2 h-3 bg-yellow-300 rounded-l-sm" />
                <div className="absolute right-0 bottom-2 w-2 h-3 bg-yellow-300 rounded-l-sm" />
                {/* Rear Spoiler */}
                <div className="absolute left-0 inset-y-1 w-2 bg-slate-900 rounded-r-sm" />
              </div>

              <div className="mt-4 text-center">
                <h3 className="text-xl font-black text-white">{currentCar.name}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">{currentCar.tagline}</p>
              </div>
            </div>

            {/* Stat Bars */}
            <div className="space-y-3">
              {/* Max Speed */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Kecepatan Maksimal
                  </span>
                  <span className="font-mono text-cyan-400">
                    {Math.round(currentCar.maxSpeed * 0.32)} km/h
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.maxSpeed / 750) * 100}%` }}
                  />
                </div>
              </div>

              {/* Acceleration */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Akselerasi
                  </span>
                  <span className="font-mono text-amber-400">
                    {Math.round(currentCar.acceleration * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.acceleration / 1.4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" /> Kontrol & Belokan
                  </span>
                  <span className="font-mono text-emerald-400">
                    {Math.round(currentCar.handling * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${(currentCar.handling / 1.3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Drift slide factor */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Wind className="w-3.5 h-3.5 text-purple-400" /> Kemampuan Drift
                  </span>
                  <span className="font-mono text-purple-400">
                    {Math.round(currentCar.driftFactor * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                    style={{ width: `${((currentCar.driftFactor - 0.8) / 0.18) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            Batal
          </button>
          <button
            id="btn-confirm-car"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-900/60 transition-all active:scale-95"
          >
            PILIH MOBIL INI
          </button>
        </div>
      </div>
    </div>
  );
};
