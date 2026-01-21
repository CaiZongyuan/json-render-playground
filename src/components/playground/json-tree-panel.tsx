"use client";

import { useMemo } from "react";
import type { UITree, UIElement } from "@json-render/core";

function elementSummary(element: UIElement) {
  const childrenCount = Array.isArray(element.children) ? element.children.length : 0;
  return childrenCount > 0
    ? `${element.key} (${element.type}) • ${childrenCount} children`
    : `${element.key} (${element.type})`;
}

function getElementKeysInTreeOrder(tree: UITree) {
  const visited = new Set<string>();
  const result: Array<string> = [];

  const visit = (key: string) => {
    if (!key || visited.has(key)) return;
    const element = tree.elements[key];
    if (!element) return;
    visited.add(key);
    result.push(key);
    const children = Array.isArray(element.children) ? element.children : [];
    for (const childKey of children) {
      visit(childKey);
    }
  };

  if (tree.root) visit(tree.root);

  const remainingKeys = Object.keys(tree.elements).sort();
  for (const key of remainingKeys) {
    if (!visited.has(key)) result.push(key);
  }

  return result;
}

export function JsonTreePanel({
  tree,
  highlightedKey,
}: {
  tree: UITree;
  highlightedKey?: string | null;
}) {
  const elementKeys = useMemo(() => getElementKeysInTreeOrder(tree), [tree]);

  const rootKey = tree.root;
  const rootElement = rootKey ? tree.elements[rootKey] : undefined;

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <h2
        style={{
          margin: "0 0 12px",
          fontSize: "18px",
          fontWeight: 600,
          color: "var(--foreground)",
        }}
      >
        JSON tree
      </h2>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Root:{" "}
          <span style={{ color: "var(--foreground)", fontWeight: 600 }}>
            {rootKey || "(empty)"}
          </span>
        </div>

        {rootElement && (
          <details>
            <summary
              style={{
                cursor: "pointer",
                fontSize: 13,
                color: "var(--foreground)",
                fontWeight: 600,
              }}
            >
              Root element (collapsed by default)
            </summary>
            <pre
              style={{
                marginTop: 8,
                marginBottom: 0,
                padding: 12,
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                overflow: "auto",
                fontSize: 12,
                color: "var(--muted)",
                maxHeight: 320,
              }}
            >
              {JSON.stringify(rootElement, null, 2)}
            </pre>
          </details>
        )}

        <details open>
          <summary
            style={{
              cursor: "pointer",
              fontSize: 13,
              color: "var(--foreground)",
              fontWeight: 600,
            }}
          >
            Elements ({elementKeys.length})
          </summary>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {elementKeys.map((key) => {
              const element = tree.elements[key];
              if (!element) return null;
              const isHighlighted = key === highlightedKey;

              return (
                <details key={key}>
                  <summary
                    style={{
                      cursor: "pointer",
                      fontSize: 12,
                      color: "var(--foreground)",
                      fontWeight: 500,
                      padding: "6px 8px",
                      border: `1px solid ${
                        isHighlighted ? "rgba(59, 130, 246, 0.55)" : "var(--border)"
                      }`,
                      borderRadius: "var(--radius)",
                      background: isHighlighted
                        ? "rgba(59, 130, 246, 0.12)"
                        : "var(--background)",
                    }}
                  >
                    {elementSummary(element)}
                  </summary>
                  <pre
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      padding: 12,
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      overflow: "auto",
                      fontSize: 12,
                      color: "var(--muted)",
                      maxHeight: 360,
                    }}
                  >
                    {JSON.stringify(element, null, 2)}
                  </pre>
                </details>
              );
            })}
          </div>
        </details>
      </div>
    </div>
  );
}
