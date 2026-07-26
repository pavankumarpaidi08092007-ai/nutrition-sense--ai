import React from 'react';
import { Bot, Minus, Maximize2, X, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onMaximize: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isMinimized,
  onMinimize,
  onClose,
  onMaximize,
}) => (
  <div
    className="chatbot-header flex items-center justify-between px-4 py-3 cursor-pointer select-none"
    onClick={() => isMinimized && onMaximize()}
  >
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white flex items-center gap-1">
          Nutri Sense AI
          <Sparkles className="w-3 h-3 text-yellow-300" />
        </h4>
        <span className="text-[10px] text-emerald-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block chatbot-online-dot" />
          Online · Personalized for you
        </span>
      </div>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onMinimize(); }}
        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        aria-label={isMinimized ? 'Maximize' : 'Minimize'}
      >
        {isMinimized ? <Maximize2 className="w-3.5 h-3.5 text-white" /> : <Minus className="w-3.5 h-3.5 text-white" />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/80 flex items-center justify-center transition-colors"
        aria-label="Close chat"
      >
        <X className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  </div>
);
