import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { GoogleAuthModal } from '../components/GoogleAuthModal';
import {
  Activity, Mail, Lock, User, Phone, CheckCircle2, XCircle,
  Eye, EyeOff, ShieldAlert, ArrowRight, Sparkles, KeyRound,
  Check, RefreshCw, Scale, Heart, Flame, Dumbbell, ChevronDown,
  Clock, ShieldCheck, Apple, Salad, Brain, Award
} from 'lucide-react';

interface AuthPageProps {
  defaultTab?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultTab = 'login' }) => {
  const { login, register, googleLogin, guestLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Tab State: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    if (location.pathname.includes('register')) return 'register';
    return defaultTab;
  });

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname.includes('register')) {
      setActiveTab('register');
    } else if (location.pathname.includes('login')) {
      setActiveTab('login');
    }
  }, [location.pathname]);

  // General Loading & Error States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  // --- LOGIN FORM STATE ---
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Auto-restore remembered email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setLoginIdentifier(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // --- REGISTER FORM STATE ---
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Health Profile Fields
  const [regAge, setRegAge] = useState<number>(25);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regHeight, setRegHeight] = useState<number>(170);
  const [regWeight, setRegWeight] = useState<number>(65);
  const [regGoal, setRegGoal] = useState<string>('Healthy Lifestyle');
  const [regActivityLevel, setRegActivityLevel] = useState<string>('Moderately Active');

  // Touched Field Tracking for showing errors below fields
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Username Uniqueness State
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Post Registration Success Modal State
  const [registeredSuccessUser, setRegisteredSuccessUser] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  // --- FORGOT PASSWORD MODAL STATE ---
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  // Debounced username availability check
  useEffect(() => {
    if (!regUsername || regUsername.length < 4 || /\s/.test(regUsername)) {
      setUsernameAvailable(null);
      return;
    }
    const cleanUser = regUsername.trim().toLowerCase();

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(cleanUser)}`);
        setUsernameAvailable(res.data?.available ?? true);
      } catch (err) {
        setUsernameAvailable(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regUsername]);

  // --- STRICT VALIDATION RULES & INLINE MESSAGES ---

  // 1. Full Name: Required, Min 3 chars
  const nameError = useMemo(() => {
    if (!regFullName) return 'Full name is required';
    if (regFullName.trim().length < 3) return 'Name must be at least 3 characters long';
    return null;
  }, [regFullName]);

  // 2. Username: Required, Min 4 chars, No spaces
  const usernameError = useMemo(() => {
    if (!regUsername) return 'Username is required';
    if (regUsername.length < 4) return 'Username must be at least 4 characters';
    if (/\s/.test(regUsername)) return 'Username cannot contain spaces';
    if (usernameAvailable === false) return 'Username is already taken';
    return null;
  }, [regUsername, usernameAvailable]);

  // 3. Contact Number: Required, Only numbers, 10–15 digits
  const phoneError = useMemo(() => {
    if (!regPhone) return 'Contact number is required';
    const clean = regPhone.trim().replace(/[-()\s]/g, '');
    if (!/^[0-9]+$/.test(clean)) return 'Contact number must contain only numbers';
    if (clean.length < 10 || clean.length > 15) return 'Contact number must be between 10 and 15 digits';
    return null;
  }, [regPhone]);

  // 4. Email Address: Valid email format
  const emailError = useMemo(() => {
    if (!regEmail) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) return 'Please enter a valid email address';
    return null;
  }, [regEmail]);

  // 5. Password Criteria Checklist & Error
  const passwordCriteria = useMemo(() => {
    return {
      minLen: regPassword.length >= 8,
      uppercase: /[A-Z]/.test(regPassword),
      lowercase: /[a-z]/.test(regPassword),
      number: /[0-9]/.test(regPassword),
      special: /[!@#$%^&*(),.?":{}|<>_]/.test(regPassword),
    };
  }, [regPassword]);

  const passwordStrengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLen) score += 25;
    if (passwordCriteria.uppercase) score += 25;
    if (passwordCriteria.lowercase) score += 25;
    if (passwordCriteria.number) score += 25;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrengthScore === 0) return { label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-400' };
    if (passwordStrengthScore <= 50) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (passwordStrengthScore <= 75) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  }, [passwordStrengthScore]);

  const passwordError = useMemo(() => {
    if (!regPassword) return 'Password is required';
    if (regPassword.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(regPassword)) return 'Must contain at least one uppercase letter';
    if (!/[a-z]/.test(regPassword)) return 'Must contain at least one lowercase letter';
    if (!/[0-9]/.test(regPassword)) return 'Must contain at least one number';
    return null;
  }, [regPassword]);

  // 6. Confirm Password Match
  const confirmPasswordError = useMemo(() => {
    if (!regConfirmPassword) return 'Please confirm your password';
    if (regPassword !== regConfirmPassword) return 'Passwords do not match';
    return null;
  }, [regPassword, regConfirmPassword]);

  // Form Overall Validity
  const isRegisterFormValid = !nameError && !usernameError && !phoneError && !emailError && !passwordError && !confirmPasswordError;

  // --- HANDLERS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast('Please enter your username/email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const success = await login(loginIdentifier, loginPassword);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginIdentifier.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        showToast(`Welcome back, ${loginIdentifier.split('@')[0]}!`, 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Invalid username/email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all touched to trigger field validation messages
    setTouched({
      name: true, username: true, phone: true, email: true, password: true, confirmPassword: true
    });

    if (!isRegisterFormValid) {
      const firstErr = nameError || usernameError || phoneError || emailError || passwordError || confirmPasswordError;
      showToast(firstErr || 'Please resolve validation errors before submitting.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        phone: regPhone.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        age: Number(regAge),
        gender: regGender,
        height: Number(regHeight),
        weight: Number(regWeight),
        goal: regGoal,
        activityLevel: regActivityLevel,
      };

      const success = await register(payload);
      if (success) {
        setRegisteredSuccessUser(regFullName.trim());
        showToast('Account created successfully!', 'success');
        
        let count = 3;
        setRedirectCountdown(3);
        const timer = setInterval(() => {
          count -= 1;
          setRedirectCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setRegisteredSuccessUser(null);
            setActiveTab('login');
            setLoginIdentifier(regEmail.trim() || regUsername.trim());
          }
        }, 1000);
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed due to server error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (selectedEmail: string, selectedName: string) => {
    setGoogleLoading(true);
    try {
      const success = await googleLogin(selectedEmail, selectedName);
      if (success) {
        showToast(`Welcome back, ${selectedName}!`, 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      showToast(err.message || 'Google Authentication failed.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Quick Demo Fills
  const fillDemoUser = () => {
    setLoginIdentifier('rahul_sharma');
    setLoginPassword('password123');
    setRememberMe(true);
    showToast('Demo Username credentials filled', 'info');
  };

  const fillDemoAdmin = () => {
    setLoginIdentifier('admin_sys');
    setLoginPassword('admin123');
    setRememberMe(true);
    showToast('Demo Admin credentials filled', 'info');
  };

  const generateQuickRegisterUser = () => {
    const r = Math.floor(1000 + Math.random() * 9000);
    setRegFullName(`Alex River ${r}`);
    setRegUsername(`alex_river_${r}`);
    setRegPhone(`98765${r}123`);
    setRegEmail(`alex${r}@nutrisense.com`);
    setRegPassword('NutriPass123!');
    setRegConfirmPassword('NutriPass123!');
    setRegAge(26);
    setRegHeight(175);
    setRegWeight(72);
    setRegGoal('Healthy Lifestyle');
    setRegActivityLevel('Moderately Active');
    showToast('Generated fresh valid test user profile!', 'info');
  };

  // --- FORGOT PASSWORD FLOW HANDLERS ---
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (res.data?.success) {
        setForgotMessage(`6-digit OTP code sent! Demo Code: "${res.data.otp || '123456'}"`);
        showToast('OTP sent to your email', 'success');
        setForgotStep('otp');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to request OTP code', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length < 6) {
      showToast('Please enter 6-digit OTP code', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: forgotEmail, otp: forgotOtp });
      if (res.data?.success) {
        showToast('OTP verified successfully!', 'success');
        setForgotStep('password');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP code', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });
      if (res.data?.success) {
        showToast('Password reset successfully!', 'success');
        setForgotStep('success');
        setTimeout(() => {
          setIsForgotModalOpen(false);
          setActiveTab('login');
          setLoginIdentifier(forgotEmail);
        }, 2000);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center min-h-[92vh] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">

      {/* Background Gradient Orbs & Subtle Grid */}
      <div className="absolute top-0 right-1/3 w-[35rem] h-[35rem] bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-0 left-1/4 w-[35rem] h-[35rem] bg-sky-400/15 dark:bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000" />

      {/* Floating Healthy Lifestyle Badges (Decorative Illustrations) */}
      <div className="hidden lg:block absolute top-24 left-12 z-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-xl flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Salad className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-800 dark:text-white">AI Personalized Diets</span>
            <span className="block text-[10px] text-slate-500">Tailored macronutrient goals</span>
          </div>
        </motion.div>
      </div>

      <div className="hidden lg:block absolute bottom-24 right-12 z-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-xl flex items-center gap-3"
        >
          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-800 dark:text-white">Smart Nutrition Tracking</span>
            <span className="block text-[10px] text-slate-500">Real-time BMI & calories score</span>
          </div>
        </motion.div>
      </div>

      {/* Top Header & Website Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-3 group mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-[16px] bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent">
            NUTRI<span className="text-slate-800 dark:text-white font-bold"> SENSE</span>
          </span>
        </Link>
      </div>

      {/* Main Glassmorphism Card (20px Rounded) */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl py-8 px-6 sm:px-9 rounded-[20px] border border-white/50 dark:border-slate-800 shadow-2xl shadow-emerald-500/5 relative overflow-hidden transition-all"
        >
          {/* Top Decorative Gradient Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

          {/* TAB SWITCHER */}
          <div className="relative flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50 mb-6">
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20"
              initial={false}
              animate={{
                left: activeTab === 'login' ? '0.25rem' : '50%',
                width: 'calc(50% - 0.25rem)'
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                navigate('/login', { replace: true });
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg z-10 transition-colors duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'login' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Login
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                navigate('/register', { replace: true });
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-lg z-10 transition-colors duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'register' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Register
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* =================================================== */}
            {/* LOGIN PAGE */}
            {/* =================================================== */}
            {activeTab === 'login' ? (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Title & Subtitle */}
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    Welcome Back
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Login to continue your healthy journey.
                  </p>
                </div>

                {/* Quick Demo Preset Credentials */}
                <div className="bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 space-y-1.5">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
                    ⚡ Quick Test Credentials
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={fillDemoUser}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-400/20 transition-all flex items-center justify-center gap-1"
                    >
                      <User className="w-3 h-3" /> User Demo
                    </button>
                    <button
                      type="button"
                      onClick={fillDemoAdmin}
                      className="py-1.5 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold border border-sky-400/20 transition-all flex items-center justify-center gap-1"
                    >
                      <KeyRound className="w-3 h-3" /> Admin Demo
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Field 1: Username / Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Enter your username or email"
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options: Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 font-medium text-slate-600 dark:text-slate-400">Remember Me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button (Full Width) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 glow-btn-green"
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Login <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider: OR */}
                <div className="relative flex items-center my-3">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">OR</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  disabled={googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2.5"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Bottom Text */}
                <div className="pt-2 text-center border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        navigate('/register', { replace: true });
                      }}
                      className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Register
                    </button>
                  </span>
                </div>
              </motion.div>
            ) : (
              /* =================================================== */
              /* REGISTER PAGE */
              /* =================================================== */
              <motion.div
                key="register-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Title & Subtitle */}
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                    Create Your Account
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Join NutriSense and start your personalized nutrition journey.
                  </p>
                </div>

                {/* Quick Generator Preset */}
                <div className="bg-slate-100/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
                  <div className="text-left">
                    <span className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Quick Test Profile</span>
                    <span className="block text-[10px] text-slate-400">Autofill valid registration fields</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateQuickRegisterUser}
                    className="py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-400/20 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Generate
                  </button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {/* Field 1: Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onBlur={() => markTouched('name')}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="John Doe"
                        className={`w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.name && nameError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      {regFullName && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          {!nameError ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.name && nameError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {nameError}
                      </span>
                    )}
                  </div>

                  {/* Field 2: Username */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="text-xs font-extrabold text-slate-400">@</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onBlur={() => markTouched('username')}
                        onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                        placeholder="johndoe123 (Min 4 chars, no spaces)"
                        className={`w-full text-xs sm:text-sm pl-8 pr-8 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.username && usernameError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      {regUsername && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                          {isCheckingUsername ? (
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                          ) : !usernameError ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.username && usernameError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {usernameError}
                      </span>
                    )}
                  </div>

                  {/* Field 3: Contact Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onBlur={() => markTouched('phone')}
                        onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="10 to 15 digits (e.g. 9876543210)"
                        className={`w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.phone && phoneError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      {regPhone && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          {!phoneError ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.phone && phoneError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {phoneError}
                      </span>
                    )}
                  </div>

                  {/* Field 4: Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onBlur={() => markTouched('email')}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="john@example.com"
                        className={`w-full text-xs sm:text-sm pl-9 pr-8 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.email && emailError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      {regEmail && (
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          {!emailError ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {touched.email && emailError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {emailError}
                      </span>
                    )}
                  </div>

                  {/* Field 5: Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onBlur={() => markTouched('password')}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                        className={`w-full text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.password && passwordError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* PASSWORD STRENGTH INDICATOR */}
                    {regPassword.length > 0 && (
                      <div className="mt-2 space-y-1 p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] font-bold text-slate-500">Password Strength:</span>
                          <span className={`text-[10px] font-black ${passwordStrengthLabel.text}`}>
                            {passwordStrengthLabel.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrengthLabel.color} transition-all duration-300`}
                            style={{ width: `${passwordStrengthScore}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {touched.password && passwordError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {passwordError}
                      </span>
                    )}
                  </div>

                  {/* Field 6: Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onBlur={() => markTouched('confirmPassword')}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full text-xs sm:text-sm pl-9 pr-9 py-2.5 rounded-xl border bg-white/90 dark:bg-slate-900/90 focus:outline-none transition-all font-medium ${
                          touched.confirmPassword && confirmPasswordError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'border-slate-250 dark:border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {touched.confirmPassword && confirmPasswordError && (
                      <span className="text-[10px] font-bold text-rose-500 mt-1 block flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> {confirmPasswordError}
                      </span>
                    )}
                  </div>

                  {/* Create Account Button (Full Width) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 glow-btn-green"
                  >
                    {loading ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Create Account <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider: OR */}
                <div className="relative flex items-center my-3">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold">OR</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  disabled={googleLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2.5"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Bottom Text */}
                <div className="pt-2 text-center border-t border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        navigate('/login', { replace: true });
                      }}
                      className="font-bold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      Login
                    </button>
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* REGISTRATION SUCCESS POPUP MODAL */}
      <AnimatePresence>
        {registeredSuccessUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="max-w-md w-full p-8 rounded-[20px] bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-2xl text-center space-y-4 relative"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                🎉 Welcome to NutriSense!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                Your account <span className="font-bold text-emerald-500">{registeredSuccessUser}</span> has been created successfully.
              </p>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Redirecting to Login tab in {redirectCountdown} seconds...</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRegisteredSuccessUser(null);
                  setActiveTab('login');
                  setLoginIdentifier(regEmail || regUsername);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs"
              >
                Go to Sign In Now
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full p-6 sm:p-8 rounded-[20px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    Password Reset Flow
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Steps Indicator */}
              <div className="flex items-center justify-between text-[11px] font-bold border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className={forgotStep === 'email' ? 'text-emerald-500' : 'text-slate-400'}>1. Email</span>
                <span className={forgotStep === 'otp' ? 'text-emerald-500' : 'text-slate-400'}>2. Verify OTP</span>
                <span className={forgotStep === 'password' ? 'text-emerald-500' : 'text-slate-400'}>3. New Password</span>
              </div>

              {/* STEP 1: ENTER EMAIL */}
              {forgotStep === 'email' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your registered email address to receive a 6-digit OTP reset code.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs"
                  >
                    {forgotLoading ? 'Sending Code...' : 'Send OTP Code'}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}
              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {forgotMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold">
                      {forgotMessage}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the 6-digit verification code sent to <span className="font-bold text-slate-800 dark:text-white">{forgotEmail}</span>.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">6-Digit OTP Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      className="w-full text-lg tracking-widest text-center p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900 font-black focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs"
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify OTP Code'}
                  </button>
                </form>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {forgotStep === 'password' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full text-xs p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </form>
              )}

              {/* STEP 4: SUCCESS */}
              {forgotStep === 'success' && (
                <div className="text-center space-y-3 py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-extrabold text-slate-800 dark:text-white">Password Updated!</h4>
                  <p className="text-xs text-slate-500">Redirecting to Login tab...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleSelectAccount}
      />
    </div>
  );
};
