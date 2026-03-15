# Smart Notes Desktop

Smart Notes Desktop is an offline-first desktop notes application built with Electron, React, TypeScript, and Vite. It uses local Markdown files as the source of truth and is designed for people who want a lightweight, private workspace without relying on a cloud backend.

The project has moved beyond the initial scaffold stage and now includes a working desktop experience for selecting a workspace, browsing folders, creating and editing notes, searching across Markdown content, and automatically reacting to filesystem changes.

## Highlights

- Offline-first local notes app
- Markdown files stored directly in your own workspace folder
- Folder tree with nested folders and notes
- Create, rename, edit, save, and delete notes
- Create and delete folders
- Live workspace refresh with filesystem watching
- Search across note names and note content
- Markdown preview mode with plain-text editing mode
- Saved workspace path between sessions
- Secure Electron setup with `contextIsolation` and preload-based IPC

## Current Product State

The current version is a functional desktop knowledge workspace focused on solid local note management fundamentals.

What is implemented today:

- Workspace selection through a native folder picker
- Persistent workspace restore on next launch
- Recursive workspace tree generation for `.md` files and folders
- Note reading and writing through Electron IPC
- Folder and note creation inside the active workspace
- Note renaming with workspace path validation
- Note and folder deletion with safety checks
- Debounced live refresh when files change on disk
- Search by filename, basename, and note content
- Light and dark UI modes
- Keyboard save shortcut with `Ctrl+S` / `Cmd+S`

What is not in the project yet:

- Rich text editor
- Tags, backlinks, or graph view
- Full-text indexing engine
- AI, embeddings, vector search, or RAG workflows
- Automated test suite

## Tech Stack

- Electron 40
- React 19
- TypeScript 5
- Vite 7
- Electron Forge
- `chokidar` for workspace watching
- `electron-store` for local app persistence
- `markdown-it` for Markdown rendering

## How It Works

Smart Notes Desktop treats a user-selected local folder as the workspace root.

Inside that workspace:

- folders are displayed as a recursive tree
- Markdown files are treated as notes
- note content is read directly from disk
- edits are written back to the same file
- external filesystem changes trigger a UI refresh

The main process owns filesystem access and exposes a narrow IPC API through the preload script. The renderer stays focused on the UI, state management, search interactions, and Markdown viewing/editing.

## Architecture

```text
src/
|-- main/
|   `-- main.ts              # Electron window lifecycle and IPC handlers
|-- modules/
|   `-- storage/
|       |-- notes.ts         # Workspace tree, note CRUD, search, folder CRUD
|       |-- watcher.ts       # Chokidar-based workspace watcher
|       `-- workspace.ts     # Workspace validation
|-- renderer/
|   |-- App.tsx              # Main desktop UI and app state
|   |-- components/
|   |   `-- TreeNode.tsx     # Recursive workspace tree renderer
|   `-- utils/
|       |-- markdown.ts      # Markdown rendering
|       `-- logger.ts        # Development logging helpers
|-- shared/
|   `-- types.ts             # Shared file tree and search result types
`-- preload.ts               # Secure renderer API bridge
```

### Main process responsibilities

- manage the Electron app lifecycle
- open the native workspace picker
- validate workspace access
- handle note and folder IPC operations
- persist the last selected workspace
- broadcast workspace change events

### Renderer responsibilities

- render the sidebar and editor UI
- manage selected workspace, note, folder, and draft state
- perform search interactions
- handle edit/save/rename/delete flows
- switch between preview and editing modes

## Security and File Safety

The app already includes a few important safety measures:

- renderer code does not get direct Node.js access
- `contextIsolation` is enabled
- all filesystem access goes through preload-exposed IPC handlers
- note writes, renames, creates, and deletes are validated against the active workspace
- only Markdown files are treated as editable notes
- hidden files and folders are ignored in the tree and watcher

## Development

### Prerequisites

- Node.js 20 or newer is recommended
- npm

### Install dependencies

```bash
npm install
```

### Start the desktop app in development

```bash
npm start
```

### Lint the codebase

```bash
npm run lint
```

### Package the application

```bash
npm run package
```

### Build distributables

```bash
npm run make
```

## Packaging

The project uses Electron Forge with Vite and is configured for:

- Windows via Squirrel
- macOS via ZIP
- Linux via Deb and RPM

Electron fuses are also configured to reduce unnecessary runtime surface area in packaged builds.

## Project Direction

The current milestone is a clean, reliable local notes foundation. The next logical improvements are:

1. Better editor ergonomics and note metadata
2. More capable search and navigation
3. Quality improvements such as tests and error-state polish
4. Optional local AI features on top of the existing Markdown workspace model

## License

MIT
