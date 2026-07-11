'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Shuffle, Clock, Calendar } from 'lucide-react';

export default function TemporaryPage() {
  const { showToast } = useToast();
  
  const [faculty, setFaculty] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    absentFacultyId: '',
    replacementFacultyId: '',
    date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, subRes] = await Promise.all([
        api.get('/faculty', { params: { limit: 100 } }),
        api.get('/timetables/temporary')
      ]);

      if (facRes.data.success) {
        setFaculty(facRes.data.data);
        if (facRes.data.data.length > 1) {
          setFormData({
            absentFacultyId: facRes.data.data[0].id.toString(),
            replacementFacultyId: facRes.data.data[1].id.toString(),
            date: new Date().toISOString().split('T')[0]
          });
        }
      }
      if (subRes.data.success) setSubstitutions(subRes.data.data);
    } catch (error) {
      showToast('Error loading substitution schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.absentFacultyId === formData.replacementFacultyId) {
      showToast('Absent and replacement faculty cannot be the same person', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/timetables/temporary', {
        absentFacultyId: parseInt(formData.absentFacultyId),
        replacementFacultyId: parseInt(formData.replacementFacultyId),
        date: formData.date
      });

      if (res.data.success) {
        showToast(`Temporary substitution created successfully! Configured ${res.data.count} periods.`);
        fetchData();
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Substitution assignment conflict detected', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto text-left">
        {/* Substitution Form */}
        <div className="lg:col-span-1">
          <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-400" />
                Plan Substitution
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Assign temporary replacement teaching staff</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date of Absence</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Absent Faculty</label>
                <select
                  value={formData.absentFacultyId}
                  onChange={(e) => setFormData({ ...formData, absentFacultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                >
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Replacement Faculty</label>
                <select
                  value={formData.replacementFacultyId}
                  onChange={(e) => setFormData({ ...formData, replacementFacultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                >
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Creating Assignment...' : 'Register Substitution'}
              </button>
            </form>
          </div>
        </div>

        {/* Substitutions List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Active Substitution Schedules</h3>
          <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <div className="divide-y divide-zinc-900">
              {loading ? (
                <div className="p-8 text-center text-zinc-650">
                  <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-650 mb-2" />
                  Loading active substitutions...
                </div>
              ) : substitutions.length === 0 ? (
                <div className="p-8 text-center text-zinc-650 text-sm">
                  No temporary substitutions scheduled.
                </div>
              ) : (
                substitutions.map((sub) => (
                  <div key={sub?.id || Math.random()} className="p-5 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-200">
                          {sub?.timetable?.subject?.name || 'N/A'} ({sub?.timetable?.classroom || 'N/A'})
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Date: <strong className="text-zinc-400">{sub?.date || ''}</strong> • Slot: {sub?.modifiedPeriod || ''}
                        </p>
                        <p className="text-[10px] text-indigo-400 font-semibold mt-1">
                          Replaced: {sub?.timetable?.faculty?.name || 'N/A'} ➜ Assigned: {sub?.replacementFaculty?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-yellow-950/40 border border-yellow-500/25 text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                      Modified Period
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
