import { getDatabase } from '../config/database';
import bcrypt from 'bcrypt';
import type { User } from '../db/schema';

const SALT_ROUNDS = 10;

export function createUser(email: string, password: string): User {
  const db = getDatabase();
  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);

  const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
  const result = stmt.run(email, passwordHash);

  return getUserById(result.lastInsertRowid as number)!;
}

export function getUserById(id: number): User | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | null;
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function getAllUsers(): User[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
  return stmt.all() as User[];
}
