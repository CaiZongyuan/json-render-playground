"use client";

import { useMemo, useRef, useState } from "react";
import type { UITree } from "@json-render/core";
import { Markdown } from "@/src/components/playground/markdown";

type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

function buildTreeOutline(tree: UITree) {
  const elements = Object.values(tree.elements).map((el) => {
    const props = (el.props ?? {}) as Record<string, unknown>;
    const summaryParts: Array<string> = [];
    if (typeof props.text === "string") summaryParts.push(`text="${props.text}"`);
    if (typeof props.title === "string") summaryParts.push(`title="${props.title}"`);
    if (typeof props.label === "string") summaryParts.push(`label="${props.label}"`);
    if (typeof props.content === "string") summaryParts.push(`content="${props.content}"`);

    return {
      key: el.key,
      type: el.type,
      parentKey: (el as unknown as { parentKey?: unknown }).parentKey ?? null,
      children: Array.isArray(el.children) ? el.children : [],
      summary: summaryParts.join(" "),
    };
  });

  return {
    root: tree.root,
    elements,
  };
}

export function ChatPanel({
  tree,
  selectedKey,
  data,
  onApplyPatchLine,
}: {
  tree: UITree;
  selectedKey: string | null;
  data: Record<string, unknown>;
  onApplyPatchLine: (patchLine: string) => { ok: boolean; error?: string };
}) {
  const [messages, setMessages] = useState<Array<ChatMessage>>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAssistantMarkdown, setActiveAssistantMarkdown] = useState("");
  const [rawStream, setRawStream] = useState("");
  const [modalView, setModalView] = useState<"markdown" | "raw">("markdown");
  const abortRef = useRef<AbortController | null>(null);

  const outline = useMemo(() => buildTreeOutline(tree), [tree]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setInput("");
    setActiveAssistantMarkdown("");
    setRawStream("");
    setModalView("markdown");
    setIsModalOpen(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: prompt },
      { role: "assistant", content: "" },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          selectedKey,
          currentTree: tree,
          context: { data, selectedKey, uiOutline: outline },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status} ${res.statusText}`);
      }
      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let inCodeFence = false;

      const appendRaw = (text: string) => {
        if (!text) return;
        setRawStream((prev) => {
          const next = prev + text;
          // Keep a bounded buffer so we don't grow unbounded in long chats.
          const maxChars = 50_000;
          return next.length > maxChars ? next.slice(next.length - maxChars) : next;
        });
      };

      const appendAssistant = (text: string) => {
        setActiveAssistantMarkdown((prev) => prev + text);
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "assistant") {
              next[i] = { role: "assistant", content: next[i].content + text };
              break;
            }
          }
          return next;
        });
      };

      const handleRawLine = (rawLine: string) => {
        const trimmed = rawLine.trim();

        if (trimmed.startsWith("```")) {
          inCodeFence = !inCodeFence;
          appendAssistant(rawLine + "\n");
          return;
        }

        if (inCodeFence) {
          appendAssistant(rawLine + "\n");
          return;
        }

        if (!trimmed) {
          appendAssistant("\n");
          return;
        }

        if (trimmed.startsWith("//")) {
          appendAssistant(trimmed.replace(/^\/\/\s?/, "") + "\n");
          return;
        }

        // If a line is a JSON patch object, apply it; otherwise treat it as markdown text.
        try {
          const parsed = JSON.parse(trimmed) as unknown;
          if (
            parsed &&
            typeof parsed === "object" &&
            "op" in parsed &&
            "path" in parsed &&
            typeof (parsed as { op?: unknown }).op === "string" &&
            typeof (parsed as { path?: unknown }).path === "string"
          ) {
            const result = onApplyPatchLine(trimmed);
            if (!result.ok) {
              appendAssistant(
                `\nPatch error: ${result.error ?? "Failed to apply patch"}\n`,
              );
              setError(result.error ?? "Failed to apply patch");
              stop();
              return;
            }
            return;
          }
        } catch {
          // fall through to treat as markdown
        }

        appendAssistant(rawLine + "\n");
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        appendRaw(chunk);
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          handleRawLine(rawLine);
        }
      }

      const tail = decoder.decode();
      appendRaw(tail);
      const final = buffer + tail;
      if (final) {
        for (const rawLine of final.split("\n")) {
          if (!rawLine) continue;
          handleRawLine(rawLine);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {isModalOpen && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 50,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{
              width: "min(900px, 100%)",
              maxHeight: "min(80vh, 780px)",
              overflow: "auto",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "calc(var(--radius) + 2px)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>
                AI reply
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {selectedKey ? `Selected: ${selectedKey}` : "No selection"}
              </div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <button
                  onClick={() =>
                    setModalView((v) => (v === "markdown" ? "raw" : "markdown"))
                  }
                  style={{
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                >
                  {modalView === "markdown" ? "Raw" : "Markdown"}
                </button>
                {isStreaming ? (
                  <button
                    onClick={stop}
                    style={{
                      padding: "6px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: "transparent",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                    }}
                  >
                    Stop
                  </button>
                ) : null}
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 14,
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--foreground)",
              }}
            >
              {modalView === "raw" ? (
                rawStream.trim() ? (
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 12,
                      color: "var(--foreground)",
                    }}
                  >
                    {rawStream}
                  </pre>
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: 13 }}>
                    {isStreaming ? "Streaming..." : "No output yet."}
                  </span>
                )
              ) : activeAssistantMarkdown.trim() ? (
                <Markdown content={activeAssistantMarkdown} />
              ) : rawStream.trim() ? (
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Markdown view is empty yet. Switch to Raw to see streamed output.
                </span>
              ) : (
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {isStreaming ? "Streaming..." : "No reply yet."}
                </span>
              )}
            </div>

            {error && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  color: "#ef4444",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 18,
          transform: "translateX(-50%)",
          width: "min(820px, calc(100% - 24px))",
          zIndex: 40,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "calc(var(--radius) + 2px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          padding: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {selectedKey ? `Selected: ${selectedKey}` : "Click a component to select"}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!activeAssistantMarkdown.trim() && messages.length === 0}
              style={{
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 600,
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                cursor:
                  !activeAssistantMarkdown.trim() && messages.length === 0
                    ? "not-allowed"
                    : "pointer",
                opacity:
                  !activeAssistantMarkdown.trim() && messages.length === 0 ? 0.6 : 1,
              }}
            >
              Open reply
            </button>

            {isStreaming ? (
              <button
                onClick={stop}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                }}
              >
                Stop
              </button>
            ) : (
              <button
                onClick={() => {
                  setMessages([]);
                  setActiveAssistantMarkdown("");
                  setError(null);
                }}
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "end" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask or edit… (Ctrl+Enter to send)"
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 140,
              padding: "10px 12px",
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--foreground)",
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              resize: "vertical",
              outline: "none",
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void send();
              }
            }}
            disabled={isStreaming}
          />

          <button
            onClick={() => void send()}
            disabled={isStreaming || !input.trim()}
            style={{
              padding: "10px 14px",
              fontSize: 12,
              fontWeight: 700,
              background:
                isStreaming || !input.trim()
                  ? "transparent"
                  : "var(--foreground)",
              color:
                isStreaming || !input.trim()
                  ? "var(--muted)"
                  : "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer",
              opacity: isStreaming || !input.trim() ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
