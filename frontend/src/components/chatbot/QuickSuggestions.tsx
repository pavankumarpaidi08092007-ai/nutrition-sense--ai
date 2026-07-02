import React from 'react';
import { QUICK_SUGGESTIONS } from './constants';

interface QuickSuggestionsProps {
  visible: boolean;
  disabled: boolean;
  onSelect: (query: string) => void;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({
  visible,
  disabled,
  onSelect,
}) => {
  if (!visible) return null;

  return (
    <div className="px-3 pb-2 flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto chatbot-feed">
      {QUICK_SUGGESTIONS.map((s) => (
        <button
          key={s.label}
          onClick={() => onSelect(s.query)}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium rounded-full border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <s.icon className="w-3 h-3" />
          {s.label}
        </button>
      ))}
    </div>
  );
};
