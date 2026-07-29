import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, ShieldAlert, ArrowRight, UserCheck, KeyRound, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { user, login, googleLogin, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Load remembered email on mount (Passwords are never stored in localStorage for security)
  useEffect(() => {
    localStorage.removeItem('rememberedPassword'); // Purge legacy insecure password key
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      setSavedNotice(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Securely store ONLY the email address for convenient re-filling if checked
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        localStorage.removeItem('rememberedPassword');
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const success = await googleLogin();
      if (success) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
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
    <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-nutri transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-md">
            <Activity className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
            NUTRI<span className="text-slate-800 dark:text-white font-semibold"> SENSE</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
          Sign In to Your Account
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Enter credentials to retrieve health metrics and logging progress.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="glass-panel-heavy py-8 px-6 sm:px-10 rounded-[2rem] border border-white/20 shadow-xl space-y-5">
          {savedNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-350 rounded-xl text-xs flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Restored saved email address
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('');
                  setPassword('');
                  setRememberMe(false);
                  localStorage.removeItem('rememberedEmail');
                  localStorage.removeItem('rememberedPassword');
                  setSavedNotice(false);
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2.5"
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

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">Or Sign In with Email</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* Quick Demo Fill Presets */}
          <div className="bg-slate-100/60 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-2">
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
              ⚡ Quick Fill Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleFillDemoUser}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-350 text-[11px] font-semibold border border-emerald-400/20 transition-all text-center flex items-center justify-center gap-1"
              >
                <UserCheck className="w-3.5 h-3.5" /> User Demo
              </button>
              <button
                type="button"
                onClick={handleFillAdminUser}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-350 text-[11px] font-semibold border border-sky-400/20 transition-all text-center flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">
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
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="rahul@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">
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
                  className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-500 dark:text-slate-400 cursor-pointer">
                  Save login details
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5 glow-btn-green"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 flex flex-col gap-3 text-center border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" /> Continue as Guest
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-emerald-650 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-350"
              >
                Sign Up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
