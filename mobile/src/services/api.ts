import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, Transaction } from '../types';

// Update this to your backend URL
const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
};

export const notificationAPI = {
  sendNotification: async (text: string, appName: string): Promise<void> => {
    await api.post('/notifications', { text, appName });
  },
};

export const transactionAPI = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get<{ transactions: Transaction[] }>('/transactions');
    return response.data.transactions;
  },
};

export default api;
