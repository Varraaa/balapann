/**
 * Virtual Touch Controls for Mobile/Tablet devices
 * Smooth pointer event bindings with multi-touch support.
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Disc, ChevronUp, ChevronDown } from 'lucide-react';

interface TouchControlsProps {
  onSteerChange: (steer: number) => void;
  onThrottleChange: (throttle: number) => void;
  onBrakeChange: (brake: number) => void;
  onDriftChange: (drift: boolean) => void;
  onNitroTrigger: (active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onSteerChange,
  onThrottleChange,
  onBrakeChange,
  onDriftChange,
  onNitroTrigger
}) => {
  return (
    <div
      id="virtual-touch-controls"
      className="absolute inset-0 pointer-events-none select-none flex justify-between items-end p-4 md:p-8 z-20"
    >
      {/* Left Group: Steering D-Pad */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          id="btn-touch-left"
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerChange(-1);
          }}
          onPointerUp={() => onSteerChange(0)}
          onPointerCancel={() => onSteerChange(0)}
          onPointerLeave={() => onSteerChange(0)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-600/70 border-2 border-slate-600/80 shadow-2xl backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform touch-none"
        >
          <ArrowLeft className="w-8 h-8" />
        </button>

        <button
          id="btn-touch-right"
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            onSteerChange(1);
          }}
          onPointerUp={() => onSteerChange(0)}
          onPointerCancel={() => onSteerChange(0)}
          onPointerLeave={() => onSteerChange(0)}
          className="w-16 h-16 rounded-2xl bg-slate-900/80 active:bg-cyan-600/70 border-2 border-slate-600/80 shadow-2xl backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-transform touch-none"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>

      {/* Right Group: Gas, Brake, Drift, Nitro */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {/* Nitro & Drift auxiliary buttons */}
        <div className="flex flex-col gap-3">
          <button
            id="btn-touch-nitro"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onNitroTrigger(true);
            }}
            onPointerUp={() => onNitroTrigger(false)}
            onPointerCancel={() => onNitroTrigger(false)}
            onPointerLeave={() => onNitroTrigger(false)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-sky-400 active:from-cyan-400 active:to-white border-2 border-cyan-300 shadow-xl flex flex-col items-center justify-center text-slate-950 active:scale-95 transition-transform touch-none"
          >
            <Zap className="w-6 h-6 fill-slate-950" />
            <span className="text-[9px] font-black tracking-wider leading-none mt-0.5">NITRO</span>
          </button>

          <button
            id="btn-touch-drift"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onDriftChange(true);
            }}
            onPointerUp={() => onDriftChange(false)}
            onPointerCancel={() => onDriftChange(false)}
            onPointerLeave={() => onDriftChange(false)}
            className="w-14 h-14 rounded-2xl bg-amber-600/80 active:bg-amber-500 border-2 border-amber-400/80 shadow-xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform touch-none"
          >
            <Disc className="w-5 h-5" />
            <span className="text-[9px] font-black tracking-wider leading-none mt-0.5">DRIFT</span>
          </button>
        </div>

        {/* Primary Gas & Brake Pedals */}
        <div className="flex flex-col gap-3">
          <button
            id="btn-touch-gas"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onThrottleChange(1);
            }}
            onPointerUp={() => onThrottleChange(0)}
            onPointerCancel={() => onThrottleChange(0)}
            onPointerLeave={() => onThrottleChange(0)}
            className="w-20 h-20 rounded-2xl bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-400 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform touch-none"
          >
            <ChevronUp className="w-8 h-8 stroke-[3]" />
            <span className="text-xs font-black tracking-wider leading-none">GAS</span>
          </button>

          <button
            id="btn-touch-brake"
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onBrakeChange(1);
            }}
            onPointerUp={() => onBrakeChange(0)}
            onPointerCancel={() => onBrakeChange(0)}
            onPointerLeave={() => onBrakeChange(0)}
            className="w-20 h-14 rounded-2xl bg-rose-700/90 active:bg-rose-600 border-2 border-rose-400 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform touch-none"
          >
            <ChevronDown className="w-6 h-6 stroke-[3]" />
            <span className="text-[10px] font-black tracking-wider leading-none">REM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
