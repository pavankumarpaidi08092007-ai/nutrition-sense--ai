import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, Users, Salad, TrendingUp, Scale, 
  Trash2, Plus, AlertCircle, RefreshCw 
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'foods'>('users');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New food form state
  const [foodForm, setFoodForm] = useState({
    name: '',
    category: 'Vegetables',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    servingSize: '100g',
    healthBenefits: ''
  });

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const statsRes = await api.get('/admin/stats');
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }

      const usersRes = await api.get('/admin/users');
      if (usersRes.data?.success) {
        setUsers(usersRes.data.users);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Access denied or failed to load statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user profile? This action is permanent.')) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      if (res.data?.success) {
        setSuccessMsg('User profile successfully deleted.');
        setTimeout(() => setSuccessMsg(null), 2000);
        await loadAdminData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to remove user.');
    }
  };

  const handleAddFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      ...foodForm,
      calories: Number(foodForm.calories),
      protein: Number(foodForm.protein),
      carbs: Number(foodForm.carbs),
      fat: Number(foodForm.fat),
      fiber: Number(foodForm.fiber)
    };

    try {
      const res = await api.post('/foods', payload);
      if (res.data?.success) {
        setSuccessMsg(`Food "${foodForm.name}" created successfully in category.`);
        setFoodForm({
          name: '',
          category: 'Vegetables',
          calories: '',
          protein: '',
          carbs: '',
          fat: '',
          fiber: '',
          servingSize: '100g',
          healthBenefits: ''
        });
        setTimeout(() => setSuccessMsg(null), 3000);
        await loadAdminData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to register food item.');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-850">Access Restricted</h3>
        <p className="text-xs text-slate-400 mt-1">This module is reserved for site administrators.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Administrator Workspace
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              Admin Control Panel
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Analyze site statistics, terminate profiles, or append items to the Indian Food Database.
            </p>
          </div>
          
          <button
            onClick={loadAdminData}
            className="p-2 rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500 hover:text-emerald-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-650 rounded-2xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-emerald-650 rounded-2xl text-xs font-bold">
            {successMsg}
          </div>
        )}

        {/* 1. KEY STATISTICS ROW */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Registered Users</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{stats.totalUsers}</span>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-650 flex items-center justify-center flex-shrink-0">
                <Salad className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Food database</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{stats.totalFoods} items</span>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Average User BMI</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">{stats.averageBmi}</span>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-650 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Vegetarian split</span>
                <span className="text-lg font-black text-slate-800 dark:text-white">
                  {stats.preferenceCounts?.Veg || 0} users
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. NAVIGATION TABS */}
        <div className="glass-panel p-1 rounded-2xl flex border border-white/20">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-slate-850 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-650 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
            }`}
          >
            User Management ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('foods')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'foods'
                ? 'bg-slate-850 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-650 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
            }`}
          >
            Append Food Database
          </button>
        </div>

        {/* 3. DETAILS BOARD */}
        <div className="glass-panel p-6 rounded-[2.5rem] border border-white/20 shadow-xl min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[250px]">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-2"></div>
              <span className="text-xs text-slate-400">Syncing admin dashboard data...</span>
            </div>
          ) : (
            <>
              {activeTab === 'users' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Regimen / Goal</th>
                        <th className="py-3 px-4">Physical Stats</th>
                        <th className="py-3 px-4">Joined On</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-850">
                      {users.map(u => (
                        <tr key={u.id}>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-white">{u.name}</span>
                            <span className="block text-[10px] text-slate-450">{u.email}</span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {u.goal}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {u.height}cm • {u.weight}kg • Age {u.age}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              disabled={u.email === user.email} // Protect self from deleting
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">Register Custom Food Item</h3>
                    <p className="text-xs text-slate-400 mt-1">Specify FDA metrics for proper dynamic recommendation matching.</p>
                  </div>

                  <form onSubmit={handleAddFoodSubmit} className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Food Name</label>
                      <input
                        type="text"
                        required
                        value={foodForm.name}
                        onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                        placeholder="Ex. Chicken Shawarma or Sprouts Mix"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Category</label>
                      <select
                        value={foodForm.category}
                        onChange={e => setFoodForm({ ...foodForm, category: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      >
                        {['Dairy', 'Pulses & Legumes', 'Vegetables', 'Fruits', 'Poultry & Meat', 'Fish & Seafood', 'Grains & Cereals', 'Nuts & Seeds', 'Snacks', 'Beverages', 'Eggs'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Serving Size</label>
                      <input
                        type="text"
                        required
                        value={foodForm.servingSize}
                        onChange={e => setFoodForm({ ...foodForm, servingSize: e.target.value })}
                        placeholder="Ex. 100g, 1 bowl"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Calories (kcal)</label>
                      <input
                        type="number"
                        required
                        value={foodForm.calories}
                        onChange={e => setFoodForm({ ...foodForm, calories: e.target.value })}
                        placeholder="Ex. 140"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Protein (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={foodForm.protein}
                        onChange={e => setFoodForm({ ...foodForm, protein: e.target.value })}
                        placeholder="Ex. 8.5"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Carbohydrates (g)</label>
                      <input
                        type="number"
                        required
                        value={foodForm.carbs}
                        onChange={e => setFoodForm({ ...foodForm, carbs: e.target.value })}
                        placeholder="Ex. 20"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Fats (g)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={foodForm.fat}
                        onChange={e => setFoodForm({ ...foodForm, fat: e.target.value })}
                        placeholder="Ex. 1.2"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">Health Benefits Description</label>
                      <textarea
                        rows={3}
                        value={foodForm.healthBenefits}
                        onChange={e => setFoodForm({ ...foodForm, healthBenefits: e.target.value })}
                        placeholder="Detail health properties e.g., low glycemic index, promotes calcium absorption..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 glow-btn-green"
                    >
                      <Plus className="w-4 h-4" /> Save New Food Item
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
