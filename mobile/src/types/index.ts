export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
  created_at: string;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}
