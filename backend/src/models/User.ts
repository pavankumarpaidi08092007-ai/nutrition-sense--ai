import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: false, unique: true, sparse: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, default: '' },
    password: { type: String, required: function(this: any) { return !this.authProvider || this.authProvider === 'local'; } },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    picture: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    
    // Health Profile Details
    age: { type: Number, default: 25 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    height: { type: Number, default: 170 }, // in cm
    weight: { type: Number, default: 65 },  // in kg
    activityLevel: { 
      type: String, 
      enum: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Athlete', 'Extra Active'],
      default: 'Sedentary' 
    },
    goal: { 
      type: String, 
      enum: ['Weight Loss', 'Weight Gain', 'Muscle Gain', 'Maintenance', 'Healthy Lifestyle', 'Mild Weight Loss', 'Maintain Weight', 'Mild Weight Gain'],
      default: 'Maintenance' 
    },
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
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
