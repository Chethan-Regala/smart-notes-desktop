export {};

import type { FileNode } from '../../shared/types';

declare global {
  interface Window {
    api: {
      selectWorkspace: () => Promise<string | null>;
      getWorkspace: () => Promise<string | null>;
      getWorkspaceTree: (workspacePath: string) => Promise<FileNode[]>;
      readNote: (filePath: string) => Promise<string | null>;
      onWorkspaceUpdated: (callback: () => void) => () => void;
    };
  }
}
