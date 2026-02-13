import fs from 'fs';

export function isValidWorkspace(path: string | null): boolean {
  if (!path) return false;
  return fs.existsSync(path);
}
