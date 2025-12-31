import Database from 'better-sqlite3';
import path from 'path';
import { createTables } from '../db/schema';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/finance.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Initialize tables
    createTables(db);
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
