// Centralized API service using unified API URL
import config from './config';

// Simple toast event system
export function showToast(message, type = 'error') {
  const event = new CustomEvent('app-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${config.API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      showToast(error.message || response.statusText || 'API Error', 'error');
      throw new Error(error.message || response.statusText || 'API Error');
    }
    return response.json();
  } catch (err) {
    showToast(err.message || 'Network/API Error', 'error');
    throw err;
  }
}

