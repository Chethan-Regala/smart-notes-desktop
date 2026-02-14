import { useState } from 'react';
import type { FileNode } from '../../shared/types';

type Props = {
  node: FileNode;
  onSelect: (path: string) => void;
  selectedPath: string | null;
};

export default function TreeNode({ node, onSelect, selectedPath }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (node.type === 'folder') {
    return (
      <div style={{ marginLeft: '12px' }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: 'pointer', fontWeight: 'bold', padding: '4px 0' }}
        >
          📁 {node.name}
        </div>

        {expanded &&
          node.children?.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(node.path)}
      style={{
        marginLeft: '24px',
        cursor: 'pointer',
        padding: '6px 8px',
        backgroundColor: selectedPath === node.path ? '#e0e0e0' : 'transparent',
        borderRadius: '4px',
        marginBottom: '2px',
      }}
    >
      📄 {node.name}
    </div>
  );
}
