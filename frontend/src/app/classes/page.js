'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Plus, Edit2, Trash2, GraduationCap, Clock, X } from 'lucide-react';

export default function ClassesPage() {
  const { showToast } = useToast();
  
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    departmentId: '',
    semester: 1,
    section: 'A',
    strength: 60
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, deptRes] = await Promise.all([
        api.get('/classes'),
        api.get('/departments')
      ]);

      if (classRes.data.success) setClasses(classRes.data.data);
      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
        if (deptRes.data.data.length > 0) {
          setFormData(prev => ({ ...prev, departmentId: deptRes.data.data[0].id }));
        }
      }
    } catch (error) {
      showToast('Error loading academic classes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    setFormData({
      departmentId: departments[0]?.id || '',
      semester: 1,
      section: 'A',
      strength: 60
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      departmentId: cls.departmentId,
      semester: cls.semester,
      section: cls.section,
      strength: cls.strength
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        const res = await api.put(`/classes/${editingClass.id}`, formData);
        if (res.data.success) {
          showToast('Class updated successfully!');
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/classes', formData);
        if (res.data.success) {
          showToast('Class created successfully!');
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Validation error saving class', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class section? All timetables will be deleted.')) return;
    try {
      const res = await api.delete(`/classes/${id}`);
      if (res.data.success) {
        showToast('Class section deleted successfully!');
        fetchData();
      }
    } catch (error) {
      showToast('Failed to delete class section', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto text-left">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Classes Directory</h2>
            <p className="text-sm text-zinc-500">Configure academic semesters, classroom student limits, and division sections</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Class Section
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-zinc-600">
              <Clock className="w-6 h-6 animate-spin mx-auto text-zinc-650 mb-2" />
              Loading academic class sections...
            </div>
          ) : classes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-600">
              No class sections registered.
            </div>
          ) : (
            classes.map((cls) => (
              <div key={cls?.id || Math.random()} className="glass border border-zinc-800/80 rounded-2xl p-5 bg-zinc-900/10 flex flex-col justify-between hover:border-indigo-500/20 group transition-all shadow-md">
                <div className="flex items-start justify-between border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <GraduationCap className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-200">Sem {cls?.semester || ''}-{cls?.section || ''}</h4>
                      <p className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5 truncate max-w-[150px]">{cls?.department?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-indigo-400">
                    {cls?.department?.code || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-zinc-500 font-semibold">Strength: <strong className="text-zinc-300">{cls.strength} Students</strong></span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(cls)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                      title="Edit class"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
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
                {editingClass ? 'Edit Class Specifications' : 'Register New Class Section'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Section</label>
                    <input
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                      placeholder="e.g. A"
                      maxLength="2"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Capacity</label>
                    <input
                      type="number"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: parseInt(e.target.value) || 60 })}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm outline-none focus:border-indigo-500/30 transition-colors"
                      min="10"
                      max="120"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
                >
                  {editingClass ? 'Save Changes' : 'Create Class Section'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
