import { Router, Response } from 'express';
import { dbFoods, dbMealPlans } from '../utils/dbManager';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { 
  calculateBMI, 
  calculateCaloricNeeds, 
  calculateMacros, 
  generateDailyMealPlan, 
  predictWeightHistory,
  getHealthInsights
} from '../utils/aiRecommender';

const router = Router();

// @route   GET api/recommendations/stats
// @desc    Retrieve calculated BMI, BMR, TDEE, Macros and health metrics
router.get('/stats', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    const bmiDetails = calculateBMI(user.height, user.weight);
    const caloricNeeds = calculateCaloricNeeds(user);
    const macros = calculateMacros(caloricNeeds.targetCalories, user);
    const insights = getHealthInsights(user, bmiDetails.category);

    res.json({
      success: true,
      stats: {
        bmi: bmiDetails.bmi,
        bmiCategory: bmiDetails.category,
        bmiRisk: bmiDetails.riskLevel,
        bmiSuggestions: bmiDetails.suggestions,
        healthyRange: bmiDetails.healthyRange,
        bmr: caloricNeeds.bmr,
        tdee: caloricNeeds.tdee,
        targetCalories: caloricNeeds.targetCalories,
        calorieOptions: {
          maintenance: caloricNeeds.maintenanceCalories,
          weightLoss: caloricNeeds.weightLossCalories,
          weightGain: caloricNeeds.weightGainCalories
        },
        macros,
        insights
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/recommendations/meals
// @desc    Generate a daily meal plan recommendation
router.get('/meals', protect, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    
    // Fetch all foods in database (Mongoose or in-memory)
    const foods = await dbFoods.find({});
    
    // Generate recommendation
    const recommendation = generateDailyMealPlan(foods, user);

    res.json({
      success: true,
      recommendation
    });
  } catch (error: any) {
    console.error('Meal Generation Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/recommendations/predictions
// @desc    Retrieve 8-week weight forecast based on goal
router.get('/predictions', protect, async (req: AuthRequest, res: Response) => {
  try {
    const predictions = predictWeightHistory(req.user);
    res.json({ success: true, predictions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/recommendations/mealplans
// @desc    Save/Bookmark a meal plan
router.post('/mealplans', protect, async (req: AuthRequest, res: Response) => {
  const { name, date, targetCalories, meals } = req.body;
  try {
    if (!name || !date || !targetCalories || !meals) {
      return res.status(400).json({ success: false, message: 'Please provide name, date, targetCalories, and meals' });
    }

    const savedPlan = await dbMealPlans.create({
      userId: req.user._id,
      name,
      date,
      targetCalories,
      meals,
      isBookmarked: true
    });

    res.status(201).json({ success: true, mealPlan: savedPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/recommendations/mealplans
// @desc    Get saved/bookmarked meal plans
router.get('/mealplans', protect, async (req: AuthRequest, res: Response) => {
  try {
    const plans = await dbMealPlans.find({ userId: req.user._id, isBookmarked: true });
    res.json({ success: true, mealPlans: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/recommendations/mealplans/:id
// @desc    Delete a bookmarked meal plan
router.delete('/mealplans/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await dbMealPlans.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }
    res.json({ success: true, message: 'Meal plan removed from bookmarks' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
