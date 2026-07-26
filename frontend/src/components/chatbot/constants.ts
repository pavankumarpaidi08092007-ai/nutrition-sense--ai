import type { LucideIcon } from 'lucide-react';
import {
  Scale, Zap, Heart, Apple, Dumbbell, Droplets, Leaf, HelpCircle,
  Activity, Shield
} from 'lucide-react';
import type { QuickSuggestion } from './types';

export const SESSION_STORAGE_KEY = 'nutrisense_chat_session';

export const QUICK_SUGGESTIONS: (QuickSuggestion & { icon: LucideIcon })[] = [
  { label: 'My BMI', icon: Scale, query: 'What is my BMI?' },
  { label: 'BMR', icon: Activity, query: 'Explain my BMR' },
  { label: 'Calories', icon: Zap, query: 'How many calories do I need?' },
  { label: 'Weight Loss', icon: Heart, query: 'Give me a weight loss plan' },
  { label: 'Muscle Gain', icon: Dumbbell, query: 'Give me a muscle building plan' },
  { label: 'Meal Plan', icon: Apple, query: 'Create a meal plan for me' },
  { label: 'Water Intake', icon: Droplets, query: 'How much water should I drink?' },
  { label: 'Indian Diet', icon: Leaf, query: 'Suggest an Indian diet plan' },
  { label: 'Diabetic Diet', icon: Shield, query: 'What is a diabetic diet?' },
  { label: 'Help', icon: HelpCircle, query: 'What can you help me with?' },
];

export const MEDICAL_DISCLAIMER =
  'For educational purposes only. Not medical advice. Consult a healthcare professional for clinical guidance.';
