import { useState } from 'react';
import type { FileNode } from '../../shared/types';

type Props = {
  node: FileNode;
  onSelect: (path: string) => void;
  onSelectFolder: (path: string) => void;
  selectedPath: string | null;
  selectedFolderPath: string | null;
  depth?: number;
};

export default function TreeNode({
  node,
  onSelect,
  onSelectFolder,
  selectedPath,
  selectedFolderPath,
  depth = 0,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (node.type === 'folder') {
    return (
      <div>
        <div
          onClick={() => {
            setExpanded(!expanded);
            onSelectFolder(node.path);
          }}
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            padding: '4px 6px',
            paddingLeft: `${depth * 16 + 6}px`,
            borderRadius: '4px',
            backgroundColor: selectedFolderPath === node.path ? '#e0e0e0' : 'transparent',
          }}
        >
          [Folder] {node.name}
        </div>

        {expanded &&
          node.children?.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              onSelectFolder={onSelectFolder}
              selectedPath={selectedPath}
              selectedFolderPath={selectedFolderPath}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(node.path)}
      style={{
        cursor: 'pointer',
        padding: '6px 8px',
        paddingLeft: `${(depth + 1) * 16 + 8}px`,
        backgroundColor: selectedPath === node.path ? '#e0e0e0' : 'transparent',
        borderRadius: '4px',
        marginBottom: '2px',
      }}
    >
      [Note] {node.name}
    </div>
  );
}
