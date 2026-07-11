'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { 
  Plus, Search, Edit2, Trash2, Calendar, Clock, 
  ChevronLeft, ChevronRight, X, Sparkles, Check, Trash
} from 'lucide-react';

export default function FacultyPage() {
  const { showToast } = useToast();
  
  // Data States
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals States
  const [modalOpen, setModalOpen] = useState(false);
  const [availModalOpen, setAvailModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    workloadLimit: 16,
    departmentId: ''
  });

  // Availability calendar pattern
  const [availabilities, setAvailabilities] = useState([]);

  // Fetch Faculty List
  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty', {
        params: {
          search,
          departmentId: deptFilter || undefined,
          page,
          limit: 8
        }
      });
      if (res.data.success) {
        setFaculty(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (error) {
      showToast('Error loading faculty list', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Departments for Form Dropdown
  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data.success) {
        setDepartments(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching departments', error);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchFaculty();
  }, [search, deptFilter, page]);

  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      code: '',
      email: '',
      workloadLimit: 16,
      departmentId: departments[0]?.id || ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      name: fac.name,
      code: fac.code,
      email: fac.email,
      workloadLimit: fac.workloadLimit,
      departmentId: fac.departmentId
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        // Edit Action
        const res = await api.put(`/faculty/${editingFaculty.id}`, formData);
        if (res.data.success) {
          showToast('Faculty updated successfully!');
          setModalOpen(false);
          fetchFaculty();
        }
      } else {
        // Create Action
        const res = await api.post('/faculty', formData);
        if (res.data.success) {
          showToast('Faculty created successfully!');
          setModalOpen(false);
          fetchFaculty();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Validation error saving faculty', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member? All associated schedules will be deleted.')) return;
    try {
      const res = await api.delete(`/faculty/${id}`);
      if (res.data.success) {
        showToast('Faculty deleted successfully!');
        fetchFaculty();
      }
    } catch (error) {
      showToast('Failed to delete faculty member', 'error');
    }
  };

  // Open Availability Pattern Calendar
  const handleOpenAvailability = async (fac) => {
    setSelectedFaculty(fac);
    try {
      const res = await api.get(`/faculty/${fac.id}/availability`);
      if (res.data.success) {
        setAvailabilities(res.data.data);
        setAvailModalOpen(true);
      }
    } catch (error) {
      showToast('Error loading availability calendar', 'error');
    }
  };

  // Toggle single availability cell
  const handleToggleAvail = (id) => {
    setAvailabilities(prev => 
      prev.map(av => av.id === id ? { ...av, isAvailable: !av.isAvailable } : av)
    );
  };

  const handleSaveAvailability = async () => {
    try {
      const res = await api.put(`/faculty/${selectedFaculty.id}/availability`, {
        availabilities
      });
      if (res.data.success) {
        showToast('Faculty availability calendar updated successfully!');
        setAvailModalOpen(false);
        fetchFaculty();
      }
    } catch (error) {
      showToast('Failed to save availability schedule', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Faculty Directory</h2>
            <p className="text-sm text-zinc-500">Manage teaching staff and coordinate lecture availability</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Faculty Member
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search faculty by name, code or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        {/* Faculty Table / List */}
        <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Faculty Name</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Workload Distribution</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-650">
                      <Clock className="w-6 h-6 animate-spin mx-auto text-zinc-600 mb-2" />
                      Loading faculty directory...
                    </td>
                  </tr>
                ) : faculty.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-600">
                      No faculty members found matching search parameters.
                    </td>
                  </tr>
                ) : (
                  faculty.map((fac) => (
                    <tr key={fac?.id || Math.random()} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs font-semibold">{fac?.code || ''}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-100">{fac?.name || 'N/A'}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{fac?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-semibold">
                          {fac?.department?.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full max-w-[200px] space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                            <span>{fac?.subjects?.length || 0} Subjects</span>
                            <span>Limit: {fac?.workloadLimit || 16} hrs</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((fac?.subjects?.length || 0) * 4 / (fac?.workloadLimit || 16)) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenAvailability(fac)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-400 rounded-lg transition-colors"
                            title="Manage Availability"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(fac)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 rounded-lg transition-colors"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fac.id)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-rose-455 rounded-lg transition-colors"
                            title="Delete faculty"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-850 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-semibold">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add/Edit Faculty Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="glass border border-zinc-800 rounded-2xl w-full max-w-md p-6 bg-zinc-950/90 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1 hover:bg-zinc-900 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-lg font-bold text-zinc-100 mb-4">
                {editingFaculty ? 'Edit Faculty Details' : 'Add New Faculty Member'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Faculty Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Ada Lovelace"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Code ID</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. FAC009"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Workload Limit (hrs)</label>
                    <input
                      type="number"
                      value={formData.workloadLimit}
                      onChange={(e) => setFormData({ ...formData, workloadLimit: parseInt(e.target.value) || 16 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      min="4"
                      max="40"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@university.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Department Link</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
                >
                  {editingFaculty ? 'Save Changes' : 'Create Profile'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Availability Calendar Dialog */}
        {availModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="glass border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 bg-zinc-950/95 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setAvailModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1 hover:bg-zinc-900 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="text-lg font-bold text-zinc-100">Faculty Availability Pattern</h3>
              <p className="text-xs text-zinc-500 mt-1 mb-6">Select available weekly blocks for {selectedFaculty?.name}</p>

              {/* Grid layout */}
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2 border-b border-zinc-850 pb-2 text-xs font-semibold text-zinc-400 text-center uppercase tracking-wider">
                  <div>Time Slot</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                </div>

                {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'].map((time) => (
                  <div key={time} className="grid grid-cols-6 gap-2 items-center">
                    <div className="text-center font-mono text-xs font-semibold text-zinc-400 border border-zinc-900 bg-zinc-900/40 py-2.5 rounded-xl">{time}</div>
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((day) => {
                      const av = availabilities.find(a => a.dayOfWeek === day && a.startTime === time);
                      if (!av) return <div key={day} className="h-10 bg-zinc-900/20 rounded-xl"></div>;
                      return (
                        <button
                          key={day}
                          onClick={() => handleToggleAvail(av.id)}
                          className={`h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                            av.isAvailable
                              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/20'
                              : 'bg-zinc-900 border-zinc-850 text-zinc-600'
                          }`}
                        >
                          {av.isAvailable ? <Check className="w-4 h-4" /> : ''}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-zinc-850">
                <button
                  onClick={() => setAvailModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvailability}
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-550 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Apply Patterns
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
