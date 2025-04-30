import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function AttendanceManage() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [msg, setMsg] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      if (section) params.push(`section=${section}`);
      if (year) params.push(`year=${year}`);
      const res = await apiRequest(`/student${params.length ? '?' + params.join('&') : ''}`);
      setStudents(res);
      setAttendance(res.reduce((acc, s) => ({ ...acc, [s._id]: 'Present' }), {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (section && year) fetchStudents(); }, [section, year]);

  // Fetch subjects for selected year and semester
  useEffect(() => {
    if (year && semester) {
      const semesterNum = semester === 'sem1' ? '1' : semester === 'sem2' ? '2' : '';
      apiRequest(`/subject?year=${year}&semester=${semesterNum}`)
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [year, semester]);

  const handleChange = (id, status) => setAttendance(a => ({ ...a, [id]: status }));

const handleMarkAllPresent = () => {
  setAttendance(a => {
    const updated = { ...a };
    students.forEach(s => { updated[s._id] = 'Present'; });
    return updated;
  });
};

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await apiRequest('/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date,
          section,
          year,
          semester,
          subject,
          records: students.map(s => ({ studentId: s._id, status: attendance[s._id] }))
        })
      });
      setMsg('Attendance marked successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Attendance Management</h2>
      <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded" required />
        <select value={section} onChange={e => setSection(e.target.value)} className="p-2 border rounded" required>
          <option value="">Section</option>
          {['CSE-01','CSE-02','CSE-03','CSE-04','CSE-05','CSE-06'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} className="p-2 border rounded" required>
          <option value="">Year</option>
          {['E-1','E-2','E-3','E-4'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={semester} onChange={e => setSemester(e.target.value)} className="p-2 border rounded" required>
          <option value="">Sem</option>
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 border rounded" required disabled={subjects.length === 0}>
          <option value="">{subjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <button className="bg-primary text-white px-4 py-2 rounded" type="button" onClick={handleMarkAllPresent} disabled={students.length === 0}>Mark All Present</button>
        <button className="bg-primary text-white px-4 py-2 rounded" type="submit" disabled={!date || !section || !year || !semester || !subject || students.length === 0}>Mark Attendance</button>
      </form>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? <div>Loading students...</div> : (
        students.length > 0 ? (
           <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-center">Name</th>
                <th className="p-2 text-center">ID Number</th>
                <th className="p-2 text-center">Roll No</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id} className="border-t">
                  <td className="p-2 text-center">{s.userId?.name}</td>
                  <td className="p-2 text-center">{s.idNumber || '-'}</td>
                  <td className="p-2 text-center">{s.rollNo}</td>
                  <td className="p-2 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        className={`px-3 py-1 rounded ${attendance[s._id] === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => handleChange(s._id, 'Present')}
                      >Present</button>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded ${attendance[s._id] === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}
                        onClick={() => handleChange(s._id, 'Absent')}
                      >Absent</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          section && year && <div>No students found for this section/year.</div>
        )
      )}
    </div>
  );
}

