import React from 'react';
import type { FileNode } from '../../shared/types';

type Props = {
  node: FileNode;
  workspacePath: string;
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
  workspacePath,
  onSelect,
  onSelectFolder,
  onToggleFolder,
  expandedFolders,
  selectedPath,
  selectedFolderPath,
  depth = 0,
}: Props) {
  if (node.type === 'folder') {
    const isRoot = node.path === workspacePath;
    const isExpanded = isRoot || expandedFolders.has(node.path);
    const isSelected =
      (isRoot && selectedFolderPath === null && selectedPath === null) ||
      selectedFolderPath === node.path;

    return (
      <div>
        <div
          onClick={() => {
            if (!isRoot) {
              onToggleFolder(node.path);
            }
            onSelectFolder(node.path);
          }}
          className={`folder-item${isSelected ? ' active' : ''}${isRoot ? ' root-folder' : ''}`}
          style={{
            paddingLeft: `${depth * 16 + 6}px`,
          }}
        >
          {isRoot ? '[Root]' : `[${isExpanded ? '-' : '+'}]`} {node.name}
        </div>

        {isExpanded &&
          node.children?.map(child => (
            <TreeNode
              key={child.path}
              node={child}
              workspacePath={workspacePath}
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

  if (previous.workspacePath !== next.workspacePath) {
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

  if (previous.node.type === 'folder') {
    const previousIsRoot = previous.node.path === previous.workspacePath;
    const nextIsRoot = next.node.path === next.workspacePath;
    if (previousIsRoot !== nextIsRoot) {
      return false;
    }

    if (!previousIsRoot) {
      const previousIsExpanded = previous.expandedFolders.has(previous.node.path);
      const nextIsExpanded = next.expandedFolders.has(next.node.path);
      if (previousIsExpanded !== nextIsExpanded) {
        return false;
      }
    }

    const previousIsSelected = previousIsRoot
      ? previous.selectedFolderPath === null && previous.selectedPath === null
      : previous.selectedFolderPath === previous.node.path;
    const nextIsSelected = nextIsRoot
      ? next.selectedFolderPath === null && next.selectedPath === null
      : next.selectedFolderPath === next.node.path;
    return previousIsSelected === nextIsSelected;
  }

  const previousIsSelected = previous.selectedPath === previous.node.path;
  const nextIsSelected = next.selectedPath === next.node.path;
  return previousIsSelected === nextIsSelected;
}

export default TreeNode;
