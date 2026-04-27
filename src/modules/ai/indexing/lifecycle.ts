import { getRegistry } from '../storage/registryRepo';
import { computeFileHash } from './hash';

export type IndexDecision = 'NO_CHANGE' | 'NEW_FILE' | 'UPDATED';

export function determineIndexingAction(filePath: string): {
  decision: IndexDecision;
  newHash: string;
} {
  const newHash = computeFileHash(filePath);
  const existing = getRegistry(filePath);

  if (!existing) {
    return { decision: 'NEW_FILE', newHash };
  }

  if (existing.contentHash === newHash) {
    return { decision: 'NO_CHANGE', newHash };
  }

  return { decision: 'UPDATED', newHash };
}
