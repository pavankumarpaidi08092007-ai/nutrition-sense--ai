import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsDone(true), 300); // Small buffer for visual finish
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5; // Fast progress increment
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDone) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 600); // Match exit transition duration
      return () => clearTimeout(timeout);
    }
  }, [isDone, onComplete]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-800 via-teal-900 to-sky-950 text-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Decorative background glow circles */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

          <div className="z-10 flex flex-col items-center text-center px-6">
            {/* Animated Logo Container */}
            <motion.div
              className="flex items-center justify-center w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl mb-6 cursor-pointer"
              initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], rotate: 0, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              whileHover={{ rotate: 10, scale: 1.05 }}
            >
              <Activity className="w-12 h-12 text-emerald-400" />
            </motion.div>

            {/* Application Title */}
            <motion.h1
              className="text-4xl sm:text-5xl font-extrabold tracking-wider font-sans mb-2 drop-shadow-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <span className="text-white">NUTRI</span>
              <span className="text-emerald-400"> SENSE</span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              className="text-emerald-200/80 text-sm sm:text-base font-light max-w-sm mb-12 tracking-wide font-sans"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              AI-Powered Personalized Nutrition & Health System
            </motion.p>

            {/* Progress Bar Container */}
            <div className="w-64 sm:w-80 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm relative">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 rounded-full"
                style={{ width: `${Math.min(progress, 100)}%` }}
                layoutId="progressBar"
              />
            </div>
            
            {/* Progress Percentage */}
            <motion.span 
              className="text-xs text-emerald-300/60 mt-2 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {Math.min(progress, 100)}% Loaded
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
