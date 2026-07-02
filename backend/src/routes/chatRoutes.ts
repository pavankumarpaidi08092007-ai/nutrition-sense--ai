import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { calculateBMI, calculateCaloricNeeds, calculateMacros } from '../utils/aiRecommender';

const router = Router();

// ─── Helper: format bold markdown for frontend ───────────────────────────────
const bold = (text: string | number) => `**${text}**`;

// ─── Safety disclaimer ────────────────────────────────────────────────────────
const DISCLAIMER =
  '\n\n> ⚕️ *This information is for educational purposes only and does not constitute medical advice. For personalised clinical guidance, please consult a qualified healthcare professional.*';

// ─── Keyword match helper ─────────────────────────────────────────────────────
const has = (input: string, ...terms: string[]) =>
  terms.some(t => input.includes(t));

// @route   POST /api/chat
// @desc    AI Nutrition Assistant – comprehensive keyword-driven responses with user context
router.post('/', async (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const fallbackUser = {
    name: 'there',
    age: 30,
    gender: 'Other',
    height: 170,
    weight: 70,
    activityLevel: 'Moderately Active',
    goal: 'Maintain Weight',
    foodPreference: 'Veg',
    medicalConditions: [],
    allergies: [],
    dailyWaterGoal: 2500,
    sleepHours: 7,
  };
  const user = (req.user ?? fallbackUser) as any;

  try {
    if (!message) {
      return res.status(400).json({ success: false, message: 'Please provide a chat message.' });
    }

    const input = message.toLowerCase().trim();
    const bmi = calculateBMI(user.height, user.weight);
    const cal = calculateCaloricNeeds(user);
    const isVeg = user.foodPreference === 'Veg' || user.foodPreference === 'Vegan';
    const hasDiabetes = user.medicalConditions?.some((c: string) => c.toLowerCase().includes('diabet'));
    const hasHypertension = user.medicalConditions?.some((c: string) =>
      c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('blood pressure')
    );
    const macros = calculateMacros(cal.targetCalories, user);
    const protein_g = Math.round(macros.protein ?? (cal.targetCalories * 0.25) / 4);
    const carbs_g = Math.round(macros.carbs ?? (cal.targetCalories * 0.45) / 4);
    const fat_g = Math.round(macros.fat ?? (cal.targetCalories * 0.30) / 9);
    const waterMl = user.dailyWaterGoal || Math.round(user.weight * 35);

    let reply = '';

    // ──────────────────────────────────────────────────────────────────────────
    // 1. GREETINGS
    // ──────────────────────────────────────────────────────────────────────────
    if (has(input, 'hello', 'hi ', 'hey', 'greet', 'namaste', 'good morning', 'good evening')) {
      reply = `Hello ${bold(user.name)}! 👋 Welcome to your **Nutri Sense AI Assistant**.

Here's a quick snapshot of your health profile:
- 🎯 Goal: ${bold(user.goal)}
- 🍽️ Diet: ${bold(user.foodPreference)}
- 🔥 Daily Target: ${bold(cal.targetCalories + ' kcal')}
- 💧 Water Goal: ${bold(waterMl + ' ml/day')}
- 📊 BMI: ${bold(bmi.bmi)} (${bmi.category})

I can help you with diet plans, BMI, calorie needs, macros, meal ideas, and much more. Just ask! 😊`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. BMI
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'bmi', 'body mass index', 'am i overweight', 'am i obese', 'am i underweight')) {
      reply = `## 📊 Your BMI Analysis

| Metric | Value |
|--------|-------|
| Height | ${user.height} cm |
| Weight | ${user.weight} kg |
| BMI | ${bold(bmi.bmi)} |
| Category | ${bold(bmi.category)} |
| Risk Level | ${bmi.riskLevel || 'See below'} |
| Healthy Range | ${bmi.healthyRange?.min}–${bmi.healthyRange?.max} kg |

**What this means:**
${bmi.suggestions}

BMI is a screening tool — it doesn't account for muscle mass, bone density, or body composition. Athletes may have a high BMI but low body fat.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. BMR (Basal Metabolic Rate)
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'bmr', 'basal metabolic', 'metabolism', 'metabolic rate', 'resting')) {
      reply = `## 🔥 Your BMR (Basal Metabolic Rate)

**BMR = ${bold(cal.bmr + ' kcal/day')}**

This is the number of calories your body burns at complete rest — just to keep your heart beating, lungs breathing, and organs functioning.

**How it's calculated (Mifflin-St Jeor):**
- Males: 10×weight + 6.25×height − 5×age + 5
- Females: 10×weight + 6.25×height − 5×age − 161

**Your TDEE** (Total Daily Energy Expenditure at ${bold(user.activityLevel)}) = ${bold(cal.tdee + ' kcal')}

To ${user.goal.toLowerCase()}, your daily target is set to ${bold(cal.targetCalories + ' kcal')}.`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 4. TDEE / CALORIES
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'tdee', 'calorie', 'caloric', 'how many calories', 'daily calorie', 'energy need')) {
      reply = `## 🔥 Your Calorie Requirements

| | Kcal/day |
|-|---------|
| BMR (at rest) | ${cal.bmr} |
| TDEE (with activity) | ${cal.tdee} |
| **Target (for ${user.goal})** | **${cal.targetCalories}** |

**Caloric Strategy for "${user.goal}":**
${user.goal.includes('Loss')
  ? `You are in a calorie deficit of ~${cal.tdee - cal.targetCalories} kcal/day. 1 kg of fat ≈ 7,700 kcal — at this rate, you can expect to lose ~0.5 kg/week.`
  : user.goal.includes('Gain')
  ? `You are in a calorie surplus of ~${cal.targetCalories - cal.tdee} kcal/day to support muscle or weight gain.`
  : `You are eating at maintenance — perfect for weight stability and body recomposition.`}

**Tips:**
- Eat every 3–4 hours to keep metabolism active
- Never go below 1,200 kcal (women) / 1,500 kcal (men)
- Track calories for at least 2 weeks for best results`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 5. MACRONUTRIENTS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'macro', 'protein carb fat', 'macronutrient', 'how much protein', 'how much carb')) {
      reply = `## ⚖️ Your Daily Macronutrient Targets

| Macro | Grams | Calories | % of Total |
|-------|-------|----------|-----------|
| 🥩 Protein | ${protein_g}g | ${protein_g * 4} kcal | ~25% |
| 🍚 Carbohydrates | ${carbs_g}g | ${carbs_g * 4} kcal | ~45% |
| 🥑 Fats | ${fat_g}g | ${fat_g * 9} kcal | ~30% |

**Why each matters:**
- **Protein** → builds & repairs muscle, keeps you full, boosts metabolism
- **Carbohydrates** → primary fuel source for brain & muscles
- **Fats** → hormone production, fat-soluble vitamins (A, D, E, K), joint health

**Best sources (${user.foodPreference} diet):**
- Protein: ${isVeg ? 'Lentils, Paneer, Tofu, Greek yogurt, Chickpeas, Quinoa' : 'Chicken breast, Eggs, Fish, Paneer, Lentils, Whey protein'}
- Carbs: Oats, Brown rice, Sweet potato, Whole wheat roti, Fruits
- Fats: Almonds, Walnuts, Avocado, Olive oil, Ghee (in moderation)`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 6. PROTEIN
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'protein', 'muscle protein', 'amino acid', 'protein source', 'high protein')) {
      reply = `## 🥩 Protein Guide for ${user.goal}

Your daily protein target: ${bold(protein_g + 'g')} (${user.goal.includes('Muscle') ? '2.0–2.2' : '1.6–1.8'}g per kg of body weight)

**Top ${user.foodPreference} Protein Sources:**
${isVeg
  ? `1. 🫘 Lentils (Dal) — 9g/100g cooked
2. 🧀 Paneer — 18g/100g
3. 🫙 Greek Yogurt — 10g/100g
4. 🌱 Tofu — 8g/100g
5. 🥚 Eggs (Eggitarian) — 13g per 2 eggs
6. 🌾 Quinoa — 8g/100g
7. 🫘 Chickpeas/Rajma — 8g/100g
8. 🥛 Low-fat milk — 3.4g/100ml`
  : `1. 🍗 Chicken breast (grilled) — 31g/100g
2. 🥚 Eggs — 13g per 2 eggs
3. 🐟 Tuna/Salmon — 25g/100g
4. 🧀 Paneer — 18g/100g
5. 🫘 Lentils — 9g/100g cooked
6. 🌱 Tofu — 8g/100g
7. 🦐 Shrimp — 24g/100g
8. 🥛 Greek Yogurt — 10g/100g`}

**Tips:**
- Spread protein across all meals for maximum absorption
- Consume 20–40g of protein post-workout within 30 minutes
- Complete proteins contain all 9 essential amino acids`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 7. CARBOHYDRATES
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'carb', 'carbohydrate', 'sugar', 'rice', 'wheat', 'glycemic', 'low carb')) {
      reply = `## 🍚 Carbohydrates Guide

Your daily carb target: ${bold(carbs_g + 'g')}

**Types of Carbohydrates:**
- ✅ **Complex (Slow)**: Brown rice, oats, sweet potato, whole wheat roti, barley
- ⚠️ **Simple (Fast)**: Fruits, milk — fine in moderation
- ❌ **Refined**: White bread, maida, soft drinks, candy — minimize

**Glycemic Index (GI) Guide:**
| Food | GI | Better Choice |
|------|----|----|
| White rice | 72 (High) | Brown rice (55) |
| White bread | 75 (High) | Whole wheat (69) |
| Potato | 85 (High) | Sweet potato (44) |
| Watermelon | 76 (High) | Apple (36) |

${hasDiabetes ? '⚠️ **Since you have diabetes**, focus on low-GI foods. Avoid refined carbs completely. Pair carbs with protein and fiber to blunt glucose spikes.' : ''}

**For ${user.goal}:**
${user.goal.includes('Loss') ? 'Reduce simple carbs. Prioritise fiber-rich complex carbs. Avoid eating carbs alone — pair with protein.' : 'Carbs are your friend! Time them around workouts for best performance and recovery.'}` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 8. FATS / HEALTHY FATS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'fat', 'healthy fat', 'omega', 'avocado', 'ghee', 'oil', 'saturated', 'unsaturated')) {
      reply = `## 🥑 Healthy Fats Guide

Your daily fat target: ${bold(fat_g + 'g')}

**Fat Types:**
- ✅ **Monounsaturated**: Olive oil, avocado, almonds, peanut butter
- ✅ **Polyunsaturated (Omega-3)**: Walnuts, flaxseeds, fatty fish, chia seeds
- ⚠️ **Saturated**: Ghee, butter, coconut oil — use in moderation
- ❌ **Trans Fats**: Margarine, processed snacks, fried fast food — AVOID

**Top Healthy Fat Foods:**
1. 🥑 Avocado — 15g healthy fat per half
2. 🌰 Almonds — 14g fat per 30g (also 6g protein)
3. 🐟 Salmon — rich in Omega-3 EPA & DHA
4. 🌿 Flaxseeds — best plant Omega-3 source
5. 🫙 Extra virgin olive oil — anti-inflammatory MUFA

${hasHypertension ? '⚠️ **For your hypertension**, increase Omega-3 intake and drastically reduce saturated fat and sodium. Use olive oil instead of butter.' : ''}

**Why fats are essential:**
- Absorb vitamins A, D, E, K
- Produce sex hormones (testosterone, estrogen)
- Protect organs and insulate the body`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 9. WATER / HYDRATION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'water', 'hydrat', 'drink', 'fluid', 'dehydrat', 'thirst')) {
      reply = `## 💧 Hydration Guide

Your daily water goal: ${bold(waterMl + ' ml')} (~${Math.round(waterMl / 250)} glasses)

**General formula:** Body weight (kg) × 35 ml = daily water needs

**Why hydration matters:**
- Regulates body temperature
- Lubricates joints
- Flushes out toxins via kidneys
- Boosts metabolic rate by up to 30% for 1 hour after 500ml
- Reduces hunger (often thirst is mistaken for hunger)

**Smart hydration habits:**
1. 🌅 Drink 1 glass (250ml) immediately upon waking
2. 🥗 Drink 1 glass 30 min before each meal
3. 🏃 Add 500ml extra per 30 min of exercise
4. ☕ For every cup of coffee/tea — add 1 extra glass of water
5. 🌡️ In hot weather or illness — increase by 500–1000ml

**Signs of dehydration:** Dark yellow urine, headaches, fatigue, dry lips.

Log your intake on the Health Tracker page to watch the animated water bottle fill up! 💙`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 10. WEIGHT LOSS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'weight loss', 'lose weight', 'lose fat', 'fat loss', 'slim', 'reduce weight', 'cut weight')) {
      reply = `## 🏃 Weight Loss Plan for ${user.name}

**Your personalised targets:**
- Daily calories: ${bold(cal.targetCalories + ' kcal')} (${cal.tdee - cal.targetCalories} kcal deficit/day)
- Expected loss: ~${((cal.tdee - cal.targetCalories) * 7 / 7700).toFixed(2)} kg/week

**Nutritional Strategy:**
1. 🥩 High protein (${protein_g}g) → preserves muscle while losing fat
2. 🥬 Fill half your plate with vegetables
3. 🚫 Cut liquid calories (juice, soda, alcohol)
4. 🕐 Intermittent fasting (16:8) can help reduce intake naturally

**Sample ${user.foodPreference} Meal Plan:**
- **Breakfast**: Vegetable omelette / Poha with sprouts + green tea
- **Lunch**: Brown rice + Dal + Salad + Curd
- **Snack**: Apple + 10 almonds / Chaas
- **Dinner**: Grilled ${isVeg ? 'paneer + sautéed vegetables' : 'chicken + stir-fried vegetables'} + 1 roti

**Exercise Recommendations:**
- 🏃 Cardio: 30–45 min, 5×/week (walk, cycle, swim)
- 💪 Strength: 3×/week (preserves muscle)
- 🧘 Flexibility: 10 min yoga daily

**Avoid:** Crash diets, skipping meals, extreme calorie restriction below 1200 kcal.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 11. MUSCLE BUILDING (dedicated)
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'muscle building', 'muscle gain', 'build muscle', 'hypertrophy', 'lean muscle', 'get muscular')) {
      const muscleProtein = Math.round(user.weight * 2.0);
      reply = `## 💪 Muscle Building Plan for ${user.name}

**Your muscle-building targets:**
- Daily calories: ${bold(cal.targetCalories + ' kcal')} (slight surplus for lean gains)
- Protein: ${bold(muscleProtein + 'g')} (2.0g per kg body weight)
- Carbs: ${bold(carbs_g + 'g')} (fuel for training)
- Fats: ${bold(fat_g + 'g')} (hormone support)

**Training Nutrition Rules:**
1. 🥩 **Protein at every meal** — 25–40g per sitting
2. 🍚 **Carbs around workouts** — pre + post training
3. 😴 **Sleep 7–9 hours** — muscle grows during recovery
4. 💧 **${waterMl} ml water/day** — hydration supports performance

**Best ${user.foodPreference} Muscle Foods:**
${isVeg
  ? `- Paneer, Tofu, Greek yogurt, Lentils, Rajma\n- Oats, Brown rice, Sweet potato\n- Almonds, Peanut butter, Chia seeds`
  : `- Chicken breast, Eggs, Fish, Lean beef\n- Whey protein, Cottage cheese\n- Oats, Rice, Sweet potato\n- Nuts, Olive oil`}

**Sample Post-Workout Meal:**
- ${isVeg ? 'Paneer bhurji + 2 rotis + banana shake' : '150g grilled chicken + rice + fruit'}
- Target: ~${Math.round(muscleProtein * 0.35)}g protein + ~${Math.round(carbs_g * 0.30)}g carbs

**Weekly Training Split (suggested):**
- Day 1: Push (chest, shoulders, triceps)
- Day 2: Pull (back, biceps)
- Day 3: Legs (squats, lunges, deadlifts)
- Day 4: Rest or light cardio
- Repeat with progressive overload` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. MAINTAIN WEIGHT
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'maintain weight', 'maintenance', 'stay same weight', 'keep weight', 'maintain my weight')) {
      reply = `## ⚖️ Maintain Weight Plan for ${user.name}

**Your maintenance targets:**
- Daily calories: ${bold(cal.targetCalories + ' kcal')} (at TDEE)
- Protein: ${bold(protein_g + 'g')} | Carbs: ${bold(carbs_g + 'g')} | Fats: ${bold(fat_g + 'g')}
- Water: ${bold(waterMl + ' ml/day')}

**Strategy for Weight Maintenance:**
1. 🎯 Eat at your TDEE (${cal.tdee} kcal) — no surplus or deficit
2. 🥗 80/20 rule — 80% whole foods, 20% flexibility
3. 📊 Weigh weekly (same day, same time) to catch drift early
4. 💪 Strength train 2–3×/week to preserve muscle mass

**Sample ${user.foodPreference} Maintenance Day:**
- **Breakfast**: Oats + nuts + fruit (~${Math.round(cal.targetCalories * 0.25)} kcal)
- **Lunch**: Roti + dal + sabzi + salad (~${Math.round(cal.targetCalories * 0.35)} kcal)
- **Snack**: Fruit + handful of nuts (~${Math.round(cal.targetCalories * 0.10)} kcal)
- **Dinner**: Light protein + vegetables (~${Math.round(cal.targetCalories * 0.30)} kcal)

**Healthy snacks:** Roasted makhana, sprout chaat, Greek yogurt, apple + peanut butter

**Tip:** Body recomposition (lose fat + gain muscle) is possible at maintenance with consistent strength training!` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13. WEIGHT GAIN
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'weight gain', 'gain weight', 'bulk', 'underweight')) {
      reply = `## 💪 Weight/Muscle Gain Plan for ${user.name}

**Your targets:**
- Daily calories: ${bold(cal.targetCalories + ' kcal')} (${cal.targetCalories - cal.tdee} kcal surplus/day)
- Protein: ${bold(protein_g + 'g')} (2.0g per kg BW for muscle gain)
- Expected gain: ~${((cal.targetCalories - cal.tdee) * 7 / 7700).toFixed(2)} kg/week (lean gain recommended: 0.25–0.5 kg/week)

**Key Principles:**
1. 🍽️ **Eat more frequently** — 5–6 meals per day
2. 🥩 **Protein priority** at every meal
3. 🍚 **Calorie-dense foods** — nuts, nut butter, dried fruits, whole milk
4. 💪 **Progressive overload** in the gym — increase weight/reps weekly

**Sample High-Calorie ${user.foodPreference} Foods:**
${isVeg
  ? `- Peanut butter (2 tbsp = 190 kcal)
- Rajma/Chole with brown rice
- Paneer with full-fat milk
- Banana + milk smoothie with almonds
- Avocado toast with eggs`
  : `- Chicken thighs (higher calorie than breast)
- Eggs + whole milk (mass shake)
- Salmon with sweet potato
- Beef/mutton curry with rice
- Whey protein with milk`}

**Post-workout nutrition:** 40g protein + 60–80g carbs within 45 min of training.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 12. VITAMINS & MINERALS / MICRONUTRIENTS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'vitamin', 'mineral', 'micronutrient', 'iron', 'calcium', 'zinc', 'magnesium', 'deficien', 'supplement')) {
      reply = `## 🌿 Vitamins & Minerals Guide

**Key Micronutrients You Need Daily:**

| Nutrient | Function | Best ${user.foodPreference} Sources |
|----------|----------|------|
| Vitamin D | Bone health, immunity | Sunlight, ${isVeg ? 'fortified milk, mushrooms' : 'salmon, egg yolk, fortified milk'} |
| Vitamin B12 | Nerve function, energy | ${isVeg ? '⚠️ Supplement recommended (rare in plant foods)' : 'Meat, eggs, dairy'} |
| Iron | Oxygen transport | ${isVeg ? 'Spinach, lentils, jaggery, pumpkin seeds' : 'Red meat, liver, lentils, spinach'} |
| Calcium | Bones, muscle contraction | Milk, curd, ragi, almonds, tofu |
| Vitamin C | Immunity, iron absorption | Amla, citrus fruits, bell peppers, guava |
| Zinc | Immunity, wound healing | ${isVeg ? 'Pumpkin seeds, legumes, wheat germ' : 'Red meat, shellfish, pumpkin seeds'} |
| Magnesium | 300+ enzyme reactions | Dark chocolate, spinach, almonds, cashews |
| Folate | Cell division, pregnancy | Leafy greens, lentils, beans, fortified foods |

${isVeg || user.foodPreference === 'Vegan' ? '\n⚠️ **For vegans/vegetarians:** B12 and Vitamin D supplementation is strongly recommended. Consider fortified plant milks.' : ''}

**Lab tests recommended:** Vitamin D, B12, Iron, CBC annually.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 13. DIABETIC DIET
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'diabet', 'blood sugar', 'sugar level', 'insulin', 'glycemic', 'hba1c')) {
      reply = `## 🩺 Diabetic Diet Guidance

${hasDiabetes ? `⚠️ **I see diabetes is listed in your medical conditions.** Please follow this guidance in consultation with your doctor.` : ''}

**Key Dietary Principles:**
1. **Low Glycemic Index (GI < 55)** foods to prevent glucose spikes
2. **Consistent meal timing** — eat every 3–4 hours
3. **Portion control** — use the plate method (½ veg, ¼ protein, ¼ complex carb)
4. **High fiber** — slows sugar absorption

**Best Foods for Diabetes:**
- ✅ Bitter gourd (Karela), fenugreek (Methi), amla
- ✅ Barley, oats, bajra roti, brown rice
- ✅ Leafy greens, broccoli, cucumber
- ✅ Legumes: Dal, rajma, chole
- ✅ Nuts & seeds: Almonds, walnuts, flaxseeds

**Foods to Avoid:**
- ❌ White rice, maida, sugar, white bread
- ❌ Fruit juices, sweetened drinks
- ❌ Processed snacks, fried foods
- ❌ Alcohol

**The "Plate Method":**
Half the plate = non-starchy vegetables
Quarter = protein
Quarter = complex carbs

**Monitor:** Blood glucose before/after meals to identify personal trigger foods.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 14. HEART-HEALTHY DIET
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'heart', 'cardiovascular', 'cholesterol', 'blood pressure', 'hypertension', 'cardiac', 'triglyceride')) {
      reply = `## ❤️ Heart-Healthy Diet Guide

${hasHypertension ? `⚠️ **Hypertension noted in your profile.** These guidelines are especially important for you.` : ''}

**The DASH Diet (Dietary Approaches to Stop Hypertension) — clinically proven:**

**Foods to Emphasise:**
- 🐟 Fatty fish (salmon, mackerel) — 2×/week for Omega-3s
- 🥬 Dark leafy greens — high in potassium (lowers BP)
- 🫐 Berries — rich in antioxidants
- 🌾 Whole grains — oats, barley, brown rice
- 🧅 Garlic, onions — natural blood pressure reducers
- 🥑 Avocado, olive oil — heart-healthy MUFA

**Sodium target:** < 2,300 mg/day (1 tsp salt) — or < 1,500 mg if hypertensive

**Foods to Avoid:**
- ❌ Fried foods, ghee in excess, butter
- ❌ Red/processed meats
- ❌ Pickles, papad, namkeen, packaged foods (high sodium)
- ❌ Alcohol, energy drinks

**Lifestyle:** 30 min moderate cardio daily, quit smoking, manage stress (yoga, meditation).` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 15. INDIAN DIET
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'indian diet', 'indian food', 'desi food', 'roti', 'dal', 'sabzi', 'curry', 'rajma', 'chapati', 'dosa', 'idli')) {
      reply = `## 🇮🇳 Indian Diet Recommendations

India's traditional diet is naturally rich in fibre, complex carbs, and plant protein — perfectly aligned with your ${bold(user.foodPreference)} preference.

**Balanced Indian Meal Template:**
- **Breakfast**: Poha / Upma / Oats / Idli-Sambar / Besan chilla + 1 fruit
- **Mid-morning**: Chaas / Coconut water / Sprout chaat
- **Lunch**: 2 rotis (atta) + Dal + Sabzi + Salad + Curd (200ml)
- **Evening snack**: Makhana / Roasted chana / Fruit
- **Dinner**: 1–2 rotis + Light sabzi / Soup + Dal / Curd

**Nutritional Gems of Indian Kitchen:**
| Food | Benefit |
|------|---------|
| Turmeric | Anti-inflammatory |
| Methi (Fenugreek) | Blood sugar control |
| Ajwain | Digestive health |
| Amla | Vitamin C powerhouse |
| Ragi (Nachni) | High calcium, iron |
| Rajma | Complete protein + iron |
| Curd | Probiotics for gut health |

**Healthy swaps:**
- Maida roti → Multigrain/atta roti
- White rice → Brown rice or millets
- Deep frying → Air frying / sautéing
- Full-fat cream → Low-fat curd`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 16. MEAL PLANNING
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'meal plan', 'what to eat', 'diet plan', 'food plan', 'meal prep', 'weekly plan')) {
      reply = `## 📅 Your Personalised ${user.goal} Meal Plan

**Daily Target: ${cal.targetCalories} kcal | P:${protein_g}g C:${carbs_g}g F:${fat_g}g**

**Sample Full-Day ${user.foodPreference} Plan:**

🌅 **Breakfast (${Math.round(cal.targetCalories * 0.25)} kcal)**
${isVeg
  ? '- 2 Besan chillas + 1 tsp green chutney\n- 1 cup low-fat curd\n- 1 medium banana'
  : '- 3 egg omelette (1 whole + 2 whites) with veggies\n- 2 whole wheat toast\n- 1 glass low-fat milk'}

☀️ **Lunch (${Math.round(cal.targetCalories * 0.35)} kcal)**
- 2 whole wheat rotis
- 1 cup Dal (Moong/Masoor)
- 1 cup Sabzi (Palak/Gobi)
- 1 cup Salad (cucumber, tomato, carrot)
- 200ml Curd

🌆 **Evening Snack (${Math.round(cal.targetCalories * 0.10)} kcal)**
- 10–12 Almonds + 1 apple / 1 cup green tea + roasted makhana

🌙 **Dinner (${Math.round(cal.targetCalories * 0.30)} kcal)**
${isVeg
  ? '- 1 cup Paneer bhurji (low fat)\n- 1 roti\n- 1 cup Vegetable soup'
  : '- 150g Grilled chicken / Fish curry\n- 1 roti or ½ cup brown rice\n- Steamed vegetables'}

💡 **Head to the Meal Planner** page for AI-generated daily, weekly, and monthly plans personalised to your exact profile!`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 17. SNACKS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'snack', 'munchies', 'hunger', 'cravings', 'in between meal', 'between meal')) {
      reply = `## 🥜 Healthy Snack Ideas for ${user.goal}

**Low-calorie, high-satiety snacks (<150 kcal):**
1. 🥜 10–12 Almonds or Walnuts (~160 kcal)
2. 🌽 Roasted Makhana (fox nuts) — 1 cup (~100 kcal)
3. 🍎 Apple + 1 tbsp peanut butter (~160 kcal)
4. 🥕 Carrot + cucumber sticks with hummus (~80 kcal)
5. 🫙 200g Greek yogurt + berries (~120 kcal)
6. 🥚 1 hard-boiled egg + sprinkle of pepper (~70 kcal)
7. 🌱 Sprout chaat with lemon + chaat masala (~100 kcal)
8. 🍊 1 orange + handful of roasted chana (~130 kcal)

**Snacks to avoid:**
- ❌ Chips, namkeen, biscuits (empty calories)
- ❌ Sweetened yogurt, flavoured milk
- ❌ Protein bars with >10g added sugar

**Tip:** Keep healthy snacks pre-portioned and visible. Drink 1 glass of water before snacking — hunger is often thirst in disguise!`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 18. SPORTS NUTRITION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'sport', 'athlete', 'performance', 'pre workout', 'post workout', 'gym nutrition', 'endurance', 'creatine', 'whey')) {
      reply = `## 🏋️ Sports Nutrition Guide

**Pre-Workout (60–90 min before):**
- Complex carbs + moderate protein + low fat
- Examples: Banana + peanut butter toast | Oats + whey | Rice + chicken

**During Workout (if >60 min):**
- Sip water or an electrolyte drink every 15–20 min
- Long sessions: 30–60g carbs/hour (banana, dates, sports drink)

**Post-Workout (within 30–45 min):**
- 20–40g protein + 40–80g carbs (golden window!)
- Examples: Whey + banana shake | Chicken + rice | Curd + poha

**Your Post-Workout Target:**
- Protein: ~${Math.round(protein_g * 0.35)}g
- Carbs: ~${Math.round(carbs_g * 0.30)}g

**Supplements (evidence-based):**
| Supplement | Benefit | Dose |
|-----------|---------|------|
| Creatine Monohydrate | Strength + power | 3–5g/day |
| Whey Protein | Convenient protein | 25–30g post-workout |
| Caffeine | Endurance + focus | 3–6mg/kg BW |
| Beta-Alanine | Reduce fatigue | 3.2–6.4g/day |

**Always prioritise whole foods over supplements!**` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 19. PREGNANCY NUTRITION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'pregnan', 'prenatal', 'trimester', 'folic acid', 'breastfeed', 'lactation')) {
      reply = `## 🤰 Pregnancy Nutrition (General Guidance)

**Key Nutrients for Pregnancy:**
| Nutrient | Daily Need | Best Sources |
|---------|-----------|------|
| Folate | 600 mcg | Leafy greens, lentils, fortified cereals |
| Iron | 27 mg | Spinach, lentils, red meat, jaggery |
| Calcium | 1000 mg | Milk, curd, ragi, almonds |
| Vitamin D | 600 IU | Sunlight, fortified milk |
| Omega-3 | 200–300 mg DHA | Fatty fish, walnuts, flaxseeds |
| Iodine | 220 mcg | Iodized salt, dairy |

**Caloric Needs:**
- 1st Trimester: +0 extra kcal/day
- 2nd Trimester: +340 kcal/day
- 3rd Trimester: +450 kcal/day

**Foods to Avoid During Pregnancy:**
- ❌ Raw/undercooked meat, sushi, unpasteurised cheese
- ❌ High-mercury fish (shark, swordfish)
- ❌ Alcohol, excess caffeine (>200mg/day)
- ❌ Unwashed fruits and vegetables

**Always consult your OB-GYN or a registered dietitian for a personalised pregnancy meal plan.**` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 20. CHILD NUTRITION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'child', 'kid', 'toddler', 'infant', 'baby', 'school age', 'adolescent', 'teen')) {
      reply = `## 👶 Child & Adolescent Nutrition Guide

**Caloric Needs by Age:**
| Age | Boys (kcal) | Girls (kcal) |
|----|------------|-------------|
| 2–3 years | 1,000–1,400 | 1,000–1,200 |
| 4–8 years | 1,200–1,600 | 1,200–1,400 |
| 9–13 years | 1,400–2,200 | 1,400–2,000 |
| 14–18 years | 2,000–3,200 | 1,800–2,400 |

**Key Nutrients for Children:**
- 🦴 **Calcium**: 700–1300mg/day — milk, curd, ragi, cheese
- 🩸 **Iron**: 7–15mg/day — lentils, spinach, jaggery
- 🧠 **Omega-3**: DHA for brain development — walnuts, fatty fish
- 💊 **Vitamin D**: Sunlight + fortified foods

**Healthy Meal Ideas for Kids:**
- Besan chilla with veggies
- Dalia khichdi
- Egg fried rice (homemade)
- Banana milk smoothie
- Vegetable paratha with curd

**Healthy habits to build early:**
- Regular meal times
- Limit screen time during eating
- Include children in food preparation
- Avoid using food as reward/punishment` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 21. ELDERLY NUTRITION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'elderly', 'senior', 'old age', 'aging', 'ageing', 'menopause', 'osteoporosis')) {
      reply = `## 👴 Elderly Nutrition Guide

**Key Changes with Age:**
- Reduced appetite → need more nutrient-dense foods
- Lower caloric needs but HIGHER need for protein, calcium, vitamin D
- Reduced kidney efficiency → hydration more critical
- Decreased gut motility → more fibre needed

**Protein needs:** 1.2–1.5g per kg BW/day (higher than younger adults)
**Calcium:** 1,200mg/day | **Vitamin D:** 800 IU/day

**Best Foods for Seniors:**
1. 🥛 Low-fat milk + curd — calcium + B12
2. 🫘 Lentils + legumes — protein + fibre
3. 🐟 Fish — Omega-3 for brain & joint health
4. 🌿 Turmeric milk — anti-inflammatory
5. 🥬 Leafy greens — folate, iron, antioxidants
6. 🥜 Nuts — healthy fats, magnesium
7. 🫐 Berries — cognitive health

**Common Deficiencies in Elderly:**
- Vitamin D (reduced sun exposure + absorption)
- Vitamin B12 (reduced stomach acid)
- Calcium → osteoporosis risk
- Iron → anaemia

**Supplementation:** Often required — consult a physician.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 22. FOOD ALLERGIES / INTOLERANCES
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'allerg', 'intoleran', 'gluten', 'lactose', 'nut allergy', 'celiac', 'sensitivity')) {
      reply = `## 🚨 Food Allergy & Intolerance Guide

${user.allergies?.length > 0 ? `⚠️ **Your registered allergies:** ${user.allergies.join(', ')}. I've taken these into account in my recommendations.` : ''}

**8 Most Common Food Allergens:**
1. Milk | 2. Eggs | 3. Fish | 4. Shellfish
5. Tree Nuts | 6. Peanuts | 7. Wheat | 8. Soy

**Gluten-Free Alternatives:**
- Rice, quinoa, millets (bajra, jowar, ragi), corn, potato, tapioca

**Lactose-Free Alternatives:**
- Plant milks (almond, oat, soy, coconut)
- Lactose-free dairy products
- Hard cheeses (lower lactose)

**Tips for Managing Allergies:**
- Always read food labels carefully
- "May contain" warnings indicate cross-contamination risk
- Carry an emergency epinephrine auto-injector for severe allergies
- Inform restaurants of allergies before ordering

**Reading Labels:**
- Ingredients are listed by weight (highest first)
- Allergens must be clearly highlighted by law in India (FSSAI)

**Consult an allergist for formal allergy testing.**` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 23. FOOD LABELS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'food label', 'read label', 'nutrition label', 'ingredient list', 'fssai', 'packaging')) {
      reply = `## 🏷️ How to Read Food Labels

**Key sections on a Nutrition Facts label:**

**1. Serving Size**
- All values are per serving — check how many servings per pack!

**2. Calories**
- Total energy per serving

**3. Macros (per serving):**
| Nutrient | What to Look For |
|---------|-----------------|
| Total Fat | < 10g (prefer) |
| Saturated Fat | < 3g (low is better) |
| Trans Fat | 0g (always!) |
| Total Carbs | Check fiber vs. sugar |
| Added Sugar | < 5g (low is better) |
| Protein | Higher the better |

**4. Micronutrients (%DV)**
- Look for high %DV for Vitamin D, Iron, Calcium
- Low %DV for Sodium (< 15% per serving)

**5. Ingredients List**
- Listed by weight (most → least)
- Shorter = cleaner
- Avoid: Hydrogenated oils, HFCS, artificial colours, preservatives

**Green flags:** Whole grain listed 1st, <5 ingredients, no added sugar
**Red flags:** Sugar in top 3, "partially hydrogenated", artificial dyes`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 24. NUTRITION MYTHS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'myth', 'misconception', 'fact or fiction', 'is it true', 'truth about', 'debunk')) {
      reply = `## 🔍 Common Nutrition Myths Debunked

**Myth 1: "Eating fat makes you fat"**
✅ Reality: Healthy fats (avocado, nuts, olive oil) are essential. Excess calories from ANY source cause fat gain.

**Myth 2: "Carbs are bad for you"**
✅ Reality: Complex carbs (oats, brown rice) are vital for energy. The issue is refined carbs, not carbs per se.

**Myth 3: "Eating after 8 PM causes weight gain"**
✅ Reality: Total daily calories matter, not meal timing. Though avoiding late-night snacking helps reduce excess intake.

**Myth 4: "Detox juices cleanse your body"**
✅ Reality: Your liver and kidneys detox your body every second. No juice "cleanses" the body.

**Myth 5: "More protein = more muscle automatically"**
✅ Reality: Protein + resistance training + adequate sleep = muscle growth. Excess protein above needs is stored as fat.

**Myth 6: "You need to eat 6 meals a day to boost metabolism"**
✅ Reality: Meal frequency has minimal impact on metabolic rate. Total calories and macros matter most.

**Myth 7: "Organic food is always healthier"**
✅ Reality: "Organic" refers to farming method, not nutritional content. A regular apple and organic apple have similar nutrients.

**Myth 8: "Drinking warm lemon water burns fat"**
✅ Reality: It's hydrating and aids digestion slightly. Does NOT directly burn fat.`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 25. LIFESTYLE / HEALTHY HABITS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'lifestyle', 'habit', 'healthy living', 'sleep', 'stress', 'routine', 'morning routine', 'wellness')) {
      reply = `## 🌱 Healthy Lifestyle Habits for ${user.name}

**The 5 Pillars of Health:**

🍽️ **1. Nutrition**
- Follow your ${bold(cal.targetCalories + ' kcal')} daily target
- Eat whole, minimally processed foods 80% of the time

🏃 **2. Exercise**
- 150 min moderate cardio/week (WHO guideline)
- 2–3 strength training sessions/week
- 8,000–10,000 steps daily

😴 **3. Sleep**
- Target: ${user.sleepHours || 7}–8 hours (your profile goal)
- Poor sleep increases hunger hormones (ghrelin) by 24%
- Consistent sleep/wake times regulate circadian rhythm

🧘 **4. Stress Management**
- Chronic stress → cortisol → belly fat accumulation
- 10–15 min daily meditation, breathing exercises
- Nature walks, journaling, social connection

💧 **5. Hydration**
- ${waterMl} ml daily (your target)
- Avoid starting your day with coffee — hydrate first!

**Daily Routine Template:**
- 🌅 Wake → 2 glasses water → sunlight 10 min
- 🍽️ Breakfast within 1 hour of waking
- 🚶 Movement every 45–60 min if desk job
- 🧘 Wind down screen 1 hour before bed`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 26. WEIGHT PREDICTION
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'predict', 'forecast', 'future weight', '8 week', 'week predict', 'how long')) {
      const weeklyNet = (cal.targetCalories - cal.tdee) * 7;
      const weeklyChange = weeklyNet / 7700;
      const in8 = (user.weight + weeklyChange * 8).toFixed(1);
      const in4 = (user.weight + weeklyChange * 4).toFixed(1);
      const in12 = (user.weight + weeklyChange * 12).toFixed(1);

      reply = `## 📈 Your Weight Prediction Model

**Based on:**
- Current weight: ${user.weight} kg
- TDEE: ${cal.tdee} kcal | Target: ${cal.targetCalories} kcal
- Weekly caloric ${weeklyNet > 0 ? 'surplus' : 'deficit'}: ${Math.abs(weeklyNet)} kcal

**Projected Weight:**
| Timeframe | Estimated Weight | Change |
|-----------|-----------------|--------|
| 4 weeks | ${in4} kg | ${(parseFloat(in4) - user.weight).toFixed(1)} kg |
| 8 weeks | ${in8} kg | ${(parseFloat(in8) - user.weight).toFixed(1)} kg |
| 12 weeks | ${in12} kg | ${(parseFloat(in12) - user.weight).toFixed(1)} kg |

**Important notes:**
- 1 kg fat ≈ 7,700 kcal deficit/surplus
- Safe weight loss: 0.5–1 kg/week | Safe gain: 0.25–0.5 kg/week
- Real results vary due to water retention, muscle changes, adherence
- Log weekly weigh-ins (same time, same conditions) on the Health Tracker!

Tip: Type "weight loss" or "weight gain" for a full strategy guide.`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 27. EXERCISE
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'exercise', 'workout', 'gym', 'running', 'yoga', 'cardio', 'strength', 'walk', 'cycling')) {
      reply = `## 🏋️ Exercise Recommendations for ${user.goal}

**Activity level:** ${bold(user.activityLevel)} → ${bold(cal.tdee + ' kcal')} TDEE

${user.goal.includes('Loss')
  ? `**Fat Loss Exercise Plan:**
- 🏃 Cardio: 45 min, 5×/week (brisk walk, cycle, swim) — burns ~300–400 kcal
- 💪 Strength: 3×/week — HIIT circuits, bodyweight or weights
- 🧘 Flexibility: 10 min yoga or stretching daily
- 🎯 Goal: Maintain muscle while losing fat`
  : user.goal.includes('Gain') || user.goal.includes('Muscle')
  ? `**Muscle Gain Exercise Plan:**
- 💪 Strength: 4–5×/week — progressive overload (add weight/reps weekly)
- 🏃 Cardio: 20–30 min, 2×/week (maintain heart health, don't overdo)
- 😴 Rest days: Muscle grows during recovery, not in the gym!
- 🎯 Focus: Compound lifts — squat, deadlift, bench, rows`
  : `**Maintenance Exercise Plan:**
- 🏃 Cardio: 150 min moderate/week (30 min × 5 days)
- 💪 Strength: 2–3×/week to maintain muscle mass
- 🧘 Flexibility + balance work
- 🎯 Consistency > intensity`}

**NEAT (Non-Exercise Activity Thermogenesis):**
Take stairs, park farther, stand desks, walk while on calls — can add 200–400 kcal burn/day!` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 28. FOOD / RECIPE SUGGESTIONS
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'recipe', 'cook', 'food', 'eat', 'meal idea', 'suggest food', 'what should i eat')) {
      reply = `## 🍽️ Personalised Food Suggestions for ${user.name}

**Based on your ${user.foodPreference} diet and ${user.goal} goal (${cal.targetCalories} kcal/day):**

**Quick & Healthy ${user.foodPreference} Recipes:**

${isVeg
  ? `1. **Moong Dal Chilla** (15 min) — 180 kcal, 12g protein
   Soak moong dal → grind → add veggies → pan cook

2. **Tofu Bhurji** (10 min) — 200 kcal, 15g protein
   Crumble tofu + onion + tomato + spices + stir fry

3. **Quinoa Pulao** (20 min) — 280 kcal, 10g protein
   Quinoa + mixed veg + cumin + minimal oil

4. **Greek Yogurt Parfait** (5 min) — 180 kcal, 12g protein
   Curd + banana + granola + honey (light drizzle)

5. **Roasted Chickpea Salad** (10 min) — 220 kcal, 9g protein
   Chickpeas + cucumber + tomato + lemon + spices`
  : `1. **Egg White Omelette** (10 min) — 150 kcal, 18g protein
   3 egg whites + spinach + mushroom + pepper

2. **Grilled Chicken Tikka** (25 min) — 220 kcal, 32g protein
   Marinate chicken + grill/air fry

3. **Tuna Salad** (5 min) — 200 kcal, 25g protein
   Canned tuna + cucumber + lemon + herbs

4. **Fish Curry (light)** (20 min) — 280 kcal, 28g protein
   Fish + tomato-onion gravy + minimal oil

5. **Chicken & Oats Porridge** (15 min) — 350 kcal, 30g protein
   Savoury oats + shredded chicken + herbs`}

💡 **Visit the Meal Planner** page for a full AI-generated meal plan personalised to your exact caloric needs!`;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 29. HELP / WHAT CAN YOU DO
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'help', 'what can you', 'what do you', 'capabilities', 'topics', 'can you help', 'how do you work')) {
      reply = `## 🤖 Nutri Sense AI Assistant — I Can Help With:

**📊 Health Calculations:**
- BMI analysis | BMR calculation | TDEE | Calorie needs

**🥗 Nutrition Guidance:**
- Macronutrients | Micronutrients | Vitamins & minerals
- Protein sources | Healthy carbs | Healthy fats

**🏃 Goal-Based Plans:**
- Weight loss | Weight gain | Muscle building | Maintenance

**🍽️ Diet-Specific:**
- Indian diet | Diabetic diet | Heart-healthy diet
- Vegetarian/Vegan | Food allergies | Sports nutrition

**📅 Meal Planning:**
- Daily meal plans | Snack ideas | Recipe suggestions
- Meal prep tips

**🌱 Lifestyle:**
- Exercise recommendations | Sleep | Stress | Hydration
- Healthy habits | Nutrition myths debunked

**📖 Education:**
- How to read food labels | Nutrition myths
- Pregnancy nutrition | Child nutrition | Elderly nutrition

Just ask me anything! Type topics like:
\`"What's my BMI?"\` | \`"Give me a weight loss plan"\` | \`"Indian diet for diabetes"\``;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 30. MEDICAL / SERIOUS SYMPTOMS — Safety guardrail
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'diagnos', 'symptom', 'disease', 'pain', 'sick', 'medicine', 'drug', 'tablet', 'prescri', 'doctor', 'hospital', 'treatment', 'cure', 'remedy')) {
      reply = `## ⚕️ Medical Query Detected

I'm your **Nutrition & Wellness AI Assistant**, not a medical professional. I'm not qualified to:
- Diagnose diseases or medical conditions
- Prescribe medications or treatments
- Interpret medical test results
- Provide emergency medical advice

**What I can do:**
- Provide general nutrition education
- Offer evidence-based dietary guidelines
- Share lifestyle wellness tips

**For medical concerns, please consult:**
- Your primary care physician (GP)
- A registered dietitian/nutritionist
- A specialist doctor for your specific condition
- **Emergency services (112)** if you're experiencing a medical emergency

I can help you understand the dietary aspects of conditions like diabetes, hypertension, or heart disease — just ask me specifically about "diabetic diet" or "heart-healthy diet"!` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 31. THANK YOU / GOODBYE
    // ──────────────────────────────────────────────────────────────────────────
    else if (has(input, 'thank', 'thanks', 'bye', 'goodbye', 'see you', 'great', 'awesome', 'perfect', 'amazing')) {
      reply = `You're welcome, ${user.name}! 😊

Keep up the great work on your ${bold(user.goal)} journey. Remember:
- 🎯 Daily target: **${cal.targetCalories} kcal**
- 💧 Water: **${waterMl} ml/day**
- 💤 Sleep: **${user.sleepHours || '7-8'} hours**

Feel free to come back anytime you have questions about your nutrition, diet plans, or healthy lifestyle tips. I'm always here to help! 

Stay consistent, stay healthy! 💪🌱`;
    }

    // ── Personalized full summary ───────────────────────────────────────────
    else if (has(input, 'personalized', 'my profile', 'my stats', 'my nutrition', 'full summary', 'recommend for me')) {
      reply = `## 🎯 Your Personalised Nutrition Summary

Hello ${bold(user.name)}! Here's everything tailored to your profile:

| Metric | Value |
|--------|-------|
| Age / Gender | ${user.age} / ${user.gender} |
| Height / Weight | ${user.height} cm / ${user.weight} kg |
| BMI | ${bold(bmi.bmi)} (${bmi.category}) |
| Activity | ${user.activityLevel} |
| Goal | ${bold(user.goal)} |
| Diet | ${user.foodPreference} |

**Daily Targets:**
- 🔥 Calories: ${bold(cal.targetCalories + ' kcal')}
- 🥩 Protein: ${bold(protein_g + 'g')}
- 🍚 Carbs: ${bold(carbs_g + 'g')}
- 🥑 Fats: ${bold(fat_g + 'g')}
- 💧 Water: ${bold(waterMl + ' ml')}

${user.medicalConditions?.filter((c: string) => c !== 'None').length
  ? `**Medical considerations:** ${user.medicalConditions.filter((c: string) => c !== 'None').join(', ')} — dietary adjustments applied where relevant.\n`
  : ''}${user.allergies?.filter((a: string) => a !== 'None').length
  ? `**Allergies noted:** ${user.allergies.filter((a: string) => a !== 'None').join(', ')}\n`
  : ''}
**Meal suggestion for today:**
- Breakfast: ${isVeg ? 'Besan chilla + curd + fruit' : 'Egg omelette + toast + milk'}
- Lunch: Dal + roti + sabzi + salad
- Snack: Almonds + green tea
- Dinner: ${isVeg ? 'Paneer + vegetables + soup' : 'Grilled chicken/fish + vegetables'}

**Lifestyle tip:** Aim for ${user.sleepHours || 7}–8 hours of sleep and 8,000+ daily steps.` + DISCLAIMER;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 32. DEFAULT FALLBACK
    // ──────────────────────────────────────────────────────────────────────────
    else {
      reply = `Hello ${user.name}! I received your message: *"${message}"*

I'm not sure I understood that specific query. Here are some things I can help you with right now:

1. 📊 **"What is my BMI?"** — Get your personalised BMI analysis
2. 🔥 **"How many calories do I need?"** — TDEE + target calories
3. ⚖️ **"Explain my macros"** — Protein, carbs, fat breakdown
4. 🏃 **"Give me a weight loss plan"** — Full personalised strategy
5. 🍽️ **"What should I eat today?"** — Meal suggestions for your goal
6. 💧 **"How much water should I drink?"** — Hydration guide
7. 🌿 **"Vitamins and minerals"** — Micronutrient guide
8. 🇮🇳 **"Indian diet plan"** — Traditional healthy Indian meals
9. 🤖 **"Help"** — See everything I can do

Type any of the above or ask in your own words!`;
    }

    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Chat route error:', error.message);
    res.status(500).json({ success: false, message: 'AI assistant encountered an error. Please try again.' });
  }
});

export default router;
