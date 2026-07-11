'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Plus, Clock, X, Info } from 'lucide-react';

export default function AcademicCalendarPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    type: 'HOLIDAY',
    description: ''
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calendar');
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      showToast('Error loading calendar events', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleOpenCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      date: today,
      type: 'HOLIDAY',
      description: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/calendar', formData);
      if (res.data.success) {
        showToast('Calendar event marked successfully!');
        setModalOpen(false);
        fetchEvents();
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Validation error saving calendar event', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await api.delete(`/calendar/${id}`);
      if (res.data.success) {
        showToast('Event removed successfully!');
        fetchEvents();
      }
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto text-left">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Academic Calendar</h2>
            <p className="text-sm text-zinc-500">Track key academic milestones, holidays, and examination slots</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Mark Date
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 text-zinc-400 flex items-start gap-3.5 text-xs">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Marking days as Holidays will automatically restrict schedules from landing on those dates. Re-schedule calculations ignore temporary substitute blocks that might conflict with Exam schedules.
          </p>
        </div>

        <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
          <div className="p-4 border-b border-zinc-850 bg-zinc-950/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Marked Semesters Schedules</h3>
          </div>
          <div className="divide-y divide-zinc-900">
            {loading ? (
              <div className="p-8 text-center text-zinc-650">
                <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-650 mb-2" />
                Loading calendar dates...
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center text-zinc-600 text-sm">
                No events or special dates marked for this term yet.
              </div>
            ) : (
              events.map((event) => (
                <div key={event?.id || Math.random()} className="flex items-center justify-between p-5 hover:bg-zinc-900/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-zinc-900/60 border border-zinc-805 text-zinc-400 flex flex-col items-center justify-center font-mono">
                      <span className="text-[10px] text-zinc-550 leading-none">{new Date(event?.date || Date.now()).toLocaleDateString([], { month: 'short' }).toUpperCase()}</span>
                      <span className="text-sm font-bold text-zinc-200 leading-tight mt-0.5">{new Date(event?.date || Date.now()).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-200">{event?.description || 'Special Academic Day'}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{new Date(event?.date || Date.now()).toLocaleDateString([], { weekday: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                      event?.type === 'HOLIDAY' ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30' :
                      event?.type === 'EXAM_DAY' ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30' :
                      event?.type === 'SPECIAL_EVENT' ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/30' :
                      'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30'
                    }`}>
                      {(event?.type || 'EVENT').replace('_', ' ')}
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(event?.id)}
                        className="p-2 hover:bg-zinc-900 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="glass border border-zinc-800 rounded-2xl w-full max-w-md p-6 bg-zinc-950/90 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1 hover:bg-zinc-900 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-lg font-bold text-zinc-100 mb-4">Mark Special Academic Date</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Target Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Classification Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                  >
                    <option value="HOLIDAY">Holiday (No classes)</option>
                    <option value="WORKING_DAY">Working Day (Special Schedule)</option>
                    <option value="EXAM_DAY">Exam Session</option>
                    <option value="SPECIAL_EVENT">Academic Event / Festival</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Event Label / Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Independence Day Break"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
                >
                  Confirm & Mark
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
