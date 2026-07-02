import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';
import type { UserType } from '../../context/AuthContext';
import type { ChatMessage } from './types';
import { SESSION_STORAGE_KEY } from './constants';
import { calculateBMI, getBMICategory } from './utils';

interface StoredMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const serializeMessages = (messages: ChatMessage[]): StoredMessage[] =>
  messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));

const deserializeMessages = (stored: StoredMessage[]): ChatMessage[] =>
  stored.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));

export const buildWelcomeMessage = (user: UserType | null): ChatMessage => {
  const profile: UserType = user ?? {
    id: 'guest',
    name: 'friend',
    email: '',
    role: 'user',
    age: 30,
    gender: 'Other',
    height: 170,
    weight: 70,
    activityLevel: 'Moderately Active',
    goal: 'Maintain Weight',
    medicalConditions: [],
    allergies: [],
    foodPreference: 'Veg',
    cuisinePreference: '',
    dailyWaterGoal: 2500,
    sleepHours: 7,
  };
  const bmi = calculateBMI(profile.height, profile.weight);
  const bmiCategory = bmi ? getBMICategory(bmi) : 'N/A';
  const medicalNote = profile.medicalConditions?.filter(c => c !== 'None').length
    ? `\n- ⚕️ Conditions: **${profile.medicalConditions.filter(c => c !== 'None').join(', ')}**`
    : '';

  return {
    id: 'welcome',
    sender: 'ai',
    text: `Hello **${profile.name}**! 👋 I'm your **Nutri Sense AI Assistant**.\n\nHere's your health snapshot:\n- 🎯 Goal: **${profile.goal}**\n- 🍽️ Diet: **${profile.foodPreference}**\n- 📊 BMI: **${bmi || '—'}** (${bmiCategory})\n- 🏃 Activity: **${profile.activityLevel}**${medicalNote}\n\nAsk me about diet plans, calories, macros, meal ideas, vitamins, and more! Use the quick buttons below or type your question. 😊`,
    timestamp: new Date(),
  };
};

export const useChatSession = (user: UserType | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isOpenRef = useRef(false);
  const isMinimizedRef = useRef(false);

  const setOpenState = (open: boolean, minimized: boolean) => {
    isOpenRef.current = open;
    isMinimizedRef.current = minimized;
  };

  // Restore session from sessionStorage
  useEffect(() => {
    if (sessionLoaded) return;
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(deserializeMessages(parsed));
          setSessionLoaded(true);
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
    setSessionLoaded(true);
  }, [sessionLoaded]);

  // Persist session
  useEffect(() => {
    if (!sessionLoaded || messages.length === 0) return;
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(serializeMessages(messages)));
    } catch {
      // sessionStorage full or unavailable — ignore
    }
  }, [messages, sessionLoaded]);

  const initWelcome = useCallback(() => {
    if (!user) return;
    setMessages([buildWelcomeMessage(user)]);
  }, [user]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    initWelcome();
    setInput('');
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      setInput(prev => (prev ? `${prev} ${event.results[0][0].transcript}` : event.results[0][0].transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isTyping) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await api.post('/chat', { message: text });
      const aiReply = response.data?.reply || "I couldn't process that. Please try again.";
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);

      if (!isOpenRef.current || isMinimizedRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `ai_err_${Date.now()}`,
        sender: 'ai',
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🔄",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return {
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
  };
};
