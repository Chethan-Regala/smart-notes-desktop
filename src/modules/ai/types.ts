export type IndexingStatus = 'pending' | 'indexing' | 'indexed' | 'failed';

export interface RegistryEntry {
  filePath: string;
  contentHash: string;
  status: IndexingStatus;
  lastIndexedAt: number | null;
}

export interface Chunk {
  id?: number;
  filePath: string;
  chunkText: string;
  embedding: Buffer | null;
}
