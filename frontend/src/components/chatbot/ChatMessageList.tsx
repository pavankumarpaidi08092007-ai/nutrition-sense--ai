import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { ChatMessage } from './types';
import { ChatMessageBubble } from './ChatMessageBubble';
import { TypingIndicator } from './TypingIndicator';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isTyping,
  copiedId,
  onCopy,
}) => {
  const feedRef = useRef<HTMLDivElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = useCallback(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleScroll = () => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={feedRef}
        onScroll={handleScroll}
        className="chatbot-feed h-[min(380px,50vh)] sm:h-[380px] overflow-y-auto p-4 space-y-3"
      >
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            copiedId={copiedId}
            onCopy={onCopy}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={feedEndRef} />
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-10"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
