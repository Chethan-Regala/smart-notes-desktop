import { getDB } from './db';
import { Chunk } from '../types';

export function insertChunks(chunks: Chunk[]): void {
  const db = getDB();

  const insert = db.prepare(`
    INSERT INTO chunks (file_path, chunk_text, embedding)
    VALUES (?, ?, ?)
  `);

  const insertFTS = db.prepare(`
    INSERT INTO fts_chunks (chunk_text, file_path)
    VALUES (?, ?)
  `);

  const transaction = db.transaction((chunkList: Chunk[]) => {
    for (const chunk of chunkList) {
      insert.run(chunk.filePath, chunk.chunkText, chunk.embedding);
      insertFTS.run(chunk.chunkText, chunk.filePath);
    }
  });

  transaction(chunks);
}

export function deleteChunksByFile(filePath: string): void {
  const db = getDB();

  db.prepare(`DELETE FROM chunks WHERE file_path = ?`).run(filePath);
  db.prepare(`DELETE FROM fts_chunks WHERE file_path = ?`).run(filePath);
}
