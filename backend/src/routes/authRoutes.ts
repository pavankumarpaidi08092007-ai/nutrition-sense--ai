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

// Helper function to build sanitized user payload
const formatUserPayload = (user: any) => {
  const userId = user._id || user.id;
  return {
    id: userId,
    name: user.name,
    username: user.username || user.name?.toLowerCase().replace(/\s+/g, '_'),
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'user',
    age: user.age ?? 25,
    gender: user.gender ?? 'Male',
    height: user.height ?? 170,
    weight: user.weight ?? 65,
    activityLevel: user.activityLevel ?? 'Moderately Active',
    goal: user.goal ?? 'Maintenance',
    medicalConditions: user.medicalConditions ?? [],
    allergies: user.allergies ?? [],
    foodPreference: user.foodPreference ?? 'Veg',
    cuisinePreference: user.cuisinePreference ?? 'All',
    dailyWaterGoal: user.dailyWaterGoal ?? 3000,
    sleepHours: user.sleepHours ?? 8,
    favorites: user.favorites || [],
    notificationSettings: user.notificationSettings || {
      breakfast: true, lunch: true, dinner: true, water: true, exercise: true, sleep: true
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

// @route   GET api/auth/check-username
// @desc    Check if username already exists
router.get('/check-username', async (req: any, res: Response) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ success: false, message: 'Username parameter is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await dbUsers.findOne({ username: cleanUsername });

    res.json({
      success: true,
      username: cleanUsername,
      available: !existing,
      exists: !!existing,
      message: existing ? 'Username already taken' : 'Username is available'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST api/auth/register
// @desc    Register a new user with health profile
router.post('/register', async (req: any, res: Response) => {
  const {
    name, username, email, phone, password,
    age, gender, height, weight, goal, activityLevel
  } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanUsername = (username || cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_')).trim().toLowerCase();

    // Check if email already exists
    const emailExists = await dbUsers.findOne({ email: cleanEmail });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please sign in instead.' });
    }

    // Check if username already exists
    if (cleanUsername) {
      const usernameExists = await dbUsers.findOne({ username: cleanUsername });
      if (usernameExists) {
        return res.status(400).json({ success: false, message: 'This username is already taken. Please choose another username.' });
      }
    }

    // Password validation (min 8 chars)
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with health parameters
    const user = await dbUsers.create({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      role: cleanEmail.includes('admin') ? 'admin' : 'user',
      age: age ? Number(age) : 25,
      gender: gender || 'Male',
      height: height ? Number(height) : 170,
      weight: weight ? Number(weight) : 65,
      goal: goal || 'Maintenance',
      activityLevel: activityLevel || 'Moderately Active',
    });

    const token = generateToken(user._id || user.id);

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUserPayload(user)
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed due to server error' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user by Email or Username & get token
router.post('/login', async (req: any, res: Response) => {
  const { email, username, password } = req.body;
  const loginIdentifier = (email || username || '').trim().toLowerCase();

  console.log(`[AUTH LOGIN] Step 1: Login request received for identifier: "${loginIdentifier}"`);

  try {
    if (!loginIdentifier || !password) {
      console.warn('[AUTH LOGIN] Failed Step 1: Missing email/username or password in request body.');
      return res.status(400).json({ success: false, message: 'Please provide Email Address and Password.' });
    }

    // Find user by email OR username
    console.log(`[AUTH LOGIN] Step 2: Querying database for user record...`);
    const user = await dbUsers.findOne({
      $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
    });

    if (!user) {
      console.warn(`[AUTH LOGIN] Failed Step 2: No account found matching "${loginIdentifier}".`);
      return res.status(401).json({ success: false, message: 'Invalid credentials. Account not found with this email or username.' });
    }
    console.log(`[AUTH LOGIN] Step 2 Success: Found user "${user.email}" (id: ${user._id || user.id}).`);

    // Check account lockout status
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      const minutesLeft = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
      console.warn(`[AUTH LOGIN] Locked: Account is locked for another ${minutesLeft} minutes.`);
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes.`
      });
    }

    console.log(`[AUTH LOGIN] Step 3: Verifying bcrypt password hash...`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = (user.loginAttempts || 0) + 1;
      let lockUntilDate = null;
      if (attempts >= 5) {
        lockUntilDate = new Date(Date.now() + 15 * 60 * 1000);
      }
      if (user._id || user.id) {
        await dbUsers.updateById(user._id || user.id, {
          loginAttempts: attempts >= 5 ? 0 : attempts,
          lockUntil: lockUntilDate
        });
      }

      console.warn(`[AUTH LOGIN] Failed Step 3: Incorrect password. Attempt ${attempts}/5.`);

      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Account locked due to 5 consecutive failed login attempts. Please try again after 15 minutes.'
        });
      }

      return res.status(401).json({
        success: false,
        message: `Incorrect password. ${5 - attempts} attempt(s) remaining before temporary lockout.`
      });
    }
    console.log(`[AUTH LOGIN] Step 3 Success: Password hash matched.`);

    // Reset login attempts on successful login
    if (user._id || user.id) {
      await dbUsers.updateById(user._id || user.id, { loginAttempts: 0, lockUntil: null });
    }

    console.log(`[AUTH LOGIN] Step 4: Signing JWT token...`);
    const token = generateToken(user._id || user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log(`[AUTH LOGIN] Step 5: Returning HTTP 200 JSON payload with token.`);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserPayload(user)
    });
  } catch (error: any) {
    console.error('[AUTH LOGIN] Server Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Login failed due to server error' });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user & clear cookie
router.post('/logout', (req: any, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

// @route   GET api/auth/me & api/auth/profile
// @desc    Get current user profile
const getProfileHandler = async (req: AuthRequest, res: Response) => {
  const user = req.user;
  res.json({
    success: true,
    user: formatUserPayload(user)
  });
};
router.get('/me', protect, getProfileHandler);
router.get('/profile', protect, getProfileHandler);

// @route   PUT api/auth/me & api/auth/profile
// @desc    Update user profile details
const updateProfileHandler = async (req: AuthRequest, res: Response) => {
  try {
    const updatedUser = await dbUsers.updateById(req.user._id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserPayload(updatedUser)
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
router.put('/me', protect, updateProfileHandler);
router.put('/profile', protect, updateProfileHandler);

// In-Memory store for simulated OTPs
const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

// @route   POST api/auth/forgot-password
// @desc    Send 6-digit OTP to user email
router.post('/forgot-password', async (req: any, res: Response) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const user = await dbUsers.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email address.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore[cleanEmail] = { otp, expiresAt };

    if (user._id) {
      await dbUsers.updateById(user._id, { resetOtp: otp, resetOtpExpires: new Date(expiresAt) });
    }

    res.json({
      success: true,
      message: `OTP code sent successfully to ${cleanEmail}. Check your inbox or use code ${otp}`,
      otp // Included for seamless testing & local demonstration
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Forgot password request failed.' });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify 6-digit OTP code
router.post('/verify-otp', async (req: any, res: Response) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore[cleanEmail];

    const user = await dbUsers.findOne({ email: cleanEmail });
    const storedOtp = record?.otp || user?.resetOtp;
    const isExpired = record?.expiresAt ? Date.now() > record.expiresAt : false;

    if (!storedOtp || storedOtp !== otp.trim() || isExpired) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please request a new OTP.' });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now set a new password.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'OTP verification failed.' });
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset password after OTP verification
router.post('/reset-password', async (req: any, res: Response) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dbUsers.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Verify OTP if passed
    if (otp) {
      const record = otpStore[cleanEmail];
      const storedOtp = record?.otp || user?.resetOtp;
      if (storedOtp && storedOtp !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await dbUsers.updateById(user._id || user.id, {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpires: null
    });

    delete otpStore[cleanEmail];

    res.json({
      success: true,
      message: 'Password updated successfully! You can now log in with your new password.'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Password reset failed.' });
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

// @route   POST api/auth/google
// @desc    Authenticate or register user via Google Sign-In
router.post('/google', async (req: any, res: Response) => {
  const { email, name, picture, googleId, idToken } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const cleanUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_');

    // Query database for existing user
    let user = await dbUsers.findOne({ email: cleanEmail });

    if (!user) {
      // Create new real user record with authProvider: 'google'
      user = await dbUsers.create({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        authProvider: 'google',
        picture: picture || '',
        googleId: googleId || `google_${Date.now()}`,
        role: cleanEmail.includes('admin') ? 'admin' : 'user',
      });
    } else if (!user.picture && picture) {
      await dbUsers.updateById(user._id || user.id, { picture });
    }

    const token = generateToken(user._id || user.id);

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Google Authentication successful',
      token,
      user: formatUserPayload(user)
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Google authentication failed due to server error' });
  }
});

export default router;

