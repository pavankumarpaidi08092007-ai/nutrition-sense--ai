// AI Recommendation and Calculation Engine for Nutri Sense

export interface HealthProfile {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number; // in cm
  weight: number; // in kg
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extra Active';
  goal: 'Weight Loss' | 'Mild Weight Loss' | 'Maintain Weight' | 'Mild Weight Gain' | 'Weight Gain';
  medicalConditions: string[];
  allergies: string[];
  foodPreference: 'Veg' | 'Non-Veg' | 'Eggitarian' | 'Vegan';
  cuisinePreference?: string;
  dailyWaterGoal?: number;
  sleepHours?: number;
}

// 1. BMI Calculation
export const calculateBMI = (heightCm: number, weightKg: number) => {
  // Guard against zero/missing values
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: 22.0,
      category: 'Normal',
      riskLevel: 'Minimal Risk',
      suggestions: 'Please update your height and weight in Profile Settings to get your personalised BMI analysis.',
      healthyRange: { min: 55.0, max: 74.0 }
    };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  
  let category = 'Normal';
  let riskLevel = 'Low Risk';
  let suggestions = 'Maintain your current lifestyle with a balanced diet and regular physical activity.';

  if (bmi < 18.5) {
    category = 'Underweight';
    riskLevel = 'Moderate Risk (Nutritional Deficiency)';
    suggestions = 'Focus on nutrient-dense foods, healthy fats, and strength training to build lean muscle mass.';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    category = 'Normal';
    riskLevel = 'Minimal Risk';
    suggestions = 'Great job! Maintain your current balanced diet and include at least 150 minutes of moderate exercise per week.';
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Overweight';
    riskLevel = 'Moderate Risk (Cardiovascular & Metabolic)';
    suggestions = 'Incorporate moderate calorie restriction, increase dietary fiber, and combine cardio with strength training.';
  } else {
    category = 'Obese';
    riskLevel = 'High Risk (Type 2 Diabetes, Hypertension)';
    suggestions = 'It is recommended to seek professional guidance. Focus on a structured calorie deficit, low glycemic index foods, and consistent daily movement.';
  }

  const healthyWeightMin = 18.5 * (heightM * heightM);
  const healthyWeightMax = 24.9 * (heightM * heightM);

  return {
    bmi: parseFloat(bmi.toFixed(1)),
    category,
    riskLevel,
    suggestions,
    healthyRange: {
      min: parseFloat(healthyWeightMin.toFixed(1)),
      max: parseFloat(healthyWeightMax.toFixed(1))
    }
  };
};

// 2. BMR & TDEE Calculations
export const calculateCaloricNeeds = (profile: HealthProfile) => {
  const { age, gender, height, weight, activityLevel, goal } = profile;

  // Guard against missing/zero profile values (fresh users)
  if (!age || !height || !weight || age <= 0 || height <= 0 || weight <= 0) {
    return {
      bmr: 1500,
      tdee: 1800,
      targetCalories: 1800,
      maintenanceCalories: 1800,
      weightLossCalories: 1400,
      weightGainCalories: 2300
    };
  }
  
  // Harris-Benedict Equation
  let bmr = 0;
  if (gender === 'Male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Activity Multiplier
  const activityMultipliers = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extra Active': 1.9
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier;

  // Calorie adjustments based on goals
  let targetCalories = tdee;
  if (goal === 'Weight Loss') {
    targetCalories = tdee - 500;
  } else if (goal === 'Mild Weight Loss') {
    targetCalories = tdee - 250;
  } else if (goal === 'Mild Weight Gain') {
    targetCalories = tdee + 250;
  } else if (goal === 'Weight Gain') {
    targetCalories = tdee + 500;
  }

  // Establish baseline floors for health safety
  const minCalories = gender === 'Male' ? 1500 : 1200;
  if (targetCalories < minCalories) {
    targetCalories = minCalories;
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    maintenanceCalories: Math.round(tdee),
    weightLossCalories: Math.round(tdee - 500 > minCalories ? tdee - 500 : minCalories),
    weightGainCalories: Math.round(tdee + 500)
  };
};

// 3. Macronutrient Distribution
export const calculateMacros = (targetCalories: number, profile: HealthProfile) => {
  const { goal, medicalConditions = [] } = profile;
  
  // Defaults: 50% Carbs, 20% Protein, 30% Fat
  let carbPct = 0.50;
  let proteinPct = 0.20;
  let fatPct = 0.30;

  // Goal modifications
  if (goal === 'Weight Loss' || goal === 'Mild Weight Loss') {
    carbPct = 0.40;
    proteinPct = 0.30;
    fatPct = 0.30;
  } else if (goal === 'Weight Gain') {
    carbPct = 0.55;
    proteinPct = 0.20;
    fatPct = 0.25;
  }

  // Medical condition overrides
  if (medicalConditions.some((c: string) => (c || '').toLowerCase().includes('diabetes') || (c || '').toLowerCase().includes('pcos'))) {
    carbPct = 0.35; // Lower carbs
    proteinPct = 0.30;
    fatPct = 0.35; // Healthy fats
  }

  // Gram calculations (Carbs: 4kcal/g, Protein: 4kcal/g, Fat: 9kcal/g)
  const carbsG = Math.round((targetCalories * carbPct) / 4);
  const proteinG = Math.round((targetCalories * proteinPct) / 4);
  const fatG = Math.round((targetCalories * fatPct) / 9);
  const fiberG = Math.round((targetCalories / 1000) * 14); // 14g fiber per 1000 kcal

  return {
    carbs: carbsG,
    protein: proteinG,
    fat: fatG,
    fiber: fiberG,
    distribution: {
      carbs: Math.round(carbPct * 100),
      protein: Math.round(proteinPct * 100),
      fat: Math.round(fatPct * 100)
    }
  };
};

// 4. Smart Health Score out of 100
export const calculateHealthScore = (profile: HealthProfile, waterLoggedMl: number, sleepHoursLogged: number) => {
  let score = 50; // Starting baseline
  const medicalConditions = profile.medicalConditions || [];

  const bmiDetails = calculateBMI(profile.height, profile.weight);
  
  // BMI contribution (Max 25 pts)
  if (bmiDetails.category === 'Normal') score += 25;
  else if (bmiDetails.category === 'Underweight' || bmiDetails.category === 'Overweight') score += 15;
  else score += 5;

  // Water intake contribution (Max 25 pts)
  const waterTarget = profile.dailyWaterGoal || 3000;
  const waterPct = Math.min(waterLoggedMl / waterTarget, 1.2);
  score += Math.round(waterPct * 25);

  // Sleep hours contribution (Max 20 pts)
  const sleepTarget = profile.sleepHours || 8;
  const sleepPct = Math.min(sleepHoursLogged / sleepTarget, 1.2);
  score += Math.round(sleepPct * 20);

  // Physical activity contribution (Max 15 pts)
  const activityScores = {
    'Sedentary': 5,
    'Lightly Active': 8,
    'Moderately Active': 12,
    'Very Active': 15,
    'Extra Active': 15
  };
  score += activityScores[profile.activityLevel] || 5;

  // Medical conditions penalty/management adjustment (Max 15 pts)
  // If user has zero medical conditions or they have medical conditions but follow clean preferences
  if (medicalConditions.includes('None') || medicalConditions.length === 0) {
    score += 15;
  } else {
    // If they have conditions, keeping active helps stabilize score
    score += profile.activityLevel !== 'Sedentary' ? 10 : 5;
  }

  return Math.min(score, 100);
};

// 5. Weight Prediction over 8 Weeks
export const predictWeightHistory = (profile: HealthProfile) => {
  const calNeeds = calculateCaloricNeeds(profile);
  const weeklyDeficitOrSurplus = (calNeeds.targetCalories - calNeeds.tdee) * 7;
  // 7700 calories roughly equal 1kg of weight change
  const weightChangePerWeek = weeklyDeficitOrSurplus / 7700;

  const predictions = [];
  const startWeight = profile.weight;
  const today = new Date();

  for (let i = 0; i <= 8; i++) {
    const projectedWeight = startWeight + (weightChangePerWeek * i);
    const date = new Date(today);
    date.setDate(today.getDate() + (i * 7));
    
    predictions.push({
      week: `Week ${i}`,
      date: date.toISOString().split('T')[0],
      weight: parseFloat(projectedWeight.toFixed(2)),
      bmi: parseFloat((projectedWeight / Math.pow(profile.height / 100, 2)).toFixed(1))
    });
  }

  return predictions;
};

// 6. Food filtering engine for AI recommendations
export const filterFoodsForProfile = (foods: any[], profile: HealthProfile) => {
  const { foodPreference, allergies = [], medicalConditions = [] } = profile;

  return foods.filter(food => {
    const category = food.category.toLowerCase();
    const name = food.name.toLowerCase();
    const healthBenefits = food.healthBenefits.toLowerCase();

    // A. Food Preference Filter
    if (foodPreference === 'Veg') {
      // Exclude non-veg categories and eggs
      if (
        category.includes('poultry') || 
        category.includes('meat') || 
        category.includes('fish') || 
        category.includes('seafood') || 
        category.includes('eggs') || 
        name.includes('chicken') || 
        name.includes('fish') || 
        name.includes('egg') || 
        name.includes('mutton') || 
        name.includes('shrimp')
      ) {
        return false;
      }
    } else if (foodPreference === 'Vegan') {
      // Exclude meat, fish, eggs and dairy
      if (
        category.includes('poultry') || 
        category.includes('meat') || 
        category.includes('fish') || 
        category.includes('seafood') || 
        category.includes('dairy') || 
        category.includes('eggs') ||
        name.includes('chicken') || 
        name.includes('fish') || 
        name.includes('egg') || 
        name.includes('milk') || 
        name.includes('paneer') || 
        name.includes('curd') || 
        name.includes('cheese') || 
        name.includes('butter') || 
        name.includes('ghee')
      ) {
        return false;
      }
    } else if (foodPreference === 'Eggitarian') {
      // Exclude meat & fish, but keep eggs and dairy
      if (
        category.includes('poultry') || 
        category.includes('meat') || 
        category.includes('fish') || 
        category.includes('seafood') || 
        (name.includes('chicken') && !name.includes('egg')) || 
        name.includes('fish') || 
        name.includes('mutton') || 
        name.includes('shrimp')
      ) {
        return false;
      }
    }

    // B. Allergy Filters
    if (allergies.some((a: string) => (a || '').toLowerCase().includes('dairy') || (a || '').toLowerCase().includes('lactose'))) {
      if (category.includes('dairy') || name.includes('milk') || name.includes('cheese') || name.includes('paneer') || name.includes('butter')) {
        return false;
      }
    }
    if (allergies.some((a: string) => (a || '').toLowerCase().includes('peanut') || (a || '').toLowerCase().includes('nut'))) {
      if (category.includes('nuts') || category.includes('seeds') || name.includes('peanut') || name.includes('almond') || name.includes('cashew') || name.includes('walnut')) {
        return false;
      }
    }
    if (allergies.some((a: string) => (a || '').toLowerCase().includes('gluten') || (a || '').toLowerCase().includes('wheat'))) {
      if (name.includes('wheat') || name.includes('roti') || name.includes('bread') || name.includes('maida') || name.includes('semolina') || name.includes('suji') || name.includes('pasta')) {
        return false;
      }
    }
    if (allergies.some((a: string) => (a || '').toLowerCase().includes('egg'))) {
      if (category.includes('eggs') || name.includes('egg')) {
        return false;
      }
    }

    // C. Medical Condition Filters
    if (medicalConditions.some((c: string) => (c || '').toLowerCase().includes('diabetes'))) {
      // Limit high glycemic items and high sugar
      if (food.sugar > 10 || name.includes('sugar') || name.includes('sweet') || name.includes('jalebi') || name.includes('cola') || name.includes('soda') || name.includes('juice') || name.includes('potato')) {
        return false;
      }
    }
    if (medicalConditions.some((c: string) => (c || '').toLowerCase().includes('hypertension') || (c || '').toLowerCase().includes('bp'))) {
      // Limit sodium items
      if (food.sodium > 400 || name.includes('pickle') || name.includes('salted') || name.includes('chips') || name.includes('sauce') || name.includes('papad')) {
        return false;
      }
    }

    return true;
  });
};

// 7. Core Recommendation Engine: Generates Balanced Daily Meal Plans
export const generateDailyMealPlan = (foods: any[], profile: HealthProfile) => {
  const caloricNeeds = calculateCaloricNeeds(profile);
  const targetCalories = caloricNeeds.targetCalories;
  
  // Filter foods relative to profile constraints
  const suitableFoods = filterFoodsForProfile(foods, profile);

  // Calorie allocations for meals
  const mealAllocations = {
    breakfast: targetCalories * 0.30,
    midMorningSnack: targetCalories * 0.10,
    lunch: targetCalories * 0.30,
    eveningSnack: targetCalories * 0.10,
    dinner: targetCalories * 0.20
  };

  const mealPlan: any = {
    breakfast: [],
    midMorningSnack: [],
    lunch: [],
    eveningSnack: [],
    dinner: []
  };

  // Utility to filter foods by categories
  const getFoodsByCategory = (categories: string[]) => 
    suitableFoods.filter(f => categories.includes(f.category));

  // 1. Breakfast foods: Grains & Cereals, Eggs, Dairy, Fruits, Beverages
  const bfPool = getFoodsByCategory(['Grains & Cereals', 'Eggs', 'Dairy', 'Fruits', 'Beverages']);
  // 2. Mid-Morning Snack foods: Fruits, Nuts & Seeds, Beverages
  const mmsPool = getFoodsByCategory(['Fruits', 'Nuts & Seeds', 'Beverages']);
  // 3. Lunch foods: Grains & Cereals, Pulses & Legumes, Vegetables, Poultry & Meat, Fish & Seafood, Dairy
  const lunchPool = getFoodsByCategory(['Grains & Cereals', 'Pulses & Legumes', 'Vegetables', 'Poultry & Meat', 'Fish & Seafood', 'Dairy']);
  // 4. Evening Snack foods: Snacks, Nuts & Seeds, Beverages, Fruits
  const evsPool = getFoodsByCategory(['Snacks', 'Nuts & Seeds', 'Beverages', 'Fruits']);
  // 5. Dinner foods: Grains & Cereals, Pulses & Legumes, Vegetables, Poultry & Meat, Fish & Seafood, Dairy (Lighter options)
  const dinnerPool = getFoodsByCategory(['Grains & Cereals', 'Pulses & Legumes', 'Vegetables', 'Poultry & Meat', 'Fish & Seafood', 'Dairy']);

  const pickMealItems = (pool: any[], targetCal: number) => {
    if (pool.length === 0) return [];
    
    // Sort randomly to avoid generating identical plans every single time
    const sortedPool = [...pool].sort(() => Math.random() - 0.5);
    const selected: any[] = [];
    let currentCal = 0;

    // Pick 1 base carbohydrate/protein item and 1 accompaniment/beverage
    for (const item of sortedPool) {
      if (currentCal + item.calories <= targetCal + 80) {
        selected.push(item);
        currentCal += item.calories;
        
        // Stop if we have 2 items and are close to target, or reached target
        if (selected.length >= 2 || currentCal >= targetCal - 50) {
          break;
        }
      }
    }

    // Fallback if no item matched the target
    if (selected.length === 0 && sortedPool.length > 0) {
      selected.push(sortedPool[0]);
    }

    return selected;
  };

  mealPlan.breakfast = pickMealItems(bfPool, mealAllocations.breakfast);
  mealPlan.midMorningSnack = pickMealItems(mmsPool, mealAllocations.midMorningSnack);
  mealPlan.lunch = pickMealItems(lunchPool, mealAllocations.lunch);
  mealPlan.eveningSnack = pickMealItems(evsPool, mealAllocations.eveningSnack);
  mealPlan.dinner = pickMealItems(dinnerPool, mealAllocations.dinner);

  // Compute actual plan statistics
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  const countMacros = (mealItems: any[]) => {
    mealItems.forEach(item => {
      totalCalories += item.calories;
      totalProtein += item.protein;
      totalCarbs += item.carbs;
      totalFat += item.fat;
      totalFiber += item.fiber || 0;
    });
  };

  Object.values(mealPlan).forEach((mealItems: any) => countMacros(mealItems));

  return {
    meals: mealPlan,
    targetCalories,
    actualCalories: Math.round(totalCalories),
    actualProtein: Math.round(totalProtein),
    actualCarbs: Math.round(totalCarbs),
    actualFat: Math.round(totalFat),
    actualFiber: Math.round(totalFiber)
  };
};

// 8. Health Tips & Insight Generators
export const getHealthInsights = (profile: HealthProfile, bmiCategory: string) => {
  const insights = [];
  const medicalConditions = profile.medicalConditions || [];

  // Goal insights
  if (profile.goal === 'Weight Loss') {
    insights.push('To reach your weight loss goal, aim for a consistent calorie deficit. Increase fiber intake to stay full longer.');
    insights.push('Include a portion of protein in every meal to preserve lean muscle tissue during weight loss.');
  } else if (profile.goal === 'Weight Gain') {
    insights.push('Incorporate healthy high-calorie density foods like nuts, avocados, and seeds to meet weight gain goals.');
    insights.push('Combine caloric surplus with progressive overload strength training to gain high-quality muscle mass.');
  } else {
    insights.push('Maintain calorie balance. Focus on eating colorful, diverse, whole-food groups to get adequate micronutrients.');
  }

  // Medical insights
  if ((profile.medicalConditions || []).some((c: string) => (c || '').toLowerCase().includes('diabetes'))) {
    insights.push('Focus on low-glycemic carbs like brown rice, oats, and lentils to prevent rapid spikes in blood sugar.');
    insights.push('Always pair carbohydrates with lean proteins or healthy fats to slow down glucose absorption.');
  }
  if ((profile.medicalConditions || []).some((c: string) => (c || '').toLowerCase().includes('hypertension'))) {
    insights.push('Ensure low sodium intake. Opt for herbs, lemon juice, and spices to flavor foods instead of table salt.');
    insights.push('Eat potassium-rich foods (e.g. bananas, spinach, coconut water) which naturally help lower blood pressure.');
  }

  // General lifestyle tips
  if (profile.sleepHours && profile.sleepHours < 7) {
    insights.push('Sleeping under 7 hours affects cortisol and ghrelin levels, which can trigger sugar cravings and slow down metabolism.');
  }
  if (profile.activityLevel === 'Sedentary') {
    insights.push('Combat sedentary habits by setting a timer to take a 5-minute walking or stretching break every hour.');
  }

  // Fallback insights if list is short
  if (insights.length < 3) {
    insights.push('Hydrate consistently throughout the day. Drinking water before meals can aid digestion and manage portion sizes.');
    insights.push('Prioritize chewing your food slowly. It takes about 20 minutes for your brain to receive fullness signals.');
  }

  return insights;
};
