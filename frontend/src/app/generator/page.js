'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { 
  Sparkles, Check, ChevronRight, Play, Loader2, Download, Printer, 
  Eye, HelpCircle, Users, BookOpen, GraduationCap, X, Plus
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIME_SLOTS = [
  '09:00-10:00', '10:00-11:00', '11:00-12:00', 
  '13:00-14:00', '14:00-15:00', '15:00-16:00'
];

export default function GeneratorPage() {
  const { showToast } = useToast();
  
  // Wizard Steps
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Available Data lists
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [faculty, setFaculty] = useState([]);

  // Selections
  const [selectedSemesters, setSelectedSemesters] = useState([3, 5]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [classrooms, setClassrooms] = useState(['Room 101', 'Room 102', 'Room 103']);
  const [newRoom, setNewRoom] = useState('');

  // View timetable states
  const [activeTab, setActiveTab] = useState('class'); // class or faculty
  const [selectedViewId, setSelectedViewId] = useState('');
  const [timetableGrid, setTimetableGrid] = useState({});

  const fetchData = async () => {
    try {
      const [deptRes, classRes, facRes] = await Promise.all([
        api.get('/departments'),
        api.get('/classes'),
        api.get('/faculty', { params: { limit: 100 } })
      ]);

      if (deptRes.data.success) {
        setDepartments(deptRes.data.data);
        setSelectedDepts(deptRes.data.data.map(d => d.id));
      }
      if (classRes.data.success) {
        setClasses(classRes.data.data);
        if (classRes.data.data.length > 0) {
          setSelectedViewId(classRes.data.data[0].id.toString());
        }
      }
      if (facRes.data.success) setFaculty(facRes.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch timetable grid when selection changes
  useEffect(() => {
    if (!selectedViewId) return;

    const fetchTimetable = async () => {
      try {
        const url = activeTab === 'class' 
          ? `/timetables/class/${selectedViewId}` 
          : `/timetables/faculty/${selectedViewId}`;
        
        const res = await api.get(url);
        if (res.data.success) {
          // Format raw slots array into quick lookup map: key = `${day}-${timeStart}`
          const gridMap = {};
          res.data.data.forEach(slot => {
            const key = `${slot.dayOfWeek}-${slot.startTime}`;
            gridMap[key] = slot;
          });
          setTimetableGrid(gridMap);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchTimetable();
  }, [activeTab, selectedViewId]);

  const handleAddRoom = () => {
    if (newRoom && !classrooms.includes(newRoom)) {
      setClassrooms([...classrooms, newRoom]);
      setNewRoom('');
    }
  };

  const handleRemoveRoom = (room) => {
    setClassrooms(classrooms.filter(r => r !== room));
  };

  const toggleSemester = (sem) => {
    setSelectedSemesters(prev => 
      prev.includes(sem) ? prev.filter(s => s !== sem) : [...prev, sem]
    );
  };

  const toggleDept = (id) => {
    setSelectedDepts(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleTriggerGenerate = async () => {
    if (selectedSemesters.length === 0 || selectedDepts.length === 0 || classrooms.length === 0) {
      showToast('Please select semesters, departments and add classrooms', 'warning');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.post('/timetables/generate', {
        semesters: selectedSemesters,
        departmentIds: selectedDepts,
        classrooms
      });

      if (res.data.success) {
        showToast(`AI Timetable generated. ${res.data.details.scheduledPeriods} periods configured successfully!`);
        if (res.data.details.conflictsDetected > 0) {
          showToast(`Warning: Detected ${res.data.details.conflictsDetected} room or faculty conflict(s). Review in Conflict Detection page.`, 'warning');
        }
        setStep(3); // go to preview step
        fetchData(); // refresh grids
      }
    } catch (error) {
      showToast(error.response?.data?.error || 'Timetabling calculation failure.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Header
    csvContent += 'TimeSlot,' + DAYS.join(',') + '\n';

    TIME_SLOTS.forEach(slotRange => {
      const startTime = slotRange.split('-')[0];
      let row = slotRange + ',';
      
      const dayValues = DAYS.map(day => {
        const slot = timetableGrid[`${day}-${startTime}`];
        if (!slot) return 'FREE';
        if (activeTab === 'class') {
          return `"${slot.subject.name} (${slot.classroom} - ${slot.faculty.name})"`;
        } else {
          return `"${slot.subject.name} (${slot.classroom} - Sem ${slot.class.semester}-${slot.class.section})"`;
        }
      });
      
      row += dayValues.join(',') + '\n';
      csvContent += row;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timetable_${activeTab}_${selectedViewId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-7xl mx-auto text-left print:p-0 print:m-0">
        {/* Wizard Headers (hidden during print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Schedule Optimization Studio</h2>
            <p className="text-sm text-zinc-500">Run the constraint satisfaction scheduling engine to build clash-free weekly charts</p>
          </div>
          
          {/* Stepper indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                onClick={() => { if (num <= step) setStep(num); }}
                className={`w-8 h-8 rounded-full border font-bold text-xs flex items-center justify-center transition-all ${
                  step === num 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : step > num
                    ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-650'
                }`}
              >
                {step > num ? <Check className="w-3.5 h-3.5" /> : num}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Configure options */}
        {step === 1 && !generating && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
            {/* Semesters Card */}
            <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 flex flex-col gap-4">
              <h4 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                Select Semesters
              </h4>
              <p className="text-xs text-zinc-500">Pick which levels are scheduled in this run</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => {
                  const active = selectedSemesters.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSemester(s)}
                      className={`p-3 rounded-xl border text-left font-semibold text-xs transition-all ${
                        active 
                          ? 'bg-indigo-950/40 border-indigo-500/35 text-indigo-300' 
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-500 hover:text-zinc-350'
                      }`}
                    >
                      Semester {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Departments Card */}
            <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 flex flex-col gap-4">
              <h4 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                Select Departments
              </h4>
              <p className="text-xs text-zinc-500">Enable calculations across select colleges</p>
              <div className="space-y-2 mt-2 overflow-y-auto max-h-[170px] pr-1">
                {departments.map(d => {
                  const active = selectedDepts.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDept(d.id)}
                      className={`w-full p-3 rounded-xl border text-left font-semibold text-xs flex items-center justify-between transition-all ${
                        active 
                          ? 'bg-purple-950/40 border-purple-500/35 text-purple-300' 
                          : 'bg-zinc-900/40 border-zinc-850 text-zinc-550'
                      }`}
                    >
                      <span>{d.name}</span>
                      <span className="font-bold text-[10px] uppercase">{d.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classrooms Card */}
            <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 flex flex-col gap-4">
              <h4 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Designate Lecture Rooms
              </h4>
              <p className="text-xs text-zinc-500">Provide physical rooms codes to map slots</p>
              
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="e.g. Room 304"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-850 outline-none text-zinc-200 focus:border-cyan-500/30"
                />
                <button
                  onClick={handleAddRoom}
                  className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[100px] pr-1 mt-1">
                {classrooms.map(room => (
                  <span key={room} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-850 text-[10px] font-bold text-cyan-300">
                    {room}
                    <button onClick={() => handleRemoveRoom(room)} className="text-zinc-500 hover:text-rose-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="col-span-full flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                Configure Constraints
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Trigger generate */}
        {step === 2 && !generating && (
          <div className="max-w-xl mx-auto glass border border-zinc-800 rounded-3xl p-8 bg-zinc-900/10 text-center space-y-6 print:hidden">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5 animate-pulse">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Ready to run AI scheduler?</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              This will overwrite previous timetables for the selected departments and semesters and generate an optimized weekly grid.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-2.5 px-5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 text-xs font-bold transition-all"
              >
                Back to settings
              </button>
              <button
                onClick={handleTriggerGenerate}
                className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                Launch AI Generator
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {generating && (
          <div className="max-w-md mx-auto p-12 text-center space-y-4 print:hidden">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            <h3 className="font-bold text-zinc-200">AI Calculations In Progress</h3>
            <p className="text-xs text-zinc-500">Analyzing calendar constraints, teacher availability records, classroom overlaps, and balancing lecture blocks...</p>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-progress-bar"></div>
            </div>
          </div>
        )}

        {/* Step 3: Timetable Grid Preview */}
        {step === 3 && !generating && (
          <div className="space-y-6">
            {/* View selectors */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/20 p-4 border border-zinc-900 rounded-2xl print:hidden">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => { setActiveTab('class'); setSelectedViewId(classes[0]?.id.toString() || ''); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'class' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  Class Timetable
                </button>
                <button
                  onClick={() => { setActiveTab('faculty'); setSelectedViewId(faculty[0]?.id.toString() || ''); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'faculty' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  Faculty Timetable
                </button>

                <select
                  value={selectedViewId}
                  onChange={(e) => setSelectedViewId(e.target.value)}
                  className="ml-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs outline-none focus:border-indigo-500/30"
                >
                  {activeTab === 'class' ? (
                    classes.map(c => (
                      <option key={c.id} value={c.id}>Sem {c.semester}-{c.section} ({c.department.code})</option>
                    ))
                  ) : (
                    faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                    ))
                  )}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel Export
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 py-2 px-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Schedule
                </button>
              </div>
            </div>

            {/* Timetable Grid display */}
            <div className="glass border border-zinc-800/80 rounded-2xl p-6 bg-zinc-900/10 shadow-2xl overflow-x-auto print:border-none print:shadow-none print:p-0">
              <h3 className="hidden print:block text-zinc-900 text-lg font-bold text-center mb-6">
                UNIVERSITY TIMETABLE - {activeTab === 'class' ? `Class: ${classes.find(c => c.id.toString() === selectedViewId)?.semester}-${classes.find(c => c.id.toString() === selectedViewId)?.section}` : `Faculty: ${faculty.find(f => f.id.toString() === selectedViewId)?.name}`}
              </h3>
              
              <table className="w-full border-collapse border border-zinc-800 print:border-zinc-300 min-w-[700px]">
                <thead>
                  <tr className="bg-zinc-950/20 print:bg-zinc-100">
                    <th className="border border-zinc-800 print:border-zinc-300 p-4 text-xs font-bold text-zinc-400 print:text-zinc-650 text-center uppercase w-32">Time Slot</th>
                    {DAYS.map(day => (
                      <th key={day} className="border border-zinc-800 print:border-zinc-300 p-4 text-xs font-bold text-zinc-400 print:text-zinc-650 text-center uppercase">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {TIME_SLOTS.map((slotRange) => {
                    const startTime = slotRange.split('-')[0];
                    return (
                      <tr key={slotRange} className="hover:bg-zinc-900/5 transition-colors">
                        {/* Time labels column */}
                        <td className="border border-zinc-800 print:border-zinc-300 p-4 font-mono text-center text-xs font-bold text-zinc-400 print:text-zinc-650 bg-zinc-950/10 print:bg-zinc-50">
                          {slotRange}
                        </td>
                        {/* Days column values */}
                        {DAYS.map(day => {
                          const slot = timetableGrid[`${day}-${startTime}`];
                          return (
                            <td 
                              key={day} 
                              className={`border border-zinc-800 print:border-zinc-300 p-4 text-center h-28 relative transition-colors ${
                                slot 
                                  ? 'bg-indigo-950/25 print:bg-indigo-50 border-l-2 border-l-indigo-500' 
                                  : 'bg-zinc-900/10 print:bg-white text-zinc-600 print:text-zinc-300'
                              }`}
                            >
                              {slot ? (
                                <div className="space-y-1.5 text-left">
                                  <div className="font-bold text-xs text-indigo-300 print:text-indigo-850 leading-tight">
                                    {slot?.subject?.name || 'N/A'}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-400 print:text-zinc-600">
                                    {slot?.subject?.code || ''}
                                  </div>
                                  <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-500 print:text-zinc-550 border-t border-zinc-850/50 pt-1.5 mt-1.5">
                                    <span>{slot?.classroom || 'N/A'}</span>
                                    <span>
                                      {activeTab === 'class' 
                                        ? (slot?.faculty?.name ? slot.faculty.name.replace('Dr. ', '') : 'N/A') 
                                        : (slot?.class ? `Sem ${slot?.class?.semester}-${slot?.class?.section}` : 'N/A')}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-wider">FREE</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
