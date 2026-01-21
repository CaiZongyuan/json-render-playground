---
name: json-render
description: AI-driven UI generation framework using JSON trees. Use for building dynamic interfaces with Catalog (component/action definitions), Components (React registry), Streaming (JSONL patches), Data Binding (JSON Pointer paths), Actions (named handlers), Visibility (conditional rendering), and Validation (form inputs).
---

# json-render Skills

## Catalog

The catalog defines what AI can generate. It's your guardrail.

### What is a Catalog?

A catalog is a schema that defines:
- **Components** — UI elements AI can create
- **Actions** — Operations AI can trigger
- **Validation Functions** — Custom validators for form inputs

### Creating a Catalog

```javascript
import { createCatalog } from '@json-render/core';
import { z } from 'zod';

const catalog = createCatalog({
  components: {
    // Define each component with its props schema
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable(),
        padding: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      hasChildren: true, // Can contain other components
    },

    Metric: {
      props: z.object({
        label: z.string(),
        valuePath: z.string(), // JSON Pointer to data
        format: z.enum(['currency', 'percent', 'number']),
      }),
    },
  },

  actions: {
    submit_form: {
      params: z.object({
        formId: z.string(),
      }),
      description: 'Submit a form',
    },

    export_data: {
      params: z.object({
        format: z.enum(['csv', 'pdf', 'json']),
      }),
    },
  },

  validationFunctions: {
    isValidEmail: {
      description: 'Validates email format',
    },
    isPhoneNumber: {
      description: 'Validates phone number',
    },
  },
});
```

### Component Definition

Each component in the catalog has:

```javascript
{
  props: z.object({...}),  // Zod schema for props
  hasChildren?: boolean,    // Can it have children?
  description?: string,     // Help AI understand when to use it
}
```

### Generating AI Prompts

Use `generateCatalogPrompt` to create a system prompt for AI:

```javascript
import { generateCatalogPrompt } from '@json-render/core';

const systemPrompt = generateCatalogPrompt(catalog);
// Pass this to your AI model as the system prompt
```

---

## Components

Register React components to render your catalog types.

### Component Registry

Create a registry that maps catalog component types to React components:

```javascript
const registry = {
  Card: ({ element, children }) => (
    <div className="card">
      <h2>{element.props.title}</h2>
      {element.props.description && (
        <p>{element.props.description}</p>
      )}
      {children}
    </div>
  ),

  Button: ({ element, onAction }) => (
    <button onClick={() => onAction?.(element.props.action)}>
      {element.props.label}
    </button>
  ),
};
```

### Component Props

Each component receives these props:

```javascript
import type { Action, VisibilityCondition } from '@json-render/core';

interface ComponentProps {
  element: {
    key: string;
    type: string;
    props: Record<string, unknown>;
    children?: string[]; // Array of child element keys
    parentKey?: string | null;
    visible?: VisibilityCondition;
  };
  children?: React.ReactNode;  // Rendered children
  onAction?: (action: Action) => void;
}
```

### Using Data Binding

Use hooks to read and write data:

```javascript
import { useDataValue, useDataBinding } from '@json-render/react';

const Metric = ({ element }) => {
  // Read-only value
  const value = useDataValue(element.props.valuePath);

  return (
    <div className="metric">
      <span className="label">{element.props.label}</span>
      <span className="value">{formatValue(value)}</span>
    </div>
  );
};

const TextField = ({ element }) => {
  // Two-way binding
  const [value, setValue] = useDataBinding(element.props.valuePath);

  return (
    <input
      value={value || ''}
      onChange={(e) => setValue(e.target.value)}
      placeholder={element.props.placeholder}
    />
  );
};
```

### Using the Renderer

```javascript
import { Renderer } from '@json-render/react';

function App() {
  return (
    <Renderer
      tree={uiTree}
      registry={registry}
    />
  );
}
```

---

## Streaming (JSONL Patches)

Stream UI generation progressively by returning **JSONL** (JSON Lines) where each line is a `JsonPatch`.

This is the format consumed by `useUIStream()` in `@json-render/react`.

### useUIStream

`useUIStream` sends a `POST` to your API with:
- `prompt` — the user prompt
- `context` — optional extra context you pass in
- `currentTree` — the current `UITree` so the server can incrementally update

```javascript
import { Renderer, useUIStream } from '@json-render/react';

function App() {
  const { tree, isStreaming, error, send, clear } = useUIStream({
    api: '/api/generate',
    onComplete: (finalTree) => console.log('done', finalTree),
    onError: (err) => console.error(err),
  });

  return (
    <div>
      <button onClick={() => send('Create a dashboard')}>Generate</button>
      <button onClick={clear} disabled={isStreaming}>Clear</button>
      {error && <pre>{String(error.message)}</pre>}
      <Renderer tree={tree} registry={registry} />
    </div>
  );
}
```

### Patch Shape

Each line is parsed independently. Empty lines and lines starting with `//` are ignored.

```json
{"op":"set","path":"/root","value":"page"}
{"op":"add","path":"/elements/page","value":{"key":"page","type":"Stack","props":{"direction":"vertical","gap":"lg"},"children":["title"]}}
{"op":"add","path":"/elements/title","value":{"key":"title","type":"Heading","props":{"text":"Dashboard","level":1}}}
```

### Server Response Requirements

Your API should return a streaming response body where:
- Each patch is a single JSON object on its own line (JSONL)
- Lines are separated by `\n`
- The response is not buffered (so the client receives patches progressively)

### Supported Paths

The streamed patches update a **flat** `UITree`:
- `/root` — sets `UITree.root` (the root element key, a string)
- `/elements/{key}` — sets an entire `UIElement`
- `/elements/{key}/...` — sets a nested property within that element (for example `/elements/title/props/text`)

### Operations: set / add / replace / remove

`@json-render/react` currently applies patches with these semantics:
- `set`, `add`, `replace` — treated the same: **set** the value at the path (for `/elements/...` subpaths this uses a JSON-Pointer-like traversal)
- `remove` — only supports removing an element by key: `{"op":"remove","path":"/elements/{key}"}`

This is intentionally simpler than RFC 6902 JSON Patch. In particular, `add` does **not** mean “append to an array”.

### Gotchas

- `remove` does not automatically remove the key from any parent `children` arrays; patch the parent `children` too.
- If you `remove` the current root element, also `set` `/root` to a new element key (or clear your tree).

### Examples

Replace a single prop:

```json
{"op":"replace","path":"/elements/title/props/text","value":"New title"}
```

Replace an element’s `children` list (recommended over index-based edits):

```json
{"op":"set","path":"/elements/page/children","value":["title","metric"]}
```

Remove an element (and then update the parent to stop referencing it):

```json
{"op":"remove","path":"/elements/metric"}
{"op":"replace","path":"/elements/page/children","value":["title"]}
```

---

## Data Binding

Connect UI components to your application data using JSON Pointer paths.

### JSON Pointer Paths

json-render uses JSON Pointer (RFC 6901) for data paths:

```javascript
// Given this data:
{
  "user": {
    "name": "Alice",
    "email": "alice@example.com"
  },
  "metrics": {
    "revenue": 125000,
    "growth": 0.15
  }
}

// These paths access:
"/user/name"        -> "Alice"
"/metrics/revenue"  -> 125000
"/metrics/growth"   -> 0.15
```

### DataProvider

Wrap your app with DataProvider to enable data binding:

```javascript
import { DataProvider } from '@json-render/react';

function App() {
  const initialData = {
    user: { name: 'Alice' },
    form: { email: '', message: '' },
  };

  return (
    <DataProvider initialData={initialData}>
      {/* Your UI */}
    </DataProvider>
  );
}
```

### Reading Data

Use `useDataValue` for read-only access:

```javascript
import { useDataValue } from '@json-render/react';

function UserGreeting() {
  const name = useDataValue('/user/name');
  return <h1>Hello, {name}!</h1>;
}
```

### Two-Way Binding

Use `useDataBinding` for read-write access:

```javascript
import { useDataBinding } from '@json-render/react';

function EmailInput() {
  const [email, setEmail] = useDataBinding('/form/email');

  return (
    <input
      type="email"
      value={email || ''}
      onChange={(e) => setEmail(e.target.value)}
    />
  );
}
```

### Using the Data Context

Access the full data context for advanced use cases:

```javascript
import { useData } from '@json-render/react';

function DataDebugger() {
  const { data, setData, getValue, setValue } = useData();

  // Read any path
  const revenue = getValue('/metrics/revenue');

  // Write any path
  const updateRevenue = () => setValue('/metrics/revenue', 150000);

  // Replace all data
  const resetData = () => setData({ user: {}, form: {} });

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### In JSON UI Trees

AI can reference data paths in component props:

```json
{
  "type": "Metric",
  "props": {
    "label": "Total Revenue",
    "valuePath": "/metrics/revenue",
    "format": "currency"
  }
}
```

---

## Actions

Handle user interactions safely with named actions.

### Why Named Actions?

Instead of AI generating arbitrary code, it declares _intent_ by name. Your application provides the implementation. This is a core guardrail.

### Defining Actions

Define available actions in your catalog:

```javascript
const catalog = createCatalog({
  components: { /* ... */ },
  actions: {
    submit_form: {
      params: z.object({
        formId: z.string(),
      }),
      description: 'Submit a form',
    },
    export_data: {
      params: z.object({
        format: z.enum(['csv', 'pdf', 'json']),
        filters: z.object({
          dateRange: z.string().optional(),
        }).optional(),
      }),
    },
    navigate: {
      params: z.object({
        url: z.string(),
      }),
    },
  },
});
```

### ActionProvider

Provide action handlers to your app:

```javascript
import { ActionProvider } from '@json-render/react';

function App() {
  const handlers = {
    submit_form: async (params) => {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ formId: params.formId }),
      });
      return response.json();
    },

    export_data: async (params) => {
      const blob = await generateExport(params.format, params.filters);
      downloadBlob(blob, `export.${params.format}`);
    },

    navigate: (params) => {
      window.location.href = params.url;
    },
  };

  return (
    <ActionProvider handlers={handlers}>
      {/* Your UI */}
    </ActionProvider>
  );
}
```

### Using Actions in Components

```javascript
const Button = ({ element, onAction }) => (
  <button onClick={() => onAction?.(element.props.action)}>
    {element.props.label}
  </button>
);

// Or use the useAction hook
import { useAction } from '@json-render/react';

function SubmitButton() {
  const { execute, isLoading } = useAction({
    name: 'submit_form',
    params: { formId: 'contact' },
  });

  return (
    <button onClick={execute} disabled={isLoading}>
      Submit
    </button>
  );
}
```

### Actions with Confirmation

AI can declare actions that require user confirmation:

```json
{
  "type": "Button",
  "props": {
    "label": "Delete Account",
    "action": {
      "name": "delete_account",
      "params": { "userId": "123" },
      "confirm": {
        "title": "Delete Account?",
        "message": "This action cannot be undone.",
        "variant": "danger"
      }
    }
  }
}
```

### Action Callbacks

Handle success and error states:

```json
{
  "type": "Button",
  "props": {
    "label": "Save",
    "action": {
      "name": "save_changes",
      "params": { "documentId": "doc-1" },
      "onSuccess": {
        "set": { "/ui/savedMessage": "Changes saved!" }
      },
      "onError": {
        "set": { "/ui/errorMessage": "$error.message" }
      }
    }
  }
}
```

---

## Visibility

Conditionally show or hide components based on data, auth, or logic.

### VisibilityProvider

Wrap your app with VisibilityProvider to enable conditional rendering:

```javascript
import { VisibilityProvider } from '@json-render/react';

function App() {
  return (
    <DataProvider initialData={data}>
      <VisibilityProvider>
        {/* Components can now use visibility conditions */}
      </VisibilityProvider>
    </DataProvider>
  );
}
```

### Path-Based Visibility

Show/hide based on data values:

```json
{
  "type": "Alert",
  "props": { "message": "Form has errors" },
  "visible": { "path": "/form/hasErrors" }
}

// Visible when /form/hasErrors is truthy
```

### Auth-Based Visibility

Show/hide based on authentication state:

```json
{
  "type": "AdminPanel",
  "visible": { "auth": "signedIn" }
}

// Options: "signedIn", "signedOut", "admin", etc.
```

### Logic Expressions

Combine conditions with logic operators:

```json
// AND - all conditions must be true
{
  "type": "SubmitButton",
  "visible": {
    "and": [
      { "path": "/form/isValid" },
      { "path": "/form/hasChanges" }
    ]
  }
}

// OR - any condition must be true
{
  "type": "HelpText",
  "visible": {
    "or": [
      { "path": "/user/isNew" },
      { "path": "/settings/showHelp" }
    ]
  }
}

// NOT - invert a condition
{
  "type": "WelcomeBanner",
  "visible": {
    "not": { "path": "/user/hasSeenWelcome" }
  }
}
```

### Comparison Operators

```json
// Equal
{
  "visible": {
    "eq": [{ "path": "/user/role" }, "admin"]
  }
}

// Greater than
{
  "visible": {
    "gt": [{ "path": "/cart/total" }, 100]
  }
}

// Available: eq, ne, gt, gte, lt, lte
```

### Complex Example

```json
{
  "type": "RefundButton",
  "props": { "label": "Process Refund" },
  "visible": {
    "and": [
      { "auth": "signedIn" },
      { "eq": [{ "path": "/user/role" }, "support"] },
      { "gt": [{ "path": "/order/amount" }, 0] },
      { "not": { "path": "/order/isRefunded" } }
    ]
  }
}
```

### Using in Components

```javascript
import { useIsVisible } from '@json-render/react';

function ConditionalContent({ element, children }) {
  const isVisible = useIsVisible(element.visible);

  if (!isVisible) return null;
  return <div>{children}</div>;
}
```

---

## Validation

Validate form inputs with built-in and custom functions.

### Built-in Validators

json-render includes common validation functions:
- `required` — Value must be non-empty
- `email` — Valid email format
- `minLength` — Minimum string length
- `maxLength` — Maximum string length
- `pattern` — Match a regex pattern
- `min` — Minimum numeric value
- `max` — Maximum numeric value

### Using Validation in JSON

```json
{
  "type": "TextField",
  "props": {
    "label": "Email",
    "valuePath": "/form/email",
    "checks": [
      { "fn": "required", "message": "Email is required" },
      { "fn": "email", "message": "Invalid email format" }
    ],
    "validateOn": "blur"
  }
}
```

### Validation with Parameters

```json
{
  "type": "TextField",
  "props": {
    "label": "Password",
    "valuePath": "/form/password",
    "checks": [
      { "fn": "required", "message": "Password is required" },
      {
        "fn": "minLength",
        "args": { "length": 8 },
        "message": "Password must be at least 8 characters"
      },
      {
        "fn": "pattern",
        "args": { "pattern": "[A-Z]" },
        "message": "Must contain at least one uppercase letter"
      }
    ]
  }
}
```

### Custom Validation Functions

Define custom validators in your catalog:

```javascript
const catalog = createCatalog({
  components: { /* ... */ },
  validationFunctions: {
    isValidPhone: {
      description: 'Validates phone number format',
    },
    isUniqueEmail: {
      description: 'Checks if email is not already registered',
    },
  },
});
```

Then implement them in your ValidationProvider:

```javascript
import { ValidationProvider } from '@json-render/react';

function App() {
  const customValidators = {
    isValidPhone: (value) => {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(value);
    },
    isUniqueEmail: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const { available } = await response.json();
      return available;
    },
  };

  return (
    <ValidationProvider functions={customValidators}>
      {/* Your UI */}
    </ValidationProvider>
  );
}
```

### Using in Components

```javascript
import { useFieldValidation } from '@json-render/react';

function TextField({ element }) {
  const { value, setValue, errors, validate } = useFieldValidation(
    element.props.valuePath,
    element.props.checks
  );

  return (
    <div>
      <label>{element.props.label}</label>
      <input
        value={value || ''}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => validate()}
      />
      {errors.map((error, i) => (
        <p key={i} className="text-red-500 text-sm">{error}</p>
      ))}
    </div>
  );
}
```

### Validation Timing

Control when validation runs with `validateOn`:
- `change` — Validate on every input change
- `blur` — Validate when field loses focus
- `submit` — Validate only on form submission

---
