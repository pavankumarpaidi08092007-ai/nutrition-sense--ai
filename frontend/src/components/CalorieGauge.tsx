import React from 'react';
import { Flame } from 'lucide-react';

interface CalorieGaugeProps {
  consumed: number;
  target: number;
}

export const CalorieGauge: React.FC<CalorieGaugeProps> = ({ consumed, target }) => {
  const percentage = Math.min((consumed / target) * 100, 100);
  
  // SVG circle calculations
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 relative">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* SVG Circular Progress Bar */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Inner ring */}
          <circle
            stroke="#e2e8f0"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="dark:stroke-slate-800"
          />
          {/* Active progress ring */}
          <circle
            stroke="url(#calorieColor)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
          
          {/* Defs to set gradient */}
          <defs>
            <linearGradient id="calorieColor" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center overlay details */}
        <div className="absolute flex flex-col items-center text-center">
          <Flame className="w-6 h-6 text-emerald-500 fill-emerald-500 animate-pulse" />
          <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            {consumed}
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            of {target} kcal
          </span>
        </div>
      </div>
      
      {/* Target Progress Info */}
      <span className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
        {Math.round((consumed / target) * 100)}% Target Reached
      </span>
    </div>
  );
};
