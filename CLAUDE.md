# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Timer Desktop - A desktop timer application built with React 19, TypeScript, Vite 7, and Tailwind CSS 4. Uses shadcn/ui components with the "new-york" style.

## Development Commands

All commands must be run from the `renderer/` directory:

```bash
cd renderer

# Install dependencies
pnpm install

# Start development server with HMR
pnpm dev

# Type check and build for production
pnpm build

# Run ESLint
pnpm lint

# Preview production build
pnpm preview
```

## Project Architecture

```
renderer/                  # Main application directory
├── src/
│   ├── main.tsx          # Application entry point (React StrictMode)
│   ├── App.tsx           # Root component
│   ├── index.css         # Global styles, Tailwind config, CSS variables (light/dark themes)
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   └── lib/
│       └── utils.ts      # Utility functions (cn helper for className merging)
├── components.json        # shadcn/ui configuration
└── vite.config.ts        # Vite configuration with path aliases
```

## Key Conventions

### Import Path Alias
Use `@/` alias for imports from `src/`:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

### Adding shadcn/ui Components
```bash
cd renderer
pnpm dlx shadcn@latest add <component-name>
```

### Styling
- Tailwind CSS 4 with CSS variables for theming
- Dark mode: Add `.dark` class to enable dark theme
- Color tokens defined in `src/index.css` using OKLCH color space
- Use `cn()` utility for conditional class merging

### TypeScript
- Strict mode enabled
- Target: ES2022
- Path aliases configured in both `tsconfig.json` and `vite.config.ts`
