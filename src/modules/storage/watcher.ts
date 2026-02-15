import { watch, FSWatcher } from 'chokidar';
import fs from 'fs';

let watcher: FSWatcher | null = null;

async function closeWatcher(): Promise<void> {
  if (!watcher) {
    return;
  }

  const currentWatcher = watcher;
  watcher = null;
  await currentWatcher.close();
}

/**
 * Starts watching a workspace directory for filesystem changes.
 * Automatically closes any existing watcher before starting a new one.
 * @param workspacePath - The directory path to watch
 * @param onChange - Callback function to invoke when filesystem changes
 */
export async function startWorkspaceWatcher(
  workspacePath: string,
  onChange: () => void,
): Promise<void> {
  await closeWatcher();

  if (!fs.existsSync(workspacePath)) {
    throw new Error(`Workspace path does not exist: ${workspacePath}`);
  }

  // Create new watcher with safe configuration.
  watcher = watch(workspacePath, {
    ignored: /(^|[/\\])\../,
    persistent: true,
    ignoreInitial: true,
    depth: Infinity,
    usePolling: process.platform === 'win32',
    interval: 200,
    binaryInterval: 300,
    ignorePermissionErrors: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  watcher.on('all', () => {
    onChange();
  });

  watcher.on('error', (error: Error) => {
    console.error('[Watcher] Error:', error);
  });
}

/**
 * Stops the workspace watcher and cleans up resources.
 */
export async function stopWorkspaceWatcher(): Promise<void> {
  await closeWatcher();
}
