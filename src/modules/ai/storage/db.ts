import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'node:path';

let db: Database.Database | null = null;

export function getDB(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'smart-notes.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  return db;
}
