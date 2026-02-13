import fs from 'fs';
import path from 'path';
import { NoteFile } from '../../shared/types';

export function getMarkdownFiles(workspacePath: string): NoteFile[] {
  if (!workspacePath || !fs.existsSync(workspacePath)) return [];

  const files = fs.readdirSync(workspacePath);

  return files
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      name: file,
      path: path.join(workspacePath, file),
    }));
}

export function readMarkdownFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}
