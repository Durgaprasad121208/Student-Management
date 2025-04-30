import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api';

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/notification/my');
      setNotifications(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAsRead = async id => {
    setMsg('');
    try {
      await apiRequest(`/notification/${id}/read`, { method: 'POST' });
      setMsg('Notification marked as read.');
      fetchNotifications();
    } catch (err) {
      setMsg('Failed to mark as read.');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Notifications</h2>
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {notifications.length > 0 && (
        <button
          className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={async () => {
            try {
              await apiRequest('/notification/read-all', { method: 'PATCH' });
              // Mark all notifications as read in the UI
              setNotifications(notifications.map(n => ({ ...n, read: true })));
            } catch (err) {
              // Optionally show error
              // setError('Failed to mark all as read');
            }
          }}
        >
          Mark All as Read
        </button>
      )}
      {notifications.length > 0 ? (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Message</th>
              <th className="p-2">Type</th>
              <th className="p-2">Read</th>
              <th className="p-2">Created At</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => (
              <tr key={n._id} className="border-t">
                <td className="p-2">{n.message}</td>
                <td className="p-2">{n.type}</td>
                <td className="p-2">{n.read ? 'Yes' : 'No'}</td>
                <td className="p-2">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</td>
                <td className="p-2">
                  {!n.read && (
                    <button
                      className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                      onClick={async () => {
                        try {
                          await apiRequest(`/notification/read/${n._id}`, { method: 'PATCH' });
                          // Update local state
                          n.read = true;
                          // Optionally show a message
                          // setMsg('Marked as read');
                          // Force a state update
                          setNotifications([...notifications]);
                        } catch (err) {
                          // Optionally show error
                          // setError('Failed to mark as read');
                        }
                      }}
                    >
                      Mark as Read
                    </button>
                  )}
                </td>
                <td className="p-2">
                  {!n.read && <button className="text-blue-600" onClick={() => markAsRead(n._id)}>Mark as Read</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <div>No notifications found.</div>
      )}
    </div>
  );
}
