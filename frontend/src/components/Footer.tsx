import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 shadow-md">
                <Activity className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                NUTRI<span className="text-slate-800 dark:text-white font-semibold"> SENSE</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Nutri Sense is an AI-powered personalized diet and health coaching platform. We help you calculate BMI, monitor calories, log water, and access tailored meal recommendations.
            </p>
          </div>

          {/* Quick links Col */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-xs text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400">
                  Home Page
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-xs text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400">
                  User Dashboard
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-xs text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400">
                  Nutrition Food Search
                </Link>
              </li>
              <li>
                <Link to="/tracker" className="text-xs text-slate-500 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400">
                  Hydration & Weight Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Tools Col */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Medical & Health Tools
            </h3>
            <ul className="space-y-2">
              <li>
                <span className="text-xs text-slate-500 dark:text-slate-400">BMI / BMR Calculators</span>
              </li>
              <li>
                <span className="text-xs text-slate-500 dark:text-slate-400">TDEE Caloric Needs</span>
              </li>
              <li>
                <span className="text-xs text-slate-500 dark:text-slate-400">Indian Food Nutrition Facts</span>
              </li>
              <li>
                <span className="text-xs text-slate-500 dark:text-slate-400">8-Week Weight Prediction</span>
              </li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white uppercase tracking-wider mb-4">
              Contact & Support
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Mail className="w-4 h-4 text-emerald-500" />
                support@nutrisense.com
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Phone className="w-4 h-4 text-emerald-500" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-500" />
                B.Tech Major Project, Healthcare Labs
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} NUTRI SENSE. All rights reserved. Created for placement showcase.
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
              Production Ready
            </span>
            <span className="text-[10px] text-sky-500 bg-sky-500/10 px-2.5 py-1 rounded-full font-bold">
              B.Tech Major Project v1.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
