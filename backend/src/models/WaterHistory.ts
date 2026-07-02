import { Schema, model } from 'mongoose';

const waterHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    amount: { type: Number, required: true } // in ml
  },
  { timestamps: true }
);

// Compound index so each user has only one record per day
waterHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

export const WaterHistory = model('WaterHistory', waterHistorySchema);
