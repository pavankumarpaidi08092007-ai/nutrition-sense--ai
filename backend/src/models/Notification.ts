import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['meal', 'water', 'exercise', 'sleep', 'general'], 
      default: 'general' 
    },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Notification = model('Notification', notificationSchema);
