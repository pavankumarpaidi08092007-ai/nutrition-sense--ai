import { Schema, model } from 'mongoose';

const weightHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    weight: { type: Number, required: true }, // in kg
    bmi: { type: Number, required: true }
  },
  { timestamps: true }
);

// Compound index so each user has only one record per day
weightHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const WeightHistory = model('WeightHistory', weightHistorySchema);
