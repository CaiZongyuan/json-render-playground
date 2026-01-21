"use client";

import { useMemo } from "react";
import { useValidation } from "@json-render/react";

type FieldState = {
  touched?: boolean;
  validated?: boolean;
  result?: { valid?: boolean; errors?: Array<string> } | null;
};

export function ValidationPanel() {
  const { fieldStates, validateAll, touch, clear } = useValidation() as {
    fieldStates: Record<string, FieldState>;
    validateAll: () => boolean;
    touch: (path: string) => void;
    clear: (path: string) => void;
  };

  const rows = useMemo(() => {
    return Object.entries(fieldStates).map(([path, state]) => {
      const errors = state.result?.errors ?? [];
      const valid = state.result?.valid ?? true;
      return {
        path,
        touched: !!state.touched,
        validated: !!state.validated,
        valid,
        errors,
      };
    });
  }, [fieldStates]);

  const clearAll = () => {
    for (const path of Object.keys(fieldStates)) {
      clear(path);
    }
  };

  const touchAll = () => {
    for (const path of Object.keys(fieldStates)) {
      touch(path);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Validation (debug panel)
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => validateAll()}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              background: "var(--foreground)",
              color: "var(--background)",
              border: "1px solid var(--foreground)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            Validate all
          </button>
          <button
            onClick={touchAll}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            Touch all
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              cursor: "pointer",
            }}
          >
            Clear all
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          No fields yet (add a TextField with checks to see validation state)
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {rows.map((r) => (
            <div
              key={r.path}
              style={{
                padding: "10px 12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                background: "var(--background)",
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
                  {r.path}
                </span>
                <span style={{ color: "var(--muted)" }}>
                  touched={String(r.touched)}
                </span>
                <span style={{ color: "var(--muted)" }}>
                  validated={String(r.validated)}
                </span>
                <span
                  style={{
                    color: r.valid ? "#22c55e" : "#ef4444",
                    fontWeight: 600,
                  }}
                >
                  {r.valid ? "VALID" : "INVALID"}
                </span>
                <button
                  onClick={() => clear(r.path)}
                  style={{
                    marginLeft: "auto",
                    padding: "4px 8px",
                    fontSize: 12,
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
              {r.errors.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 18, color: "#ef4444" }}>
                  {r.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
