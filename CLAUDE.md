# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Timer Desktop - A macOS menu bar timer application built with Electron 33, React 19, TypeScript, and Tailwind CSS 4. The app runs as a system tray application with a popover window for the timer UI.

## Development Commands

```bash
# Root directory commands (Electron + full app)
pnpm install          # Install all dependencies
pnpm dev              # Start Electron app with hot reload (runs electron-vite dev)
pnpm build            # Build for production
pnpm test             # Run main process + shared tests
pnpm test:watch       # Watch mode for main process tests
pnpm lint             # ESLint for all TypeScript files

# Renderer-specific commands (run from renderer/ directory)
cd renderer
pnpm install          # Install renderer dependencies
pnpm dev              # Start Vite dev server only (renderer)
pnpm test             # Run React component tests
pnpm test:watch       # Watch mode for renderer tests
pnpm dlx shadcn@latest add <component>  # Add shadcn/ui component
```

## Architecture

### Process Model (Electron)

```
┌─────────────────────────────────────────────────────────────┐
│ Main Process (main/)                                        │
│  ├── main.ts           Entry point, app lifecycle           │
│  ├── preload.ts        contextBridge API exposure           │
│  ├── tray/             TrayManager - system tray + popover  │
│  ├── timer/            TimerService - timer state machine   │
│  ├── ipc/              IPC handlers (timer, task)           │
│  ├── notification/     macOS notifications                  │
│  └── store/            TaskStore - electron-store persist   │
├─────────────────────────────────────────────────────────────┤
│ Shared (shared/)                                            │
│  └── types.ts          IPC_CHANNELS, TimerState, TaskRecord │
├─────────────────────────────────────────────────────────────┤
│ Renderer Process (renderer/src/)                            │
│  ├── App.tsx           Root component                       │
│  ├── hooks/useTimer.ts IPC bridge to TimerService           │
│  └── components/Timer/ Timer UI components                  │
└─────────────────────────────────────────────────────────────┘
```

### IPC Communication Pattern

**Renderer → Main** (invoke/handle):
- `timer:start`, `timer:pause`, `timer:resume`, `timer:stop`, `timer:reset`
- `task:save`, `task:getAll`, `task:delete`

**Main → Renderer** (send/on):
- `timer:tick` - Every second with TimerData
- `timer:stateChange` - State transitions
- `timer:complete` - Timer finished

### Timer State Machine

```
idle → running → overtime
  ↑       ↓         ↓
  └── paused ←──────┘
```

States: `'idle' | 'running' | 'paused' | 'overtime'`

## Key Conventions

### Import Paths
```typescript
// Renderer: use @/ alias
import { useTimer } from '@/hooks/useTimer'
import { Button } from '@/components/ui/button'

// Main/Shared: use relative paths
import { IPC_CHANNELS } from '../../shared/types'
```

### Styling
- Tailwind CSS 4 with OKLCH color tokens in `renderer/src/index.css`
- shadcn/ui "new-york" style with Radix UI primitives
- Dark mode via `.dark` class on document

### Testing
- **Main process**: Vitest in Node environment, tests in `__tests__/` folders
- **Renderer**: Vitest + jsdom + @testing-library/react
- Coverage threshold: 95% for statements, branches, functions, lines

## Build Output

```
dist/
├── main/      # Compiled main process
├── preload/   # Compiled preload script
└── renderer/  # Bundled React app
```
