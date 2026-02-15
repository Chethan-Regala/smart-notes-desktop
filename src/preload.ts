// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getWorkspace: () => ipcRenderer.invoke('get-workspace'),
  getWorkspaceTree: (workspacePath: string) =>
    ipcRenderer.invoke('get-workspace-tree', workspacePath),
  readNote: (filePath: string) => ipcRenderer.invoke('read-note', filePath),
  writeNote: (filePath: string, content: string) =>
    ipcRenderer.invoke('write-note', filePath, content),
  searchNotes: (query: string) => ipcRenderer.invoke('search-notes', query),
  createNote: (fileName: string, parentFolder?: string) =>
    ipcRenderer.invoke('create-note', fileName, parentFolder),
  renameNote: (oldPath: string, newName: string) =>
    ipcRenderer.invoke('rename-note', oldPath, newName),
  deleteNote: (filePath: string) => ipcRenderer.invoke('delete-note', filePath),
  createFolder: (folderName: string, parentFolder?: string) =>
    ipcRenderer.invoke('create-folder', folderName, parentFolder),
  deleteFolder: (folderPath: string) => ipcRenderer.invoke('delete-folder', folderPath),
  onWorkspaceUpdated: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('workspace-updated', listener);

    return () => {
      ipcRenderer.removeListener('workspace-updated', listener);
    };
  },
});
