import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Scale, HelpCircle, Save } from 'lucide-react';

export const ProfileEdit: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || 25);
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [height, setHeight] = useState(user?.height || 170);
  const [weight, setWeight] = useState(user?.weight || 65);
  const [activityLevel, setActivityLevel] = useState(user?.activityLevel || 'Sedentary');
  const [goal, setGoal] = useState(user?.goal || 'Maintain Weight');
  const [foodPreference, setFoodPreference] = useState(user?.foodPreference || 'Veg');
  const [cuisinePreference, setCuisinePreference] = useState(user?.cuisinePreference || 'Any');
  const [dailyWaterGoal, setDailyWaterGoal] = useState(user?.dailyWaterGoal || 3000);
  const [sleepHours, setSleepHours] = useState(user?.sleepHours || 8);
  
  // Multi-select lists
  const [medicalConditions, setMedicalConditions] = useState<string[]>(user?.medicalConditions || ['None']);
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || ['None']);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activityOptions = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'];
  const goalOptions = ['Weight Loss', 'Mild Weight Loss', 'Maintain Weight', 'Mild Weight Gain', 'Weight Gain'];
  const foodPrefs = ['Veg', 'Non-Veg', 'Eggitarian', 'Vegan'];
  
  const medConditionsList = ['None', 'Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Heart Disease'];
  const allergiesList = ['None', 'Dairy', 'Gluten', 'Peanuts', 'Soy', 'Shellfish'];

  const handleMedicalToggle = (condition: string) => {
    if (condition === 'None') {
      setMedicalConditions(['None']);
      return;
    }

    let updated = medicalConditions.filter(c => c !== 'None');
    if (updated.includes(condition)) {
      updated = updated.filter(c => c !== condition);
      if (updated.length === 0) updated = ['None'];
    } else {
      updated.push(condition);
    }
    setMedicalConditions(updated);
  };

  const handleAllergyToggle = (allergy: string) => {
    if (allergy === 'None') {
      setAllergies(['None']);
      return;
    }

    let updated = allergies.filter(a => a !== 'None');
    if (updated.includes(allergy)) {
      updated = updated.filter(a => a !== allergy);
      if (updated.length === 0) updated = ['None'];
    } else {
      updated.push(allergy);
    }
    setAllergies(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const updatedData = {
      name,
      age: Number(age),
      gender: gender as any,
      height: Number(height),
      weight: Number(weight),
      activityLevel: activityLevel as any,
      goal: goal as any,
      foodPreference: foodPreference as any,
      cuisinePreference,
      dailyWaterGoal: Number(dailyWaterGoal),
      sleepHours: Number(sleepHours),
      medicalConditions,
      allergies
    };

    try {
      const isUpdated = await updateProfile(updatedData);
      if (isUpdated) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update diagnostic stats.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex-1 bg-gradient-nutri p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-white/20 shadow-xl space-y-6">
          
          {/* Header */}
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Diagnostic Intake
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
              Edit Health Profile
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your physical parameters are analyzed to calculate BMR calorie thresholds and filter recipe allergies.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-650 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450 rounded-2xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Profile updated successfully! Loading dashboard...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Basic Information Grid */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                <User className="w-4.5 h-4.5 text-emerald-500" /> Basic Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={120}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Physical Metrics Grid */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                <Scale className="w-4.5 h-4.5 text-emerald-500" /> Physical Metrics
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={250}
                    value={height}
                    onChange={e => setHeight(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={300}
                    value={weight}
                    onChange={e => setWeight(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Water Goal (ml)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    max={10000}
                    step={250}
                    value={dailyWaterGoal}
                    onChange={e => setDailyWaterGoal(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Sleep Goal (Hours)</label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={18}
                    value={sleepHours}
                    onChange={e => setSleepHours(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Goals & Activity Levels */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                <HelpCircle className="w-4.5 h-4.5 text-emerald-500" /> regimental Goals
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Exercise Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={e => setActivityLevel(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {activityOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Weight Target Goal</label>
                  <select
                    value={goal}
                    onChange={e => setGoal(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {goalOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Food & Cuisine Preferences */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-4">
                Dietary Preferences
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Food Preference</label>
                  <select
                    value={foodPreference}
                    onChange={e => setFoodPreference(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    {foodPrefs.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Cuisine Preference</label>
                  <input
                    type="text"
                    value={cuisinePreference}
                    onChange={e => setCuisinePreference(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500"
                    placeholder="Ex. North Indian, South Indian, Any"
                  />
                </div>
              </div>
            </div>

            {/* 5. Medical Conditions Checkboxes */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-xs font-bold text-slate-500 mb-2">Medical Conditions (Select all that apply)</h3>
              <div className="flex flex-wrap gap-2.5">
                {medConditionsList.map(c => {
                  const isActive = medicalConditions.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleMedicalToggle(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Allergies Checkboxes */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="text-xs font-bold text-slate-500 mb-2">Allergens & Intolerances</h3>
              <div className="flex flex-wrap gap-2.5">
                {allergiesList.map(a => {
                  const isActive = allergies.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleAllergyToggle(a)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-sky-500 border-sky-500 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-105 shadow-md transition-all glow-btn-green"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Diagnostics
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
