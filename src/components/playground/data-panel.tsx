"use client";

import { useMemo, useState } from "react";
import { useData } from "@json-render/react";

export function DataPanel({
  initialData,
}: {
  initialData: Record<string, unknown>;
}) {
  const { data, set, update } = useData();
  const [path, setPath] = useState("/form/name");
  const [rawValue, setRawValue] = useState("\"Alice\"");
  const [error, setError] = useState<string | null>(null);

  const dataJson = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const handleSet = () => {
    try {
      setError(null);
      const trimmedPath = path.trim();
      if (!trimmedPath.startsWith("/")) {
        throw new Error(
          "Path must be a JSON Pointer starting with '/', e.g. /form/name",
        );
      }
      const trimmedValue = rawValue.trim();
      const parsed =
        trimmedValue === "" ? "" : (JSON.parse(trimmedValue) as unknown);
      set(trimmedPath, parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleReset = () => {
    update({
      "/analytics": initialData.analytics,
      "/form": initialData.form,
      "/ui": initialData.ui,
    });
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
        Data binding (data panel)
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, color: "var(--muted)" }}>path</label>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
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
          <label style={{ fontSize: 12, color: "var(--muted)" }}>
            value（JSON）
          </label>
          <input
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
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
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          onClick={handleSet}
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
          Set path
        </button>
        <button
          onClick={handleReset}
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
          Reset data
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#ef4444" }}>
          {error}
        </div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--muted)" }}>
          View current data
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
            maxHeight: 260,
          }}
        >
          {dataJson}
        </pre>
      </details>
    </div>
  );
}
