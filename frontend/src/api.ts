import axios from 'axios';
import { useAppStore, useUIStore } from './store';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
});

api.interceptors.request.use((config) => {
  useUIStore.getState().startRequest();
  const token = useAppStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  useUIStore.getState().endRequest();
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    useUIStore.getState().endRequest();
    return response;
  },
  (error) => {
    useUIStore.getState().endRequest();
    if (error.response?.status === 401) {
      useAppStore.getState().setToken(null, null);
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

