'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Plus, Search, Edit2, Trash2, Clock, X } from 'lucide-react';

export default function SubjectsPage() {
  const { showToast } = useToast();
  
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

  // Form Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    semester: 1,
    departmentId: '',
    facultyId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, deptRes, facRes] = await Promise.all([
        api.get('/subjects', {
          params: {
            search,
            departmentId: deptFilter || undefined,
            semester: semFilter || undefined
          }
        }),
        api.get('/departments'),
        api.get('/faculty', { params: { limit: 100 } })
      ]);

      if (subRes.data.success) setSubjects(subRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (facRes.data.success) setFaculty(facRes.data.data);
    } catch (error) {
      showToast('Error loading subject database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, deptFilter, semFilter]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      credits: 3,
      semester: 1,
      departmentId: departments[0]?.id || '',
      facultyId: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      code: sub.code,
      credits: sub.credits,
      semester: sub.semester,
      departmentId: sub.departmentId,
      facultyId: sub.facultyId || ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        facultyId: formData.facultyId ? parseInt(formData.facultyId) : null
      };

      if (editingSubject) {
        const res = await api.put(`/subjects/${editingSubject.id}`, payload);
        if (res.data.success) {
          showToast('Subject updated successfully!');
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/subjects', payload);
        if (res.data.success) {
          showToast('Subject created successfully!');
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Validation error saving subject', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject? This might affect existing timetables.')) return;
    try {
      const res = await api.delete(`/subjects/${id}`);
      if (res.data.success) {
        showToast('Subject deleted successfully!');
        fetchData();
      }
    } catch (error) {
      showToast('Failed to delete subject', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Subjects Directory</h2>
            <p className="text-sm text-zinc-500">Register courses, configure academic credits, and designate teaching roles</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.code}</option>
            ))}
          </select>
          <select
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Subject Title</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-left">Semester</th>
                  <th className="px-6 py-4 text-left">Credits</th>
                  <th className="px-6 py-4 text-left">Assigned Teacher</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-zinc-650">
                      <Clock className="w-6 h-6 animate-spin mx-auto text-zinc-600 mb-2" />
                      Loading subject database...
                    </td>
                  </tr>
                ) : subjects.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-zinc-600">
                      No subjects registered.
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub) => (
                    <tr key={sub?.id || Math.random()} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs font-semibold">{sub?.code || ''}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-100">{sub?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400">
                          {sub?.department?.code || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">Sem {sub?.semester || ''}</td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-400">{sub?.credits || 0}</td>
                      <td className="px-6 py-4">
                        {sub?.faculty ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-200">{sub?.faculty?.name || 'N/A'}</span>
                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">{sub?.faculty?.code || ''}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs font-semibold uppercase tracking-wider bg-zinc-900 px-2 py-1 rounded border border-dashed border-zinc-800">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
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
              
              <h3 className="text-lg font-bold text-zinc-100 mb-4">
                {editingSubject ? 'Edit Subject Registration' : 'Register New Subject'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subject Title</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Computer Networks"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subject Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. CSE502"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Credits</label>
                    <input
                      type="number"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      min="1"
                      max="6"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Department</label>
                    <select
                      value={formData.departmentId}
                      onChange={(e) => setFormData({ ...formData, departmentId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Assign Faculty Member</label>
                  <select
                    value={formData.facultyId}
                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-350 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                  >
                    <option value="">No Faculty Assigned</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
                >
                  {editingSubject ? 'Save Changes' : 'Register Subject'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
