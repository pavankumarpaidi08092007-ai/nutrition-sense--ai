import { Router, Response } from 'express';
import { dbNotifications, dbWater } from '../utils/dbManager';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Apply protect middleware to all routes
router.use(protect);

// @route   GET api/notifications
// @desc    Get all notifications for logged-in user (triggers dynamic reminders)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const settings = req.user.notificationSettings || {
      breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
    };

    // 1. Fetch existing notifications
    let notifications = await dbNotifications.find({ userId });

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Generate dynamic reminders if they don't already exist
    const notificationsByType = new Map<string, any>();
    notifications.forEach(n => {
      // Group by type and date
      const dateStr = new Date(n.createdAt).toISOString().split('T')[0];
      if (dateStr === todayStr) {
        notificationsByType.set(n.type, n);
      }
    });

    const newNotifs = [];

    // A. Seed welcome notification if user has zero notifications at all
    if (notifications.length === 0) {
      const welcome = await dbNotifications.create({
        userId,
        title: 'Welcome to Nutri Sense! 🎉',
        message: `Hello ${req.user.name}, your personalized diagnostic health plan is ready. Head over to the Dashboard to review your BMI analysis and targets.`,
        type: 'general'
      });
      newNotifs.push(welcome);
    }

    // B. Water Hydration Reminder
    if (settings.water && !notificationsByType.has('water')) {
      // Check water logged today
      const waterLogs = await dbWater.find({ userId, date: todayStr });
      const currentAmount = waterLogs.length > 0 ? waterLogs[0].amount : 0;
      const target = req.user.dailyWaterGoal || 3000;

      if (currentAmount < target) {
        const notif = await dbNotifications.create({
          userId,
          title: 'Hydration Check 💧',
          message: `You've logged ${currentAmount}ml of water out of your ${target}ml daily goal. Keep hydrating and log your glasses!`,
          type: 'water'
        });
        newNotifs.push(notif);
      }
    }

    // C. Exercise reminder based on goal
    if (settings.exercise && !notificationsByType.has('exercise')) {
      const goal = (req.user.goal || '').toLowerCase();
      let workoutMessage = 'Don\'t forget to complete and log your daily movement checklist!';
      if (goal.includes('loss')) {
        workoutMessage = 'Ready for a calorie burn? A 30-minute walk or HIIT circuit is recommended today.';
      } else if (goal.includes('gain')) {
        workoutMessage = 'Strength training focus: Lift consistently today to build lean muscle mass.';
      }

      const notif = await dbNotifications.create({
        userId,
        title: 'Daily Movement Challenge 🏋️',
        message: workoutMessage,
        type: 'exercise'
      });
      newNotifs.push(notif);
    }

    // D. Meal planner alert
    if ((settings.breakfast || settings.lunch || settings.dinner) && !notificationsByType.has('meal')) {
      const notif = await dbNotifications.create({
        userId,
        title: 'Diet Meal Log 🥗',
        message: `Log your meals today to ensure you stay within your recommended target intake.`,
        type: 'meal'
      });
      newNotifs.push(notif);
    }

    // E. Sleep recovery advice
    if (settings.sleep && !notificationsByType.has('sleep')) {
      const targetHours = req.user.sleepHours || 8;
      const notif = await dbNotifications.create({
        userId,
        title: 'Rest & Muscle Recovery 😴',
        message: `Plan to get at least ${targetHours} hours of sleep tonight for optimal cellular repair and energy.`,
        type: 'sleep'
      });
      newNotifs.push(notif);
    }

    // If new notifications were seeded, refetch to keep ordered sorting
    if (newNotifs.length > 0) {
      notifications = await dbNotifications.find({ userId });
    }

    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/notifications/read-all
// @desc    Mark all user notifications as read
router.post('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await dbNotifications.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/notifications/:id
// @desc    Delete a notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await (dbNotifications as any).deleteById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/notifications
// @desc    Clear all notifications for a user
router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    await (dbNotifications as any).clearAll(req.user._id);
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
