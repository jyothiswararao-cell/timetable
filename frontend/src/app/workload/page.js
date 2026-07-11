'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Sparkles, BarChart3, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function WorkloadPage() {
  const { showToast } = useToast();
  
  const [faculty, setFaculty] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    facultyId: '',
    type: 'INCREASE',
    amount: 2
  });
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facRes, reqRes] = await Promise.all([
        api.get('/faculty', { params: { limit: 100 } }),
        api.get('/timetables/adjust-workload')
      ]);

      if (facRes.data.success) {
        setFaculty(facRes.data.data);
        if (facRes.data.data.length > 0) {
          setFormData(prev => ({ ...prev, facultyId: facRes.data.data[0].id.toString() }));
        }
      }
      if (reqRes.data.success) setRequests(reqRes.data.data);
    } catch (error) {
      showToast('Error loading workload metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.facultyId) return;

    try {
      setSaving(true);
      setAiSuggestion('');
      const res = await api.post('/timetables/adjust-workload', {
        facultyId: parseInt(formData.facultyId),
        type: formData.type,
        amount: parseInt(formData.amount)
      });

      if (res.data.success) {
        showToast('Workload limit adjusted successfully!');
        setAiSuggestion(res.data.data.suggestion);
        fetchData();
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Failed to adjust workload', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto text-left">
        {/* Left Column: Form & Suggestions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 shadow-xl space-y-4">
            <div>
              <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Workload Configuration
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Alter teaching hours allowance limits</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Select Faculty</label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                >
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Action Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                  >
                    <option value="INCREASE">Increase Hours</option>
                    <option value="DECREASE">Decrease Hours</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount (hrs)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 2 })}
                    min="1"
                    max="12"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Processing...' : 'Apply Workload Limit'}
              </button>
            </form>
          </div>

          {/* AI Suggestions Box */}
          {aiSuggestion && (
            <div className="glass border border-indigo-500/25 rounded-2xl p-5 bg-indigo-950/15 text-left shadow-lg space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="font-bold text-xs text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                AI Assistant Recommendations
              </h4>
              <p className="text-xs text-indigo-200 leading-relaxed font-semibold">
                {aiSuggestion}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: History List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Workload Modification Logs</h3>
          <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <div className="divide-y divide-zinc-900">
              {loading ? (
                <div className="p-8 text-center text-zinc-650">
                  <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-600 mb-2" />
                  Loading modification logs...
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center text-zinc-650 text-sm">
                  No workload modifications recorded yet.
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req?.id || Math.random()} className="p-5 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        req?.type === 'INCREASE' 
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
                      }`}>
                        {req?.type === 'INCREASE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-zinc-200">{req?.faculty?.name || 'N/A'} ({req?.faculty?.code || ''})</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">{req?.type === 'INCREASE' ? 'Raised limit' : 'Reduced limit'} by {req?.amount || 0} hours</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {req?.status || 'PENDING'}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-1">{new Date(req?.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                    </div>
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
