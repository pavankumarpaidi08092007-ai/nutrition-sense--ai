import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export const TypingIndicator: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-2.5 max-w-[80%]"
  >
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center text-white">
      <Bot className="w-3.5 h-3.5" />
    </div>
    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
      <span className="chatbot-typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="chatbot-typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="chatbot-typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  </motion.div>
);
