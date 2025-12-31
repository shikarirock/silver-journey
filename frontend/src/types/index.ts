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
  source: 'manual' | 'notification' | 'recurring';
  raw_text?: string;
  is_recurring: boolean;
  recurring_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringTransaction {
  id: number;
  user_id: number;
  amount: number;
  merchant: string;
  category: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  last_generated_date?: string;
  is_active: boolean;
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

export interface DirectTransactionRequest {
  amount: number;
  merchant: string;
  category?: string;
  date: string;
  description?: string;
}

export interface UpdateTransactionRequest {
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  description?: string;
}

export interface CreateRecurringRequest {
  amount: number;
  merchant: string;
  category?: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
}

export interface ConvertToRecurringRequest {
  transaction_id: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  backfill?: boolean;
  force?: boolean;
}

export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'other';
