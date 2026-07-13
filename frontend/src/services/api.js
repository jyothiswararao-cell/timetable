import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to inject JWT token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login?expired=true';
          }
        }
        error.message = "Session expired. Please login again.";
        if (error.response.data) error.response.data.error = "Session expired. Please login again.";
      } else if (status === 403) {
        error.message = "Access denied.";
        if (error.response.data) error.response.data.error = "Access denied.";
      } else if (status === 500) {
        error.message = "Server error.";
        if (error.response.data) error.response.data.error = "Server error.";
      }
    } else {
      error.message = "Server is offline or unreachable.";
    }
    return Promise.reject(error);
  }
);

export default api;
