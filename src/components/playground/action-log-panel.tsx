"use client";

export type ActionLogEntry = {
  id: string;
  name: string;
  params?: unknown;
  status: "running" | "success" | "error";
  startedAt: string;
  endedAt?: string;
  error?: string;
};

export function ActionLogPanel({
  logs,
  onClear,
}: {
  logs: Array<ActionLogEntry>;
  onClear: () => void;
}) {
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
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Actions (execution log)
        </h3>
        <button
          onClick={onClear}
          disabled={logs.length === 0}
          style={{
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 500,
            background: "transparent",
            color: logs.length === 0 ? "var(--muted)" : "var(--foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            cursor: logs.length === 0 ? "not-allowed" : "pointer",
            opacity: logs.length === 0 ? 0.6 : 1,
          }}
        >
          Clear
        </button>
      </div>

      {logs.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          No actions yet (click any Button with an action)
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {logs
            .slice()
            .reverse()
            .map((l) => {
              const isEmptyParams =
                typeof l.params === "object" &&
                l.params !== null &&
                Object.keys(l.params as Record<string, unknown>).length === 0;

              return (
                <div
                  key={l.id}
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
                      {l.name}
                    </span>
                    <span style={{ color: "var(--muted)" }}>
                      {l.status.toUpperCase()}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{l.startedAt}</span>
                    {l.endedAt && (
                      <span style={{ color: "var(--muted)" }}>{l.endedAt}</span>
                    )}
                  </div>

                  {l.params !== undefined && !isEmptyParams && (
                    <pre
                      style={{
                        marginTop: 6,
                        padding: 10,
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        overflow: "auto",
                        maxHeight: 140,
                        color: "var(--muted)",
                      }}
                    >
                      {JSON.stringify(l.params, null, 2)}
                    </pre>
                  )}

                  {l.params !== undefined && isEmptyParams && (
                    <div style={{ marginTop: 6, color: "var(--muted)" }}>
                      params: (none)
                    </div>
                  )}

                  {l.error && (
                    <div style={{ marginTop: 6, color: "#ef4444" }}>
                      {l.error}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
