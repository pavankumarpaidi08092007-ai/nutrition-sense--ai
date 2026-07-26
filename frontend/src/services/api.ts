import axios from 'axios';

// Create Axios Client pointing to the backend server
const api = axios.create({
  baseURL: ((import.meta as any).env?.VITE_API_URL as string) || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Detect non-JSON (HTML 404/SPA fallbacks) and mark as API offline
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      const err: any = new Error('API returned HTML instead of JSON (API Offline / Static deployment)');
      err.isApiOffline = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response && typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
      error.isApiOffline = true;
    }
    return Promise.reject(error);
  }
);

export default api;
