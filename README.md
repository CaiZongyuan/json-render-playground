## nextjs-json-render

**English | [中文](README-zh.md)**

Interactive playground for learning **json-render** in a real Next.js app.

**json-render**: [https://github.com/vercel-labs/json-render](https://github.com/vercel-labs/json-render)

This repo focuses on the core concepts you’ll use in json-render projects:
- **UI Tree** (`UITree`): `root` + flat `elements` map
- **Components registry**: map `type -> React component`
- **JSONL patches**: mutate the tree with `set/add/replace/remove`
- **Data binding**: read/write via JSON Pointer paths (e.g. `/form/email`)
- **Validation**: field checks + validation state debugging
- **Actions**: named actions handled by your app, with execution logging

---

## Quick Start

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

---

## How the Playground Works

The UI is a 3-column layout:
- **Left**: patch editor + “Add” builder + learning panels (Data/Validation/Actions)
- **Middle**: **Live preview** (renders the current tree)
- **Right**: **JSON tree viewer** (elements collapsed by default)

Use the panel buttons above **Live preview** to **hide/show** the Playground or JSON panel.

---

## Screenshots

**Live preview + Playground**

![Live preview + Playground](assets/images/playground01.png)

**Live preview + JSON tree**

![Live preview + JSON tree](assets/images/playground02.png)

**Playground + Live preview + JSON tree**

![Playground + Live preview + JSON tree](assets/images/playground03.png)

---

## JSONL Patches (Supported Ops)

The editor accepts **JSON Lines** (one JSON object per line).
- Empty lines and lines starting with `//` are ignored.
- Supported ops: `set`, `add`, `replace`, `remove`

Paths you’ll commonly use:
- `/root` (string) — sets the root element key
- `/elements/{key}` — adds/replaces a whole element
- `/elements/{key}/props/...` — updates a nested prop
- `/elements/{key}/children` — replaces the children array (recommended)

Example: replace a heading
```json
{"op":"replace","path":"/elements/main-heading/props/text","value":"Hello from patches!"}
```

Example: add a `Text` element and append it to `root.children`
```json
{"op":"add","path":"/elements/demo-text","value":{"key":"demo-text","type":"Text","props":{"content":"(Added) This is a new Text element","variant":"muted"},"parentKey":"root"}}
{"op":"replace","path":"/elements/root/children","value":["page-header","alert-section","metrics-grid","charts-grid","forms-section","data-table-section","actions-section","divider-demo","list-demo","demo-text"]}
```

Notes:
- `remove` removes an element key (and in this demo also removes its descendants + cleans up dangling references).
- When removing an element referenced by a parent, you generally also patch the parent `children` (or use the demo’s subtree-remove behavior).

---

## Actions

Buttons can declare actions by name (and optional params):
```json
{
  "type": "Button",
  "props": {
    "label": "Export (JSON)",
    "variant": "secondary",
    "action": { "name": "exportData", "params": { "format": "json" } }
  }
}
```

Actions are handled by app code (`src/lib/mockData.ts`), and the Playground logs:
- action name
- params
- status (running/success/error)

Try it:
1. Click **Add action button (example)** in the Playground.
2. Click the new button in the UI.
3. Check the **Actions (execution log)** panel.

---

## Data Binding + Validation

Components like `TextField`, `Select`, and `DatePicker` bind to data using JSON Pointer paths (e.g. `/form/email`).

The Playground includes:
- **Data panel**: set any path/value to see live updates
- **Validation panel**: view field validation state and run `Validate all`

Try it:
1. Use the Data panel to set `/form/email` to `"bad-email"`.
2. Focus/blur the email field (or use **Validate all**).
3. See validation errors in the UI + the Validation panel.

---

## Repo Pointers

- UI page: `src/app/page.tsx`
- Component registry: `src/components/ui/index.ts`
- Patch utilities + examples: `src/lib/patchUtils.ts`
- Demo initial tree: `src/lib/mockPatches.ts`
- Demo data/actions: `src/lib/mockData.ts`
- Troubleshooting notes: `docs/troubleshooting-nextjs-hydration-and-update-depth.md`
