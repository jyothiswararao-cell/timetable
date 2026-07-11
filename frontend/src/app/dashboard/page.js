'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { 
  Users, GraduationCap, BookOpen, Clock, AlertOctagon, 
  Sparkles, Play, RefreshCw, CalendarDays, BarChart3, Settings, CalendarCog
} from 'lucide-react';
import Link from 'next/link';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, 
  Tooltip, Legend, ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalClasses: 0,
    totalSubjects: 0,
    todayLectures: 0,
    pendingRequests: 0,
    conflictsDetected: 0
  });
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, facultyReportRes] = await Promise.all([
        api.get('/timetables/dashboard-stats'),
        api.get('/timetables/audit-logs'),
        api.get('/reports/faculty-report')
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      
      if (facultyReportRes.data.success) {
        const facs = facultyReportRes.data.data || [];
        setChartData({
          labels: facs.map(f => f?.name?.replace('Dr. ', '') || 'N/A'),
          datasets: [
            {
              label: 'Assigned Workload',
              data: facs.map(f => f?.assignedWorkload || 0),
              backgroundColor: 'rgba(79, 70, 229, 0.7)',
              borderColor: '#4F46E5',
              borderWidth: 1,
            },
            {
              label: 'Workload Limit',
              data: facs.map(f => f?.workloadLimit || 0),
              backgroundColor: 'rgba(124, 58, 237, 0.2)',
              borderColor: '#7C3AED',
              borderWidth: 1,
            }
          ]
        });
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDetectConflicts = async () => {
    try {
      const res = await api.post('/timetables/detect-conflicts');
      if (res.data.success) {
        showToast(`Conflict check complete. Detected ${res.data.data.length} conflict(s).`, res.data.data.length > 0 ? 'warning' : 'success');
        const statsRes = await api.get('/timetables/dashboard-stats');
        if (statsRes.data.success) setStats(statsRes.data.data);
      }
    } catch (error) {
      showToast('Failed to execute conflict scan', 'error');
    }
  };

  const dashboardCards = [
    { name: 'Total Faculty', value: stats.totalFaculty, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/5' },
    { name: 'Total Classes', value: stats.totalClasses, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/5' },
    { name: 'Total Subjects', value: stats.totalSubjects, icon: BookOpen, color: 'text-cyan-400', bg: 'bg-cyan-500/5' },
    { name: "Today's Lectures", value: stats.todayLectures, icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
    { name: 'Pending Requests', value: stats.pendingRequests, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/5' },
    { name: 'Conflicts Detected', value: stats.conflictsDetected, icon: AlertOctagon, color: stats.conflictsDetected > 0 ? 'text-rose-400 animate-pulse' : 'text-zinc-400', bg: 'bg-rose-500/5' }
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="glass rounded-3xl p-8 border border-zinc-800/80 bg-gradient-to-r from-indigo-950/20 via-purple-950/10 to-transparent relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex-1 space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Scheduling Engine
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              AI-Powered Dynamic <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Timetable Management</span>
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-xl">
              Automatically generate conflict-free timetables with intelligent workload balancing, real-time workload limits checks, and dynamic substitute schedule optimization.
            </p>
            <div className="flex items-center gap-3.5 pt-2">
              <Link 
                href="/generator" 
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Generate Timetable
              </Link>
              <Link 
                href="/reports" 
                className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-855 text-zinc-300 font-semibold text-sm transition-all"
              >
                View Analytics
              </Link>
            </div>
          </div>

          <div className="w-full md:w-[340px] shrink-0 hidden lg:block">
            <div className="glass border border-zinc-800/80 rounded-2xl p-4 bg-zinc-950/50 shadow-2xl flex flex-col gap-3 relative">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-xs font-bold animate-pulse">AI</div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-left">
                <span className="text-xs font-bold text-zinc-400">Timetable AI Optimization</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">100% Conflict-Free</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { subject: 'Math', time: '09:00', room: 'R-101', color: 'from-indigo-600 to-indigo-700' },
                  { subject: 'CS', time: '10:00', room: 'R-102', color: 'from-purple-600 to-purple-700' },
                  { subject: 'Physics', time: '11:00', room: 'R-103', color: 'from-cyan-600 to-cyan-700' },
                  { subject: 'EE', time: '13:00', room: 'R-101', color: 'from-blue-600 to-blue-700' },
                  { subject: 'Chem', time: '14:00', room: 'R-105', color: 'from-violet-600 to-violet-700' },
                  { subject: 'Bio', time: '15:00', room: 'R-104', color: 'from-emerald-600 to-emerald-700' }
                ].map((item, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} shadow-lg shadow-black/30 flex flex-col justify-between h-20 text-left`}>
                    <span className="text-xs font-bold text-white leading-tight">{item.subject}</span>
                    <div className="flex flex-col text-[8px] text-white/70">
                      <span>{item.time}</span>
                      <span>{item.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section className="space-y-4 text-left">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            <Link href="/generator" className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-indigo-600/10 border border-zinc-800/80 hover:border-indigo-500/30 text-center gap-2 group transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarCog className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">Generate Timetable</span>
            </Link>
            <Link href="/temporary" className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-cyan-600/10 border border-zinc-800/80 hover:border-cyan-500/30 text-center gap-2 group transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <RefreshCw className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">Temporary Substitution</span>
            </Link>
            <Link href="/workload" className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-purple-600/10 border border-zinc-800/80 hover:border-purple-500/30 text-center gap-2 group transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">Adjust Workload</span>
            </Link>
            <button onClick={handleDetectConflicts} className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-rose-600/10 border border-zinc-800/80 hover:border-rose-500/30 text-center gap-2 group transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">Detect Conflicts</span>
            </button>
            <Link href="/reports" className="flex flex-col items-center justify-center p-4 rounded-2xl glass hover:bg-amber-600/10 border border-zinc-800/80 hover:border-amber-500/30 text-center gap-2 group transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-zinc-300">Export Reports</span>
            </Link>
          </div>
        </section>

        {/* Statistics Tiles */}
        <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {dashboardCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="glass border border-zinc-850 p-5 rounded-2xl text-left bg-zinc-900/30 relative overflow-hidden group shadow-lg">
                <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-xs text-zinc-500 font-semibold truncate">{card.name}</p>
                <p className="text-2xl font-black text-white mt-1">{loading ? '...' : card.value}</p>
              </div>
            );
          })}
        </section>

        {/* Charts & Timeline */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass border border-zinc-805 rounded-2xl p-6 bg-zinc-900/10 flex flex-col text-left shadow-lg">
            <h3 className="text-base font-bold text-zinc-200 mb-4">Faculty Workload Distribution</h3>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="animate-pulse flex space-x-4"><div className="w-4 h-24 bg-zinc-800 rounded"></div></div>
              ) : chartData ? (
                <Bar 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.4)' }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.4)' }
                      }
                    },
                    plugins: {
                      legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                    }
                  }} 
                />
              ) : (
                <span className="text-zinc-600 text-sm">No data available</span>
              )}
            </div>
          </div>

          <div className="glass border border-zinc-805 rounded-2xl p-6 bg-zinc-900/10 flex flex-col text-left shadow-lg">
            <h3 className="text-base font-bold text-zinc-200 mb-4">Recent Activity</h3>
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[320px] pr-2 scrollbar-thin">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0"></div>
                      <div className="flex-1 space-y-2 py-1"><div className="h-4 bg-zinc-800 rounded w-3/4"></div></div>
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center text-zinc-600 text-sm py-10">No recent logs recorded.</div>
              ) : (
                logs.map((log) => (
                  <div key={log?.id || Math.random()} className="flex gap-3 text-sm relative group">
                    <div className="w-8 h-8 rounded-full bg-zinc-800/50 border border-zinc-800 flex items-center justify-center shrink-0 text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 border-b border-zinc-900 pb-3">
                      <p className="text-xs text-zinc-500">{new Date(log?.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log?.action || 'Action'}</p>
                      <p className="text-xs text-zinc-300 font-medium mt-0.5 leading-snug">{log?.details || ''}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
