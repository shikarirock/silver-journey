export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  description: string;
  source: 'manual' | 'notification';
  raw_text?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateTransactionRequest {
  text: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  description?: string;
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'other';
