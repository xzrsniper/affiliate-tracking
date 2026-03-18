import axios from 'axios';

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000';

const API_BASE_URL = import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url, { hasToken: !!token });
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) console.log('API Response:', response.status, response.config?.url);
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);
    }
    
    if (error.response?.status === 401) {
      // Don't redirect on auth endpoints — let the login page handle its own errors
      const url = error.config?.url || '';
      const isAuthEndpoint = /\/api\/auth\/(login|register|forgot-password|reset-password|google)/.test(url);
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
