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
    let data, text;
    try {
      data = await response.clone().json();
    } catch (e) {
      try {
        text = await response.clone().text();
      } catch (e2) {
        text = null;
      }
    }
    if (!response.ok) {
      // Print the error to the browser console for debugging
      console.error('[API ERROR]', {
        url,
        status: response.status,
        statusText: response.statusText,
        data,
        text,
        options
      });
      showToast((data && data.message) || text || response.statusText || 'API Error', 'error');
      const error = new Error((data && data.message) || text || response.statusText || 'API Error');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (err) {
    // Print the error to the browser console for debugging
    console.error('[API CATCH ERROR]', err, { url, options });
    showToast(err.message || 'Network/API Error', 'error');
    throw err;
  }
}
