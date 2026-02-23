import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileNode, NoteSearchResult } from '../shared/types';
import TreeNode from './components/TreeNode';
import { renderMarkdown } from './utils/markdown';
import { error, log } from './utils/logger';

function treeContainsPath(nodes: FileNode[], targetPath: string, nodeType?: 'file' | 'folder'): boolean {
  for (const node of nodes) {
    if (node.path === targetPath && (!nodeType || node.type === nodeType)) {
      return true;
    }

    if (node.type === 'folder' && node.children && treeContainsPath(node.children, targetPath, nodeType)) {
      return true;
    }
  }

  return false;
}

function getParentPath(inputPath: string): string | null {
  const lastForwardSlash = inputPath.lastIndexOf('/');
  const lastBackwardSlash = inputPath.lastIndexOf('\\');
  const lastSlash = Math.max(lastForwardSlash, lastBackwardSlash);

  if (lastSlash === -1) {
    return null;
  }

  return inputPath.substring(0, lastSlash);
}

function formatFolderBreadcrumb(workspacePath: string, folderPath: string): string {
  const normalizePath = (value: string) => value.replace(/[\\/]+/g, '\\');
  const normalizedWorkspace = normalizePath(workspacePath);
  const normalizedFolder = normalizePath(folderPath);

  if (normalizedFolder === normalizedWorkspace) {
    return '';
  }

  const workspacePrefix = `${normalizedWorkspace}\\`;
  const relativePath = normalizedFolder.startsWith(workspacePrefix)
    ? normalizedFolder.substring(workspacePrefix.length)
    : normalizedFolder;

  return relativePath
    .split('\\')
    .filter(Boolean)
    .join(' > ');
}

type EditorContentProps = {
  hasWorkspace: boolean;
  selectedNote: string | null;
  isEditing: boolean;
  content: string;
  draftContent: string;
  onDraftChange: (nextValue: string) => void;
};

const EditorContent = React.memo(function EditorContent({
  hasWorkspace,
  selectedNote,
  isEditing,
  content,
  draftContent,
  onDraftChange,
}: EditorContentProps) {
  if (!hasWorkspace) {
    return (
      <div className="empty-state">
        <p>Select a workspace to begin.</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <textarea
        value={draftContent}
        onChange={event => {
          onDraftChange(event.target.value);
        }}
        className="editor-textarea"
      />
    );
  }

  if (!selectedNote) {
    return (
      <div className="empty-state">
        <p>Select a note to view or edit.</p>
      </div>
    );
  }

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}, (previous, next) =>
  previous.hasWorkspace === next.hasWorkspace &&
  previous.selectedNote === next.selectedNote &&
  previous.isEditing === next.isEditing &&
  previous.content === next.content &&
  previous.draftContent === next.draftContent &&
  previous.onDraftChange === next.onDraftChange);

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteSearchResult[] | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);

  const getActiveFolder = useCallback((): string | null => {
    if (selectedFolder) {
      return selectedFolder;
    }

    if (selectedNote) {
      return getParentPath(selectedNote);
    }

    return null;
  }, [selectedFolder, selectedNote]);

  const highlightMatch = useCallback((text: string, query: string): React.ReactNode => {
    if (!query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    return (
      <>
        {before}
        <span style={{ backgroundColor: '#ffd54f' }}>{match}</span>
        {after}
      </>
    );
  }, []);

  const trimmedSearchQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  useEffect(() => {
    if (!trimmedSearchQuery) {
      setSearchResults(null);
      return;
    }

    if (trimmedSearchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const handler = setTimeout(async () => {
      try {
        const results = await window.api.searchNotes(trimmedSearchQuery);
        setSearchResults(results);
      } catch (searchError) {
        error('Failed to search notes:', searchError);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [trimmedSearchQuery]);

  useEffect(() => {
    const loadWorkspace = async () => {
      const savedWorkspace = await window.api.getWorkspace();
      if (savedWorkspace) {
        setWorkspace(savedWorkspace);
      }
    };

    void loadWorkspace();
  }, []);

  useEffect(() => {
    if (!workspace) return;

    const refreshTree = async () => {
      const data = await window.api.getWorkspaceTree(workspace);
      setTree(data);
    };

    void refreshTree();

    const unsubscribe = window.api.onWorkspaceUpdated(() => {
      void refreshTree();
    });

    return () => {
      unsubscribe();
    };
  }, [workspace]);

  useEffect(() => {
    if (selectedFolder && selectedFolder !== workspace && !treeContainsPath(tree, selectedFolder, 'folder')) {
      setSelectedFolder(null);
    }

    if (selectedNote && !treeContainsPath(tree, selectedNote, 'file')) {
      setSelectedNote(null);
      setContent('');
      setDraftContent('');
      setIsEditing(false);
      setIsDirty(false);
      setIsRenaming(false);
      setRenameValue('');
    }
  }, [tree, selectedFolder, selectedNote, workspace]);

  const handleSelectWorkspace = useCallback(async () => {
    const path = await window.api.selectWorkspace();
    if (path) {
      setWorkspace(path);
      setSelectedNote(null);
      setSelectedFolder(null);
      setContent('');
      setDraftContent('');
      setIsDirty(false);
      setIsEditing(false);
      setSearchQuery('');
      setSearchResults(null);
      setShowNewFolderInput(false);
      setNewFolderName('');
      setIsRenaming(false);
      setRenameValue('');
    }
  }, []);

  const handleSelectNote = useCallback(async (filePath: string) => {
    log('Clicked:', filePath);
    const parentFolder = getParentPath(filePath);

    if (parentFolder) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add(parentFolder);
        return next;
      });
    }

    try {
      const noteContent = await window.api.readNote(filePath);
      log('Loaded content:', noteContent);
      const resolvedContent = noteContent ?? '';
      setSelectedNote(filePath);
      setSelectedFolder(parentFolder);
      setContent(resolvedContent);
      setDraftContent(resolvedContent);
      setIsDirty(false);
      setIsEditing(false);
    } catch (readError) {
      error('Failed to read note:', readError);
      setSelectedNote(filePath);
      setSelectedFolder(parentFolder);
      setContent('');
      setDraftContent('');
      setIsDirty(false);
      setIsEditing(false);
    }
  }, []);

  const handleSelectFolder = useCallback((folderPath: string) => {
    if (workspace && folderPath === workspace) {
      setSelectedFolder(null);
    } else {
      setSelectedFolder(folderPath);
    }
    setSelectedNote(null);
    setContent('');
    setDraftContent('');
    setIsEditing(false);
    setIsDirty(false);
    setIsRenaming(false);
    setRenameValue('');
  }, [workspace]);

  const handleToggleFolder = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const handleEditToggle = () => {
    if (!selectedNote) return;

    if (isEditing) {
      setDraftContent(content);
      setIsDirty(false);
      setIsEditing(false);
      return;
    }

    setDraftContent(content);
    setIsDirty(false);
    setIsEditing(true);
  };

  const handleSave = useCallback(async () => {
    if (!selectedNote || !isEditing || !isDirty) return;

    try {
      await window.api.writeNote(selectedNote, draftContent);
      setContent(draftContent);
      setIsDirty(false);
      setIsEditing(false);
    } catch (saveError) {
      error('Failed to save note:', saveError);
    }
  }, [draftContent, isDirty, isEditing, selectedNote]);

  const handleDraftChange = useCallback((nextValue: string) => {
    setDraftContent(nextValue);
    setIsDirty(nextValue !== content);
  }, [content]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const activeFolder = useMemo(() => getActiveFolder(), [getActiveFolder]);
  const breadcrumbPath =
    workspace && activeFolder ? formatFolderBreadcrumb(workspace, activeFolder) : '';
  const rootNode = useMemo<FileNode | null>(() => {
    if (!workspace) {
      return null;
    }

    return {
      name: 'Workspace',
      path: workspace,
      type: 'folder',
      children: tree,
    };
  }, [tree, workspace]);

  const renderedSearchResults = useMemo(
    () => searchResults?.map(note => (
      <div
        key={note.path}
        onClick={() => void handleSelectNote(note.path)}
        className={`note-item${selectedNote === note.path ? ' active' : ''}`}
      >
        {highlightMatch(note.name, trimmedSearchQuery)}
      </div>
    )),
    [handleSelectNote, highlightMatch, searchResults, selectedNote, trimmedSearchQuery],
  );

  const renderedTree = useMemo(
    () => (rootNode ? (
      <TreeNode
        key={rootNode.path}
        node={rootNode}
        workspacePath={workspace ?? ''}
        onSelect={handleSelectNote}
        onSelectFolder={handleSelectFolder}
        onToggleFolder={handleToggleFolder}
        expandedFolders={expandedFolders}
        selectedPath={selectedNote}
        selectedFolderPath={selectedFolder}
        depth={0}
      />
    ) : null),
    [
      expandedFolders,
      handleSelectFolder,
      handleSelectNote,
      handleToggleFolder,
      rootNode,
      selectedFolder,
      selectedNote,
      workspace,
    ],
  );

  return (
    <main className={`app-container${isLightMode ? ' light-mode' : ''}`}>
      <div className="sidebar">
        <button onClick={handleSelectWorkspace} className="button-block mb-sm">
          Select Workspace
        </button>
        <button
          onClick={() => setShowNewNoteInput(true)}
          className="button-block mb-sm"
          disabled={!workspace}
        >
          + New Note
        </button>
        <button
          onClick={() => setShowNewFolderInput(true)}
          className="button-block mb-sm"
          disabled={!workspace}
        >
          + New Folder
        </button>
        <button
          onClick={() => setIsLightMode(prev => !prev)}
          className="button-block mb-sm"
        >
          {isLightMode ? 'Switch to Dark' : 'Switch to Light'}
        </button>
        {showNewFolderInput && (
          <div className="inline-row mb-xs">
            <input
              value={newFolderName}
              onChange={event => setNewFolderName(event.target.value)}
              placeholder="Enter folder name"
              className="text-input flex-1"
            />
            <button
              onClick={async () => {
                if (!newFolderName.trim()) return;
                if (!workspace) return;

                try {
                  const targetFolder = getActiveFolder();
                  await window.api.createFolder(newFolderName.trim(), targetFolder ?? undefined);
                  if (targetFolder) {
                    setExpandedFolders(prev => {
                      const next = new Set(prev);
                      next.add(targetFolder);
                      return next;
                    });
                  }
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                } catch (createFolderError) {
                  error(createFolderError);
                }
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        {showNewNoteInput && (
          <div className="inline-row mb-xs">
            <input
              type="text"
              placeholder="Enter note name"
              value={newNoteName}
              onChange={event => setNewNoteName(event.target.value)}
              className="text-input flex-1"
            />
            <button
              onClick={async () => {
                if (!newNoteName.trim()) return;
                if (!workspace) return;

                try {
                  const targetFolder = getActiveFolder();
                  const newPath = await window.api.createNote(newNoteName.trim(), targetFolder ?? undefined);
                  if (targetFolder) {
                    setExpandedFolders(prev => {
                      const next = new Set(prev);
                      next.add(targetFolder);
                      return next;
                    });
                  }
                  setShowNewNoteInput(false);
                  setNewNoteName('');
                  await handleSelectNote(newPath);
                  setIsEditing(true);
                  setDraftContent('');
                  setIsDirty(false);
                } catch (createNoteError) {
                  error(createNoteError);
                }
              }}
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowNewNoteInput(false);
                setNewNoteName('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <p className="workspace-label">
          {workspace ?? 'No workspace selected'}
        </p>
        <div className="breadcrumb">
          <button
            type="button"
            className="breadcrumb-link"
            onClick={() => {
              setSelectedFolder(null);
              setSelectedNote(null);
              setContent('');
              setDraftContent('');
              setIsEditing(false);
              setIsDirty(false);
              setIsRenaming(false);
              setRenameValue('');
            }}
          >
            Workspace
          </button>
          {workspace && activeFolder && breadcrumbPath && (
            <>
              {' > '}
              {breadcrumbPath}
            </>
          )}
        </div>
        {selectedFolder && (
          <button
            className="button-block mb-sm"
            disabled={!workspace}
            onClick={async () => {
              if (!workspace || !selectedFolder) {
                return;
              }

              const confirmed = window.confirm(
                'Are you sure you want to delete this folder and all of its contents?',
              );
              if (!confirmed) {
                return;
              }

              try {
                await window.api.deleteFolder(selectedFolder);

                if (selectedNote) {
                  const normalizePath = (value: string) => value.replace(/[\\/]+/g, '\\').toLowerCase();
                  const normalizedFolder = normalizePath(selectedFolder);
                  const normalizedSelectedNote = normalizePath(selectedNote);
                  const noteInsideFolder =
                    normalizedSelectedNote === normalizedFolder ||
                    normalizedSelectedNote.startsWith(`${normalizedFolder}\\`);

                  if (noteInsideFolder) {
                    setSelectedNote(null);
                    setContent('');
                    setDraftContent('');
                    setIsEditing(false);
                    setIsDirty(false);
                    setIsRenaming(false);
                    setRenameValue('');
                  }
                }

                setSelectedFolder(null);
              } catch (deleteFolderError) {
                error(deleteFolderError);
              }
            }}
          >
            Delete Folder
          </button>
        )}
        <input
          type="text"
          value={searchQuery}
          onChange={event => {
            setSearchQuery(event.target.value);
          }}
          placeholder="Search notes..."
          className="text-input mb-sm"
        />
        <div className="tree-container">
          {!workspace ? (
            <div className="empty-state compact">
              <p>Select a workspace to begin.</p>
            </div>
          ) : searchResults !== null ? (
            renderedSearchResults
          ) : (
            renderedTree
          )}
        </div>
      </div>
      <div className="editor-pane">
        <div className="editor-toolbar">
          <div className="editor-title">
            {selectedNote
              ? `${selectedNote.split(/[\\/]/).pop() ?? selectedNote}${isDirty ? ' *' : ''}`
              : 'No note selected'}
          </div>
          <div className="inline-row">
            {selectedNote && (
              <button
                onClick={() => {
                  setIsRenaming(true);
                  setRenameValue(
                    selectedNote.split(/[\\/]/).pop()?.replace(/\.md$/i, '') ?? '',
                  );
                }}
              >
                Rename
              </button>
            )}
            <button
              disabled={!selectedNote}
              onClick={async () => {
                if (!selectedNote) return;

                const confirmDelete = window.confirm(
                  'Are you sure you want to delete this note?',
                );
                if (!confirmDelete) return;

                try {
                  await window.api.deleteNote(selectedNote);
                  setSelectedNote(null);
                  setContent('');
                  setDraftContent('');
                  setIsEditing(false);
                  setIsDirty(false);
                  setIsRenaming(false);
                  setRenameValue('');
                } catch (deleteNoteError) {
                  error(deleteNoteError);
                }
              }}
            >
              Delete
            </button>
            <button onClick={handleEditToggle} disabled={!selectedNote}>
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={() => void handleSave()} disabled={!selectedNote || !isEditing || !isDirty}>
              Save
            </button>
          </div>
        </div>
        {isRenaming && (
          <div className="inline-row mb-md">
            <input
              value={renameValue}
              onChange={event => setRenameValue(event.target.value)}
              className="text-input rename-input"
            />
            <button
              onClick={async () => {
                if (!selectedNote) return;
                const nextName = renameValue.trim();
                if (!nextName) return;

                try {
                  const newPath = await window.api.renameNote(selectedNote, nextName);
                  setSelectedNote(newPath);
                  setIsRenaming(false);
                  setRenameValue('');
                } catch (renameError) {
                  error(renameError);
                }
              }}
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setIsRenaming(false);
                setRenameValue('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
        <EditorContent
          hasWorkspace={Boolean(workspace)}
          selectedNote={selectedNote}
          isEditing={isEditing}
          content={content}
          draftContent={draftContent}
          onDraftChange={handleDraftChange}
        />
      </div>
    </main>
  );
}

export default App;
