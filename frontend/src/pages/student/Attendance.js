import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState({ records: [], total: 0, presents: 0, percentage: 0, attendanceCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [semesterFilter, setSemesterFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [studentYear, setStudentYear] = useState('');
  const [studentSection, setStudentSection] = useState('');

  const [summary, setSummary] = useState([]);

  // Fetch student profile to get year and section
  useEffect(() => {
    apiRequest('/student/my')
      .then(profile => {
        // Defensive: handle both {userId, ...} and {user: {profile: {...}}} shapes
        if (profile && profile.year && profile.section) {
          setStudentYear(profile.year);
          setStudentSection(profile.section);
        } else if (profile && profile.profile) {
          setStudentYear(profile.profile.year || '');
          setStudentSection(profile.profile.section || '');
        } else {
          setStudentYear('');
          setStudentSection('');
        }
      })
      .catch(() => {
        setStudentYear('');
        setStudentSection('');
      });
  }, []);

  // Fetch subjects from database whenever semester changes (with value mapping)
  useEffect(() => {
    if (!studentYear || !semesterFilter) {
      setSubjects([]);
      setSubjectFilter('');
      return;
    }
    // Map year and semester to backend values for subject fetch
    const yearMap = { '1': 'E-1', '2': 'E-2', '3': 'E-3', '4': 'E-4', 'E-1': 'E-1', 'E-2': 'E-2', 'E-3': 'E-3', 'E-4': 'E-4' };
    const backendYear = yearMap[studentYear] || studentYear;
    const backendSemester = semesterFilter === 'sem1' ? '1' : semesterFilter === 'sem2' ? '2' : semesterFilter;
    apiRequest(`/subject?year=${backendYear}&semester=${backendSemester}`)
      .then(data => {
        setSubjects(data);
        if (!data.some(s => s.name === subjectFilter)) setSubjectFilter('');
      })
      .catch(() => setSubjects([]));
  }, [studentYear, semesterFilter]);

  // Defensive: fetch attendance or summary
  const fetchAttendance = () => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    setSummary([]);
    setAttendance({ records: [], total: 0, presents: 0, percentage: 0, attendanceCount: 0 });
    const params = [];
    if (semesterFilter) params.push(`semester=${semesterFilter}`);
    if (subjectFilter) params.push(`subject=${encodeURIComponent(subjectFilter)}`);
    // Fetch student profile first to get student._id
    if (subjectFilter) {
      apiRequest('/student/my')
        .then(student => {
          if (!student || !student._id) throw new Error('Student profile not found');
          const url = `/attendance/${student._id}${params.length ? '?' + params.join('&') : ''}`;
          return apiRequest(url);
        })
        .then(data => {
          setAttendance({
            records: Array.isArray(data.records) ? data.records : [],
            total: typeof data.total === 'number' ? data.total : 0,
            presents: typeof data.presents === 'number' ? data.presents : 0,
            percentage: typeof data.percentage === 'number' ? data.percentage : 0,
            attendanceCount: data.records ? data.records.length : 0
          });
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else if (semesterFilter) {
      // Only semester selected: fetch summary for all subjects
      apiRequest('/student/my')
        .then(student => {
          if (!student || !student._id || typeof student._id !== 'string' || student._id.length !== 24) {
            setError('Student profile not found or invalid. Please re-login.');
            setLoading(false);
            return;
          }
          return apiRequest(`/attendance/${student._id}/summary?semester=${semesterFilter}`);
        })
        .then(data => {
          if (data) setSummary(Array.isArray(data.summary) ? data.summary : []);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, [user, semesterFilter, subjectFilter]);

  function TroubleshootNote() {
    return (
      <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
        <b>Troubleshooting:</b> If you don't see your attendance, make sure:<br />
        - The admin marked attendance for the <b>same semester and subject</b> you selected.<br />
        - The subject name matches exactly.<br />
        - Try clicking <b>Refresh</b>.<br />
        If you still don't see records, contact your admin.
      </div>
    );
  }

  // UI for summary table
  function SummaryTable() {
    if (summary.length === 0) return (
      <div className="text-gray-600">No attendance records found for this semester.</div>
    );
    return (
      <table className="w-full border mt-2 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr className="bg-gray-100">
            <th className="p-2 text-center">Subject</th>
            <th className="p-2 text-center">Total Classes</th>
            <th className="p-2 text-center">Present</th>
            <th className="p-2 text-center">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {summary.map(s => (
            <tr key={s.subject} className="border-t hover:bg-blue-50 transition-all">
              <td className="p-2 text-center">{s.subject}</td>
              <td className="p-2 text-center">{s.total}</td>
              <td className="p-2 text-center">{s.presents}</td>
              <td className="p-2 text-center">
                <span className={s.percentage >= 75 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {s.percentage.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Attendance</h2>
      <div className="mb-2 text-gray-600 text-sm">
        <span className="mr-4"><b>Year:</b> {studentYear || '-'}</span>
        <span><b>Section:</b> {studentSection || '-'}</span>
      </div>
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className="p-2 border rounded min-w-[140px]">
          <option value="">Select Semester</option>
          <option value="sem1">Semester 1</option>
          <option value="sem2">Semester 2</option>
        </select>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="p-2 border rounded min-w-[140px]">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
        <button onClick={fetchAttendance} className="bg-primary text-white px-4 py-2 rounded" type="button">Show Attendance</button>
        <button onClick={fetchAttendance} className="bg-gray-500 text-white px-4 py-2 rounded ml-2" type="button">Refresh</button>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error} <br />If you believe attendance should be visible, check that your semester and subject match exactly with what the admin used. Try different combinations or contact your admin.</div>
      ) : (!semesterFilter) ? (
        <div className="text-gray-600">Please select a Semester to view your attendance.</div>
      ) : (!subjectFilter) ? (
        <div className="text-gray-600">Please select a Subject to view your attendance.</div>
      ) : !attendance.records || attendance.records.length === 0 ? (
        <>
          <div className="text-red-600 font-semibold mb-2">
            No attendance records found for your selection.<br />
            <span className="font-normal">
              Please check that:
              <ul className="list-disc list-inside pl-4 mt-1">
                <li>Your admin has marked attendance for <b>this semester and subject</b>.</li>
                <li>The subject name matches exactly as shown in the dropdown.</li>
                <li>You are viewing the correct semester.</li>
                <li>Try clicking <b>Refresh</b> or changing your selection.</li>
              </ul>
              If you still don't see your records, please contact your admin for help.
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 p-4 rounded bg-gray-50 flex flex-wrap gap-8 items-center justify-start border">
            <div><span className="font-semibold">Total Classes:</span> {attendance.total}</div>
            <div><span className="font-semibold">Present:</span> {attendance.presents}</div>
            <div><span className="font-semibold">Attendance %:</span> <span className={attendance.percentage >= 75 ? 'text-green-600' : 'text-red-600'}>{attendance.percentage.toFixed(1)}%</span></div>
            <div><span className="font-semibold">Attendance Records Found:</span> {attendance.attendanceCount ?? attendance.total}</div>
          </div>
          <table className="w-full border mt-2 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr className="bg-gray-100">
                <th className="p-2 text-center">Date</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.records.map(a => (
                <tr key={a._id} className="border-t hover:bg-blue-50 transition-all">
                  <td className="p-2 text-center">{a.date ? new Date(a.date).toLocaleDateString() : ''}</td>
                  <td className="p-2 text-center">
                    {a.status === 'Present' ? <span className="text-green-600 font-semibold">Present</span> : <span className="text-red-600 font-semibold">Absent</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
