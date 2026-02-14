import fs from 'fs';
import path from 'path';
import type { FileNode } from '../../shared/types';

export function buildWorkspaceTree(workspacePath: string): FileNode[] {
  if (!workspacePath || !fs.existsSync(workspacePath)) return [];

  const entries = fs.readdirSync(workspacePath, { withFileTypes: true });

  return entries
    .filter(entry => !entry.name.startsWith('.'))
    .map(entry => {
      const fullPath = path.join(workspacePath, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          path: fullPath,
          type: 'folder',
          children: buildWorkspaceTree(fullPath),
        };
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        return {
          name: entry.name,
          path: fullPath,
          type: 'file',
        };
      }

      return null;
    })
    .filter(Boolean) as FileNode[];
}

export function readMarkdownFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}
