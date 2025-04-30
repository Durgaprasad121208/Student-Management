import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { PdfIcon, CsvIcon } from './_ReportIcons';
import { ExcelIcon } from './_ReportIcons';

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

export default function ReportsManage() {
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false); // Only declare once at the top
  const [error, setError] = useState(''); // Only declare once at the top
  const [msg, setMsg] = useState('');

  // Filters & form state
  const [filter, setFilter] = useState({ type: '', from: '', to: '' });
  const [form, setForm] = useState({
    reportMode: 'class',
    // For class-wise
    classSection: '',
    classYear: '',
    classSemester: '',
    // For individual
    studentId: '',
    indYear: '',
    indSection: '',
    indSemester: '',
    indSearch: '',
  });
  const [generating, setGenerating] = useState(false);

  // Fetch students for dropdown
  const fetchStudents = async () => {
    try {
      const res = await apiRequest('/student');
      setStudents(res);
    } catch (err) {
      setStudents([]);
    }
  };


  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/report');
      setReports(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); fetchStudents(); }, []);

  const handleDownload = async (id, format) => {
    try {
      const token = localStorage.getItem('token');
      const url = `${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/report/${id}/download?format=${format}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `report_${id}.${format}`;
      link.click();
      setMsg(`Downloaded report as ${format.toUpperCase()}`);
    } catch (err) {
      setError('Failed to download report.');
    }
  };

  // Filter reports in-memory
  const filteredReports = reports.filter(r => {
    let match = true;
    if (filter.type) match = match && r.type === filter.type;
    if (filter.from) {
      const created = new Date(r.createdAt).setHours(0,0,0,0);
      const from = new Date(filter.from).setHours(0,0,0,0);
      match = match && created >= from;
    }
    if (filter.to) {
      const created = new Date(r.createdAt).setHours(0,0,0,0);
      const to = new Date(filter.to).setHours(23,59,59,999);
      match = match && created <= to;
    }
    return match;
  });

  // Handle filter change
  const handleFilterChange = e => setFilter(f => ({ ...f, [e.target.name]: e.target.value }));

  // Handle form change
  const handleFormChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Generate report (calls backend PDF generator)
  const handleGenerate = async e => {
    e.preventDefault();
    setGenerating(true);
    setMsg('');
    setError('');
    try {
      if (!form.studentId || !form.indSemester) throw new Error('Select student and semester');
      const params = `studentId=${form.studentId}&semester=${form.indSemester}&reportType=${form.indReportType}`;
      const url = `${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/report/student?${params}`;
      const token = localStorage.getItem('token');
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to generate report');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `student_report_${form.studentId}_${form.indSemester}.pdf`;
      link.click();
      setMsg('Report generated and downloaded!');
      setTimeout(fetchReports, 1200);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Reports Management</h2>
      {/* Generate Report Form */}
       {/* Report Mode Selection */}
      <div className="flex gap-6 mb-4 items-center">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="reportMode"
            value="class"
            checked={form.reportMode === 'class'}
            onChange={() => setForm(f => ({ ...f, reportMode: 'class' }))}
            className="mr-2"
          />
          Class-wise Report
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="reportMode"
            value="individual"
            checked={form.reportMode === 'individual'}
            onChange={() => setForm(f => ({ ...f, reportMode: 'individual' }))}
            className="mr-2"
          />
          Individual Report
        </label>
      </div>
      <form className="bg-white shadow-lg rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end" onSubmit={handleGenerate}>
        {form.reportMode === 'class' ? (
          <div className="flex flex-wrap gap-3 items-end mb-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Section</label>
              <select name="classSection" value={form.classSection || ''} onChange={e => setForm(f => ({ ...f, classSection: e.target.value }))} className="p-2 border rounded w-32">
                <option value="">Section</option>
                {['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Year</label>
              <select name="classYear" value={form.classYear || ''} onChange={e => setForm(f => ({ ...f, classYear: e.target.value }))} className="p-2 border rounded w-32">
                <option value="">Year</option>
                {['E-1', 'E-2', 'E-3', 'E-4'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Semester</label>
              <select name="classSemester" value={form.classSemester || ''} onChange={e => setForm(f => ({ ...f, classSemester: e.target.value }))} className="p-2 border rounded w-32">
                <option value="">Semester</option>
                <option value="sem1">Sem 1</option>
                <option value="sem2">Sem 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Report Type</label>
              <select name="classReportType" value={form.classReportType || 'Performance'} onChange={e => setForm(f => ({ ...f, classReportType: e.target.value }))} className="p-2 border rounded w-32">
                <option value="Performance">Performance</option>
                <option value="Attendance">Attendance</option>
                <option value="Marks">Marks</option>
              </select>
            </div>
            <button
              type="button"
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-60 flex items-center gap-2"
              disabled={!(form.classSection && form.classYear && form.classSemester) || generating}
              onClick={async () => {
                setGenerating(true);
                setMsg('');
                setError('');
                try {
                  const params = `section=${form.classSection}&year=${form.classYear}&semester=${form.classSemester}&format=xlsx&reportType=${form.classReportType || 'Performance'}`;
                  const url = `${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/report/class?${params}`;
                  const token = localStorage.getItem('token');
                  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
                  if (!res.ok) throw new Error('Failed to download class report');
                  const blob = await res.blob();
                  const link = document.createElement('a');
                  link.href = window.URL.createObjectURL(blob);
                  link.download = `class_report_${form.classSection}_${form.classYear}_${form.classSemester}.xlsx`;
                  link.click();
                  setMsg('Class-wise Excel report downloaded!');
                } catch (err) {
                  setError(err.message || 'Failed to download class report');
                } finally {
                  setGenerating(false);
                }
              }}
            >
              <ExcelIcon className="inline w-5 h-5 align-text-bottom" />
              Download Class Excel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-end mb-2">
            <div>
              <label className="block text-sm font-semibold mb-1">Year</label>
              <select name="indYear" value={form.indYear || ''} onChange={handleFormChange} className="p-2 border rounded w-32">
                <option value="">Year</option>
                {['E-1', 'E-2', 'E-3', 'E-4'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Report Type</label>
              <select name="indReportType" value={form.indReportType || 'Performance'} onChange={e => setForm(f => ({ ...f, indReportType: e.target.value }))} className="p-2 border rounded w-32">
                <option value="Performance">Performance</option>
                <option value="Attendance">Attendance</option>
                <option value="Marks">Marks</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Section</label>
              <select name="indSection" value={form.indSection || ''} onChange={handleFormChange} className="p-2 border rounded w-32">
                <option value="">Section</option>
                {['CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Semester</label>
              <select name="indSemester" value={form.indSemester || ''} onChange={handleFormChange} className="p-2 border rounded w-32">
                <option value="">Semester</option>
                <option value="sem1">Sem 1</option>
                <option value="sem2">Sem 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Student</label>
              <select name="studentId" value={form.studentId} onChange={handleFormChange} className="p-2 border rounded w-48" required>
                <option value="">Select student</option>
                {students
                  .filter(s =>
                    (!form.indYear || s.year === form.indYear) &&
                    (!form.indSection || s.section === form.indSection)
                  )
                  .map(s => (
                    <option key={s._id} value={s._id}>{s.userId?.name || s.name} ({s.section}, {s.year})</option>
                  ))}
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60" disabled={generating}>{generating ? 'Generating...' : 'Generate Report'}</button>
          </div>
        )}
      </form>
      {/* Filters (single set, not duplicated) */}
      <div className="flex gap-4 mb-4">
        <select name="type" value={filter.type} onChange={handleFilterChange} className="p-2 border rounded">
          <option value="">All Types</option>
          <option value="attendance">Attendance</option>
          <option value="marks">Marks</option>
          <option value="performance">Performance</option>
        </select>
        <label className="flex flex-col">
          <span className="text-xs font-semibold mb-1">From</span>
          <input type="date" name="from" value={filter.from || ''} onChange={handleFilterChange} className="p-2 border rounded" />
        </label>
        <label className="flex flex-col">
          <span className="text-xs font-semibold mb-1">To</span>
          <input type="date" name="to" value={filter.to || ''} onChange={handleFilterChange} className="p-2 border rounded" />
        </label>
      </div>
      {msg && <div className="mb-2 text-green-600 font-semibold bg-green-100 border border-green-400 rounded px-4 py-2 animate-pulse">{msg}</div>}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {filteredReports.length > 0 ? (
        <div className="bg-white shadow-lg rounded-lg p-4">
          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Year</th>
                  <th className="p-2">Semester</th>
                  <th className="p-2">Created</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r._id} className="border-t">
                    <td className="p-2">{r.type}</td>
                    <td className="p-2">{r.data.section || '-'}</td>
                    <td className="p-2">{r.data.year || '-'}</td>
                    <td className="p-2">{r.data.semester || '-'}</td>
                    <td className="p-2">{formatDate(r.createdAt)}</td>
                    <td className="p-2 flex gap-2 items-center">
                      <button title="Download PDF" onClick={() => handleDownload(r._id, 'pdf')} className="text-red-600 hover:text-red-800">
                        <PdfIcon />
                      </button>
                      <button title="Download CSV" onClick={() => handleDownload(r._id, 'csv')} className="text-green-700 hover:text-green-900">
                        <CsvIcon />
                      </button>
                      <button title="Download Excel" onClick={() => handleDownload(r._id, 'xlsx')} className="text-yellow-600 hover:text-yellow-800">
                        <ExcelIcon />
                      </button>
                      <button title="Delete Report" onClick={async () => {
                        if (!window.confirm('Delete this report?')) return;
                        try {
                          const token = localStorage.getItem('token');
                          const res = await fetch(`${window.location.origin.replace(/:[0-9]+$/, ':5000')}/api/report/${r._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error('Failed to delete report');
                          setMsg('Report deleted.');
                          setReports(reports => reports.filter(rep => rep._id !== r._id));
                        } catch (err) {
                          setError(err.message || 'Failed to delete report');
                        }
                      }} className="text-gray-400 hover:text-gray-700 ml-2" style={{fontSize: '1.2em'}}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        !loading && <div>No reports found.</div>
      )}
    </div>
  );
}
