import React, { useEffect, useState } from 'react';
import type { FileNode } from '../shared/types';
import TreeNode from './components/TreeNode';

function App() {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
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
    }
  };

  const handleSelectNote = async (filePath: string) => {
    console.log('Clicked:', filePath);
    setSelectedNote(filePath);

    try {
      const noteContent = await window.api.readNote(filePath);
      console.log('Loaded content:', noteContent);
      setContent(noteContent ?? '');
    } catch (error) {
      console.error('Failed to read note:', error);
      setContent('');
    }
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
          {tree.map(node => (
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
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{content}</pre>
      </div>
    </main>
  );
}

export default App;
