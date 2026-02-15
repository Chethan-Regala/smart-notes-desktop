export {};

import type { FileNode, NoteSearchResult } from '../../shared/types';

declare global {
  interface Window {
    api: {
      selectWorkspace: () => Promise<string | null>;
      getWorkspace: () => Promise<string | null>;
      getWorkspaceTree: (workspacePath: string) => Promise<FileNode[]>;
      readNote: (filePath: string) => Promise<string | null>;
      writeNote: (filePath: string, content: string) => Promise<void>;
      searchNotes: (query: string) => Promise<NoteSearchResult[]>;
      createNote: (fileName: string, parentFolder?: string) => Promise<string>;
      renameNote: (oldPath: string, newName: string) => Promise<string>;
      deleteNote: (filePath: string) => Promise<void>;
      createFolder: (folderName: string, parentFolder?: string) => Promise<string>;
      deleteFolder: (folderPath: string) => Promise<void>;
      onWorkspaceUpdated: (callback: () => void) => () => void;
    };
  }
}
