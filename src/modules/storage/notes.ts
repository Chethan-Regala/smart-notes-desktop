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

async function ensureExistingDirectory(directoryPath: string, errorMessage: string): Promise<void> {
  let stats: fs.Stats;
  try {
    stats = await fs.promises.stat(directoryPath);
  } catch {
    throw new Error(errorMessage);
  }

  if (!stats.isDirectory()) {
    throw new Error(errorMessage);
  }
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

export async function createMarkdownFile(
  workspacePath: string,
  fileName: string,
  parentFolder?: string,
): Promise<string> {
  const trimmedName = fileName.trim();
  if (!trimmedName) {
    throw new Error('File name is required');
  }

  const normalizedName = trimmedName.endsWith('.md') ? trimmedName : `${trimmedName}.md`;
  const basePath = parentFolder ? path.resolve(parentFolder) : path.resolve(workspacePath);
  const resolvedWorkspace = path.resolve(workspacePath);
  const targetPath = path.join(basePath, normalizedName);
  const resolvedTarget = path.resolve(targetPath);

  const relativeBase = path.relative(resolvedWorkspace, basePath);
  if (relativeBase.startsWith('..') || path.isAbsolute(relativeBase)) {
    throw new Error('Invalid create folder path');
  }

  if (!isPathInsideWorkspace(resolvedTarget, resolvedWorkspace)) {
    throw new Error('Invalid create path');
  }

  await ensureExistingDirectory(basePath, 'Parent folder does not exist');

  if (fs.existsSync(resolvedTarget)) {
    throw new Error('File already exists');
  }

  await fs.promises.writeFile(resolvedTarget, '', 'utf-8');

  return resolvedTarget;
}

export async function renameMarkdownFile(
  workspacePath: string,
  oldPath: string,
  newName: string,
): Promise<string> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new Error('File name is required');
  }

  const normalizedName = trimmedName.endsWith('.md') ? trimmedName : `${trimmedName}.md`;
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedOldPath = path.resolve(oldPath);

  if (!isPathInsideWorkspace(resolvedOldPath, resolvedWorkspace)) {
    throw new Error('Invalid rename source');
  }

  const newPath = path.join(path.dirname(resolvedOldPath), normalizedName);
  const resolvedNewPath = path.resolve(newPath);

  if (!isPathInsideWorkspace(resolvedNewPath, resolvedWorkspace)) {
    throw new Error('Invalid rename target');
  }

  if (fs.existsSync(resolvedNewPath)) {
    throw new Error('File already exists');
  }

  await fs.promises.rename(resolvedOldPath, resolvedNewPath);

  return resolvedNewPath;
}

export async function deleteMarkdownFile(
  workspacePath: string,
  filePath: string,
): Promise<void> {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedFile = path.resolve(filePath);

  if (!isPathInsideWorkspace(resolvedFile, resolvedWorkspace)) {
    throw new Error('Invalid delete path');
  }

  if (!fs.existsSync(resolvedFile)) {
    throw new Error('File does not exist');
  }

  const fileStats = await fs.promises.stat(resolvedFile);
  if (!fileStats.isFile() || path.extname(resolvedFile).toLowerCase() !== '.md') {
    throw new Error('Only markdown files can be deleted');
  }

  await fs.promises.unlink(resolvedFile);
}

export async function createFolder(
  workspacePath: string,
  folderName: string,
  parentFolder?: string,
): Promise<string> {
  const trimmedName = folderName.trim();
  if (!trimmedName) {
    throw new Error('Folder name is required');
  }

  const resolvedWorkspace = path.resolve(workspacePath);
  const basePath = parentFolder ? path.resolve(parentFolder) : resolvedWorkspace;

  const relative = path.relative(resolvedWorkspace, basePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid folder path');
  }

  await ensureExistingDirectory(basePath, 'Parent folder does not exist');

  const newFolderPath = path.join(basePath, trimmedName);
  const resolvedNewFolder = path.resolve(newFolderPath);

  const relativeNew = path.relative(resolvedWorkspace, resolvedNewFolder);
  if (relativeNew.startsWith('..') || path.isAbsolute(relativeNew)) {
    throw new Error('Invalid folder target');
  }

  if (fs.existsSync(resolvedNewFolder)) {
    throw new Error('Folder already exists');
  }

  await fs.promises.mkdir(resolvedNewFolder);

  return resolvedNewFolder;
}

export async function deleteFolder(
  workspacePath: string,
  folderPath: string,
): Promise<void> {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedFolderPath = path.resolve(folderPath);
  const relativeFolder = path.relative(resolvedWorkspace, resolvedFolderPath);

  if (relativeFolder === '') {
    throw new Error('Cannot delete workspace root');
  }

  if (relativeFolder.startsWith('..') || path.isAbsolute(relativeFolder)) {
    throw new Error('Invalid delete folder path');
  }

  let folderStats: fs.Stats;
  try {
    folderStats = await fs.promises.stat(resolvedFolderPath);
  } catch {
    throw new Error('Folder does not exist');
  }

  if (!folderStats.isDirectory()) {
    throw new Error('Invalid folder target');
  }

  await fs.promises.rm(resolvedFolderPath, { recursive: true, force: false });
}
