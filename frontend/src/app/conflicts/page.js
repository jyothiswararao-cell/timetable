'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { AlertTriangle, Clock, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';

export default function ConflictsPage() {
  const { showToast } = useToast();
  
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      const res = await api.post('/timetables/detect-conflicts');
      if (res.data.success) {
        setConflicts(res.data.data);
      }
    } catch (error) {
      showToast('Error scanning for timetable conflicts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const handleAutoResolve = async () => {
    try {
      setResolving(true);
      const res = await api.post('/timetables/auto-resolve');
      if (res.data.success) {
        const { resolved, total } = res.data.data;
        if (resolved > 0) {
          showToast(`Success! Auto-resolved ${resolved} of ${total} scheduling conflict(s).`, 'success');
        } else {
          showToast('Conflict solver finished. No adjustments made.', 'info');
        }
        fetchConflicts();
      }
    } catch (error) {
      showToast('Error during conflict resolution calculations', 'error');
    } finally {
      setResolving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl mx-auto text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              Conflict Engine Dashboard
            </h2>
            <p className="text-sm text-zinc-500">Track structural schedule conflicts and trigger automated corrections</p>
          </div>

          {conflicts.length > 0 && (
            <button
              onClick={handleAutoResolve}
              disabled={resolving}
              className="flex items-center gap-2 py-2.5 px-4.5 rounded-xl bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-550 hover:to-purple-550 text-white font-semibold text-xs shadow-lg shadow-indigo-650/15 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              {resolving ? 'Resolving...' : 'Auto-Resolve Conflicts'}
            </button>
          )}
        </div>

        <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
          <div className="p-4 border-b border-zinc-850 bg-zinc-950/20 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Unresolved Reports ({conflicts.length})</h3>
            <button
              onClick={fetchConflicts}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Force Rescan
            </button>
          </div>

          <div className="divide-y divide-zinc-900">
            {loading ? (
              <div className="p-8 text-center text-zinc-650">
                <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-650 mb-2" />
                Scanning database for conflicts...
              </div>
            ) : conflicts.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-zinc-200">No conflicts detected!</h4>
                <p className="text-xs text-zinc-500">Your scheduling calendar is 100% collision-free.</p>
              </div>
            ) : (
              conflicts.map((conflict) => (
                <div key={conflict?.id || Math.random()} className="p-5 flex items-start gap-4 hover:bg-zinc-900/10 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    conflict?.severity === 'RED' ? 'bg-rose-950/40 border-rose-500/20 text-rose-400' :
                    conflict?.severity === 'ORANGE' ? 'bg-amber-950/40 border-amber-500/20 text-amber-400' :
                    'bg-yellow-950/40 border-yellow-500/20 text-yellow-500'
                  }`}>
                    <AlertTriangle className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        conflict?.severity === 'RED' ? 'bg-rose-950/50 text-rose-400 border-rose-900/30' :
                        conflict?.severity === 'ORANGE' ? 'bg-amber-950/50 text-amber-400 border-amber-900/30' :
                        'bg-yellow-950/50 text-yellow-500 border-yellow-900/30'
                      }`}>
                        {conflict?.type || 'UNKNOWN'} CONFLICT
                      </span>
                      <span className="text-[10px] text-zinc-500">{new Date(conflict?.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-300 mt-2 leading-relaxed">
                      {conflict?.description || ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
