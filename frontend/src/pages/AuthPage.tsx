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
  Clock, ShieldCheck
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
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Health Profile Fields
  const [regAge, setRegAge] = useState<number>(25);
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [regHeight, setRegHeight] = useState<number>(170);
  const [regWeight, setRegWeight] = useState<number>(65);
  const [regGoal, setRegGoal] = useState<string>('Maintenance');
  const [regActivityLevel, setRegActivityLevel] = useState<string>('Moderately Active');

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
    if (!regUsername || regUsername.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const cleanUser = regUsername.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      setUsernameAvailable(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(cleanUser)}`);
        setUsernameAvailable(res.data?.available ?? true);
      } catch (err) {
        setUsernameAvailable(true); // Fallback assumption
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regUsername]);

  // --- REAL-TIME VALIDATIONS ---
  const isNameValid = useMemo(() => regFullName.trim().length >= 3, [regFullName]);
  const isUsernameValid = useMemo(() => {
    if (!regUsername) return false;
    const clean = regUsername.trim();
    return clean.length >= 3 && /^[a-zA-Z0-9_]+$/.test(clean) && usernameAvailable !== false;
  }, [regUsername, usernameAvailable]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());
  }, [regEmail]);

  // Password Requirements Checklist
  const passwordCriteria = useMemo(() => {
    return {
      minLen: regPassword.length >= 8,
      uppercase: /[A-Z]/.test(regPassword),
      lowercase: /[a-z]/.test(regPassword),
      number: /[0-9]/.test(regPassword),
      special: /[!@#$%^&*(),.?":{}|<>_]/.test(regPassword),
    };
  }, [regPassword]);

  // Password Strength Score (0 to 100%)
  const passwordStrengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLen) score += 20;
    if (passwordCriteria.uppercase) score += 20;
    if (passwordCriteria.lowercase) score += 20;
    if (passwordCriteria.number) score += 20;
    if (passwordCriteria.special) score += 20;
    return score;
  }, [passwordCriteria]);

  const passwordStrengthLabel = useMemo(() => {
    if (passwordStrengthScore === 0) return { label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-400' };
    if (passwordStrengthScore <= 40) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (passwordStrengthScore <= 80) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  }, [passwordStrengthScore]);

  const isPasswordValid = useMemo(() => passwordStrengthScore >= 80, [passwordStrengthScore]);
  const isConfirmMatch = useMemo(() => regConfirmPassword.length > 0 && regPassword === regConfirmPassword, [regPassword, regConfirmPassword]);

  // Overall registration form valid check
  const isRegisterFormValid = isNameValid && isUsernameValid && isEmailValid && isPasswordValid && isConfirmMatch;

  // --- HANDLERS ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      showToast('Please enter your email or username and password', 'error');
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
      showToast(err.message || 'Invalid credentials or server error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRegisterFormValid) {
      if (!isNameValid) showToast('Full name must be at least 3 characters.', 'error');
      else if (!isUsernameValid) showToast('Please enter a valid unique username.', 'error');
      else if (!isEmailValid) showToast('Please enter a valid email address.', 'error');
      else if (!isPasswordValid) showToast('Password is too weak. Meet strength criteria.', 'error');
      else if (!isConfirmMatch) showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
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
        
        // Start 3-second countdown to switch to Login tab
        let count = 3;
        setRedirectCountdown(3);
        const timer = setInterval(() => {
          count -= 1;
          setRedirectCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            setRegisteredSuccessUser(null);
            setActiveTab('login');
            setLoginIdentifier(regEmail.trim());
          }
        }, 1000);
      }
    } catch (err: any) {
      showToast(err.message || 'Registration failed due to network or server error.', 'error');
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

  // Quick Demo Preset Fills
  const fillDemoUser = () => {
    setLoginIdentifier('rahul@example.com');
    setLoginPassword('password123');
    setRememberMe(true);
    showToast('Demo User credentials filled', 'info');
  };

  const fillDemoAdmin = () => {
    setLoginIdentifier('admin@nutrisense.com');
    setLoginPassword('admin123');
    setRememberMe(true);
    showToast('Demo Admin credentials filled', 'info');
  };

  const generateQuickRegisterUser = () => {
    const r = Math.floor(1000 + Math.random() * 9000);
    setRegFullName(`Alex River ${r}`);
    setRegUsername(`alex_river_${r}`);
    setRegEmail(`alex${r}@nutrisense.com`);
    setRegPhone('+1555019283');
    setRegPassword('NutriPass123!');
    setRegConfirmPassword('NutriPass123!');
    setRegAge(26);
    setRegHeight(175);
    setRegWeight(72);
    setRegGoal('Healthy Lifestyle');
    setRegActivityLevel('Moderately Active');
    showToast('Generated fresh test user profile!', 'info');
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
    <div className="flex-1 flex flex-col justify-center min-h-[90vh] py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">

      {/* Floating Animated Background Glass Blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-teal-300/15 dark:bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 shadow-lg shadow-teal-500/25 group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-600 bg-clip-text text-transparent">
            NUTRI<span className="text-slate-800 dark:text-white font-bold"> SENSE</span>
          </span>
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
          Intelligent Nutrition & Health Hub
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          AI-driven meal personalization, macro tracking, and real-time health scoring.
        </p>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl py-8 px-6 sm:px-10 rounded-[2.5rem] border border-white/40 dark:border-slate-800/80 shadow-2xl shadow-emerald-500/5 relative overflow-hidden transition-all">

          {/* Top Decorative Gradient Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

          {/* TAB SWITCHER */}
          <div className="relative flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/50 mb-8">
            {/* Animated Slider Highlight */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20"
              initial={false}
              animate={{
                left: activeTab === 'login' ? '0.375rem' : '50%',
                width: 'calc(50% - 0.375rem)'
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />

            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                navigate('/login', { replace: true });
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-extrabold rounded-xl z-10 transition-colors duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'login' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4" /> Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                navigate('/register', { replace: true });
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-extrabold rounded-xl z-10 transition-colors duration-200 flex items-center justify-center gap-2 ${
                activeTab === 'register' ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" /> Register Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* LOGIN TAB CONTENT */}
            {activeTab === 'login' ? (
              <motion.div
                key="login-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={() => setIsGoogleModalOpen(true)}
                  disabled={googleLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
                >
                  {googleLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Or Sign In with Credentials</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Quick Demo Fill Presets */}
                <div className="bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 space-y-2">
                  <span className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">
                    ⚡ Quick Test Credentials
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={fillDemoUser}
                      className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-400/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" /> User Demo
                    </button>
                    <button
                      type="button"
                      onClick={fillDemoAdmin}
                      className="py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 text-xs font-bold border border-sky-400/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Admin Demo
                    </button>
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1.5">
                      Email or Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="email@domain.com or username"
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/90 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Forgot password?
                      </button>
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
                        className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl border border-slate-250 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/90 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                      />
                      <span className="ml-2 font-medium text-slate-600 dark:text-slate-400">Remember Me</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 text-center border-t border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      guestLogin();
                      showToast('Logged in as Guest user', 'info');
                      navigate('/dashboard');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500" /> Explore System as Guest
                  </button>
                </div>
              </motion.div>
            ) : (
              /* REGISTER TAB CONTENT */
              <motion.div
                key="register-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Quick Generator Button */}
                <div className="bg-slate-100/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between">
                  <div className="text-left">
                    <span className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Quick Test Profile</span>
                    <span className="block text-[10px] text-slate-400">Autofill valid registration fields</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateQuickRegisterUser}
                    className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-400/20 transition-all flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Generate
                  </button>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  
                  {/* SECTION 1: PERSONAL INFORMATION */}
                  <div className="space-y-3">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      1. Personal Information
                    </span>

                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                          placeholder="Full Name (Min 3 chars)"
                          className={`w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/90 focus:outline-none transition-all ${
                            regFullName.length === 0
                              ? 'border-slate-250 dark:border-slate-700'
                              : isNameValid
                              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                              : 'border-rose-400 ring-2 ring-rose-400/10'
                          }`}
                        />
                        {regFullName.length > 0 && (
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {isNameValid ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500 animate-scale-in" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Username & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Username */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                          Username <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <span className="text-xs font-extrabold text-slate-400">@</span>
                          </div>
                          <input
                            type="text"
                            required
                            value={regUsername}
                            onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                            placeholder="username_123"
                            className={`w-full text-xs sm:text-sm pl-8 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/90 focus:outline-none transition-all ${
                              regUsername.length === 0
                                ? 'border-slate-250 dark:border-slate-700'
                                : isUsernameValid
                                ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                                : 'border-rose-400 ring-2 ring-rose-400/10'
                            }`}
                          />
                          {regUsername.length > 0 && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              {isCheckingUsername ? (
                                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                              ) : isUsernameValid ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 animate-scale-in" />
                              )}
                            </div>
                          )}
                        </div>
                        {usernameAvailable === false && regUsername.length >= 3 && (
                          <span className="text-[10px] font-bold text-rose-500 mt-1 block">Username already taken</span>
                        )}
                      </div>

                      {/* Email Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="name@example.com"
                            className={`w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/90 focus:outline-none transition-all ${
                              regEmail.length === 0
                                ? 'border-slate-250 dark:border-slate-700'
                                : isEmailValid
                                ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                                : 'border-rose-400 ring-2 ring-rose-400/10'
                            }`}
                          />
                          {regEmail.length > 0 && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                              {isEmailValid ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-scale-in" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500 animate-scale-in" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phone Number (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                        Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: ACCOUNT & PASSWORDS */}
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      2. Account Security
                    </span>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimum 8 characters"
                          className={`w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/90 focus:outline-none transition-all ${
                            regPassword.length === 0
                              ? 'border-slate-250 dark:border-slate-700'
                              : isPasswordValid
                              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                              : 'border-amber-400 ring-2 ring-amber-400/10'
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

                      {/* PASSWORD STRENGTH METER */}
                      {regPassword.length > 0 && (
                        <div className="mt-2 space-y-1.5 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Strength:</span>
                            <span className={`text-[11px] font-black ${passwordStrengthLabel.text}`}>
                              {passwordStrengthLabel.label} ({passwordStrengthScore}%)
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrengthLabel.color} transition-all duration-300`}
                              style={{ width: `${passwordStrengthScore}%` }}
                            />
                          </div>

                          {/* Checklist */}
                          <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className={passwordCriteria.minLen ? 'text-emerald-500 font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                              {passwordCriteria.minLen ? '✔' : '✖'} 8+ Characters
                            </span>
                            <span className={passwordCriteria.uppercase ? 'text-emerald-500 font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                              {passwordCriteria.uppercase ? '✔' : '✖'} Uppercase Letter
                            </span>
                            <span className={passwordCriteria.lowercase ? 'text-emerald-500 font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                              {passwordCriteria.lowercase ? '✔' : '✖'} Lowercase Letter
                            </span>
                            <span className={passwordCriteria.number ? 'text-emerald-500 font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                              {passwordCriteria.number ? '✔' : '✖'} Number (0-9)
                            </span>
                            <span className={passwordCriteria.special ? 'text-emerald-500 font-bold flex items-center gap-1 text-xs col-span-2' : 'flex items-center gap-1 text-xs col-span-2'}>
                              {passwordCriteria.special ? '✔' : '✖'} Special Symbol (!@#$%^&*)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className={`w-full text-xs sm:text-sm pl-10 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-900/90 focus:outline-none transition-all ${
                            regConfirmPassword.length === 0
                              ? 'border-slate-250 dark:border-slate-700'
                              : isConfirmMatch
                              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                              : 'border-rose-400 ring-2 ring-rose-400/10'
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
                      {regConfirmPassword.length > 0 && (
                        <span className={`text-[10px] font-bold mt-1 block ${isConfirmMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isConfirmMatch ? '✔ Passwords match' : '✖ Passwords do not match'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SECTION 3: HEALTH PROFILE METRICS */}
                  <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="block text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      3. Health Profile & Fitness Goal
                    </span>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* Age */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-350 mb-1">Age</label>
                        <input
                          type="number"
                          min="15"
                          max="120"
                          value={regAge}
                          onChange={(e) => setRegAge(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 text-center font-bold"
                        />
                      </div>

                      {/* Gender */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-350 mb-1">Gender</label>
                        <select
                          value={regGender}
                          onChange={(e) => setRegGender(e.target.value as any)}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 font-bold focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Height (cm) */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-350 mb-1">Height (cm)</label>
                        <input
                          type="number"
                          min="100"
                          max="250"
                          value={regHeight}
                          onChange={(e) => setRegHeight(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 text-center font-bold"
                        />
                      </div>

                      {/* Weight (kg) */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-350 mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          min="30"
                          max="300"
                          value={regWeight}
                          onChange={(e) => setRegWeight(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* Goals Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Primary Goal</label>
                      <select
                        value={regGoal}
                        onChange={(e) => setRegGoal(e.target.value)}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                        <option value="Muscle Gain">Muscle Gain</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Healthy Lifestyle">Healthy Lifestyle</option>
                      </select>
                    </div>

                    {/* Activity Level Dropdown */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1">Activity Level</label>
                      <select
                        value={regActivityLevel}
                        onChange={(e) => setRegActivityLevel(e.target.value)}
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-250 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 font-bold focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Sedentary">Sedentary (Little or no exercise)</option>
                        <option value="Lightly Active">Lightly Active (Exercise 1-3 days/week)</option>
                        <option value="Moderately Active">Moderately Active (Exercise 3-5 days/week)</option>
                        <option value="Very Active">Very Active (Heavy exercise 6-7 days/week)</option>
                        <option value="Athlete">Athlete (Intense daily workout / physical job)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        Create Account & Start Journey <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* REGISTRATION SUCCESS POPUP MODAL */}
      <AnimatePresence>
        {registeredSuccessUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="max-w-md w-full p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-emerald-500/30 shadow-2xl text-center space-y-4 relative"
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
                  setLoginIdentifier(regEmail);
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
              className="max-w-md w-full p-6 sm:p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5"
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
