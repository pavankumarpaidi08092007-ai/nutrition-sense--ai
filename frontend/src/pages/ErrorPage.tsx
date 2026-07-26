import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, Home, ArrowLeft, Mail, Lock, 
  ArrowRight, UserCheck, KeyRound, Sparkles, LogIn 
} from 'lucide-react';

export const ErrorPage: React.FC = () => {
  const { login, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedPassword', password);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedPassword');
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoUser = () => {
    setEmail('rahul@example.com');
    setPassword('password123');
    setRememberMe(true);
    setError(null);
  };

  const handleFillAdminUser = () => {
    setEmail('admin@nutrisense.com');
    setPassword('admin123');
    setRememberMe(true);
    setError(null);
  };

  const handleGuestAccess = () => {
    guestLogin();
    navigate('/dashboard');
  };

  return (
    <div className="flex-1 bg-gradient-nutri flex flex-col justify-center items-center p-4 sm:p-6 text-center transition-colors duration-300">
      <div className="glass-panel-heavy p-6 sm:p-10 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-lg w-full space-y-6">
        
        {/* Animated Warning Icon */}
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Page Not Found or Access Error</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            The page you requested may be restricted, moved, or requires active authentication. You can sign in below to save your login details and access your account.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setShowLoginForm(!showLoginForm)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              showLoginForm
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <LogIn className="w-4 h-4" /> {showLoginForm ? 'Hide Login Form' : 'Enter Login Details'}
          </button>

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <Link
            to="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 shadow-md transition-all"
          >
            <Home className="w-4 h-4" /> Home Page
          </Link>
        </div>

        {/* Embedded Interactive Login & Save Details Section */}
        {showLoginForm && (
          <div className="mt-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-left space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                Enter Login Details & Save Credentials
              </h3>
              <p className="text-[11px] text-slate-400">
                Log in to restore your personalized health dashboard and save credentials.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Fill Preset Buttons */}
            <div className="bg-slate-100/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                ⚡ Quick Fill Demo Credentials
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFillDemoUser}
                  className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-350 text-[11px] font-semibold border border-emerald-400/20 transition-all flex items-center justify-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" /> User Demo
                </button>
                <button
                  type="button"
                  onClick={handleFillAdminUser}
                  className="px-2 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-350 text-[11px] font-semibold border border-sky-400/20 transition-all flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Admin Demo
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="rahul@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center text-slate-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer mr-2"
                  />
                  Save login details
                </label>

                <Link
                  to="/forgot-password"
                  className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 glow-btn-green"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  <>
                    Sign In & Save Credentials <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" /> Continue as Guest
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
