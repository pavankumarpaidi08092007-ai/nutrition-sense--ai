import { Router, Response } from 'express';
import { dbUsers, dbFoods } from '../utils/dbManager';
import { protect, adminOnly, AuthRequest } from '../middleware/authMiddleware';
import { calculateBMI } from '../utils/aiRecommender';

const router = Router();

// Apply protect & adminOnly globally to this router
router.use(protect);
router.use(adminOnly);

// @route   GET api/admin/stats
// @desc    Retrieve admin dashboard aggregate statistics
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const users = await dbUsers.find({});
    const foods = await dbFoods.find({});

    // 1. Calculate average stats
    let totalBmi = 0;
    let usersWithBmiCount = 0;
    let genderCounts: any = { Male: 0, Female: 0, Other: 0 };
    let goalCounts: any = {};
    let preferenceCounts: any = { Veg: 0, 'Non-Veg': 0, Eggitarian: 0, Vegan: 0 };

    users.forEach((u: any) => {
      if (u.height && u.weight) {
        const bmi = u.weight / Math.pow(u.height / 100, 2);
        totalBmi += bmi;
        usersWithBmiCount++;
      }
      
      if (u.gender) genderCounts[u.gender] = (genderCounts[u.gender] || 0) + 1;
      if (u.goal) goalCounts[u.goal] = (goalCounts[u.goal] || 0) + 1;
      if (u.foodPreference) preferenceCounts[u.foodPreference] = (preferenceCounts[u.foodPreference] || 0) + 1;
    });

    const averageBmi = usersWithBmiCount > 0 ? parseFloat((totalBmi / usersWithBmiCount).toFixed(1)) : 0;

    // 2. Food category stats
    const foodCategoryCounts: any = {};
    foods.forEach((f: any) => {
      foodCategoryCounts[f.category] = (foodCategoryCounts[f.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalUsers: users.length,
        totalFoods: foods.length,
        averageBmi,
        genderCounts,
        goalCounts,
        preferenceCounts,
        foodCategoryCounts
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/admin/users
// @desc    List all registered users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await dbUsers.find({});
    // Exclude passwords
    const sanitizedUsers = users.map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      age: u.age,
      gender: u.gender,
      height: u.height,
      weight: u.weight,
      activityLevel: u.activityLevel,
      goal: u.goal,
      medicalConditions: u.medicalConditions,
      createdAt: u.createdAt
    }));
    res.json({ success: true, users: sanitizedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await dbUsers.deleteById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User account successfully deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
