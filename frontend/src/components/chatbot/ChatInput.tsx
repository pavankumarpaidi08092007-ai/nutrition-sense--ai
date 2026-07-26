import React from 'react';
import { Send, Trash2, Mic, MicOff } from 'lucide-react';
import { MEDICAL_DISCLAIMER } from './constants';

interface ChatInputProps {
  input: string;
  isTyping: boolean;
  isListening: boolean;
  supportsVoice: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClear: () => void;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isTyping,
  isListening,
  supportsVoice,
  inputRef,
  onInputChange,
  onSubmit,
  onClear,
  onVoiceStart,
  onVoiceStop,
}) => (
  <>
    <form
      onSubmit={onSubmit}
      className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={onClear}
        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
        title="Clear chat"
        aria-label="Clear chat"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Ask about nutrition, diet, BMI..."
        className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
        disabled={isTyping}
      />

      {supportsVoice && (
        <button
          type="button"
          onClick={isListening ? onVoiceStop : onVoiceStart}
          className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
            isListening
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20 chatbot-mic-pulse'
              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
          }`}
          title={isListening ? 'Stop listening' : 'Voice input'}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      )}

      <button
        type="submit"
        disabled={!input.trim() || isTyping}
        className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all flex-shrink-0"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>

    <div className="px-4 pb-2.5 pt-0 bg-white dark:bg-slate-900">
      <p className="text-[8px] text-center text-slate-400 leading-tight">
        {MEDICAL_DISCLAIMER}
      </p>
    </div>
  </>
);
