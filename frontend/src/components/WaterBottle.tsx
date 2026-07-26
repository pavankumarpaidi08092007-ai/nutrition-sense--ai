import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';

interface WaterBottleProps {
  loggedMl: number;
  goalMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater: () => void;
}

export const WaterBottle: React.FC<WaterBottleProps> = ({ 
  loggedMl, 
  goalMl, 
  onAddWater, 
  onResetWater 
}) => {
  const percentage = Math.min((loggedMl / goalMl) * 100, 100);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
      
      {/* 1. Animated Water Bottle Container */}
      <div className="relative flex flex-col items-center">
        {/* Bottle cap */}
        <div className="w-10 h-3 bg-slate-300 dark:bg-slate-700 rounded-t-md shadow-inner"></div>
        {/* Bottle neck */}
        <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 border-x border-slate-300 dark:border-slate-700"></div>
        
        {/* Main Bottle Body */}
        <div className="relative w-28 h-60 bg-slate-100 dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-700 rounded-[20px] overflow-hidden flex flex-col justify-end shadow-lg">
          
          {/* Fluid Wave Element */}
          <div 
            className="w-full relative transition-all duration-1000 ease-out"
            style={{ height: `${percentage}%` }}
          >
            {/* Waving fluid effect (utilizes index.css wave animations) */}
            {percentage > 0 && (
              <>
                <div className="water-wave-back -top-4"></div>
                <div className="water-wave -top-4"></div>
              </>
            )}
          </div>

          {/* Overlay Text Inside Bottle */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <span className="text-xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm">
              {loggedMl}
            </span>
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              ml
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 drop-shadow-sm">
              {Math.round(percentage)}%
            </span>
          </div>

        </div>

        {/* Bottle Bottom Holder */}
        <div className="w-32 h-2.5 bg-slate-350 dark:bg-slate-800 rounded-b-lg"></div>
      </div>

      {/* 2. Interactive Controls & Status Panel */}
      <div className="flex flex-col items-center sm:items-start gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-800 dark:text-white">Hydration Tracker</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
            Goal: **{(goalMl / 1000).toFixed(1)} Liters** ({goalMl} ml) per day. Keep hydrated!
          </p>
        </div>

        {/* Preset Increment Buttons */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-2.5">
          <button
            onClick={() => onAddWater(250)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 hover:brightness-95 transition-all border border-sky-100 dark:border-sky-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            250 ml
          </button>
          
          <button
            onClick={() => onAddWater(500)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-500 text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            500 ml
          </button>

          <button
            onClick={() => onAddWater(1000)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-white shadow-md hover:shadow-lg hover:brightness-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            1 Liter
          </button>
        </div>

        {/* Reset / General Operations */}
        <div className="flex gap-2">
          <button
            onClick={onResetWater}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/20 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Today
          </button>
        </div>
      </div>

    </div>
  );
};
