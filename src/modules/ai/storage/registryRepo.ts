import { getDB } from './db';
import { RegistryEntry } from '../types';

type RegistryRow = {
  file_path: string;
  content_hash: string;
  status: RegistryEntry['status'];
  last_indexed_at: number | null;
};

export function upsertRegistry(entry: RegistryEntry): void {
  const db = getDB();

  const stmt = db.prepare(`
    INSERT INTO registry (file_path, content_hash, status, last_indexed_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(file_path) DO UPDATE SET
      content_hash = excluded.content_hash,
      status = excluded.status,
      last_indexed_at = excluded.last_indexed_at
  `);

  stmt.run(entry.filePath, entry.contentHash, entry.status, entry.lastIndexedAt);
}

export function getRegistry(filePath: string): RegistryEntry | null {
  const db = getDB();
  const row = db.prepare(`SELECT * FROM registry WHERE file_path = ?`).get(filePath) as
    | RegistryRow
    | undefined;

  if (!row) return null;

  return {
    filePath: row.file_path,
    contentHash: row.content_hash,
    status: row.status,
    lastIndexedAt: row.last_indexed_at,
  };
}
