import React, { useEffect, useState } from 'react';
import type { FileNode, NoteSearchResult } from '../shared/types';
import TreeNode from './components/TreeNode';
import { renderMarkdown } from './utils/markdown';

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NoteSearchResult[] | null>(null);

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

  const handleSelectWorkspace = async () => {
    const path = await window.api.selectWorkspace();
    if (path) {
      setWorkspace(path);
      setSelectedNote(null);
      setContent('');
      setDraftContent('');
      setIsDirty(false);
      setIsEditing(false);
      setSearchQuery('');
      setSearchResults(null);
    }
  };

  const handleSelectNote = async (filePath: string) => {
    console.log('Clicked:', filePath);

    try {
      const noteContent = await window.api.readNote(filePath);
      console.log('Loaded content:', noteContent);
      const resolvedContent = noteContent ?? '';
      setSelectedNote(filePath);
      setContent(resolvedContent);
      setDraftContent(resolvedContent);
      setIsDirty(false);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to read note:', error);
      setSelectedNote(filePath);
      setContent('');
      setDraftContent('');
      setIsDirty(false);
      setIsEditing(false);
    }
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
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          {workspace ?? 'No workspace selected'}
        </p>
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
                  selectedPath={selectedNote}
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
            <button onClick={handleEditToggle} disabled={!selectedNote}>
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={() => void handleSave()} disabled={!selectedNote || !isEditing || !isDirty}>
              Save
            </button>
          </div>
        </div>
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
