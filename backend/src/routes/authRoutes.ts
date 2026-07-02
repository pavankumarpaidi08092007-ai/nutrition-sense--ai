import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbUsers } from '../utils/dbManager';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_nutrisense_key_2026', {
    expiresIn: '30d',
  });
};

// @route   POST api/auth/register
// @desc    Register a new user
router.post('/register', async (req: any, res: Response) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }

    // Check if user already exists
    const userExists = await dbUsers.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default profile parameters
    const user = await dbUsers.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: email.toLowerCase().includes('admin') ? 'admin' : 'user', // auto-grant admin if email contains 'admin'
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        goal: user.goal,
        medicalConditions: user.medicalConditions,
        allergies: user.allergies,
        foodPreference: user.foodPreference,
        cuisinePreference: user.cuisinePreference,
        dailyWaterGoal: user.dailyWaterGoal,
        sleepHours: user.sleepHours,
        favorites: user.favorites || [],
        notificationSettings: user.notificationSettings
      }
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req: any, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await dbUsers.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        goal: user.goal,
        medicalConditions: user.medicalConditions,
        allergies: user.allergies,
        foodPreference: user.foodPreference,
        cuisinePreference: user.cuisinePreference,
        dailyWaterGoal: user.dailyWaterGoal,
        sleepHours: user.sleepHours,
        favorites: user.favorites || [],
        notificationSettings: user.notificationSettings
      }
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  const user = req.user;
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goal: user.goal,
      medicalConditions: user.medicalConditions,
      allergies: user.allergies,
      foodPreference: user.foodPreference,
      cuisinePreference: user.cuisinePreference,
      dailyWaterGoal: user.dailyWaterGoal,
      sleepHours: user.sleepHours,
      favorites: user.favorites || [],
      notificationSettings: user.notificationSettings
    }
  });
});

// @route   PUT api/auth/me
// @desc    Update user profile details
router.put('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    const updatedUser = await dbUsers.updateById(req.user._id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        age: updatedUser.age,
        gender: updatedUser.gender,
        height: updatedUser.height,
        weight: updatedUser.weight,
        activityLevel: updatedUser.activityLevel,
        goal: updatedUser.goal,
        medicalConditions: updatedUser.medicalConditions,
        allergies: updatedUser.allergies,
        foodPreference: updatedUser.foodPreference,
        cuisinePreference: updatedUser.cuisinePreference,
        dailyWaterGoal: updatedUser.dailyWaterGoal,
        sleepHours: updatedUser.sleepHours,
        favorites: updatedUser.favorites || [],
        notificationSettings: updatedUser.notificationSettings
      }
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Request forgot password code
router.post('/forgot-password', async (req: any, res: Response) => {
  const { email } = req.body;
  try {
    const user = await dbUsers.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email' });
    }
    // Simulation: Return success and a mock code
    res.json({
      success: true,
      message: 'Password reset instructions sent. Please check your inbox.',
      resetCode: '123456' // Simple mock code for development testing
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password with reset code
router.post('/reset-password', async (req: any, res: Response) => {
  const { email, code, newPassword } = req.body;
  try {
    if (code !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
    }
    const user = await dbUsers.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await dbUsers.updateById(user._id, { password: hashedPassword });
    res.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE api/auth/me
// @desc    Delete user account
router.delete('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    await dbUsers.deleteById(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
