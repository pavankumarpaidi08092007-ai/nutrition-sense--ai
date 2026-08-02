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

// Response interceptor with precise error message extraction
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      const err: any = new Error('API returned HTML instead of JSON. Please verify backend API endpoint.');
      err.isApiOffline = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response && typeof error.response.data === 'string' && error.response.data.trim().startsWith('<')) {
      error.isApiOffline = true;
      error.message = 'API endpoint returned HTML page. Please ensure backend server is running.';
      return Promise.reject(error);
    }

    // Extract exact backend error message if available
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.data?.error) {
      error.message = error.response.data.error;
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      error.message = 'Unable to connect to backend server. Please verify the backend server is running.';
    } else if (error.response?.status === 405) {
      error.message = 'HTTP 405 Method Not Allowed: Please verify that POST is enabled for the endpoint.';
    } else if (error.response?.status === 401) {
      error.message = 'Invalid email address or password.';
    } else if (error.response?.status === 404) {
      error.message = 'Requested API resource not found.';
    } else if (error.response?.status === 500) {
      error.message = 'Internal server error. Please try again later.';
    }

    return Promise.reject(error);
  }
);

export default api;
