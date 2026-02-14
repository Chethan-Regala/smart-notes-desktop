export type FileNode = {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
};

export type NoteSearchResult = {
  name: string;
  path: string;
};
