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
  source: 'manual' | 'notification';
  raw_text?: string;
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
      source TEXT CHECK(source IN ('manual', 'notification')) NOT NULL,
      raw_text TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON raw_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_processed ON raw_notifications(processed);
  `);

  console.log('Database tables created successfully');
}
