# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **interactive playground for the json-render framework** - an educational Next.js application demonstrating AI-driven UI generation using JSON trees. The app serves as both a learning tool and a working example of how to build dynamic, data-driven interfaces.

## Development Commands

```bash
# Install dependencies (Bun is used as package manager)
bun install

# Start development server (http://localhost:3000)
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run linter
bun run lint
```

## Architecture: json-render Framework

This application demonstrates the **json-render** pattern - a declarative UI system where the entire interface is represented as serializable JSON that can be mutated via patches.

### Core Concepts

**1. UITree Structure**
The UI is stored as a flat map of elements, not nested JSX:
```typescript
{
  root: "root",        // Key of the root element
  elements: {
    "root": {
      key: "root",
      type: "Stack",
      props: { direction: "vertical" },
      children: ["header", "content"],  // Child keys by reference
      parentKey: null
    }
  }
}
```

**2. Component Registry**
All UI components are registered in `/src/components/ui/index.ts` as a `componentRegistry` object mapping JSON `type` strings to React components. This enables dynamic rendering from JSON.

**3. JSONL Patches**
UI mutations happen via JSON Lines patches (one JSON object per line):
```json
{"op":"replace","path":"/elements/heading/props/text","value":"New Title"}
{"op":"add","path":"/elements/new-button","value":{...}}
{"op":"remove","path":"/elements/old-element"}
```

Supported operations: `set`, `add`, `replace`, `remove`

**4. Data Binding (JSON Pointer)**
Components bind to application data using RFC 6901 JSON Pointer paths:
- `/analytics/revenue` - Access nested data
- `/form/email` - Two-way binding for form inputs

Hooks: `useData()`, `useDataValue()`, `useDataBinding()`, `set()`

**5. Actions as Guardrails**
Instead of AI generating arbitrary code, actions are declared by name:
```json
{
  "type": "Button",
  "props": {
    "action": { "name": "exportData", "params": { "format": "json" } }
  }
}
```
The app provides implementations in `/src/lib/mockData.ts`.

**6. Catalog (Schema Definition)**
The catalog (`/src/lib/catalog.ts`) defines available components, actions, and validation functions using Zod schemas. This acts as a guardrail for AI generation.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main playground application (521 lines) with provider stack |
| `src/components/ui/index.ts` | Component registry mapping types to React components |
| `src/lib/catalog.ts` | Zod schemas defining available components/actions |
| `src/lib/mockPatches.ts` | Initial UI tree as JSONL patches |
| `src/lib/mockData.ts` | Initial application data and action handlers |
| `src/lib/patchUtils.ts` | Patch parsing and application utilities |
| `docs/json-render-docs.md` | Comprehensive framework documentation |

## Provider Stack

The app uses nested providers from `@json-render/react`:

```
DataProvider       → Manages application data state
  ↓
VisibilityProvider → Handles conditional rendering based on data/auth
  ↓
ValidationProvider → Manages form field validation state
  ↓
ActionProvider     → Handles named action execution with loading states
  ↓
Renderer           → Renders UITree using component registry
```

## Component Props Pattern

All registered components receive:
```typescript
{
  element: {
    key: string,
    type: string,
    props: Record<string, unknown>,
    children?: string[],  // Array of child element keys
    parentKey?: string | null,
    visible?: VisibilityCondition
  },
  children?: ReactNode,
  onAction?: (action: Action) => void
}
```

## Adding New Components

1. Create component in `src/components/ui/` following the props pattern above
2. Add Zod schema to `src/lib/catalog.ts` under `components`
3. Register in `src/components/ui/index.ts` componentRegistry

## Known Issues

**Google Fonts in Network-Restricted Environments**
The app uses `next/font/google` which requires network access. For offline builds, switch to `next/font/local` in `src/app/layout.tsx` or remove the font import.

## Testing

No test framework is currently configured. This is a demonstrative/educational project.

## Useful Resources

- Troubleshooting: `docs/troubleshooting-nextjs-hydration-and-update-depth.md`
- json-render skill: `.claude/skills/json-render/SKILL.md`
