import { getDatabase } from '../config/database';
import type { PlannedTransaction, Investment, FireSettings, UserPreferences } from '../db/schema';

// ===== Planned Transactions =====

export interface CreatePlannedTransactionData {
  user_id: number;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  is_recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  category: string;
  description?: string;
}

export function createPlannedTransaction(data: CreatePlannedTransactionData): PlannedTransaction {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO planned_transactions (user_id, name, amount, type, is_recurring, frequency, start_date, end_date, category, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.user_id,
    data.name,
    data.amount,
    data.type,
    data.is_recurring ? 1 : 0,
    data.frequency || null,
    data.start_date,
    data.end_date || null,
    data.category,
    data.description || ''
  );

  const getStmt = db.prepare('SELECT * FROM planned_transactions WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as PlannedTransaction;
}

export function getPlannedTransactionsByUser(userId: number): PlannedTransaction[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM planned_transactions
    WHERE user_id = ?
    ORDER BY start_date ASC
  `);
  return stmt.all(userId) as PlannedTransaction[];
}

export function updatePlannedTransaction(id: number, userId: number, data: Partial<CreatePlannedTransactionData>): PlannedTransaction | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.amount !== undefined) {
    updates.push('amount = ?');
    values.push(data.amount);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.is_recurring !== undefined) {
    updates.push('is_recurring = ?');
    values.push(data.is_recurring ? 1 : 0);
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
  if (data.category !== undefined) {
    updates.push('category = ?');
    values.push(data.category);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, userId);

  const stmt = db.prepare(`
    UPDATE planned_transactions
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM planned_transactions WHERE id = ?');
  return getStmt.get(id) as PlannedTransaction | null;
}

export function deletePlannedTransaction(id: number, userId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM planned_transactions WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// ===== Investments =====

export interface CreateInvestmentData {
  user_id: number;
  name: string;
  asset_type: 'cash' | 'bonds' | 'stocks' | 'index_funds' | 'real_estate' | 'other';
  current_value: number;
  expected_return: number;
}

export function createInvestment(data: CreateInvestmentData): Investment {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO investments (user_id, name, asset_type, current_value, expected_return)
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.user_id,
    data.name,
    data.asset_type,
    data.current_value,
    data.expected_return
  );

  const getStmt = db.prepare('SELECT * FROM investments WHERE id = ?');
  return getStmt.get(result.lastInsertRowid) as Investment;
}

export function getInvestmentsByUser(userId: number): Investment[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as Investment[];
}

export function updateInvestment(id: number, userId: number, data: Partial<CreateInvestmentData>): Investment | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.asset_type !== undefined) {
    updates.push('asset_type = ?');
    values.push(data.asset_type);
  }
  if (data.current_value !== undefined) {
    updates.push('current_value = ?');
    values.push(data.current_value);
  }
  if (data.expected_return !== undefined) {
    updates.push('expected_return = ?');
    values.push(data.expected_return);
  }

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id, userId);

  const stmt = db.prepare(`
    UPDATE investments
    SET ${updates.join(', ')}
    WHERE id = ? AND user_id = ?
  `);
  stmt.run(...values);

  const getStmt = db.prepare('SELECT * FROM investments WHERE id = ?');
  return getStmt.get(id) as Investment | null;
}

export function deleteInvestment(id: number, userId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM investments WHERE id = ? AND user_id = ?');
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// ===== FIRE Settings =====

export interface FireSettingsData {
  withdrawal_rate?: number;
  expected_inflation?: number;
  target_monthly_expenses?: number;
  current_age?: number;
  retirement_age?: number;
}

export function getFireSettings(userId: number): FireSettings | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM fire_settings WHERE user_id = ?');
  return stmt.get(userId) as FireSettings | null;
}

export function upsertFireSettings(userId: number, data: FireSettingsData): FireSettings {
  const db = getDatabase();

  // Try to get existing settings
  const existing = getFireSettings(userId);

  if (existing) {
    // Update
    const updates: string[] = [];
    const values: any[] = [];

    if (data.withdrawal_rate !== undefined) {
      updates.push('withdrawal_rate = ?');
      values.push(data.withdrawal_rate);
    }
    if (data.expected_inflation !== undefined) {
      updates.push('expected_inflation = ?');
      values.push(data.expected_inflation);
    }
    if (data.target_monthly_expenses !== undefined) {
      updates.push('target_monthly_expenses = ?');
      values.push(data.target_monthly_expenses);
    }
    if (data.current_age !== undefined) {
      updates.push('current_age = ?');
      values.push(data.current_age);
    }
    if (data.retirement_age !== undefined) {
      updates.push('retirement_age = ?');
      values.push(data.retirement_age);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const stmt = db.prepare(`
        UPDATE fire_settings
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `);
      stmt.run(...values);
    }

    return getFireSettings(userId)!;
  } else {
    // Insert
    const stmt = db.prepare(`
      INSERT INTO fire_settings (user_id, withdrawal_rate, expected_inflation, target_monthly_expenses, current_age, retirement_age)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      data.withdrawal_rate || 4.0,
      data.expected_inflation || 3.0,
      data.target_monthly_expenses || 0,
      data.current_age || 30,
      data.retirement_age || 65
    );

    return getFireSettings(userId)!;
  }
}

// ===== User Preferences =====

export interface UserPreferencesData {
  currency?: string;
  date_format?: string;
  theme?: 'light' | 'dark' | 'auto';
  notifications_enabled?: boolean;
}

export function getUserPreferences(userId: number): UserPreferences | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
  return stmt.get(userId) as UserPreferences | null;
}

export function upsertUserPreferences(userId: number, data: UserPreferencesData): UserPreferences {
  const db = getDatabase();

  const existing = getUserPreferences(userId);

  if (existing) {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.currency !== undefined) {
      updates.push('currency = ?');
      values.push(data.currency);
    }
    if (data.date_format !== undefined) {
      updates.push('date_format = ?');
      values.push(data.date_format);
    }
    if (data.theme !== undefined) {
      updates.push('theme = ?');
      values.push(data.theme);
    }
    if (data.notifications_enabled !== undefined) {
      updates.push('notifications_enabled = ?');
      values.push(data.notifications_enabled ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const stmt = db.prepare(`
        UPDATE user_preferences
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `);
      stmt.run(...values);
    }

    return getUserPreferences(userId)!;
  } else {
    const stmt = db.prepare(`
      INSERT INTO user_preferences (user_id, currency, date_format, theme, notifications_enabled)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      userId,
      data.currency || 'USD',
      data.date_format || 'MMM dd, yyyy',
      data.theme || 'light',
      data.notifications_enabled !== undefined ? (data.notifications_enabled ? 1 : 0) : 1
    );

    return getUserPreferences(userId)!;
  }
}
