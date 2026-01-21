"use client";

import { useMemo, useState } from "react";
import type { UITree, UIElement } from "@json-render/core";

type InsertMode = "append" | "prepend" | "atIndex" | "before" | "after";

function safeJsonParse(input: string): unknown | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed) as unknown;
}

function safeJsonObject(input: string): Record<string, unknown> {
  const parsed = safeJsonParse(input);
  if (!parsed) return {};
  if (typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  throw new Error('Props must be a JSON object, e.g. {"label":"Save"}');
}

function safeStringArray(input: string): Array<string> | undefined {
  const parsed = safeJsonParse(input);
  if (parsed === undefined) return undefined;
  if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
    return parsed as Array<string>;
  }
  throw new Error('Children must be a string[], e.g. ["child-1","child-2"]');
}

function insertIntoArray(
  current: Array<string>,
  nextKey: string,
  mode: InsertMode,
  opts: { index?: number; siblingKey?: string },
): Array<string> {
  const withoutDup = current.filter((k) => k !== nextKey);
  if (mode === "append") return [...withoutDup, nextKey];
  if (mode === "prepend") return [nextKey, ...withoutDup];

  const siblingKey = opts.siblingKey;
  if (mode === "atIndex") {
    const index = Math.max(0, Math.min(withoutDup.length, opts.index ?? 0));
    return [...withoutDup.slice(0, index), nextKey, ...withoutDup.slice(index)];
  }

  if (!siblingKey) return [...withoutDup, nextKey];
  const siblingIndex = withoutDup.indexOf(siblingKey);
  if (siblingIndex === -1) return [...withoutDup, nextKey];

  const insertIndex = mode === "before" ? siblingIndex : siblingIndex + 1;
  return [
    ...withoutDup.slice(0, insertIndex),
    nextKey,
    ...withoutDup.slice(insertIndex),
  ];
}

export function AddElementPanel({
  tree,
  componentTypes,
  onSetEditor,
  onApply,
}: {
  tree: UITree;
  componentTypes: Array<string>;
  onSetEditor: (patchesJsonl: string) => void;
  onApply: (patchesJsonl: string) => void;
}) {
  const elementOptions = useMemo(() => {
    return Object.values(tree.elements)
      .map((el) => ({
        key: el.key,
        label: `${el.key} (${el.type})`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tree.elements]);

  const [newKey, setNewKey] = useState("demo-new-element");
  const [newType, setNewType] = useState(componentTypes[0] ?? "Text");
  const [propsJson, setPropsJson] = useState("{\n  \n}");
  const [childrenJson, setChildrenJson] = useState("");

  const [setAsRoot, setSetAsRoot] = useState(false);
  const [parentKey, setParentKey] = useState<string>(
    elementOptions.find((x) => x.key === tree.root)?.key ??
      elementOptions[0]?.key ??
      "",
  );
  const [insertMode, setInsertMode] = useState<InsertMode>("append");
  const [siblingKey, setSiblingKey] = useState<string>("");
  const [index, setIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const buildPatches = () => {
    const trimmedKey = newKey.trim();
    if (!trimmedKey) throw new Error("Key is required");
    if (tree.elements[trimmedKey])
      throw new Error(`Key already exists: ${trimmedKey}`);

    const props = safeJsonObject(propsJson);
    const children = safeStringArray(childrenJson);

    const element: UIElement = {
      key: trimmedKey,
      type: newType,
      props,
      ...(children && children.length > 0 ? { children } : {}),
      ...(!setAsRoot && parentKey ? { parentKey } : {}),
    };

    const patches: Array<Record<string, unknown>> = [
      { op: "add", path: `/elements/${trimmedKey}`, value: element },
    ];

    if (setAsRoot) {
      patches.push({ op: "set", path: "/root", value: trimmedKey });
      return patches.map((p) => JSON.stringify(p)).join("\n");
    }

    if (!parentKey) {
      throw new Error("Select a parentKey, or enable Set as root");
    }

    const parent = tree.elements[parentKey] as unknown as { children?: unknown };
    const currentChildren = Array.isArray(parent?.children)
      ? (parent.children as Array<string>).filter((x) => typeof x === "string")
      : [];
    const nextChildren = insertIntoArray(currentChildren, trimmedKey, insertMode, {
      siblingKey: siblingKey || undefined,
      index,
    });

    patches.push({
      op: "replace",
      path: `/elements/${parentKey}/children`,
      value: nextChildren,
    });

    return patches.map((p) => JSON.stringify(p)).join("\n");
  };

  const handleGenerate = (mode: "editor" | "apply") => {
    try {
      setError(null);
      const jsonl = buildPatches();
      if (mode === "editor") onSetEditor(jsonl);
      else onApply(jsonl);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600 }}>
        Add (generate patches and choose insertion)
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Key</label>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>Type</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
              fontSize: 14,
              outline: "none",
            }}
          >
            {componentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Props (JSON object)
          </label>
          <textarea
            value={propsJson}
            onChange={(e) => setPropsJson(e.target.value)}
            placeholder='e.g. {"label":"Export","variant":"secondary"}'
            style={{
              width: "100%",
              minHeight: 90,
              padding: "10px 12px",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--foreground)",
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            Children (optional, JSON string[])
          </label>
          <textarea
            value={childrenJson}
            onChange={(e) => setChildrenJson(e.target.value)}
            placeholder='e.g. ["child-1","child-2"] (leave empty for none)'
            style={{
              width: "100%",
              minHeight: 60,
              padding: "10px 12px",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--foreground)",
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={setAsRoot}
            onChange={(e) => setSetAsRoot(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: "var(--foreground)" }}>
            Set as root (also generates `set /root`)
          </span>
        </label>

        {!setAsRoot && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              alignItems: "end",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>
                Parent key (insert into children)
              </label>
              <select
                value={parentKey}
                onChange={(e) => setParentKey(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                {elementOptions.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>
                Insert mode
              </label>
              <select
                value={insertMode}
                onChange={(e) => setInsertMode(e.target.value as InsertMode)}
                style={{
                  padding: "8px 10px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  fontSize: 14,
                  outline: "none",
                }}
              >
                <option value="append">append (end)</option>
                <option value="prepend">prepend (start)</option>
                <option value="atIndex">atIndex</option>
                <option value="before">before (a sibling)</option>
                <option value="after">after (a sibling)</option>
              </select>
            </div>

            {(insertMode === "before" || insertMode === "after") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--muted)" }}>
                Sibling key
              </label>
                <input
                  value={siblingKey}
                  onChange={(e) => setSiblingKey(e.target.value)}
                  placeholder="e.g. btn-primary"
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            )}

            {insertMode === "atIndex" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "var(--muted)" }}>
                  index
                </label>
                <input
                  type="number"
                  value={index}
                  onChange={(e) => setIndex(Number(e.target.value))}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    background: "var(--background)",
                    color: "var(--foreground)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button
          onClick={() => handleGenerate("editor")}
          style={{
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 500,
            background: "transparent",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            cursor: "pointer",
          }}
        >
          Insert into editor
        </button>
        <button
          onClick={() => handleGenerate("apply")}
          style={{
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 500,
            background: "var(--foreground)",
            color: "var(--background)",
            border: "1px solid var(--foreground)",
            borderRadius: "var(--radius)",
            cursor: "pointer",
          }}
        >
          Apply now
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>
          {error}
        </div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>
          Example (generated JSONL patches)
        </summary>
        <pre
          style={{
            marginTop: 8,
            padding: 12,
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "auto",
            fontSize: 12,
            color: "var(--muted)",
            maxHeight: 220,
          }}
        >
          {(() => {
            try {
              return buildPatches();
            } catch {
              return "// Fill in fields to preview the generated JSONL patches";
            }
          })()}
        </pre>
      </details>
    </div>
  );
}
