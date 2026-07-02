import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface ChatFABProps {
  unreadCount: number;
  onOpen: () => void;
}

export const ChatFAB: React.FC<ChatFABProps> = ({ unreadCount, onOpen }) => (
  <motion.button
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    onClick={onOpen}
    className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999] w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center chatbot-fab-pulse cursor-pointer"
    aria-label="Open AI Nutrition Chat"
    id="chatbot-fab"
  >
    <MessageSquare className="w-6 h-6" />
    {unreadCount > 0 && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </motion.span>
    )}
  </motion.button>
);
