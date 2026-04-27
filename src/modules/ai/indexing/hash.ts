import crypto from 'node:crypto';
import fs from 'node:fs';

export function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');

  return crypto.createHash('sha256').update(content).digest('hex');
}
