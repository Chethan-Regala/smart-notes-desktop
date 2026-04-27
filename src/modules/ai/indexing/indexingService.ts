import fs from 'node:fs';
import { upsertRegistry } from '../storage/registryRepo';
import { determineIndexingAction } from './lifecycle';

export function processFileForIndexing(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const { decision, newHash } = determineIndexingAction(filePath);

  if (decision === 'NO_CHANGE') {
    console.log('[AI] Skip indexing:', filePath);
    return;
  }

  console.log('[AI] Indexing required:', decision, filePath);

  upsertRegistry({
    filePath,
    contentHash: newHash,
    status: 'pending',
    lastIndexedAt: null,
  });
}
