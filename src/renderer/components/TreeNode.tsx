import React from 'react';
import type { FileNode } from '../../shared/types';

type Props = {
  node: FileNode;
  onSelect: (path: string) => void;
  onSelectFolder: (path: string) => void;
  onToggleFolder: (path: string) => void;
  expandedFolders: Set<string>;
  selectedPath: string | null;
  selectedFolderPath: string | null;
  depth?: number;
};

const TreeNode = React.memo(function TreeNode({
  node,
  onSelect,
  onSelectFolder,
  onToggleFolder,
  expandedFolders,
  selectedPath,
  selectedFolderPath,
  depth = 0,
}: Props) {
  if (node.type === 'folder') {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFolderPath === node.path;

    return (
      <div>
        <div
          onClick={() => {
            onToggleFolder(node.path);
            onSelectFolder(node.path);
          }}
          className={`folder-item${isSelected ? ' active' : ''}`}
          style={{
            paddingLeft: `${depth * 16 + 6}px`,
          }}
        >
          [{isExpanded ? '-' : '+'}] {node.name}
        </div>

        {isExpanded &&
          node.children?.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              onSelect={onSelect}
              onSelectFolder={onSelectFolder}
              onToggleFolder={onToggleFolder}
              expandedFolders={expandedFolders}
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
      className={`note-item${selectedPath === node.path ? ' active' : ''}`}
      style={{
        paddingLeft: `${(depth + 1) * 16 + 8}px`,
      }}
    >
      [Note] {node.name}
    </div>
  );
}, areEqual);

function areEqual(previous: Props, next: Props): boolean {
  if (previous.node !== next.node) {
    return false;
  }

  if (previous.depth !== next.depth) {
    return false;
  }

  if (previous.onSelect !== next.onSelect) {
    return false;
  }

  if (previous.onSelectFolder !== next.onSelectFolder) {
    return false;
  }

  if (previous.onToggleFolder !== next.onToggleFolder) {
    return false;
  }

  const previousIsExpanded = previous.expandedFolders.has(previous.node.path);
  const nextIsExpanded = next.expandedFolders.has(next.node.path);
  if (previousIsExpanded !== nextIsExpanded) {
    return false;
  }

  if (previous.node.type === 'folder') {
    const previousIsSelected = previous.selectedFolderPath === previous.node.path;
    const nextIsSelected = next.selectedFolderPath === next.node.path;
    return previousIsSelected === nextIsSelected;
  }

  const previousIsSelected = previous.selectedPath === previous.node.path;
  const nextIsSelected = next.selectedPath === next.node.path;
  return previousIsSelected === nextIsSelected;
}

export default TreeNode;
