import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, 
  PointElement, LineElement, BarElement, Title, 
  Tooltip, Legend, Filler 
} from 'chart.js';
import { Plus, Scale, Droplet } from 'lucide-react';
import confetti from 'canvas-confetti';

// Register Chart.js Modules
ChartJS.register(
  CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const createFallbackAnalytics = () => ({
  weightTrend: [
    { date: new Date().toISOString().split('T')[0], weight: 70, bmi: 24.2 }
  ],
  waterTrend: [
    { date: new Date().toISOString().split('T')[0], amount: 2200 }
  ]
});

export const HealthTracker: React.FC = () => {
  const { user, token } = useAuth();
  
  const [weight, setWeight] = useState('');
  const [water, setWater] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'weight' | 'water'>('weight');

  const fetchTrackerData = async () => {
    setLoading(true);
    if (!token) {
      setAnalytics(createFallbackAnalytics());
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/trackers/analytics');
      if (res.data?.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to load tracking analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrackerData();
    }
  }, [user, token]);

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    if (!token) {
      setAnalytics(createFallbackAnalytics());
      setWeight('');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/trackers/weight', {
        date,
        weight: Number(weight)
      });
      if (res.data?.success) {
        setWeight('');
        // Trigger small celebrate confetti
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        await fetchTrackerData();
      }
    } catch (err) {
      console.error('Failed to submit weight entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWaterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!water) return;
    if (!token) {
      setAnalytics(createFallbackAnalytics());
      setWater('');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/trackers/water', {
        date,
        amount: Number(water)
      });
      if (res.data?.success) {
        setWater('');
        confetti({ particleCount: 30, colors: ['#38bdf8', '#0ea5e9'] });
        await fetchTrackerData();
      }
    } catch (err) {
      console.error('Failed to log water:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Compile Chart data configurations
  const buildWeightChartData = () => {
    const dates = analytics?.weightTrend?.map((w: any) => w.date) || [];
    const weights = analytics?.weightTrend?.map((w: any) => w.weight) || [];
    const bmis = analytics?.weightTrend?.map((w: any) => w.bmi) || [];

    return {
      labels: dates,
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights,
          borderColor: '#10b981', // emerald 500
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          tension: 0.35,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointRadius: 4
        },
        {
          label: 'BMI scale',
          data: bmis,
          borderColor: '#0ea5e9', // sky 500
          backgroundColor: 'rgba(14, 165, 233, 0.05)',
          tension: 0.35,
          fill: false,
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const buildWaterChartData = () => {
    const dates = analytics?.waterTrend?.map((w: any) => w.date) || [];
    const amounts = analytics?.waterTrend?.map((w: any) => w.amount) || [];

    return {
      labels: dates,
      datasets: [
        {
          label: 'Water logged (ml)',
          data: amounts,
          backgroundColor: '#38bdf8', // sky 400
          borderColor: '#0284c7', // sky 600
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    };
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Diagnostic History Charts
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
            Health Tracker & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Log weight entries to monitor BMI scales or input daily hydration levels. View progress charts below.
          </p>
        </div>

        {/* Core grids: Logging forms + chart panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Panel: Loggers */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Form 1: Log Weight */}
            <div className="glass-panel p-5 rounded-3xl border border-white/20 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Scale className="w-4.5 h-4.5 text-emerald-500" /> Log Weight Entry
              </h3>
              
              <form onSubmit={handleWeightSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Weight (in kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="Ex. 68.5"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1 glow-btn-green"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Entry
                </button>
              </form>
            </div>

            {/* Form 2: Log Water */}
            <div className="glass-panel p-5 rounded-3xl border border-white/20 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Droplet className="w-4.5 h-4.5 text-sky-500" /> Log Hydration Intake
              </h3>
              
              <form onSubmit={handleWaterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Amount (in ml)</label>
                  <input
                    type="number"
                    step="50"
                    required
                    value={water}
                    onChange={e => setWater(e.target.value)}
                    placeholder="Ex. 500 or 1000"
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Water
                </button>
              </form>
            </div>

          </div>

          {/* Right Panel: Charts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs control */}
            <div className="glass-panel p-2 rounded-2xl flex border border-white/20">
              <button
                onClick={() => setActiveTab('weight')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'weight'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Weight & BMI Trends
              </button>
              <button
                onClick={() => setActiveTab('water')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'water'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Hydration History
              </button>
            </div>

            {/* Graph Card */}
            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/20 shadow-xl min-h-[350px] flex items-center justify-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-2"></div>
                  <span className="text-xs text-slate-400">Loading diagnostic history...</span>
                </div>
              ) : analytics ? (
                <div className="w-full">
                  {activeTab === 'weight' ? (
                    analytics.weightTrend?.length > 0 ? (
                      <Line
                        data={buildWeightChartData()}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit' } } } },
                          scales: {
                            y: { grid: { color: 'rgba(0,0,0,0.03)' } },
                            y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center p-8 text-slate-400">
                        No weight logs recorded yet. Use the logger on the left to start!
                      </div>
                    )
                  ) : (
                    analytics.waterTrend?.length > 0 ? (
                      <Bar
                        data={buildWaterChartData()}
                        options={{
                          responsive: true,
                          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Outfit' } } } },
                          scales: { y: { grid: { color: 'rgba(0,0,0,0.03)' } } }
                        }}
                      />
                    ) : (
                      <div className="text-center p-8 text-slate-400">
                        No hydration records logs today.
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center text-slate-400">Failed to render analytical logs.</div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
