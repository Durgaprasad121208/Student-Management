import React, { useEffect, useState } from 'react';

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setToast({
        message: e.detail.message,
        type: e.detail.type,
      });
      setTimeout(() => setToast(null), 4000);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (!toast) return null;

  let color = toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-60 px-6 py-3 rounded shadow-lg text-white text-lg font-semibold ${color} animate-fade-in-up`}
      style={{ minWidth: 220 }}
    >
      {toast.message}
    </div>
  );
}
