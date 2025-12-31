import axios from 'axios';
import type { AuthResponse, Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
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

// Transactions API
export const transactionsAPI = {
  getAll: async (): Promise<Transaction[]> => {
    const response = await api.get<{ transactions: Transaction[] }>('/transactions');
    return response.data.transactions;
  },

  createManual: async (data: CreateTransactionRequest): Promise<Transaction> => {
    const response = await api.post<{ transaction: Transaction }>('/transactions/manual', data);
    return response.data.transaction;
  },

  update: async (id: number, data: UpdateTransactionRequest): Promise<Transaction> => {
    const response = await api.put<{ transaction: Transaction }>(`/transactions/${id}`, data);
    return response.data.transaction;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },
};

export default api;
