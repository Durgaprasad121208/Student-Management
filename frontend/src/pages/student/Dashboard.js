import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

import DashboardCard from './DashboardCards';

export default function StudentDashboard() {
  const [summary, setSummary] = useState({
    marks: 0,
    attendance: 0,
    quizzes: 0,
    reports: 0,
    notifications: 0
  });
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [partialError, setPartialError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPartialError(false);
    Promise.allSettled([
      apiRequest('/marks/my'),
      apiRequest('/attendance/my'),
      apiRequest('/quiz/available'),
      apiRequest('/report/my'),
      apiRequest('/notification/my'),
      apiRequest('/student/my')
    ]).then(results => {
      setSummary({
        marks: results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value.length : 0,
        attendance: results[1].status === 'fulfilled' && Array.isArray(results[1].value) ? results[1].value.length : 0,
        quizzes: results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value.length : 0,
        reports: results[3].status === 'fulfilled' && Array.isArray(results[3].value) ? results[3].value.length : 0,
        notifications: results[4].status === 'fulfilled' && Array.isArray(results[4].value) ? results[4].value.length : 0,
      });
      if (results[5] && results[5].status === 'fulfilled') {
        const profile = results[5].value;
        setStudentName(profile.userId?.name || profile.name || 'Student');
      } else {
        setStudentName('Student');
      }
      if (results.some((r, idx) => idx < 5 && r.status !== 'fulfilled')) setPartialError(true);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-extrabold text-primary-dark mb-4 drop-shadow">
          Welcome, {studentName}!
        </h2>
      </div>
      {loading && <div className="text-primary animate-pulse">Loading...</div>}
      <div className="flex flex-row justify-center items-center gap-8 mt-8 flex-wrap">
        <DashboardCard icon={<svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0 0H7m5 0h5"/></svg>} label="Marks" value={summary && typeof summary.marks !== 'undefined' ? summary.marks : 0} color="from-blue-500 to-blue-700" link="/student/marks" />
        <DashboardCard icon={<svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17l-5-5 5-5 5 5 5-5 5 5"/></svg>} label="Attendance" value={summary && typeof summary.attendance !== 'undefined' ? summary.attendance : 0} color="from-green-500 to-green-700" link="/student/attendance" />
        <DashboardCard icon={<svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} label="Quizzes" value={summary && typeof summary.quizzes !== 'undefined' ? summary.quizzes : 0} color="from-yellow-400 to-yellow-600" link="/student/quizzes" />
        <DashboardCard icon={<svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 17l-5-5 5-5 5 5 5-5 5 5"/></svg>} label="Reports" value={summary && typeof summary.reports !== 'undefined' ? summary.reports : 0} color="from-indigo-500 to-indigo-700" link="/student/reports" />
        <DashboardCard icon={<svg className="w-10 h-10 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405M19 13V7a2 2 0 0 0-2-2h-2.586a1 1 0 0 1-.707-.293l-1.414-1.414a1 1 0 0 0-.707-.293H9a2 2 0 0 0-2 2v6"/></svg>} label="Notifications" value={summary && typeof summary.notifications !== 'undefined' ? summary.notifications : 0} color="from-pink-500 to-pink-700" link="/student/notifications" />
      </div>
      {partialError && (
        <div className="mt-6 text-sm text-yellow-700 bg-yellow-100 rounded px-3 py-2 text-center max-w-lg mx-auto">
          Some data could not be loaded, so some numbers may be incomplete.
        </div>
      )}
    </div>
  );
}
