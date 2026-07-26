import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Copy, Check } from 'lucide-react';
import type { ChatMessage } from './types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatTime } from './utils';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  copiedId,
  onCopy,
}) => {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2.5 max-w-[92%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white ${
        isUser
          ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
          : 'bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700'
      }`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      <div className="flex flex-col group min-w-0">
        <div className={`text-xs px-3.5 py-2.5 rounded-2xl leading-relaxed break-words ${
          isUser
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'
        }`}>
          {isUser ? message.text : <MarkdownRenderer text={message.text} />}
        </div>

        <div className={`flex items-center gap-1.5 mt-1 ${isUser ? 'justify-end' : ''}`}>
          <span className="text-[9px] text-slate-400">{formatTime(message.timestamp)}</span>
          {!isUser && message.id !== 'welcome' && (
            <button
              onClick={() => onCopy(message.text, message.id)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
              aria-label="Copy response"
            >
              {copiedId === message.id
                ? <Check className="w-3 h-3 text-emerald-500" />
                : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
