import { getDatabase } from '../config/database';
import type { Transaction, RawNotification } from '../db/schema';

export interface CreateTransactionData {
  user_id: number;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  description?: string;
  source: 'manual' | 'notification' | 'recurring';
  raw_text?: string | null;
  is_recurring?: boolean;
  recurring_transaction_id?: number;
}

export interface UpdateTransactionData {
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  description?: string;
}

export function createTransaction(data: CreateTransactionData): Transaction {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO transactions (user_id, amount, merchant, category, date, description, source, raw_text, is_recurring, recurring_transaction_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.user_id,
    data.amount,
    data.merchant,
    data.category,
    data.date,
    data.description || '',
    data.source,
    data.raw_text || null,
    data.is_recurring ? 1 : 0,
    data.recurring_transaction_id || null
  );

  return getTransactionById(result.lastInsertRowid as number)!;
}

export function getTransactionById(id: number): Transaction | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  return stmt.get(id) as Transaction | null;
}

export function getTransactionsByUser(userId: number, limit: number = 100, offset: number = 0): Transaction[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM transactions
    WHERE user_id = ?
    ORDER BY date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(userId, limit, offset) as Transaction[];
}

export function updateTransaction(id: number, userId: number, data: UpdateTransactionData): Transaction | null {
  const db = getDatabase();

  const updates: string[] = [];
  const values: any[] = [];

  if (data.amount !== undefined) {
    updates.push('amount = ?');
    values.push(data.amount);
  }
  if (data.merchant !== undefined) {
    updates.push('merchant = ?');
    values.push(data.merchant);
  }
  if (data.category !== undefined) {
    updates.push('category = ?');
    values.push(data.category);
  }
  if (data.date !== undefined) {
    updates.push('date = ?');
    values.push(data.date);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }

  if (updates.length === 0) {
    return getTransactionById(id);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, userId);

  const stmt = db.prepare(`
    UPDATE transactions
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(...values);
  return getTransactionById(id);
}

export function deleteTransaction(id: number, userId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function saveRawNotification(userId: number, notificationText: string, appName: string): RawNotification {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO raw_notifications (user_id, notification_text, app_name, processed)
    VALUES (?, ?, ?, 0)
  `);
  const result = stmt.run(userId, notificationText, appName);

  const getStmt = db.prepare('SELECT * FROM raw_notifications WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as RawNotification;
}

export function markNotificationProcessed(notificationId: number, transactionId: number): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE raw_notifications
    SET processed = 1, transaction_id = ?
    WHERE id = ?
  `);
  stmt.run(transactionId, notificationId);
}

export function getUnprocessedNotifications(userId: number): RawNotification[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM raw_notifications
    WHERE user_id = ? AND processed = 0
    ORDER BY created_at ASC
  `);
  return stmt.all(userId) as RawNotification[];
}
