# Smart Notes Desktop

Smart Notes Desktop is a privacy-first, offline-capable knowledge management application built with Electron, React, and TypeScript.

The goal of this project is to provide a modular foundation for an AI-assisted personal knowledge system that runs fully on the user's machine. The architecture is designed to support local semantic search and Retrieval-Augmented Generation (RAG) pipelines without mandatory cloud dependencies.

This repository focuses on building the core foundation layer before introducing AI components.

---

## Vision

Most modern knowledge tools depend heavily on cloud infrastructure. Smart Notes Desktop takes a different approach:

* Fully offline by default
* Local markdown-based storage
* Modular architecture for AI integration
* Privacy-focused design
* Swappable AI components

The AI layer is designed to sit on top of a stable local foundation, not replace it.

---

## Current Scope (Foundation Phase – 25%)

This prototype focuses only on core infrastructure:

* Electron desktop setup
* React + TypeScript renderer
* Local workspace selection
* Markdown file-based storage
* Folder watcher for real-time updates
* Sidebar note listing
* Clean modular architecture
* AI module placeholder (not yet implemented)

No LLM, embeddings, or vector database are included in this phase.

---

## Architecture Overview

The system is structured to maintain strict separation of concerns:

* Main Process
  Handles Electron lifecycle, filesystem access, and IPC communication.

* Renderer
  React-based UI layer responsible for workspace navigation and editor integration.

* Modules
  Encapsulated business logic organized by domain:

  * notes
  * storage
  * editor
  * search
  * ai (future layer)

* Shared
  Common types and utilities used across modules.

The AI layer will later integrate with:

* Local embedding models (Transformers.js)
* Local LLM backends (Ollama or llama.cpp)
* Hybrid retrieval pipeline

The foundation is intentionally lightweight and server-free.

---

## Technology Stack

Core technologies:

* Electron
* React
* TypeScript
* Vite

Planned AI Layer:

* Transformers.js (local embeddings)
* Ollama (local LLM inference)
* Hybrid retrieval (keyword + semantic search)

All AI components will be optional and modular.

---

## Design Principles

* Offline-first architecture
* No mandatory cloud calls
* Local markdown as source of truth
* Scalable for large note collections
* Modular AI integration
* Desktop-native experience
* Performance-aware design

This project avoids heavy server-based systems and prioritizes local computation.

---

## Project Structure

```
src/
 ├── main/
 ├── renderer/
 ├── modules/
 │     ├── notes/
 │     ├── storage/
 │     ├── editor/
 │     ├── search/
 │     └── ai/
 ├── shared/
 │     ├── types/
 │     └── utils/
```

This structure ensures long-term maintainability and future extensibility.

---
---

## Architecture Diagram

                        ┌──────────────────────────┐
                        │        Electron          │
                        │      (Main Process)      │
                        │--------------------------│
                        │ • App lifecycle          │
                        │ • Native menus           │
                        │ • File system access     │
                        │ • IPC bridge             │
                        └─────────────┬────────────┘
                                      │ IPC
                                      ▼
                        ┌──────────────────────────┐
                        │        Renderer          │
                        │    (React + TypeScript)  │
                        │--------------------------│
                        │ • Sidebar (notes list)   │
                        │ • Editor (TipTap)        │
                        │ • Search UI              │
                        └─────────────┬────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 │               Modules                   │
                 │-----------------------------------------│
                 │ notes     → note management logic       │
                 │ storage   → local markdown handling     │
                 │ search    → keyword + hybrid retrieval  │
                 │ editor    → editor integration          │
                 │ ai        → future AI layer (modular)   │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────┐
                        │     Local File System    │
                        │--------------------------│
                        │ • Markdown files (.md)   │
                        │ • Metadata (SQLite)      │
                        └──────────────────────────┘


Future AI Extension Layer (Planned)

        ┌────────────────────────────────────────────┐
        │            AI Services Layer               │
        │--------------------------------------------│
        │ Chunking → Embeddings → Vector Store       │
        │ Hybrid Retrieval (Keyword + Semantic)      │
        │ Ollama (Local LLM for RAG)                 │
        └────────────────────────────────────────────┘

**Note** 
- The architecture enforces a strict separation between application shell, UI, domain logic, and future AI services.
- The AI layer is designed as an optional extension that consumes indexed local data without altering the core storage system.

---

## Roadmap

Phase 1 – Foundation (Current)

* Workspace system
* Markdown loading
* Folder watching
* Editor integration
* Basic keyword search

Phase 2 – Semantic Layer

* Chunking strategy
* Embedding pipeline
* Vector indexing
* Hybrid retrieval

Phase 3 – Local RAG

* Ollama integration
* Context-aware answers
* Citation support

Phase 4 – Knowledge Intelligence

* Auto-link suggestions
* Knowledge graph exploration
* Smart context sidebar

---

## Development Setup

Install dependencies:

```
npm install
```

Run development build:

```
npm start
```

The application launches as a local Electron desktop app.

---

## Status

This is an early-stage architectural prototype focused on building a strong local-first foundation before introducing AI features.

The design prioritizes clean structure, modularity, and long-term scalability.

---
