import fs from 'fs';
import path from 'path';
import type { FileNode, NoteSearchResult } from '../../shared/types';

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

export async function searchWorkspace(
  workspacePath: string,
  query: string,
): Promise<NoteSearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  const results: NoteSearchResult[] = [];
  if (!workspacePath || !fs.existsSync(workspacePath)) return results;

  async function traverse(currentPath: string): Promise<void> {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const normalizedName = entry.name.toLowerCase();
        const normalizedBaseName = path.parse(entry.name).name.toLowerCase();

        if (
          normalizedName.includes(normalizedQuery) ||
          normalizedBaseName.includes(normalizedQuery)
        ) {
          results.push({
            name: entry.name,
            path: fullPath,
          });
          continue;
        }

        const content = await fs.promises.readFile(fullPath, 'utf-8');
        if (content.toLowerCase().includes(normalizedQuery)) {
          results.push({
            name: entry.name,
            path: fullPath,
          });
        }
      }
    }
  }

  await traverse(workspacePath);

  return results;
}

function isPathInsideWorkspace(filePath: string, workspacePath: string): boolean {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedFile = path.resolve(filePath);
  const workspaceWithSep = `${resolvedWorkspace}${path.sep}`;
  const workspaceForCompare =
    process.platform === 'win32' ? workspaceWithSep.toLowerCase() : workspaceWithSep;
  const fileForCompare = process.platform === 'win32' ? resolvedFile.toLowerCase() : resolvedFile;

  return fileForCompare.startsWith(workspaceForCompare);
}

export async function writeMarkdownFile(
  workspacePath: string,
  filePath: string,
  content: string,
): Promise<void> {
  if (!isPathInsideWorkspace(filePath, workspacePath)) {
    throw new Error('Invalid write path');
  }
  if (path.extname(filePath).toLowerCase() !== '.md') {
    throw new Error('Only markdown files can be written');
  }

  await fs.promises.writeFile(filePath, content, 'utf-8');
}
