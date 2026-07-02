import { Router, Response } from 'express';
import { dbWater, dbWeight, dbUsers } from '../utils/dbManager';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import { calculateBMI } from '../utils/aiRecommender';

const router = Router();

// @route   GET api/trackers/water/:date
// @desc    Get water log for a specific date
router.get('/water/:date', protect, async (req: AuthRequest, res: Response) => {
  const { date } = req.params;
  try {
    const logs = await dbWater.find({ userId: req.user._id, date });
    const amount = logs.length > 0 ? logs[0].amount : 0;
    res.json({ success: true, amount });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/trackers/water
// @desc    Log/Update water intake
router.post('/water', protect, async (req: AuthRequest, res: Response) => {
  const { date, amount } = req.body;
  try {
    if (!date || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide date and amount' });
    }
    const log = await dbWater.create({ userId: req.user._id, date, amount });
    res.json({ success: true, log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/trackers/weight
// @desc    Get weight history logs
router.get('/weight', protect, async (req: AuthRequest, res: Response) => {
  try {
    const history = await dbWeight.find({ userId: req.user._id });
    res.json({ success: true, history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/trackers/weight
// @desc    Log weight and auto-calculate BMI
router.post('/weight', protect, async (req: AuthRequest, res: Response) => {
  const { date, weight } = req.body;
  try {
    if (!date || weight === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide date and weight' });
    }

    const user = req.user;
    const height = user.height || 170;

    // Calculate BMI
    const bmiDetails = calculateBMI(height, weight);

    // Save in weight history
    const log = await dbWeight.create({
      userId: user._id,
      date,
      weight,
      bmi: bmiDetails.bmi
    });

    // Also update current weight on User Profile
    await dbUsers.updateById(user._id, { weight });

    res.json({ success: true, log, bmiDetails });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/trackers/analytics
// @desc    Retrieve combined analytics data for Chart.js
router.get('/analytics', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // Fetch weight, water, and default plans
    const weights = await dbWeight.find({ userId });
    const waters = await dbWater.find({ userId });

    // Format data cleanly
    // Weight Trend: Sort by date
    const weightTrend = weights.map((w: any) => ({
      date: w.date,
      weight: w.weight,
      bmi: w.bmi
    }));

    // Water Trend: Sort by date
    const waterTrend = waters.map((w: any) => ({
      date: w.date,
      amount: w.amount
    })).sort((a: any, b: any) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      weightTrend,
      waterTrend
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
