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
      const response = await api.post('/chat', { message: text, userProfile: user });
      const aiReply = response.data?.reply || generateFallbackAIReply(text, user);
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
      // Robust client-side AI response generator fallback
      const fallbackReply = generateFallbackAIReply(text, user);
      setMessages(prev => [...prev, {
        id: `ai_fallback_${Date.now()}`,
        sender: 'ai',
        text: fallbackReply,
        timestamp: new Date(),
      }]);
      if (!isOpenRef.current || isMinimizedRef.current) {
        setUnreadCount(prev => prev + 1);
      }
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

export const generateFallbackAIReply = (query: string, user: UserType | null): string => {
  const name = user?.name || 'there';
  const goal = user?.goal || 'Maintain Weight';
  const diet = user?.foodPreference || 'Veg';
  const weight = user?.weight || 70;
  const height = user?.height || 170;
  const q = query.toLowerCase();

  const bmiVal = calculateBMI(height, weight);
  const bmiCat = bmiVal ? getBMICategory(bmiVal) : 'N/A';

  if (q.includes('bmi') || q.includes('weight')) {
    return `Hello **${name}**! 📊 Your current BMI is **${bmiVal || '24.2'}** (${bmiCat}).\n\n- Height: **${height} cm**\n- Weight: **${weight} kg**\n- Goal: **${goal}**\n\nTo achieve your goal of **${goal}**, ensure you align your daily intake with your activity level! 🎯`;
  }

  if (q.includes('diet') || q.includes('meal') || q.includes('eat') || q.includes('food')) {
    return `## 🥗 Recommended ${diet} Diet Strategy for ${name}\n\n**Goal: ${goal}**\n\n- 🌅 **Breakfast**: ${diet === 'Vegan' ? 'Oatmeal with almonds & chia seeds' : diet === 'Veg' ? 'Besan chilla with curd & fruit' : 'Egg white omelette with whole wheat toast'}\n- ☀️ **Lunch**: Brown rice or rotis + Dal + Sabzi + Fresh salad\n- 🌆 **Snack**: Handful of almonds/walnuts + Green tea\n- 🌙 **Dinner**: ${diet === 'Vegan' ? 'Tofu stir fry with veggies' : diet === 'Veg' ? 'Paneer bhurji with roti' : 'Grilled chicken / fish with sautéed vegetables'}\n\nStay consistent and keep tracking your progress! 💪`;
  }

  if (q.includes('water') || q.includes('hydrat')) {
    const water = user?.dailyWaterGoal || 3000;
    return `💧 **Hydration Target for ${name}**:\n\nYour target is **${water} ml/day** (~${Math.round(water / 250)} glasses).\n\n- Drink 2 glasses upon waking up.\n- Drink 1 glass 30 mins before meals.\n- Increase intake during workouts! 🚴‍♀️`;
  }

  if (q.includes('protein') || q.includes('macro')) {
    const targetProtein = Math.round(weight * 1.6);
    return `🥩 **Protein & Macro Breakdown for ${name}**:\n\n- **Protein Goal**: ~**${targetProtein}g** daily\n- **Best ${diet} sources**: ${diet === 'Vegan' ? 'Tofu, lentils, chickpeas, quinoa, chia seeds' : diet === 'Veg' ? 'Paneer, Greek yogurt, lentils, tofu, milk' : 'Chicken breast, eggs, fish, paneer, lentils'}\n\nDistribute protein evenly across 3-4 meals for maximum muscle recovery and satiety! 🍗🌱`;
  }

  return `Hello **${name}**! 👋 I'm your Nutri Sense AI Assistant.\n\nI can help you with:\n- 📊 **BMI & Calorie targets**\n- 🥗 **${diet} meal plans for ${goal}**\n- 🥩 **Protein & Macro recommendations**\n- 💧 **Hydration tracking**\n\nFeel free to ask me any specific question about your health and diet goals! 😊`;
};
