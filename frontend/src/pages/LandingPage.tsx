import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, Flame, Droplet, Bot, Check, ArrowRight, Star, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const stats = [
    { label: "Seeded Indian Foods", value: "200+" },
    { label: "Active Users Worldwide", value: "10K+" },
    { label: "Diets Generated Daily", value: "25K+" },
    { label: "Target Hydration Logs", value: "100K+" }
  ];

  const faqs = [
    {
      q: "What is BMR and how does Nutri Sense calculate it?",
      a: "BMR (Basal Metabolic Rate) represents the number of calories your body burns at rest to maintain vital functions. We calculate it using the scientifically proven Harris-Benedict equation, adjusting for your specific age, gender, height, and weight."
    },
    {
      q: "How does the AI Recommendation Engine work?",
      a: "Our engine uses your TDEE (Total Daily Energy Expenditure) modified by your physical goals. It then queries our database of over 200 Indian food items, applying strict filters for allergies (gluten, peanuts, dairy), food preferences (veg, non-veg, vegan, eggitarian), and medical conditions (diabetes, hypertension, thyroid) to give you a perfectly balanced breakfast, lunch, snack, and dinner plan."
    },
    {
      q: "Can I use Nutri Sense if I have diabetes or high blood pressure?",
      a: "Yes! During your profile setup, select 'Diabetes' or 'Hypertension'. The recommendation engine automatically reduces simple carbohydrate intakes, prioritizes dietary fibers, and restricts food items with high sodium content (e.g. pickles, salted nuts) to fit medical guidelines."
    },
    {
      q: "Is my personal health data secure?",
      a: "Absolutely. All session tokens are encrypted using JWT, and passwords are encrypted on the backend with bcrypt hashing. Your health logs and profile parameters are stored securely and never shared."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.name && contactForm.email && contactForm.message) {
      setContactSubmitted(true);
      setTimeout(() => {
        setContactForm({ name: '', email: '', message: '' });
        setContactSubmitted(false);
      }, 3000);
    }
  };

  return (
    <div className="bg-gradient-nutri min-h-screen transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure & AI-Powered
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-800 dark:text-white">
            Transform Your Health With <br className="hidden sm:inline" />
            <span className="text-gradient-premium">Nutri Sense</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Get medical-grade personalized diet recommendations based on physical attributes, medical restrictions, allergies, and lifestyle habits. Log water intake, analyze weights, and chat with our virtual dietitian.
          </p>
          <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:brightness-105 transition-all duration-200 glow-btn-green"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg hover:brightness-105 transition-all duration-200 glow-btn-green"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl font-bold text-slate-700 bg-white/70 hover:bg-white dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900 border border-slate-250 dark:border-slate-800 transition-all duration-200"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 relative flex justify-center z-10 w-full max-w-md lg:max-w-none">
          <div className="glass-panel-heavy p-6 rounded-[2.5rem] shadow-2xl relative w-full border border-white/20">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Active Recommendations</span>
              </div>
              <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">AI Active</span>
            </div>

            {/* Simulated UI elements */}
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-950/40">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-emerald-300">Breakfast Idea</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">290 kcal</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Ragi Roti (1 pc) accompanied by green tea and raw apple slices. Highly recommended for bone calcium density.
                </p>
              </div>

              <div className="p-3 bg-sky-50/50 dark:bg-sky-950/20 rounded-xl border border-sky-100/50 dark:border-sky-950/40">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-700 dark:text-sky-300">Hydration Progress</span>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">2200 / 3000 ml</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[73%] h-full bg-sky-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-200/40 dark:border-slate-800/40">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Packed With Healthcare Abstractions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            Nutri Sense blends professional metabolic calculators with a curated database to build a complete medical nutrition dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Metabolic Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Auto-calculate BMI ranges, BMR parameters, and TDEE calorie requirements dynamically based on activity inputs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-500">
              <Droplet className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hydration & Weight logs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Log daily water values using our interactive fluid bottle visualizer and map historical weights on Chart.js.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">AI Health Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Interact with a chatbot loaded with your profile metrics to instantly compile custom food options.
            </p>
          </div>
        </div>
      </section>

      {/* 3. STATISTICS SECTION */}
      <section className="bg-gradient-to-r from-emerald-600 to-sky-700 py-16 text-white text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2">
                {s.value}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ABOUT & TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
            Designed for Placement Portfolio & Academic Quality
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
            Nutri Sense is developed to satisfy major project requirements. The system implements secure JWT tokens, bcrypt hash configurations, Express rate-limit protection, Mongoose models, and fallback memory databases to guarantee local runtime execution.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Complete Indian Food Database with over 200 entries",
              "Dynamic medical restriction triggers (Sodium / Gluten constraints)",
              "Interactive Chart.js tracking layouts and weight projections",
              "Customized AI assistant chatbot integration"
            ].map((text, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-450 font-medium">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonials */}
        <div className="glass-panel p-6 rounded-3xl border border-white/20 relative">
          <div className="flex gap-1 text-amber-400 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400" />)}
          </div>
          <p className="text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed">
            "Nutri Sense's BMR calculator and Indian diet food recommendation engine helped me monitor my weight and cholesterol levels. The suggestions are realistic and utilize local food items like dal, paneer, and roti."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-500/10 text-sky-600 font-bold flex items-center justify-center text-xs">
              PS
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">Pooja Sharma</h4>
              <span className="text-[10px] text-slate-400">PCOS Diet Member</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQs SECTION */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-200/40 dark:border-slate-800/40">
        <h2 className="text-3xl font-extrabold tracking-tight text-center text-slate-800 dark:text-white mb-10 flex items-center justify-center gap-2">
          <HelpCircle className="w-7 h-7 text-emerald-500" /> Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-2xl overflow-hidden transition-all duration-200">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-5 py-4 text-left font-bold text-slate-800 dark:text-white text-xs sm:text-sm flex justify-between items-center focus:outline-none"
              >
                {faq.q}
                <span className="text-emerald-500 font-mono text-lg">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section className="max-w-xl mx-auto px-4 py-16 sm:px-6 lg:px-8 border-t border-slate-200/40 dark:border-slate-800/40 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white mb-2">
          Have Questions? Let's Connect!
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 leading-normal">
          Send us a message and our support team will reply within 24 hours.
        </p>

        {contactSubmitted ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            Thank you! Your message has been received.
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">Your Name</label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Ex. Rahul Verma"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Ex. rahul@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">Message</label>
              <textarea
                required
                rows={4}
                value={contactForm.message}
                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Write your health query or project feedback here..."
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md hover:brightness-105 transition-all glow-btn-green"
            >
              Send Message
            </button>
          </form>
        )}
      </section>

    </div>
  );
};
