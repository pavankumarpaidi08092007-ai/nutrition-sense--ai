import { Schema, model } from 'mongoose';

const mealPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    targetCalories: { type: Number, required: true },
    targetProtein: { type: Number },
    targetCarbs: { type: Number },
    targetFat: { type: Number },
    meals: {
      breakfast: { type: Array, default: [] },
      midMorningSnack: { type: Array, default: [] },
      lunch: { type: Array, default: [] },
      eveningSnack: { type: Array, default: [] },
      dinner: { type: Array, default: [] }
    },
    isBookmarked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const MealPlan = model('MealPlan', mealPlanSchema);
