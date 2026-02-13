import { watch, FSWatcher } from 'chokidar';

let watcher: FSWatcher | null = null;

/**
 * Starts watching a workspace directory for markdown file changes.
 * Automatically closes any existing watcher before starting a new one.
 * @param workspacePath - The directory path to watch
 * @param onChange - Callback function to invoke when .md files change
 */
export function startWorkspaceWatcher(
  workspacePath: string,
  onChange: () => void,
): void {
  // Close existing watcher if any
  if (watcher) {
    watcher.close();
    watcher = null;
  }

  // Create new watcher with safe configuration
  watcher = watch(workspacePath, {
    ignored: (filePath: string) => {
      const parts = filePath.split(/[\\/]/);
      return parts.some(part => part.startsWith('.'));
    },
    persistent: true,
    ignoreInitial: true, // Don't trigger on initial scan
    depth: Infinity, // Watch recursively
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    }, // Wait for file write to finish
  });

  // Listen for markdown file additions
  watcher.on('add', (path: string) => {
    if (path.endsWith('.md')) {
      onChange();
    }
  });

  // Listen for markdown file deletions
  watcher.on('unlink', (path: string) => {
    if (path.endsWith('.md')) {
      onChange();
    }
  });

  // Listen for markdown file modifications
  watcher.on('change', (path: string) => {
    if (path.endsWith('.md')) {
      onChange();
    }
  });

  // Log watcher errors (non-blocking)
  watcher.on('error', (error: Error) => {
    console.error('[Watcher] Error:', error.message);
  });
}

/**
 * Stops the workspace watcher and cleans up resources.
 */
export function stopWorkspaceWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
