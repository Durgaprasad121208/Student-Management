import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function StudentReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    if (!user || !user._id) return;
    setLoading(true);
    setError('');
    try {
      // Fetch student profile first to get student._id
      const student = await apiRequest('/student/my');
      if (!student || !student._id) throw new Error('Student profile not found');
      const res = await apiRequest(`/report/student/${student._id}?format=xlsx`);
      setReports(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [user]);

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
    } catch (err) {
      alert('Failed to download report.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Reports</h2>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {reports.length > 0 ? (
        <table className="w-full border mt-4 text-sm rounded-xl shadow-lg bg-white overflow-x-auto">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="bg-gray-100">
              <th className="p-2 text-center">Title</th>
              <th className="p-2 text-center">Type</th>
              <th className="p-2 text-center">Created At</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r._id} className="border-t hover:bg-blue-50 transition-all">
                <td className="p-2 text-center">{r.title || r.type}</td>
                <td className="p-2 text-center">{r.type}</td>
                <td className="p-2 text-center">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                <td className="p-2 text-center">
                  <button className="text-green-600 mr-2" onClick={() => handleDownload(r._id, 'csv')}>Download CSV</button>
                  <button className="text-yellow-600" onClick={() => handleDownload(r._id, 'xlsx')}>Download Excel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div className="text-gray-600">No reports found.</div>
      )}
    </div>
  );
}
