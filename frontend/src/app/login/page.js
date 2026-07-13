'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiredMsg, setExpiredMsg] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      setExpiredMsg(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setExpiredMsg(false);

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-indigo-500/10 mb-4">
            DT
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Welcome to TimetableAI
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to manage dynamic schedules</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-zinc-800/80 shadow-2xl bg-zinc-900/40">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-rose-950/45 border border-rose-500/20 text-rose-200 flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {expiredMsg && (
              <div className="p-4 rounded-xl bg-amber-950/45 border border-amber-500/20 text-amber-200 flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Session expired. Please login again.</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="name@university.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none text-zinc-100 text-sm transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 outline-none text-zinc-100 text-sm transition-all placeholder:text-zinc-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">Quick Access Profiles</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@timetable.com');
                  setPassword('admin123');
                }}
                className="py-2 px-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 text-[11px] font-semibold text-zinc-300 transition-colors"
              >
                Admin Credentials
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('faculty@timetable.com');
                  setPassword('faculty123');
                }}
                className="py-2 px-3 rounded-lg bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-800/60 text-[11px] font-semibold text-zinc-300 transition-colors"
              >
                Faculty Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
