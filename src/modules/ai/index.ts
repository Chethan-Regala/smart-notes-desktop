import { initSchema } from './storage/schema';
import { getDB } from './storage/db';

type RecoverableRow = {
  file_path: string;
};

function reconcileIndexingState(): void {
  const db = getDB();
  const stuck = db
    .prepare(
      `
    SELECT file_path FROM registry
    WHERE status = 'indexing'
  `,
    )
    .all() as RecoverableRow[];

  for (const row of stuck) {
    console.log('[AI] Recovering file:', row.file_path);
    db.prepare(
      `
      UPDATE registry
      SET status = 'pending'
      WHERE file_path = ?
    `,
    ).run(row.file_path);
  }
}

export function initAI(): void {
  try {
    initSchema();
    reconcileIndexingState();
  } catch (err) {
    console.error('[AI] Schema init failed', err);
  }
  console.log('[AI] Initialized');
}
