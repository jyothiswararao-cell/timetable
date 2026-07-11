'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Clock, Terminal, Users } from 'lucide-react';

export default function AdminPage() {
  const { showToast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [logsRes, usersRes] = await Promise.all([
        api.get('/timetables/audit-logs'),
        api.get('/faculty', { params: { limit: 100 } })
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (usersRes.data.success) {
        const mockUsers = usersRes.data.data.map(f => ({
          id: f.id,
          name: f.name,
          email: f.email,
          role: 'FACULTY',
          code: f.code
        }));
        setUsers([
          { id: 99, name: 'System Admin', email: 'admin@timetable.com', role: 'ADMIN', code: 'ADM001' },
          ...mockUsers
        ]);
      }
    } catch (error) {
      showToast('Error loading admin configurations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto text-left">
        {/* Users list */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4.5 h-4.5 text-indigo-400" />
            Users & Role Config
          </h3>
          <div className="glass border border-zinc-850 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <div className="divide-y divide-zinc-900">
              {loading ? (
                <div className="p-8 text-center text-zinc-600">Loading user profiles...</div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/10 transition-colors">
                    <div>
                      <h4 className="font-semibold text-sm text-zinc-200">{u.name}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{u.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border tracking-wider ${
                      u.role === 'ADMIN' 
                        ? 'bg-indigo-950/50 text-indigo-400 border-indigo-900/30' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Audit Logs list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-purple-400" />
            System Audit Trail
          </h3>
          <div className="glass border border-zinc-850 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <div className="p-4 border-b border-zinc-850 bg-zinc-950/20">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Live Database Transaction Logs</h4>
            </div>
            <div className="divide-y divide-zinc-900 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
              {loading ? (
                <div className="p-8 text-center text-zinc-650">Loading audit trail logs...</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-zinc-550 text-xs">No audit logs available.</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-4.5 flex items-start gap-4 hover:bg-zinc-900/10 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{log.action}</span>
                        <span className="text-[10px] text-zinc-650">•</span>
                        <span className="text-[10px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-medium mt-1 leading-snug">{log.details}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">Executor: {log.user ? log.user.name : 'System Scheduler'}</p>
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
