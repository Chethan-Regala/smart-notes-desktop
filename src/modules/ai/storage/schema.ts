import { getDB } from './db';

export function initSchema(): void {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS registry (
      file_path TEXT PRIMARY KEY,
      content_hash TEXT NOT NULL,
      status TEXT NOT NULL,
      last_indexed_at INTEGER
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      chunk_text TEXT NOT NULL,
      embedding BLOB
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_chunks_file_path
    ON chunks(file_path);
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS fts_chunks
    USING fts5(chunk_text, file_path);
  `);
}
