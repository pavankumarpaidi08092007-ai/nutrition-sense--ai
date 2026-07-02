import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const ErrorPage: React.FC = () => {
  return (
    <div className="flex-1 bg-gradient-nutri flex flex-col justify-center items-center p-6 text-center transition-colors duration-300">
      <div className="glass-panel-heavy p-8 sm:p-12 rounded-[3rem] border border-white/20 shadow-2xl max-w-md w-full space-y-6">
        
        {/* Animated Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto animate-bounce">
          <ShieldAlert className="w-9 h-9" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-800 dark:text-white">404 Error</h1>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Diagnostic Resource Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            The page you are looking for does not exist, has been archived, or you have insufficient access permissions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-650 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <Link
            to="/"
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 shadow-md transition-all glow-btn-green"
          >
            <Home className="w-4 h-4" /> Return Home
          </Link>
        </div>

      </div>
    </div>
  );
};
