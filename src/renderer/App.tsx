import React, { useEffect, useState } from 'react';
import type { NoteFile } from '../shared/types';

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteFile[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');

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

    const refreshNotes = async () => {
      const files = await window.api.getNotes(workspace);
      setNotes(files);
    };

    void refreshNotes();
    const unsubscribe = window.api.onWorkspaceUpdated(() => {
      void refreshNotes();
    });

    return () => {
      unsubscribe();
    };
  }, [workspace]);

  const handleSelectWorkspace = async () => {
    const path = await window.api.selectWorkspace();
    if (path) {
      setWorkspace(path);
    }
  };

  const handleSelectNote = async (filePath: string) => {
    setSelectedNote(filePath);
    const noteContent = await window.api.readNote(filePath);
    setContent(noteContent ?? '');
  };

  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
        <button onClick={handleSelectWorkspace} style={{ width: '100%', marginBottom: '10px' }}>
          Select Workspace
        </button>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          {workspace ?? 'No workspace selected'}
        </p>
        <div>
          {notes.map(note => (
            <div
              key={note.path}
              onClick={() => handleSelectNote(note.path)}
              style={{
                cursor: 'pointer',
                padding: '8px',
                backgroundColor: selectedNote === note.path ? '#e0e0e0' : 'transparent',
                borderRadius: '4px',
                marginBottom: '4px',
              }}
            >
              {note.name}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{content}</pre>
      </div>
    </main>
  );
}

export default App;
