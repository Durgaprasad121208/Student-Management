import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [semesterFilter, setSemesterFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [subjects, setSubjects] = useState([]);

  // Fetch subjects for the student (optional: can be improved to fetch only relevant subjects)
  useEffect(() => {
    apiRequest('/subject')
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, []);

  const fetchAttendance = () => {
    setLoading(true);
    setError('');
    const params = [];
    if (semesterFilter) params.push(`semester=${semesterFilter}`);
    if (subjectFilter) params.push(`subject=${subjectFilter}`);
    if (dateFilter) params.push(`date=${dateFilter}`);
    apiRequest(`/attendance/my${params.length ? '?' + params.join('&') : ''}`)
      .then(setAttendance)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAttendance(); }, [semesterFilter, subjectFilter, dateFilter]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Attendance</h2>
      <div className="mb-4 flex flex-wrap gap-4 items-end">
        <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All Semesters</option>
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="p-2 border rounded">
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="p-2 border rounded" />
        <button onClick={fetchAttendance} className="bg-primary text-white px-4 py-2 rounded" type="button">Filter</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !attendance.records || attendance.records.length === 0 ? (
        <div>No attendance records found.</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Date</th>
              <th className="p-2">Subject</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.records.map(a => (
              <tr key={a._id} className="border-t">
                <td className="p-2">{a.date ? new Date(a.date).toLocaleDateString() : ''}</td>
                <td className="p-2">{a.subject}</td>
                <td className="p-2">
                  {a.status === 'Present' ? <span className="text-green-600 font-semibold">Present</span> : <span className="text-red-600 font-semibold">Absent</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
