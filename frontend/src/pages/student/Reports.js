import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function StudentReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/report/my');
      setReports(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

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
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Title</th>
              <th className="p-2">Type</th>
              <th className="p-2">Created At</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r._id} className="border-t">
                <td className="p-2">{r.title || r.type}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</td>
                <td className="p-2">
                  <button className="text-blue-600 mr-2" onClick={() => handleDownload(r._id, 'pdf')}>Download PDF</button>
                  <button className="text-green-600 mr-2" onClick={() => handleDownload(r._id, 'csv')}>Download CSV</button>
                  <button className="text-yellow-600" onClick={() => handleDownload(r._id, 'xlsx')}>Download Excel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div>No reports found.</div>
      )}
    </div>
  );
}
