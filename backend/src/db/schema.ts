import Database from 'better-sqlite3';

export interface User {
  id: number;
  email: string;
  password_hash: string;
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

export interface RawNotification {
  id: number;
  user_id: number;
  notification_text: string;
  app_name: string;
  processed: boolean;
  transaction_id?: number;
  created_at: string;
}

export function createTables(db: Database.Database): void {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT DEFAULT 'uncategorized',
      date TEXT NOT NULL,
      description TEXT,
      source TEXT CHECK(source IN ('manual', 'notification', 'recurring')) NOT NULL,
      raw_text TEXT,
      is_recurring BOOLEAN DEFAULT 0,
      recurring_transaction_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL
    )
  `);

  // Recurring transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      merchant TEXT NOT NULL,
      category TEXT DEFAULT 'uncategorized',
      description TEXT,
      frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_generated_date TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Raw notifications table (for debugging and reprocessing)
  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      notification_text TEXT NOT NULL,
      app_name TEXT NOT NULL,
      processed BOOLEAN DEFAULT 0,
      transaction_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_recurring_id ON transactions(recurring_transaction_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(is_active);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON raw_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_processed ON raw_notifications(processed);
  `);

  console.log('Database tables created successfully');
}
