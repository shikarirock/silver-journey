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

// FIRE Planner Types
export interface PlannedTransaction {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  is_recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  category: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: number;
  user_id: number;
  name: string;
  asset_type: 'cash' | 'bonds' | 'stocks' | 'index_funds' | 'real_estate' | 'other';
  current_value: number;
  expected_return: number;
  created_at: string;
  updated_at: string;
}

export interface FireSettings {
  id: number;
  user_id: number;
  withdrawal_rate: number;
  expected_inflation: number;
  target_monthly_expenses: number;
  current_age: number;
  retirement_age: number;
  created_at: string;
  updated_at: string;
}

export interface FireProjection {
  current_portfolio_value: number;
  annual_expenses: number;
  annual_income: number;
  net_annual_savings: number;
  years_to_retirement: number;
  fire_number: number;
  progress_percentage: number;
  monthly_savings_needed: number;
  projected_retirement_age: number;
  can_retire_now: boolean;
}

export interface YearlyProjection {
  year: number;
  age: number;
  portfolio_value: number;
  annual_expenses: number;
  annual_income: number;
  withdrawals: number;
}

export interface UserPreferences {
  id: number;
  user_id: number;
  currency: string;
  date_format: string;
  theme: 'light' | 'dark' | 'auto';
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}
