import { getDatabase } from '../config/database';
import type { RecurringTransaction } from '../db/schema';
import { createTransaction } from './transaction';

export interface CreateRecurringTransactionData {
  user_id: number;
  amount: number;
  merchant: string;
  category: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
}

export interface UpdateRecurringTransactionData {
  amount?: number;
  merchant?: string;
  category?: string;
  description?: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export function createRecurringTransaction(data: CreateRecurringTransactionData): RecurringTransaction {
  const db = getDatabase();

  const stmt = db.prepare(`
    INSERT INTO recurring_transactions
    (user_id, amount, merchant, category, description, frequency, start_date, end_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const result = stmt.run(
    data.user_id,
    data.amount,
    data.merchant,
    data.category,
    data.description || '',
    data.frequency,
    data.start_date,
    data.end_date || null
  );

  return getRecurringTransactionById(result.lastInsertRowid as number)!;
}

export function getRecurringTransactionById(id: number): RecurringTransaction | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM recurring_transactions WHERE id = ?');
  return stmt.get(id) as RecurringTransaction | null;
}

export function getRecurringTransactionsByUser(userId: number): RecurringTransaction[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM recurring_transactions
    WHERE user_id = ? AND is_active = 1
    ORDER BY created_at DESC
  `);
  return stmt.all(userId) as RecurringTransaction[];
}

export function getAllActiveRecurringTransactions(): RecurringTransaction[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM recurring_transactions
    WHERE is_active = 1
    ORDER BY user_id, start_date
  `);
  return stmt.all() as RecurringTransaction[];
}

export function updateRecurringTransaction(
  id: number,
  userId: number,
  data: UpdateRecurringTransactionData
): RecurringTransaction | null {
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
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.frequency !== undefined) {
    updates.push('frequency = ?');
    values.push(data.frequency);
  }
  if (data.start_date !== undefined) {
    updates.push('start_date = ?');
    values.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    updates.push('end_date = ?');
    values.push(data.end_date);
  }
  if (data.is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(data.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return getRecurringTransactionById(id);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, userId);

  const stmt = db.prepare(`
    UPDATE recurring_transactions
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(...values);
  return getRecurringTransactionById(id);
}

export function updateLastGeneratedDate(id: number, date: string): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE recurring_transactions
    SET last_generated_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(date, id);
}

export function deleteRecurringTransaction(id: number, userId: number): boolean {
  const db = getDatabase();
  // Soft delete by setting is_active to 0
  const stmt = db.prepare(`
    UPDATE recurring_transactions
    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

export function getNextOccurrenceDate(recurringTx: RecurringTransaction): string | null {
  const startDate = new Date(recurringTx.start_date);
  const lastGenerated = recurringTx.last_generated_date
    ? new Date(recurringTx.last_generated_date)
    : new Date(startDate.getTime() - 1); // Start from one day before start_date

  const nextDate = new Date(lastGenerated);

  switch (recurringTx.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }

  // Ensure we don't go before start_date
  if (nextDate < startDate) {
    return recurringTx.start_date;
  }

  // Check if past end_date
  if (recurringTx.end_date) {
    const endDate = new Date(recurringTx.end_date);
    if (nextDate > endDate) {
      return null;
    }
  }

  return nextDate.toISOString().split('T')[0];
}

export function calculateOccurrenceCount(
  startDate: string,
  endDate: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (frequency) {
    case 'daily':
      return diffDays + 1;
    case 'weekly':
      return Math.floor(diffDays / 7) + 1;
    case 'monthly':
      return (
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        1
      );
    case 'yearly':
      return end.getFullYear() - start.getFullYear() + 1;
    default:
      return 0;
  }
}
