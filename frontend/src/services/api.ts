import axios from 'axios';
import type {
  AuthResponse,
  Transaction,
  CreateTransactionRequest,
  DirectTransactionRequest,
  UpdateTransactionRequest,
  RecurringTransaction,
  CreateRecurringRequest,
  ConvertToRecurringRequest,
} from '../types';

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

  createDirect: async (data: DirectTransactionRequest): Promise<Transaction> => {
    const response = await api.post<{ transaction: Transaction }>('/transactions/direct', data);
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

// Recurring Transactions API
export const recurringAPI = {
  getAll: async (): Promise<RecurringTransaction[]> => {
    const response = await api.get<{ recurring_transactions: RecurringTransaction[] }>('/recurring');
    return response.data.recurring_transactions;
  },

  create: async (data: CreateRecurringRequest): Promise<RecurringTransaction> => {
    const response = await api.post<{ recurring_transaction: RecurringTransaction }>('/recurring', data);
    return response.data.recurring_transaction;
  },

  convertFromTransaction: async (data: ConvertToRecurringRequest): Promise<any> => {
    const response = await api.post('/recurring/convert', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateRecurringRequest>): Promise<RecurringTransaction> => {
    const response = await api.put<{ recurring_transaction: RecurringTransaction }>(`/recurring/${id}`, data);
    return response.data.recurring_transaction;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring/${id}`);
  },

  generate: async (): Promise<void> => {
    await api.post('/recurring/generate');
  },
};

export default api;
