import React from 'react';

interface BMIGaugeProps {
  bmi: number;
}

export const BMIGauge: React.FC<BMIGaugeProps> = ({ bmi }) => {
  // Map BMI (15 to 40) to needle rotation angle (-90 to +90 degrees)
  const minBmi = 15;
  const maxBmi = 40;
  const clampedBmi = Math.max(minBmi, Math.min(maxBmi, bmi));
  
  const percentage = (clampedBmi - minBmi) / (maxBmi - minBmi);
  const angle = percentage * 180 - 90; // -90deg is far left, +90deg is far right

  // Find color
  let categoryColor = 'text-emerald-500';
  let categoryBg = 'bg-emerald-500/10';
  let categoryName = 'Normal';

  if (bmi < 18.5) {
    categoryColor = 'text-sky-500';
    categoryBg = 'bg-sky-500/10';
    categoryName = 'Underweight';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    categoryColor = 'text-emerald-500';
    categoryBg = 'bg-emerald-500/10';
    categoryName = 'Normal';
  } else if (bmi >= 25 && bmi < 29.9) {
    categoryColor = 'text-amber-500';
    categoryBg = 'bg-amber-500/10';
    categoryName = 'Overweight';
  } else {
    categoryColor = 'text-rose-500';
    categoryBg = 'bg-rose-500/10';
    categoryName = 'Obese';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-64 h-36 overflow-hidden">
        {/* Semi-circular Gauge Background Arcs */}
        <svg className="w-full h-full" viewBox="0 0 200 100">
          <defs>
            <linearGradient id="bmiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" /> {/* Underweight: Sky Blue */}
              <stop offset="35%" stopColor="#10b981" /> {/* Normal: Emerald Green */}
              <stop offset="65%" stopColor="#f59e0b" /> {/* Overweight: Amber Yellow */}
              <stop offset="100%" stopColor="#f43f5e" /> {/* Obese: Rose Red */}
            </linearGradient>
          </defs>

          {/* Core Arc */}
          <path
            d="M 20,90 A 80,80 0 0,1 180,90"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="16"
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />
          
          {/* Color Gradient Overlay Arc */}
          <path
            d="M 20,90 A 80,80 0 0,1 180,90"
            fill="none"
            stroke="url(#bmiGradient)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Needle Center Point */}
          <circle cx="100" cy="90" r="8" fill="#1e293b" className="dark:fill-slate-250" />

          {/* Needle Indicator */}
          <g transform={`rotate(${angle}, 100, 90)`}>
            <path
              d="M 98,90 L 100,20 L 102,90 Z"
              fill="#1e293b"
              className="dark:fill-slate-300"
              style={{ transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </g>
        </svg>

        {/* BMI Text Indicator Overlay */}
        <div className="absolute bottom-0 inset-x-0 text-center">
          <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
            {bmi}
          </span>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${categoryColor} ${categoryBg}`}>
          {categoryName}
        </span>
        <p className="text-[11px] text-slate-400 text-center max-w-[200px]">
          Healthy range: 18.5 – 24.9
        </p>
      </div>
    </div>
  );
};
