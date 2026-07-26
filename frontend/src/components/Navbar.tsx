import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Menu, X, Sun, Moon, LogOut, Activity, LayoutDashboard, Calendar, Search, ShieldAlert, Settings, Bell, Trash, Check } from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpenNotif, setIsOpenNotif] = useState(false);

  const fetchNotifications = async () => {
    if (!user || !localStorage.getItem('token')) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDeleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  const handleNotifClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        // Toggle isRead locally & mark on backend. We can updateMany or delete, or mark as read.
        // Actually, our read-all handles reading, we can also support marking a single as read.
        // In backend routes, let's look: we don't have a single read endpoint, but we can do a dummy update 
        // or just let them read it. Since they see it, it is fine. If they want to dismiss it, they click delete!
        // So clicking it can just mark it read locally, or we can write a simple endpoint if needed.
        // Let's mark it read locally or just toggle.
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to read notification:', err);
      }
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Render navigation links
  const renderNavLinks = (mobile = false) => {
    const linkClass = (path: string) => `
      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
      ${isActive(path) 
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold' 
        : 'text-slate-600 hover:text-emerald-500 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-emerald-400 dark:hover:bg-slate-900/50'}
      ${mobile ? 'w-full' : ''}
    `;

    return (
      <>
        {/* Public Links */}
        <Link to="/" className={linkClass('/')} onClick={() => setIsOpen(false)}>
          Home
        </Link>

        {/* Private Links (User only) */}
        {user && (
          <>
            <Link to="/dashboard" className={linkClass('/dashboard')} onClick={() => setIsOpen(false)}>
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link to="/meal-planner" className={linkClass('/meal-planner')} onClick={() => setIsOpen(false)}>
              <Calendar className="w-4 h-4" />
              Meal Planner
            </Link>
            <Link to="/search" className={linkClass('/search')} onClick={() => setIsOpen(false)}>
              <Search className="w-4 h-4" />
              Nutrition Search
            </Link>
            <Link to="/tracker" className={linkClass('/tracker')} onClick={() => setIsOpen(false)}>
              <Activity className="w-4 h-4" />
              Health Tracker
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')} onClick={() => setIsOpen(false)}>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Admin Panel
              </Link>
            )}
            <Link to="/settings" className={linkClass('/settings')} onClick={() => setIsOpen(false)}>
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </>
        )}
      </>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/75 dark:bg-slate-950/75 border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 shadow-md transition-transform duration-300 group-hover:scale-105">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                NUTRI<span className="text-slate-800 dark:text-white font-semibold"> SENSE</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {renderNavLinks()}
          </div>

          {/* Right Header Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsOpenNotif(!isOpenNotif)}
                  className="p-2 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-900 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-slate-950 animate-pulse"></span>
                  )}
                </button>

                {isOpenNotif && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Recent Alerts</span>
                      <div className="flex gap-2">
                        {notifications.some(n => !n.isRead) && (
                          <button
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-850"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearAllNotifs}
                            title="Clear all"
                            className="p-1 rounded hover:bg-rose-500/10 text-rose-500 hover:text-rose-600"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-150 dark:divide-slate-850">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No notifications. Keep up the good work!
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                            className={`p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex gap-2.5 items-start ${
                              !notif.isRead ? 'bg-emerald-500/5 dark:bg-emerald-500/2.5' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-xs font-bold ${!notif.isRead ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                {notif.title}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-0.5 leading-normal">
                                {notif.message}
                              </p>
                              <span className="text-[8px] text-slate-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button
                              onClick={(e) => handleDeleteNotif(notif._id, e)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors flex-shrink-0"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <Link to="/settings" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 font-medium">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200/30 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-emerald-500 dark:text-slate-200 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-md hover:brightness-105 transition-all duration-200 glow-btn-green"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden gap-2">
            {/* Theme Toggle (Mobile) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-emerald-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {renderNavLinks(true)}

            {user ? (
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 px-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all border border-rose-100 dark:border-rose-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 px-3">
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-55 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
