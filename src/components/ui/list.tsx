"use client";

import { type ComponentRenderProps } from "@json-render/react";
import { useData } from "@json-render/react";
import { getByPath } from "@json-render/core";

export function List({ element, children }: ComponentRenderProps) {
  const { dataPath, emptyMessage } = element.props as {
    dataPath: string;
    emptyMessage?: string | null;
  };
  const { data } = useData();
  const listData = getByPath(data, dataPath) as Array<unknown> | undefined;

  if (!listData || !Array.isArray(listData)) {
    return (
      <div style={{ color: "var(--muted)" }}>
        {emptyMessage ?? "No items"}
      </div>
    );
  }

  if (children) {
    return <div>{children}</div>;
  }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
      {listData.map((item, index) => {
        if (item === null || item === undefined) {
          return (
            <li key={index} style={{ color: "var(--muted)" }}>
              (empty)
            </li>
          );
        }

        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return <li key={index}>{String(item)}</li>;
        }

        if (typeof item === "object") {
          const record = item as Record<string, unknown>;
          const name = typeof record.name === "string" ? record.name : undefined;
          const value = record.value;
          if (name !== undefined && (typeof value === "string" || typeof value === "number")) {
            return (
              <li key={index} style={{ display: "flex", gap: 10 }}>
                <span style={{ color: "var(--foreground)", fontWeight: 500 }}>
                  {name}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--muted)" }}>
                  {String(value)}
                </span>
              </li>
            );
          }

          return (
            <li key={index}>
              <pre
                style={{
                  margin: 0,
                  padding: "8px 10px",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  overflow: "auto",
                  color: "var(--muted)",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(record, null, 2)}
              </pre>
            </li>
          );
        }

        return <li key={index}>{String(item)}</li>;
      })}
    </ul>
  );
}
