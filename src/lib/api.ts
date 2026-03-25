import axios from 'axios';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/apiError';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — sessão inválida e permissão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('tenant_cnpj');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      const msg = getApiErrorMessage(error, 'Você não tem permissão para esta ação.');
      toast.error('Acesso negado', { description: msg });
    }
    return Promise.reject(error);
  },
);

export default api;
