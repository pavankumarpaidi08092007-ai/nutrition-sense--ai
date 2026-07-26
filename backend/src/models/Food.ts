import { Schema, model } from 'mongoose';

const foodSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    category: { 
      type: String, 
      required: true, 
      index: true,
      enum: [
        'Dairy', 'Pulses & Legumes', 'Vegetables', 'Fruits', 
        'Poultry & Meat', 'Fish & Seafood', 'Grains & Cereals', 
        'Nuts & Seeds', 'Snacks', 'Beverages', 'Eggs'
      ]
    },
    calories: { type: Number, required: true }, // per serving
    protein: { type: Number, required: true },  // in g
    carbs: { type: Number, required: true },    // in g
    fat: { type: Number, required: true },      // in g
    fiber: { type: Number, default: 0 },        // in g
    sugar: { type: Number, default: 0 },        // in g
    sodium: { type: Number, default: 0 },       // in mg
    calcium: { type: Number, default: 0 },      // in mg
    iron: { type: Number, default: 0 },         // in mg
    vitamins: { type: [String], default: [] },
    minerals: { type: [String], default: [] },
    servingSize: { type: String, required: true }, // e.g. "1 cup", "100g", "1 piece"
    healthBenefits: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Food = model('Food', foodSchema);
