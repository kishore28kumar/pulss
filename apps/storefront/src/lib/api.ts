import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TENANT_SLUG = process.env.NEXT_PUBLIC_TENANT_SLUG;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(TENANT_SLUG && { 'X-Tenant-Slug': TENANT_SLUG }),
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

