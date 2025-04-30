import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function StudentMarks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest('/marks/my')
      .then(setMarks)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Marks</h2>
      {loading ? <div>Loading...</div> : error ? <div className="text-red-600">{error}</div> : marks.length === 0 ? <div>No marks found.</div> : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Subject</th>
              <th className="p-2">Assessment</th>
              <th className="p-2">Score</th>
              <th className="p-2">Total</th>
              <th className="p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {marks.map(m => (
              <tr key={m._id} className="border-t">
                <td className="p-2">{m.subject}</td>
                <td className="p-2">{m.assessment}</td>
                <td className="p-2">{m.score}</td>
                <td className="p-2">{m.total}</td>
                <td className="p-2">{m.date ? new Date(m.date).toLocaleDateString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
