// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getWorkspace: () => ipcRenderer.invoke('get-workspace'),
  getWorkspaceTree: (workspacePath: string) =>
    ipcRenderer.invoke('get-workspace-tree', workspacePath),
  readNote: (filePath: string) => ipcRenderer.invoke('read-note', filePath),
  onWorkspaceUpdated: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('workspace-updated', listener);

    return () => {
      ipcRenderer.removeListener('workspace-updated', listener);
    };
  },
});
