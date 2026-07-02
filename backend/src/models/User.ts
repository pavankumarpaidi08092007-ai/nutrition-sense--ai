import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    // Health Profile Details
    age: { type: Number, default: 25 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    height: { type: Number, default: 170 }, // in cm
    weight: { type: Number, default: 65 },  // in kg
    activityLevel: { 
      type: String, 
      enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'],
      default: 'Sedentary' 
    },
    goal: { 
      type: String, 
      enum: ['Weight Loss', 'Mild Weight Loss', 'Maintain Weight', 'Mild Weight Gain', 'Weight Gain'],
      default: 'Maintain Weight' 
    },
    medicalConditions: { type: [String], default: ['None'] },
    allergies: { type: [String], default: ['None'] },
    foodPreference: { type: String, enum: ['Veg', 'Non-Veg', 'Eggitarian', 'Vegan'], default: 'Veg' },
    cuisinePreference: { type: String, default: 'Any' },
    dailyWaterGoal: { type: Number, default: 3000 }, // in ml
    sleepHours: { type: Number, default: 8 },
    favorites: { type: [String], default: [] },
    notificationSettings: {
      breakfast: { type: Boolean, default: true },
      lunch: { type: Boolean, default: true },
      dinner: { type: Boolean, default: true },
      water: { type: Boolean, default: true },
      exercise: { type: Boolean, default: true },
      sleep: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const User = model('User', userSchema);
