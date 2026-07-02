import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { BMIGauge } from '../components/BMIGauge';
import { CalorieGauge } from '../components/CalorieGauge';
import { WaterBottle } from '../components/WaterBottle';
import {
  Dumbbell, Utensils, Brain, Scale, ShieldAlert,
  Calendar, Flame, Sparkles, ChevronRight, Bell
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [meals, setMeals] = useState<any>(null);
  const [waterAmount, setWaterAmount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const createFallbackStats = () => ({
    bmi: 23.5,
    bmiCategory: 'Normal',
    bmiRisk: 'Minimal Risk',
    bmiSuggestions: 'Maintain a balanced routine with regular meals, hydration, and light movement.',
    healthyRange: { min: 52.0, max: 70.0 },
    bmr: 1560,
    tdee: 1910,
    targetCalories: 1800,
    calorieOptions: {
      maintenance: 1910,
      weightLoss: 1600,
      weightGain: 2200,
    },
    macros: {
      protein: 95,
      carbs: 220,
      fat: 60,
      fiber: 28,
      distribution: { protein: 21, carbs: 49, fat: 30 },
    },
    insights: [
      'Keep meals balanced and hydrate regularly throughout the day.',
      'Regular movement and consistent sleep will support your long-term goals.',
    ],
  });

  const createFallbackMeals = () => ({
    meals: {
      breakfast: [{ name: 'Oats', calories: 220, protein: 8, carbs: 35, fat: 5, fiber: 6, servingSize: '1 bowl' }],
      midMorningSnack: [{ name: 'Apple', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, servingSize: '1 medium' }],
      lunch: [{ name: 'Dal + Rice', calories: 420, protein: 18, carbs: 60, fat: 10, fiber: 10, servingSize: '1 serving' }],
      eveningSnack: [{ name: 'Yogurt', calories: 120, protein: 8, carbs: 10, fat: 4, fiber: 0, servingSize: '1 cup' }],
      dinner: [{ name: 'Vegetable Stir Fry', calories: 350, protein: 12, carbs: 40, fat: 12, fiber: 8, servingSize: '1 serving' }],
    },
    targetCalories: 1800,
    actualCalories: 1205,
    actualProtein: 46,
    actualCarbs: 170,
    actualFat: 31,
    actualFiber: 28,
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!user || !localStorage.getItem('token')) {
        setStats(createFallbackStats());
        setMeals(createFallbackMeals());
        setWaterAmount(1500);
        setNotifications([]);
        setLoading(false);
        return;
      }

      const [statsRes, mealsRes, waterRes, notifsRes] = await Promise.all([
        api.get('/recommendations/stats'),
        api.get('/recommendations/meals'),
        api.get(`/trackers/water/${todayStr}`),
        api.get('/notifications')
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.stats);
      if (mealsRes.data?.success) setMeals(mealsRes.data.recommendation);
      if (waterRes.data?.success) setWaterAmount(waterRes.data.amount);
      if (notifsRes.data?.success) setNotifications(notifsRes.data.notifications);
    } catch (error) {
      console.error('Dashboard load error:', error);
      setStats(createFallbackStats());
      setMeals(createFallbackMeals());
      setWaterAmount(1500);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const handleMarkNotifRead = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev: any[]) => prev.filter((n: any) => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      showToast('All notifications cleared', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWater = async (amount: number) => {
    const newAmount = waterAmount + amount;
    setWaterAmount(newAmount);
    try {
      await api.post('/trackers/water', { date: todayStr, amount: newAmount });
    } catch (error) {
      console.error('Failed to log water:', error);
    }
  };

  const handleResetWater = async () => {
    setWaterAmount(0);
    try {
      await api.post('/trackers/water', { date: todayStr, amount: 0 });
    } catch (error) {
      console.error('Failed to reset water:', error);
    }
  };

  const getExercisesByGoal = (goal: string) => {
    const lower = (goal || '').toLowerCase();
    if (lower.includes('loss')) {
      return [
        { name: 'Brisk Walking / Jogging', duration: '30-40 mins', calories: '~250 kcal', type: 'Cardio' },
        { name: 'HIIT Session', duration: '20 mins', calories: '~220 kcal', type: 'Cardio' },
        { name: 'Bodyweight Circuit', duration: '3 rounds', calories: '~180 kcal', type: 'Strength' },
      ];
    } else if (lower.includes('gain')) {
      return [
        { name: 'Squats & Deadlifts', duration: '4 sets x 8 reps', calories: '~200 kcal', type: 'Strength' },
        { name: 'Push & Pull Workout', duration: '45 mins', calories: '~220 kcal', type: 'Strength' },
        { name: 'Light Cycling Cooldown', duration: '15 mins', calories: '~80 kcal', type: 'Cardio' },
      ];
    }
    return [
      { name: 'Vinyasa Flow Yoga', duration: '30 mins', calories: '~120 kcal', type: 'Flexibility' },
      { name: 'Steady-State Cycling', duration: '30 mins', calories: '~180 kcal', type: 'Cardio' },
      { name: 'Core & Abs Plank Circuit', duration: '15 mins', calories: '~90 kcal', type: 'Core' },
    ];
  };

  if (loading || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4"></div>
        <p className="text-xs text-slate-500 font-medium">Assembling dashboard statistics...</p>
      </div>
    );
  }

  const profileName = user?.name || 'Guest';
  const profileGoal = user?.goal || 'Maintain Weight';
  const profileFoodPreference = user?.foodPreference || 'Veg';
  const exerciseSuggestions = getExercisesByGoal(profileGoal);
  const totalCaloriesConsumed = meals?.actualCalories || 0;

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* WELCOME BANNER */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Personal Health Assessment
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
              Welcome back, {profileName}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Goal: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{profileGoal}</span> · Preference: <span className="font-semibold">{profileFoodPreference}</span>
            </p>
          </div>
          <Link
            to="/profile-edit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
          >
            Update Profile <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CORE METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BMI Gauge */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 self-start mb-2">
              <Scale className="w-4 h-4 text-emerald-500" /> BMI Assessment
            </h3>
            <BMIGauge bmi={stats.bmi} />
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 leading-normal italic px-2 border-t border-slate-100 dark:border-slate-800 pt-2">
              {stats.bmiSuggestions}
            </p>
          </div>

          {/* Calorie Gauge */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 self-start mb-2">
              <Flame className="w-4 h-4 text-emerald-500" /> Caloric Tracking
            </h3>
            <CalorieGauge consumed={totalCaloriesConsumed} target={stats.targetCalories} />
            <div className="grid grid-cols-2 w-full gap-2 mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">BMR</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {isFinite(stats.bmr) && stats.bmr > 0 ? stats.bmr : '—'} <span className="text-[9px]">kcal</span>
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">TDEE</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {isFinite(stats.tdee) && stats.tdee > 0 ? stats.tdee : '—'} <span className="text-[9px]">kcal</span>
                </span>
              </div>
            </div>
          </div>

          {/* Macronutrient Ratio */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-4">
              <Utensils className="w-4 h-4 text-emerald-500" /> Target Macronutrients
            </h3>
            <div className="space-y-4 flex-1">
              {[
                { label: `Protein (${stats.macros?.protein ?? 0}g)`, pct: stats.macros?.distribution?.protein ?? 25, color: 'bg-emerald-500' },
                { label: `Carbohydrates (${stats.macros?.carbs ?? 0}g)`, pct: stats.macros?.distribution?.carbs ?? 45, color: 'bg-sky-500' },
                { label: `Healthy Fats (${stats.macros?.fat ?? 0}g)`, pct: stats.macros?.distribution?.fat ?? 30, color: 'bg-amber-500' },
              ].map(({ label, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-600 dark:text-slate-300">{label}</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-2">
              Fiber goal: <strong>{stats.macros?.fiber ?? 25}g</strong> per day
            </p>
          </div>
        </div>

        {/* WATER BOTTLE */}
        <div className="glass-panel p-5 rounded-3xl">
          <WaterBottle
            loggedMl={waterAmount}
            goalMl={(user?.dailyWaterGoal || 3000)}
            onAddWater={handleAddWater}
            onResetWater={handleResetWater}
          />
        </div>

        {/* TODAY'S MEAL RECOMMENDATIONS */}
        {meals && (
          <div className="glass-panel p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" /> Today's Balanced Meal Plan
              </h3>
              <Link to="/meal-planner" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                Full Planner <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {meals.meals && Object.entries(meals.meals).map(([mealName, foodItems]: [string, any]) => {
                const label = mealName.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase());
                const mealCal = foodItems.reduce((acc: number, item: any) => acc + (item.calories || 0), 0);
                return (
                  <div key={mealName} className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit mb-2">
                        {label}
                      </span>
                      <ul className="space-y-2 mt-2">
                        {foodItems.map((item: any, idx: number) => (
                          <li key={idx} className="text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{item.servingSize} · P:{item.protein}g</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between text-xs font-bold">
                      <span className="text-slate-400">Total</span>
                      <span className="text-slate-800 dark:text-slate-200">{mealCal} kcal</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS & EXERCISE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Panel */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-emerald-500" /> Daily Health Alerts
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllNotifs}
                  className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  Dismiss All
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <span className="text-3xl mb-1">🎉</span>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">All caught up!</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">No outstanding health or logging reminders for today.</p>
                </div>
              ) : (
                notifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/40 dark:border-slate-800 flex justify-between items-start gap-2"
                  >
                    <div className="flex gap-2.5 items-start">
                      <span className="text-base flex-shrink-0 mt-0.5">
                        {notif.type === 'water' && '💧'}
                        {notif.type === 'exercise' && '🏋️'}
                        {notif.type === 'meal' && '🥗'}
                        {notif.type === 'sleep' && '😴'}
                        {notif.type === 'general' && '🔔'}
                      </span>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-white">{notif.title}</h4>
                        <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-0.5 leading-normal">{notif.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkNotifRead(notif._id)}
                      className="text-[9px] font-bold text-slate-450 hover:text-rose-500 px-2 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-slate-800 hover:border-rose-200/30 rounded-lg transition-all flex-shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Recommendations */}
          <div className="glass-panel p-5 rounded-3xl flex flex-col h-[400px]">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Dumbbell className="w-4.5 h-4.5 text-emerald-500" /> Activity Recommendations
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
              {exerciseSuggestions.map((ex: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{ex.name}</h4>
                    <span className="text-[10px] text-slate-400">{ex.type} · {ex.duration}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">{ex.calories}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI INSIGHTS */}
        {stats.insights && stats.insights.length > 0 && (
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-emerald-500" /> AI Health Insights
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.insights.map((insight: string, idx: number) => (
                <div key={idx} className="flex gap-2.5 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/20 border border-white/10">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
