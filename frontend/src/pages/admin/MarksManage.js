import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function MarksManage() {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [assessmentType, setAssessmentType] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [msg, setMsg] = useState('');
  const [warning, setWarning] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = [];
      if (section) params.push(`section=${section}`);
      if (year) params.push(`year=${year}`);
      const res = await apiRequest(`/student${params.length ? '?' + params.join('&') : ''}`);
      setStudents(res);
      setMarks(res.reduce((acc, s) => ({ ...acc, [s._id]: '' }), {}));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (section && year) fetchStudents(); }, [section, year]);

  // Fetch subjects for selected year and semester
  // Map semester for subject API
  useEffect(() => {
    if (year && semester) {
      const semesterNum = semester === 'sem1' ? '1' : semester === 'sem2' ? '2' : semester;
      apiRequest(`/subject?year=${year}&semester=${semesterNum}`)
        .then(setSubjects)
        .catch(() => setSubjects([]));
    } else {
      setSubjects([]);
    }
  }, [year, semester]);

  const handleChange = (id, value) => {
    if (maxScore && Number(value) > Number(maxScore)) return; // Prevent over max
    setMarks(m => ({ ...m, [id]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setError('');
    setWarning('');
    // Check for over-max marks before submitting
    for (const s of students) {
      if (marks[s._id] !== '' && Number(marks[s._id]) > Number(maxScore)) {
        setError(`Marks for ${s.userId?.name || s.rollNo} exceed max marks!`);
        return;
      }
    }
    try {
      for (const s of students) {
        if (marks[s._id] !== '') {
          const res = await apiRequest('/marks', {
            method: 'POST',
            body: JSON.stringify({
              studentId: s._id,
              subject,
              assessmentType,
              semester: semester === '1' ? 'sem1' : semester === '2' ? 'sem2' : semester,
              score: marks[s._id],
              maxScore,
              section,
              year,
              date: new Date().toISOString()
            })
          });
          if (res && res.warning) {
            setWarning(res.message);
          }
        }
      }
      setMsg('Marks saved successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Marks Management</h2>
      <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleSubmit}>
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
          {['1','2'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 border rounded" required disabled={subjects.length === 0}>
          <option value="">{subjects.length === 0 ? 'No subjects available' : 'Subject'}</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <input value={assessmentType} onChange={e => setAssessmentType(e.target.value)} placeholder="Assessment Type (e.g. Midterm, Quiz)" className="p-2 border rounded" required />
        <input value={maxScore} onChange={e => setMaxScore(e.target.value)} placeholder="Max Score" className="p-2 border rounded" required type="number" />
      </form>
      {msg && <div className="mb-2 text-green-600 font-semibold bg-green-100 border border-green-400 rounded px-4 py-2 animate-pulse">{msg}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {warning && <div className="mb-2 text-yellow-700 font-semibold bg-yellow-100 border border-yellow-400 rounded px-4 py-2 animate-pulse">{warning}</div>}
      {error && <div className="mb-2 text-red-600">{error}</div>}
      {loading ? <div>Loading students...</div> : (
        students.length > 0 ? (
           <>
           <table className="w-full border mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-center">Name</th>
                <th className="p-2 text-center">ID Number</th>
                <th className="p-2 text-center">Roll No</th>
                <th className="p-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id} className="border-t">
                  <td className="p-2 text-center">{s.userId?.name}</td>
                  <td className="p-2 text-center">{s.idNumber || '-'}</td>
                  <td className="p-2 text-center">{s.rollNo}</td>
                  <td className="p-2 text-center">
                    <input type="number" className="border rounded p-1 w-24 text-center" value={marks[s._id] || ''} onChange={e => handleChange(s._id, e.target.value)} max={maxScore} min={0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center mt-4">
            <button className="bg-primary text-white px-6 py-2 rounded shadow hover:bg-primary-dark transition" onClick={handleSubmit} type="button">
              Save Marks
            </button>
          </div>
           </>
        ) : (
          section && year && <div>No students found for this section/year.</div>
        )
      )}
    </div>
  );
}

