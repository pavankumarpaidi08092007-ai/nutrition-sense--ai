import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ChatFAB } from './chatbot/ChatFAB';
import { ChatHeader } from './chatbot/ChatHeader';
import { ChatMessageList } from './chatbot/ChatMessageList';
import { ChatInput } from './chatbot/ChatInput';
import { QuickSuggestions } from './chatbot/QuickSuggestions';
import { useChatSession } from './chatbot/useChatSession';
import { supportsVoiceInput } from './chatbot/utils';

export const AIChatAssistant: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    input,
    setInput,
    isTyping,
    copiedId,
    unreadCount,
    setUnreadCount,
    isListening,
    sessionLoaded,
    setOpenState,
    initWelcome,
    handleCopy,
    handleClearChat,
    handleSend,
    startVoiceInput,
    stopVoiceInput,
  } = useChatSession(user);

  useEffect(() => {
    setOpenState(isOpen, isMinimized);
  }, [isOpen, isMinimized, setOpenState]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
    if (sessionLoaded && messages.length === 0) {
      initWelcome();
    }
    setTimeout(() => inputRef.current?.focus(), 400);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  // Initialize welcome when session loads with empty history
  useEffect(() => {
    if (sessionLoaded && messages.length === 0) {
      initWelcome();
    }
  }, [sessionLoaded, messages.length, initWelcome]);

  const showQuickSuggestions = messages.length <= 1;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <ChatFAB unreadCount={unreadCount} onOpen={handleOpen} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 56 : 'auto',
            }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed z-[9999] chatbot-window
              inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-6 sm:right-6
              w-auto sm:w-[400px] max-w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-2rem)]
              rounded-2xl overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/50"
            id="chatbot-window"
          >
            <ChatHeader
              isMinimized={isMinimized}
              onMinimize={() => setIsMinimized(prev => !prev)}
              onClose={handleClose}
              onMaximize={() => setIsMinimized(false)}
            />

            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex flex-col bg-white dark:bg-slate-900 max-h-[calc(100vh-8rem)] sm:max-h-none"
                >
                  <ChatMessageList
                    messages={messages}
                    isTyping={isTyping}
                    copiedId={copiedId}
                    onCopy={handleCopy}
                  />

                  <QuickSuggestions
                    visible={showQuickSuggestions}
                    disabled={isTyping}
                    onSelect={handleSend}
                  />

                  <ChatInput
                    input={input}
                    isTyping={isTyping}
                    isListening={isListening}
                    supportsVoice={supportsVoiceInput()}
                    inputRef={inputRef}
                    onInputChange={setInput}
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    onClear={handleClearChat}
                    onVoiceStart={startVoiceInput}
                    onVoiceStop={stopVoiceInput}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatAssistant;
