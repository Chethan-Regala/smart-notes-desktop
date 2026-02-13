import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import Store from 'electron-store';
import { getMarkdownFiles, readMarkdownFile } from '../modules/storage/notes';
import { isValidWorkspace } from '../modules/storage/workspace';
import { startWorkspaceWatcher, stopWorkspaceWatcher } from '../modules/storage/watcher';

type StoreSchema = {
  workspacePath: string | null;
};

const store = new Store<StoreSchema>({
  defaults: {
    workspacePath: null,
  },
});

type WorkspaceStoreMethods = {
  get: (key: 'workspacePath') => string | null;
  set: (key: 'workspacePath', value: string | null) => void;
};

const typedStore = store as unknown as WorkspaceStoreMethods;

const getStoredWorkspacePath = (): string | null => typedStore.get('workspacePath');

const setStoredWorkspacePath = (workspacePath: string | null): void => {
  typedStore.set('workspacePath', workspacePath);
};

// Global reference to mainWindow for IPC communication
let mainWindow: BrowserWindow | null = null;
let activeWorkspace: string | null = null;

function isPathInsideWorkspace(filePath: string, workspacePath: string): boolean {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedFile = path.resolve(filePath);
  const workspaceWithSep = `${resolvedWorkspace}${path.sep}`;
  const workspaceForCompare =
    process.platform === 'win32' ? workspaceWithSep.toLowerCase() : workspaceWithSep;
  const fileForCompare = process.platform === 'win32' ? resolvedFile.toLowerCase() : resolvedFile;

  return fileForCompare.startsWith(workspaceForCompare);
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// IPC Handlers for secure renderer-to-main communication
ipcMain.handle('select-workspace', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled) return null;

  const selectedPath = result.filePaths[0];
  setStoredWorkspacePath(selectedPath);
  activeWorkspace = selectedPath;

  // Start watcher for this workspace
  if (mainWindow) {
    startWorkspaceWatcher(selectedPath, () => {
      // Notify renderer of workspace changes
      mainWindow?.webContents.send('workspace-updated');
    });
  }

  return selectedPath;
});

ipcMain.handle('get-workspace', async () => {
  const savedWorkspace = getStoredWorkspacePath();

  if (isValidWorkspace(savedWorkspace)) {
    activeWorkspace = savedWorkspace;

    // Start watcher for saved workspace
    if (mainWindow && savedWorkspace) {
      startWorkspaceWatcher(savedWorkspace, () => {
        // Notify renderer of workspace changes
        mainWindow?.webContents.send('workspace-updated');
      });
    }
    return savedWorkspace;
  }

  activeWorkspace = null;
  setStoredWorkspacePath(null);
  return null;
});

ipcMain.handle('get-notes', async (_, workspacePath: string) => {
  return getMarkdownFiles(workspacePath);
});

ipcMain.handle('read-note', async (_, filePath: string) => {
  if (!activeWorkspace) return null;
  if (!isPathInsideWorkspace(filePath, activeWorkspace)) {
    throw new Error('Invalid file access');
  }

  return readMarkdownFile(filePath);
});

const createWindow = () => {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Store reference to mainWindow
  mainWindow = win;

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Clean up watcher when window is closed
  mainWindow.on('closed', () => {
    stopWorkspaceWatcher();
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
