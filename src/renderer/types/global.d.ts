export {};

import type { NoteFile } from '../../shared/types';

declare global {
  interface Window {
    api: {
      selectWorkspace: () => Promise<string | null>;
      getWorkspace: () => Promise<string | null>;
      getNotes: (workspacePath: string) => Promise<NoteFile[]>;
      readNote: (filePath: string) => Promise<string | null>;
      onWorkspaceUpdated: (callback: () => void) => () => void;
    };
  }
}
