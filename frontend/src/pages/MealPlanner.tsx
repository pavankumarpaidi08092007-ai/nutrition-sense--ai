import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Calendar, Printer, Bookmark, BookmarkCheck, 
  CheckCircle, ShieldAlert 
} from 'lucide-react';

const createFallbackStats = () => ({
  targetCalories: 2000,
  calorieOptions: { maintenance: 2000, weightLoss: 1700, weightGain: 2300 },
  macros: { protein: 140, carbs: 220, fat: 65 },
  bmi: 24.2,
  bmiCategory: 'Healthy',
  insights: ['Balanced nutrition plan for everyday wellness.']
});

const createFallbackMealPlan = () => ({
  targetCalories: 2000,
  actualCalories: 1980,
  actualProtein: 132,
  actualCarbs: 220,
  actualFat: 66,
  meals: {
    Breakfast: [
      { name: 'Greek Yogurt Bowl', calories: 320, protein: 24, carbs: 30, fat: 10, servingSize: '1 bowl' }
    ],
    Lunch: [
      { name: 'Vegetable Quinoa Bowl', calories: 610, protein: 28, carbs: 75, fat: 18, servingSize: '1 bowl' }
    ],
    Dinner: [
      { name: 'Grilled Paneer Wrap', calories: 680, protein: 30, carbs: 70, fat: 24, servingSize: '1 wrap' }
    ],
    Snacks: [
      { name: 'Apple & Almonds', calories: 220, protein: 5, carbs: 28, fat: 9, servingSize: '1 serving' }
    ]
  }
});

export const MealPlanner: React.FC = () => {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  
  const [plannerMode, setPlannerMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [weeklyPlans, setWeeklyPlans] = useState<any[]>([]);
  const [monthlyCalendar, setMonthlyCalendar] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkSuccess, setBookmarkSuccess] = useState(false);
  const [selectedDayPlan, setSelectedDayPlan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStats(createFallbackStats());
      setMealPlan(createFallbackMealPlan());
      setWeeklyPlans([]);
      setMonthlyCalendar([]);
      setSelectedDayPlan(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchPlannerStats = async () => {
      try {
        const statsRes = await api.get('/recommendations/stats');
        if (statsRes.data?.success) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        console.error('Failed to load calorie stats:', err);
      }
    };

    if (user) {
      fetchPlannerStats();
      generatePlan('daily');
    }
  }, [user, token]);

  const generatePlan = async (mode: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true);
    setError(null);
    setIsBookmarked(false);

    if (!token) {
      setMealPlan(createFallbackMealPlan());
      setWeeklyPlans([]);
      setMonthlyCalendar([]);
      setSelectedDayPlan(null);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'daily') {
        const res = await api.get('/recommendations/meals');
        if (res.data?.success) {
          setMealPlan(res.data.recommendation);
        }
      } else if (mode === 'weekly') {
        const list = [];
        for (let d = 1; d <= 7; d++) {
          const res = await api.get('/recommendations/meals');
          if (res.data?.success) {
            list.push({ day: `Day ${d}`, ...res.data.recommendation });
          }
        }
        setWeeklyPlans(list);
      } else if (mode === 'monthly') {
        // Generate 28 days (4 weeks) of meal plans
        const today = new Date();
        const cal: any[] = [];
        // 4 fetch calls representative of each week phase
        const weekPhases = [
          { label: 'Week 1 – Conditioning', macro: '50% Carbs / 20% Protein / 30% Fat', color: 'emerald' },
          { label: 'Week 2 – Progression',  macro: '45% Carbs / 25% Protein / 30% Fat', color: 'sky' },
          { label: 'Week 3 – Peak Phase',   macro: '40% Carbs / 30% Protein / 30% Fat', color: 'violet' },
          { label: 'Week 4 – Recovery',     macro: '50% Carbs / 20% Protein / 30% Fat', color: 'teal' },
        ];
        for (let w = 0; w < 4; w++) {
          const res = await api.get('/recommendations/meals');
          const weekPlan = res.data?.success ? res.data.recommendation : null;
          const days = [];
          for (let d = 0; d < 7; d++) {
            const date = new Date(today);
            date.setDate(today.getDate() + w * 7 + d);
            days.push({
              date,
              dateStr: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
              weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
              plan: weekPlan,
            });
          }
          cal.push({ ...weekPhases[w], days });
        }
        setMonthlyCalendar(cal);
        if (cal[0]?.days[0]?.plan) setSelectedDayPlan({ day: cal[0].days[0].dateStr, ...cal[0].days[0].plan });
      }
    } catch (err: any) {
      setError('Failed to generate customized meal recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: 'daily' | 'weekly' | 'monthly') => {
    setPlannerMode(mode);
    generatePlan(mode);
  };

  const handleBookmark = async () => {
    if (!mealPlan || !token) {
      showToast('Please sign in to save your meal plan.', 'error');
      return;
    }

    try {
      const payload = {
        name: `${user?.goal} Diet - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString().split('T')[0],
        targetCalories: mealPlan.targetCalories,
        meals: mealPlan.meals
      };
      const res = await api.post('/recommendations/mealplans', payload);
      if (res.data?.success) {
        setIsBookmarked(true);
        setBookmarkSuccess(true);
        showToast('Meal plan bookmarked successfully! 📌', 'success');
        setTimeout(() => setBookmarkSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to bookmark meal plan:', err);
      showToast('Failed to save meal plan. Try again.', 'error');
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300 print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto space-y-6 print:max-w-full">
        
        {/* Planner Header Controls */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-white/20 print:hidden">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-3.5 h-3.5" /> Plan Your Diet Structure
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white">
              AI Diet Meal Planner
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Generate full day, weekly, or monthly nutrition structures matching your daily target of{' '}
              <strong>{stats?.targetCalories || 2000} kcal</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleModeChange('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                plannerMode === 'daily'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              Daily Plan
            </button>
            <button
              onClick={() => handleModeChange('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                plannerMode === 'weekly'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              Weekly Plan (7 Days)
            </button>
            <button
              onClick={() => handleModeChange('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                plannerMode === 'monthly'
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
              }`}
            >
              Monthly Cycle
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 rounded-2xl text-xs flex items-center gap-2 print:hidden">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}

        {/* LOADING SHIM */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] bg-white/40 dark:bg-slate-900/30 rounded-3xl py-12">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4"></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Generating customized food cards...</p>
          </div>
        ) : (
          <>
            {/* A. DAILY PLAN VIEW */}
            {plannerMode === 'daily' && mealPlan && (
              <div className="space-y-6">
                
                {/* Daily actions bar */}
                <div className="flex justify-between items-center print:hidden">
                  <span className="text-xs font-bold text-slate-400">
                    Calculated Calories: <strong>{mealPlan.actualCalories} kcal</strong> (Target: {mealPlan.targetCalories} kcal)
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleBookmark}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isBookmarked 
                          ? 'bg-teal-50 border-teal-200 text-teal-600' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {isBookmarked ? (
                        <>
                          <BookmarkCheck className="w-4 h-4 fill-current" /> Saved to Bookmarks
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-4 h-4" /> Save Plan
                        </>
                      )}
                    </button>

                    <button
                      onClick={handlePrintPDF}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:brightness-105 transition-all shadow-md"
                    >
                      <Printer className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                </div>

                {bookmarkSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Meal plan saved to your bookmarks panel!
                  </div>
                )}

                {/* Printable daily food outline card */}
                <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-white/20 print:border-none print:shadow-none print:bg-white print:p-0">
                  
                  {/* Print Document Title */}
                  <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 uppercase">Nutri Sense Diet Prescription</h1>
                      <p className="text-[10px] text-slate-500 mt-1">Diagnostic diet recommended for patient: <strong>{user.name}</strong></p>
                    </div>
                    <div className="text-right text-[10px] text-slate-600 font-bold">
                      Date: {new Date().toLocaleDateString()} <br />
                      Goal: {user.goal}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 print:grid-cols-5">
                    {Object.entries(mealPlan.meals).map(([mealName, foodItems]: any) => {
                      const formattedName = mealName.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
                      const mealCal = foodItems.reduce((acc: number, item: any) => acc + item.calories, 0);

                      return (
                        <div key={mealName} className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-200/40 dark:border-slate-800 flex flex-col justify-between print:border print:bg-white print:p-3 print:rounded-none">
                          <div>
                            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider block w-fit mb-4 print:bg-emerald-50 print:border print:border-emerald-200">
                              {formattedName}
                            </span>
                            <ul className="space-y-3.5 mt-2">
                              {foodItems.map((item: any, idx: number) => (
                                <li key={idx} className="text-xs leading-relaxed">
                                  <span className="font-bold text-slate-850 dark:text-slate-200 print:text-slate-900">{item.name}</span>
                                  <span className="text-[10px] text-slate-450 dark:text-slate-400 block mt-1">
                                    Serving: {item.servingSize} <br />
                                    P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="mt-6 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between text-xs font-bold">
                            <span className="text-slate-400">Total</span>
                            <span className="text-slate-850 dark:text-slate-200 print:text-slate-950">{mealCal} kcal</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-2 md:grid-cols-4 gap-4 print:mt-12 print:border-slate-900">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Protein</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 print:text-slate-950">{mealPlan.actualProtein} g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Carbs</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 print:text-slate-950">{mealPlan.actualCarbs} g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Fats</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 print:text-slate-950">{mealPlan.actualFat} g</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Diet Fiber</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200 print:text-slate-950">{mealPlan.actualFiber} g</span>
                    </div>
                  </div>

                  {/* Print signature */}
                  <div className="hidden print:block mt-20 text-right pr-6">
                    <div className="inline-block border-t border-slate-400 pt-2 w-48 text-center text-xs font-bold text-slate-600">
                      Nutri Sense AI Signature
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* B. WEEKLY PLAN VIEW */}
            {plannerMode === 'weekly' && weeklyPlans.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center print:hidden">
                  <span className="text-xs font-semibold text-slate-450">7-Day Diagnostic Rotation</span>
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:brightness-105 transition-all shadow-md"
                  >
                    <Printer className="w-4 h-4" /> Print Full Week
                  </button>
                </div>

                <div className="space-y-6 print:space-y-12">
                  {weeklyPlans.map((dayPlan, dayIdx) => (
                    <div key={dayIdx} className="glass-panel p-5 rounded-3xl border border-white/20 print:border-none print:shadow-none print:p-0">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                          <CheckCircle className="w-4.5 h-4.5 text-emerald-500" /> {dayPlan.day} Plan
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Total Calories: <strong>{dayPlan.actualCalories} kcal</strong> (P:{dayPlan.actualProtein}g, C:{dayPlan.actualCarbs}g, F:{dayPlan.actualFat}g)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 print:grid-cols-5">
                        {Object.entries(dayPlan.meals).map(([mealName, foodItems]: any) => {
                          const formattedName = mealName.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
                          return (
                            <div key={mealName} className="bg-slate-50/50 dark:bg-slate-900/20 p-3 rounded-2xl border border-slate-200/30 print:border print:p-2">
                              <span className="text-[9px] font-black text-emerald-600 block mb-1 uppercase tracking-wider">{formattedName}</span>
                              <ul className="space-y-1">
                                {foodItems.map((item: any, idx: number) => (
                                  <li key={idx} className="text-[11px] font-medium text-slate-800 dark:text-slate-350">
                                    • {item.name} <span className="text-[9px] text-slate-400">({item.servingSize})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. MONTHLY VIEW */}
            {plannerMode === 'monthly' && monthlyCalendar.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center print:hidden">
                  <span className="text-xs font-semibold text-slate-500">4-Week Personalised Diet Calendar</span>
                  <button
                    onClick={handlePrintPDF}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:brightness-105 transition-all shadow-md"
                  >
                    <Printer className="w-4 h-4" /> Print Monthly Plan
                  </button>
                </div>

                {monthlyCalendar.map((week, wIdx) => (
                  <div key={wIdx} className="glass-panel p-5 rounded-3xl border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                          {
                            emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
                            sky: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
                            violet: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
                            teal: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
                          }[week.color as string] || 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        }`}>
                          {week.label}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{week.macro}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">{week.days[0]?.dateStr} – {week.days[6]?.dateStr}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {week.days.map((dayObj: any, dIdx: number) => (
                        <button
                          key={dIdx}
                          onClick={() => setSelectedDayPlan({ day: dayObj.dateStr, ...dayObj.plan })}
                          className={`p-2 rounded-xl border text-left transition-all hover:shadow-md ${
                            selectedDayPlan?.day === dayObj.dateStr
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <p className={`text-[9px] font-bold ${selectedDayPlan?.day === dayObj.dateStr ? 'text-emerald-100' : 'text-slate-400'}`}>{dayObj.weekday}</p>
                          <p className={`text-[10px] font-black mt-0.5 ${selectedDayPlan?.day === dayObj.dateStr ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{dayObj.dateStr}</p>
                          {dayObj.plan && (
                            <p className={`text-[8px] mt-1 font-mono ${selectedDayPlan?.day === dayObj.dateStr ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {dayObj.plan.actualCalories} kcal
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Selected Day Detail */}
                {selectedDayPlan && (
                  <div className="glass-panel p-6 rounded-3xl border border-white/20">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" /> {selectedDayPlan.day} – Meal Breakdown
                      </h4>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Total: {selectedDayPlan.actualCalories} kcal | P:{selectedDayPlan.actualProtein}g C:{selectedDayPlan.actualCarbs}g F:{selectedDayPlan.actualFat}g
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {selectedDayPlan.meals && Object.entries(selectedDayPlan.meals).map(([mealName, items]: any) => (
                        <div key={mealName} className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800">
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 block mb-1.5 uppercase tracking-wider">
                            {mealName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <ul className="space-y-1">
                            {items.map((item: any, idx: number) => (
                              <li key={idx} className="text-[11px] text-slate-700 dark:text-slate-300">
                                • {item.name} <span className="text-[9px] text-slate-400">({item.servingSize})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
