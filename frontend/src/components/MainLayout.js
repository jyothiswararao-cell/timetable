'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, 
  CalendarDays, CalendarCog, BarChart3, Shield, 
  Menu, Sun, Moon, LogOut, AlertTriangle, CheckCircle, 
  Info, Clock, Shuffle
} from 'lucide-react';
import Link from 'next/link';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-xl border shadow-2xl transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 ${
              toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' :
              toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/30 text-rose-200' :
              toast.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' :
              'bg-zinc-900/95 border-zinc-700/50 text-zinc-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FACULTY'] },
    { name: 'Faculty', path: '/faculty', icon: Users, roles: ['ADMIN'] },
    { name: 'Subjects', path: '/subjects', icon: BookOpen, roles: ['ADMIN'] },
    { name: 'Classes', path: '/classes', icon: GraduationCap, roles: ['ADMIN'] },
    { name: 'Academic Calendar', path: '/calendar', icon: CalendarDays, roles: ['ADMIN', 'FACULTY'] },
    { name: 'Generate Timetable', path: '/generator', icon: CalendarCog, roles: ['ADMIN'] },
    { name: 'Workload Adjustment', path: '/workload', icon: BarChart3, roles: ['ADMIN', 'FACULTY'] },
    { name: 'Temporary Timetable', path: '/temporary', icon: Shuffle, roles: ['ADMIN', 'FACULTY'] },
    { name: 'Conflict Detection', path: '/conflicts', icon: AlertTriangle, roles: ['ADMIN'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'FACULTY'] },
    { name: 'Admin Panel', path: '/admin', icon: Shield, roles: ['ADMIN'] },
  ];

  const visibleLinks = navLinks.filter(link => !link.roles || link.roles.includes(user?.role));

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Clock className="animate-spin w-8 h-8 text-indigo-500" />
        <span className="text-zinc-500 text-sm">Verifying Session...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        {/* Sidebar */}
        <aside 
          className={`glass border-r border-zinc-800/80 transition-all duration-300 z-30 shrink-0 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } hidden md:flex flex-col h-full bg-zinc-950/80`}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                DT
              </div>
              {sidebarOpen && (
                <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  TimetableAI
                </span>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-none">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md shadow-indigo-600/20'
                      : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-indigo-400 transition-colors'}`} />
                  {sidebarOpen && <span className="text-sm">{link.name}</span>}
                  
                  {!sidebarOpen && (
                    <div className="absolute left-16 bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-xl z-50">
                      {link.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-zinc-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center font-semibold text-indigo-300">
              {user.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-zinc-200">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.role}</p>
              </div>
            )}
            {sidebarOpen && (
              <button 
                onClick={logout}
                className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-rose-400 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          <header className="h-16 border-b border-zinc-800/80 glass flex items-center justify-between px-6 z-20 shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-200 hidden md:block"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-lg md:text-xl text-zinc-100 capitalize">
                {visibleLinks.find(link => link.path === pathname)?.name || 'Management System'}
              </h1>
            </div>

            {/* Profile actions / settings */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-yellow-400 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 p-1 px-3 rounded-full hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-zinc-300 hidden sm:block truncate max-w-[120px]">{user.name}</span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-2.5 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                        <p className="text-sm font-semibold text-zinc-200">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Subpage Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950/10">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
