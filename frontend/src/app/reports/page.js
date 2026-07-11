'use client';

import React, { useState, useEffect } from 'react';
import MainLayout, { useToast } from '@/components/MainLayout';
import api from '@/services/api';
import { Download, Printer, Clock } from 'lucide-react';

export default function ReportsPage() {
  const { showToast } = useToast();
  
  const [facultyReport, setFacultyReport] = useState([]);
  const [departmentReport, setDepartmentReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [facRes, deptRes] = await Promise.all([
        api.get('/reports/faculty-report'),
        api.get('/reports/department-report')
      ]);

      if (facRes.data.success) setFacultyReport(facRes.data.data);
      if (deptRes.data.success) setDepartmentReport(deptRes.data.data);
    } catch (error) {
      showToast('Error loading academic reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = (type) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    if (type === 'faculty') {
      csvContent += 'Code,Name,Department,Workload Hours,Workload Limit,Utilization\n';
      facultyReport.forEach(f => {
        csvContent += `"${f.code}","${f.name}","${f.departmentCode}",${f.assignedWorkload},${f.workloadLimit},${f.utilizationPercentage}%\n`;
      });
    } else {
      csvContent += 'Code,Department Name,Classes Count,Subjects Count,Faculty Count,Scheduled Periods,Utilization\n';
      departmentReport.forEach(d => {
        csvContent += `"${d.code}","${d.name}",${d.classCount},${d.subjectCount},${d.facultyCount},${d.scheduledSlots}/${d.potentialSlots},${d.utilizationPercentage}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto text-left print:p-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Analytics & Reports</h2>
            <p className="text-sm text-zinc-500">Review faculty workload capacities and department scheduling utilization rates</p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 py-2.5 px-4.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report Sheet
          </button>
        </div>

        {/* Section 1: Department Utilization */}
        <section className="space-y-4">
          <div className="flex items-center justify-between print:hidden">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Department Utilization Report</h3>
            <button
              onClick={() => handleExportCSV('department')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Department CSV
            </button>
          </div>
          <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Department Name</th>
                  <th className="px-6 py-4 text-center">Faculty Count</th>
                  <th className="px-6 py-4 text-center">Classes Count</th>
                  <th className="px-6 py-4 text-center">Subjects Count</th>
                  <th className="px-6 py-4 text-center">Scheduled Periods</th>
                  <th className="px-6 py-4 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-zinc-650">
                      <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-600 mb-2" />
                      Loading department reports...
                    </td>
                  </tr>
                ) : departmentReport.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-zinc-600">No department statistics found.</td>
                  </tr>
                ) : (
                  departmentReport.map((dept) => (
                    <tr key={dept?.id || Math.random()} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-zinc-450 text-xs">{dept?.code || ''}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-200">{dept?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-center font-mono">{dept?.facultyCount || 0}</td>
                      <td className="px-6 py-4 text-center font-mono">{dept?.classCount || 0}</td>
                      <td className="px-6 py-4 text-center font-mono">{dept?.subjectCount || 0}</td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-zinc-400">
                        {dept?.scheduledSlots || 0} / {dept?.potentialSlots || 0} slots
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-indigo-405 font-mono">{dept?.utilizationPercentage || 0}%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Faculty Workload Report */}
        <section className="space-y-4">
          <div className="flex items-center justify-between print:hidden">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Faculty Workload Distribution</h3>
            <button
              onClick={() => handleExportCSV('faculty')}
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Workload CSV
            </button>
          </div>
          <div className="glass border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl bg-zinc-900/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-950/20">
                  <th className="px-6 py-4 text-left">Code</th>
                  <th className="px-6 py-4 text-left">Faculty Name</th>
                  <th className="px-6 py-4 text-left">Department</th>
                  <th className="px-6 py-4 text-center">Assigned Workload</th>
                  <th className="px-6 py-4 text-center">Weekly Limit</th>
                  <th className="px-6 py-4 text-center">Capacity Utilization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-350 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-zinc-650">
                      <Clock className="w-5 h-5 animate-spin mx-auto text-zinc-600 mb-2" />
                      Loading faculty metrics...
                    </td>
                  </tr>
                ) : facultyReport.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-zinc-600">No faculty reports found.</td>
                  </tr>
                ) : (
                  facultyReport.map((fac) => (
                    <tr key={fac?.id || Math.random()} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4 font-mono text-zinc-450 text-xs font-semibold">{fac?.code || ''}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-200">{fac?.name || 'N/A'}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{fac?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-455">
                          {fac?.departmentCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-zinc-200">{fac?.assignedWorkload || 0} hrs</td>
                      <td className="px-6 py-4 text-center font-mono text-zinc-500">{fac?.workloadLimit || 0} hrs</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-24 h-2 rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                (fac?.utilizationPercentage || 0) > 90 ? 'bg-rose-500' :
                                (fac?.utilizationPercentage || 0) > 75 ? 'bg-amber-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, fac?.utilizationPercentage || 0)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-xs font-bold text-zinc-300">{fac?.utilizationPercentage || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
