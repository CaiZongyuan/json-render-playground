"use client";

import { useMemo, useState } from "react";
import { UITree } from "@json-render/core";
import { componentRegistry } from "@/src/components/ui";
import {
  parsePatchesToTree,
  MOCK_PATCHES_DASHBOARD,
} from "@/src/lib/mockPatches";
import { INITIAL_DATA, ACTION_HANDLERS } from "@/src/lib/mockData";
import {
  applyPatches,
  EXAMPLE_PATCHES,
} from "@/src/lib/patchUtils";

import {
  ActionLogPanel,
  AddElementPanel,
  DataPanel,
  type ActionLogEntry,
  JsonTreePanel,
  ValidationPanel,
} from "@/src/components/playground";

import {
  ActionProvider,
  DataProvider,
  Renderer,
  ValidationProvider,
  VisibilityProvider,
} from "@json-render/react";

const INITIAL_TREE: UITree = parsePatchesToTree(MOCK_PATCHES_DASHBOARD);
const COMPONENT_TYPES = Object.keys(componentRegistry).sort();

function DashboardContent({
  actionLogs,
  onClearActionLogs,
}: {
  actionLogs: Array<ActionLogEntry>;
  onClearActionLogs: () => void;
}) {
  const [tree, setTree] = useState<UITree>(INITIAL_TREE);
  const [patchInput, setPatchInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState(true);
  const [showJson, setShowJson] = useState(true);

  const applyPatchString = (patches: string) => {
    const result = applyPatches(tree, patches);
    if (result.success) {
      setTree(result.tree);
      setError(null);
    } else {
      setError(result.error || "Failed to apply patch");
    }
  };

  const handleApplyPatch = () => {
    if (!patchInput.trim()) return;
    applyPatchString(patchInput);
  };

  const handleSelectExample = (key: string) => {
    setSelectedExample(key);
    setPatchInput(EXAMPLE_PATCHES[key as keyof typeof EXAMPLE_PATCHES]);
    setError(null);
  };

  const handleReset = () => {
    setTree(INITIAL_TREE);
    setPatchInput("");
    setError(null);
    setSelectedExample(null);
  };

  const hasElements = Object.keys(tree.elements).length > 0;

  const gridColumnsClass =
    showPlayground && showJson
      ? "lg:grid-cols-[380px_minmax(0,1fr)_360px] xl:grid-cols-[420px_minmax(0,1fr)_420px]"
      : showPlayground && !showJson
        ? "lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]"
        : !showPlayground && showJson
          ? "lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px]"
          : "lg:grid-cols-[minmax(0,1fr)]";

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <div className="mx-auto w-full max-w-[1480px] p-6">
        <div
          className={`grid grid-cols-1 gap-6 ${gridColumnsClass} lg:h-[calc(100vh-48px)]`}
        >
          {/* Left: Playground */}
          {showPlayground && (
            <div className="flex flex-col gap-6 lg:overflow-auto lg:pr-2">
              {/* Patch Playground */}
              <div
                style={{
                  padding: "20px",
                  background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "var(--foreground)",
                  }}
                >
                  Playground
                </h2>
                <button
                  onClick={handleReset}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    background: "transparent",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--foreground)";
                    e.currentTarget.style.color = "var(--foreground)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--muted)";
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Example Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                {[
                  { key: "replaceHeading", label: "Replace heading" },
                  { key: "replaceCardTitle", label: "Replace card title" },
                  { key: "removeGrowthFromChildren", label: "Replace children" },
                  { key: "removeListDemo", label: "Remove element" },
                  { key: "removeListDemoAndUpdateParent", label: "Remove + update" },
                  { key: "addTextToRoot", label: "Add text (example)" },
                  { key: "addActionButton", label: "Add action button (example)" },
                  {
                    key: "addValidatedField",
                    label: "Add validated field (example)",
                  },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleSelectExample(key)}
                    style={{
                      padding: "8px 14px",
                      fontSize: "14px",
                      fontWeight: 500,
                      background:
                        selectedExample === key
                          ? "var(--foreground)"
                          : "var(--card)",
                      color:
                        selectedExample === key
                          ? "var(--background)"
                          : "var(--foreground)",
                      border: `1px solid ${
                        selectedExample === key
                          ? "var(--foreground)"
                          : "var(--border)"
                      }`,
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      opacity:
                        selectedExample && selectedExample !== key ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedExample !== key) {
                        e.currentTarget.style.borderColor = "var(--foreground)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedExample !== key) {
                        e.currentTarget.style.borderColor = "var(--border)";
                      }
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Patch Input */}
              <div style={{ marginBottom: "16px" }}>
                <textarea
                  value={patchInput}
                  onChange={(e) => setPatchInput(e.target.value)}
                  placeholder={
                    'Enter JSONL patches (one JSON per line).\n' +
                    'Example: {"op":"replace","path":"/elements/main-heading/props/text","value":"New Title"}\n' +
                    "Tips: empty lines and lines starting with // are ignored."
                  }
                  style={{
                    width: "100%",
                    minHeight: "160px",
                    padding: "14px 16px",
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--foreground)",
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    resize: "vertical",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--foreground)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                />
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  {patchInput.length > 0
                    ? `${patchInput.length} characters`
                    : "Start typing or select an example above"}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleApplyPatch}
                  disabled={!patchInput.trim()}
                  style={{
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: 500,
                    background: !patchInput.trim()
                      ? "transparent"
                      : "var(--foreground)",
                    color: !patchInput.trim()
                      ? "var(--muted)"
                      : "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: !patchInput.trim() ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    opacity: !patchInput.trim() ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (patchInput.trim()) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Apply patches
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 16px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "var(--radius)",
                    color: "#ef4444",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Error: </span>
                  {error}
                </div>
              )}
            </div>

            {/* Add Builder */}
            <AddElementPanel
              tree={tree}
              componentTypes={COMPONENT_TYPES}
              onSetEditor={(jsonl) => {
                setSelectedExample(null);
                setPatchInput(jsonl);
                setError(null);
              }}
              onApply={(jsonl) => {
                setSelectedExample(null);
                setPatchInput(jsonl);
                applyPatchString(jsonl);
              }}
            />

            {/* Learning Panels */}
            <DataPanel
              initialData={INITIAL_DATA as unknown as Record<string, unknown>}
            />
            <ValidationPanel />
            <ActionLogPanel logs={actionLogs} onClear={onClearActionLogs} />
            </div>
          )}

          {/* Middle: Preview */}
          <div className="flex flex-col gap-6 lg:overflow-auto">
            <div
              style={{
                padding: "14px 16px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                display: "flex",
                gap: 10,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Panels</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowPlayground((v) => !v)}
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
                  {showPlayground ? "Hide playground" : "Show playground"}
                </button>
                <button
                  onClick={() => setShowJson((v) => !v)}
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
                  {showJson ? "Hide JSON" : "Show JSON"}
                </button>
              </div>
            </div>
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
                  margin: "0 0 14px",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                Live preview
              </h2>

              <div
                style={{
                  minHeight: 320,
                  padding: 24,
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                }}
              >
                {!hasElements ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: "var(--muted)",
                    }}
                  >
                    <p style={{ margin: 0 }}>No elements to display</p>
                  </div>
                ) : (
                  <Renderer tree={tree} registry={componentRegistry} />
                )}
              </div>
            </div>
          </div>

          {/* Right: JSON */}
          {showJson && (
            <div className="flex flex-col gap-6 lg:overflow-auto lg:pl-2">
              {hasElements ? (
                <JsonTreePanel tree={tree} />
              ) : (
                <div
                  style={{
                    padding: "20px",
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--muted)",
                    fontSize: 13,
                  }}
                >
                  JSON tree will appear here once the UI tree has elements.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [actionLogs, setActionLogs] = useState<Array<ActionLogEntry>>([]);

  const actionHandlers = useMemo(() => {
    const handlers: typeof ACTION_HANDLERS = {};
    for (const [name, handler] of Object.entries(ACTION_HANDLERS)) {
      handlers[name] = async (params) => {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const startedAt = new Date().toISOString();
        setActionLogs((prev) => [
          ...prev,
          { id, name, params, status: "running", startedAt },
        ]);

        try {
          await handler(params);
          const endedAt = new Date().toISOString();
          setActionLogs((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, status: "success", endedAt } : l,
            ),
          );
        } catch (e) {
          const endedAt = new Date().toISOString();
          setActionLogs((prev) =>
            prev.map((l) =>
              l.id === id
                ? {
                    ...l,
                    status: "error",
                    endedAt,
                    error: e instanceof Error ? e.message : String(e),
                  }
                : l,
            ),
          );
          throw e;
        }
      };
    }
    return handlers;
  }, []);

  return (
    <DataProvider initialData={INITIAL_DATA}>
      <VisibilityProvider>
        <ValidationProvider>
          <ActionProvider handlers={actionHandlers}>
            <DashboardContent
              actionLogs={actionLogs}
              onClearActionLogs={() => setActionLogs([])}
            />
          </ActionProvider>
        </ValidationProvider>
      </VisibilityProvider>
    </DataProvider>
  );
}
