import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Download, Trash2, AlertTriangle, Bell, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Settings: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState({
    breakfast: user?.notificationSettings?.breakfast ?? true,
    lunch: user?.notificationSettings?.lunch ?? true,
    dinner: user?.notificationSettings?.dinner ?? true,
    water: user?.notificationSettings?.water ?? true,
    exercise: user?.notificationSettings?.exercise ?? true,
    sleep: user?.notificationSettings?.sleep ?? true
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToggleNotif = async (key: string) => {
    const nextVal = !(notifs as any)[key];
    const updatedNotifs = {
      ...notifs,
      [key]: nextVal
    };
    setNotifs(updatedNotifs);
    try {
      if (updateProfile) {
        await updateProfile({
          notificationSettings: updatedNotifs
        });
        showToast(`Preference updated: ${key} is now ${nextVal ? 'enabled' : 'disabled'}.`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update preferences.', 'error');
    }
  };

  const handleExportData = () => {
    if (!user) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `nutrisense_profile_${user.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setSuccess('Your diagnostic profile has been exported as JSON.');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account and all health logs. Are you absolutely sure?')) return;
    try {
      const deleted = await deleteAccount();
      if (deleted) navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account.');
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-6">

        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">System Preferences</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2">Application Settings</h2>
          <p className="text-xs text-slate-500 mt-1">Configure visual appearance, notification reminders, and data management.</p>
        </div>

        {success && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {success}
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Appearance */}
          <div className="glass-panel p-5 rounded-3xl border border-white/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              Appearance & Theme
            </h3>
            <div className="flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Dark / Light Mode</h4>
                <p className="text-slate-500 mt-0.5">Toggle the visual lighting layout.</p>
              </div>
              <button onClick={toggleTheme}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all">
                {theme === 'dark' ? <><Sun className="w-4 h-4" /> Switch to Light</> : <><Moon className="w-4 h-4" /> Switch to Dark</>}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-panel p-5 rounded-3xl border border-white/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-emerald-500" /> Meal & Health Reminders
            </h3>
            <div className="space-y-3.5">
              {[
                { key: 'breakfast', title: 'Breakfast Reminder', desc: 'Notify at 8:30 AM to log your morning meal.' },
                { key: 'lunch', title: 'Lunch Reminder', desc: 'Notify at 1:30 PM for dietary carb and protein logging.' },
                { key: 'dinner', title: 'Dinner Reminder', desc: 'Notify at 8:00 PM for light low-fat dinner options.' },
                { key: 'water', title: 'Hydration Alerts', desc: 'Alert every 2 hours to log water intake.' },
                { key: 'exercise', title: 'Exercise Reminder', desc: 'Notify daily to complete your workout routine.' },
                { key: 'sleep', title: 'Sleep Recovery Alerts', desc: 'Remind daily to ensure recommended sleep recovery hours.' },
              ].map(item => (
                <div key={item.key} className="flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{item.title}</h4>
                    <p className="text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotif(item.key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${(notifs as any)[item.key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${(notifs as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Data Export */}
          <div className="glass-panel p-5 rounded-3xl border border-white/20 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              Data Portability
            </h3>
            <div className="flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Export Health Profile</h4>
                <p className="text-slate-500 mt-0.5">Download your complete diagnostic profile as a JSON file.</p>
              </div>
              <button onClick={handleExportData}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 transition-all shadow-md">
                <Download className="w-4 h-4" /> Export JSON
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="glass-panel p-5 rounded-3xl border border-white/20 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              Account Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Name', val: user.name },
                { label: 'Email', val: user.email },
                { label: 'Role', val: user.role === 'admin' ? '🔐 Administrator' : '👤 User' },
                { label: 'Goal', val: user.goal },
                { label: 'Food Preference', val: user.foodPreference },
                { label: 'Activity Level', val: user.activityLevel },
              ].map(({ label, val }) => (
                <div key={label}>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{label}</span>
                  <span className="font-semibold text-slate-800 dark:text-white">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel p-5 rounded-3xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/5 space-y-4">
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 pb-2 border-b border-rose-500/10 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h3>
            <div className="flex justify-between items-center text-xs">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Delete Account</h4>
                <p className="text-slate-500 mt-0.5">Permanently remove your account and all associated health data.</p>
              </div>
              <button onClick={handleDeleteProfile}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-md">
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
