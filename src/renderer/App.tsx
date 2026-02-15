import React, { useEffect, useState } from 'react';
import type { FileNode, NoteSearchResult } from '../shared/types';
import TreeNode from './components/TreeNode';
import { renderMarkdown } from './utils/markdown';

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
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

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

  const handleSelectWorkspace = async () => {
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
  };

  const handleSelectNote = async (filePath: string) => {
    console.log('Clicked:', filePath);

    try {
      const noteContent = await window.api.readNote(filePath);
      console.log('Loaded content:', noteContent);
      const resolvedContent = noteContent ?? '';
      setSelectedNote(filePath);
      setSelectedFolder(filePath.replace(/[\\/][^\\/]+$/, ''));
      setContent(resolvedContent);
      setDraftContent(resolvedContent);
      setIsDirty(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to read note:', error);
      setSelectedNote(filePath);
      setSelectedFolder(filePath.replace(/[\\/][^\\/]+$/, ''));
      setContent('');
      setDraftContent('');
      setIsDirty(false);
      setIsEditing(false);
    }
  };

  const handleSelectFolder = (folderPath: string) => {
    setSelectedFolder(folderPath);
    setSelectedNote(null);
    setContent('');
    setDraftContent('');
    setIsEditing(false);
    setIsDirty(false);
    setIsRenaming(false);
    setRenameValue('');
  };

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

  const handleSave = async () => {
    if (!selectedNote || !isEditing || !isDirty) return;

    try {
      await window.api.writeNote(selectedNote, draftContent);
      setContent(draftContent);
      setIsDirty(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleSearchChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const value = event.target.value;
    setSearchQuery(value);

    if (!value.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const results = await window.api.searchNotes(value);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search notes:', error);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draftContent, selectedNote, isEditing, isDirty]);

  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
        <button onClick={handleSelectWorkspace} style={{ width: '100%', marginBottom: '10px' }}>
          Select Workspace
        </button>
        <button
          onClick={() => setShowNewNoteInput(true)}
          style={{ width: '100%', marginBottom: '10px' }}
          disabled={!workspace}
        >
          + New Note
        </button>
        <button
          onClick={() => setShowNewFolderInput(true)}
          style={{ width: '100%', marginBottom: '10px' }}
          disabled={!workspace}
        >
          + New Folder
        </button>
        {showNewFolderInput && (
          <div style={{ marginBottom: '8px', display: 'flex', gap: '6px' }}>
            <input
              value={newFolderName}
              onChange={event => setNewFolderName(event.target.value)}
              placeholder="Enter folder name"
              style={{ flex: 1, boxSizing: 'border-box' }}
            />
            <button
              onClick={async () => {
                if (!newFolderName.trim()) return;
                if (!workspace) return;

                try {
                  const targetFolder = selectedFolder ?? workspace;
                  await window.api.createFolder(newFolderName.trim(), targetFolder);
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                } catch (error) {
                  console.error(error);
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
          <div style={{ marginBottom: '8px', display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Enter note name"
              value={newNoteName}
              onChange={event => setNewNoteName(event.target.value)}
              style={{ flex: 1, boxSizing: 'border-box' }}
            />
            <button
              onClick={async () => {
                if (!newNoteName.trim()) return;
                if (!workspace) return;

                try {
                  const targetFolder = selectedFolder ?? workspace;
                  const newPath = await window.api.createNote(newNoteName.trim(), targetFolder);
                  setShowNewNoteInput(false);
                  setNewNoteName('');
                  await handleSelectNote(newPath);
                  setIsEditing(true);
                  setDraftContent('');
                  setIsDirty(false);
                } catch (error) {
                  console.error(error);
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
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          {workspace ?? 'No workspace selected'}
        </p>
        <div style={{ fontSize: '12px', color: '#444', marginBottom: '8px' }}>
          Current Folder:{' '}
          <strong>
            {workspace
              ? selectedFolder
                ? selectedFolder === workspace
                  ? 'Workspace Root'
                  : selectedFolder
                      .replace(`${workspace}\\`, '')
                      .replace(`${workspace}/`, '')
                : 'Workspace Root'
              : 'Workspace Root'}
          </strong>
        </div>
        <button
          style={{ width: '100%', marginBottom: '10px' }}
          disabled={!workspace || !selectedFolder || selectedFolder === workspace}
          onClick={async () => {
            if (!workspace || !selectedFolder || selectedFolder === workspace) {
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
            } catch (error) {
              console.error(error);
            }
          }}
        >
          Delete Folder
        </button>
        <input
          type="text"
          value={searchQuery}
          onChange={event => {
            void handleSearchChange(event);
          }}
          placeholder="Search notes..."
          style={{ width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <div>
          {searchResults !== null
            ? searchResults.map(note => (
                <div
                  key={note.path}
                  onClick={() => void handleSelectNote(note.path)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 8px',
                    backgroundColor: selectedNote === note.path ? '#e0e0e0' : 'transparent',
                    borderRadius: '4px',
                    marginBottom: '2px',
                  }}
                >
                  {note.name}
                </div>
              ))
            : tree.map(node => (
                <TreeNode
                  key={node.path}
                  node={node}
                  onSelect={handleSelectNote}
                  onSelectFolder={handleSelectFolder}
                  selectedPath={selectedNote}
                  selectedFolderPath={selectedFolder}
                  depth={0}
                />
              ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', color: '#444' }}>
            {selectedNote
              ? `${selectedNote.split(/[\\/]/).pop() ?? selectedNote}${isDirty ? ' *' : ''}`
              : 'No note selected'}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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
                } catch (error) {
                  console.error(error);
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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              value={renameValue}
              onChange={event => setRenameValue(event.target.value)}
              style={{ minWidth: '240px', boxSizing: 'border-box' }}
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
                } catch (error) {
                  console.error(error);
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
        {isEditing ? (
          <textarea
            value={draftContent}
            onChange={event => {
              setDraftContent(event.target.value);
              setIsDirty(event.target.value !== content);
            }}
            style={{
              width: '100%',
              minHeight: 'calc(100vh - 140px)',
              resize: 'none',
              fontFamily: 'monospace',
              fontSize: '14px',
              boxSizing: 'border-box',
              padding: '12px',
            }}
          />
        ) : (
          <div
            className="markdown-content"
            style={{ padding: '16px' }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}
      </div>
    </main>
  );
}

export default App;
