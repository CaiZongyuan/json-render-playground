"use client";

import type { ReactNode } from "react";

type Block =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ul"; items: Array<string> }
  | { type: "ol"; items: Array<string> }
  | { type: "code"; lang: string | null; content: string }
  | { type: "hr" };

function safeHref(href: string) {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return null;
}

function renderInline(text: string): Array<ReactNode> {
  const parts = text.split(/(`[^`]+`)/g);
  const out: Array<ReactNode> = [];

  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex];
    if (!part) continue;
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      out.push(
        <code
          key={`code-${partIndex}`}
          style={{
            padding: "1px 6px",
            borderRadius: 6,
            background: "var(--border)",
            fontSize: "0.95em",
          }}
        >
          {part.slice(1, -1)}
        </code>,
      );
      continue;
    }

    const tokens: Array<ReactNode> = [];
    let rest = part;
    let keyCounter = 0;

    const take = (
      regex: RegExp,
      render: (m: RegExpExecArray, key: string) => ReactNode,
    ) => {
      const match = regex.exec(rest);
      if (!match || match.index === undefined) return false;
      const before = rest.slice(0, match.index);
      if (before) tokens.push(before);
      tokens.push(render(match, `${partIndex}-${keyCounter++}`));
      rest = rest.slice(match.index + match[0].length);
      return true;
    };

    // Process left-to-right by repeatedly taking the earliest of: link, bold, italic.
    while (rest) {
      const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;
      const boldRe = /\*\*([^*]+)\*\*/;
      const italicRe = /\*([^*]+)\*/;

      const linkMatch = linkRe.exec(rest);
      const boldMatch = boldRe.exec(rest);
      const italicMatch = italicRe.exec(rest);

      const candidates = [
        { kind: "link" as const, match: linkMatch },
        { kind: "bold" as const, match: boldMatch },
        { kind: "italic" as const, match: italicMatch },
      ].filter((c) => c.match && typeof c.match.index === "number") as Array<{
        kind: "link" | "bold" | "italic";
        match: RegExpExecArray;
      }>;

      if (candidates.length === 0) {
        tokens.push(rest);
        break;
      }

      candidates.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
      const next = candidates[0];

      if (next.kind === "link") {
        take(/\[([^\]]+)\]\(([^)]+)\)/, (m, key) => {
          const href = safeHref(m[2]);
          if (!href) return m[0];
          return (
            <a
              key={`a-${key}`}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              style={{
                color: "var(--foreground)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {m[1]}
            </a>
          );
        });
        continue;
      }

      if (next.kind === "bold") {
        take(/\*\*([^*]+)\*\*/, (m, key) => (
          <strong key={`b-${key}`}>{m[1]}</strong>
        ));
        continue;
      }

      take(/\*([^*]+)\*/, (m, key) => <em key={`i-${key}`}>{m[1]}</em>);
    }

    out.push(...tokens);
  }

  return out;
}

function parseMarkdown(md: string): Array<Block> {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Array<Block> = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || null;
      i += 1;
      const codeLines: Array<string> = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length && lines[i].trim().startsWith("```")) i += 1;
      blocks.push({ type: "code", lang, content: codeLines.join("\n") });
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const m = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (m) {
        const level = Math.min(6, m[1].length) as 1 | 2 | 3 | 4 | 5 | 6;
        blocks.push({ type: "heading", level, text: m[2] });
        i += 1;
        continue;
      }
    }

    if (trimmed === "---" || trimmed === "***") {
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: Array<string> = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!/^[-*]\s+/.test(t)) break;
        items.push(t.replace(/^[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: Array<string> = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!/^\d+\.\s+/.test(t)) break;
        items.push(t.replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    if (!trimmed) {
      i += 1;
      continue;
    }

    const paraLines: Array<string> = [];
    while (i < lines.length) {
      const l = lines[i];
      const t = l.trim();
      if (!t) break;
      if (t.startsWith("```")) break;
      if (/^#{1,6}\s+/.test(t)) break;
      if (t === "---" || t === "***") break;
      if (/^[-*]\s+/.test(t)) break;
      if (/^\d+\.\s+/.test(t)) break;
      paraLines.push(l);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paraLines.join("\n") });
  }

  return blocks;
}

export function Markdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);

  return (
    <div style={{ display: "grid", gap: 10, lineHeight: 1.6 }}>
      {blocks.map((b, idx) => {
        if (b.type === "heading") {
          const Tag = `h${Math.min(4, b.level)}` as "h1" | "h2" | "h3" | "h4";
          return (
            <Tag key={idx} style={{ margin: 0, fontWeight: 650 }}>
              {renderInline(b.text)}
            </Tag>
          );
        }
        if (b.type === "paragraph") {
          const lines = b.text.split("\n");
          return (
            <p key={idx} style={{ margin: 0, color: "var(--foreground)" }}>
              {lines.map((l, i) => (
                <span key={i}>
                  {renderInline(l)}
                  {i < lines.length - 1 ? <br /> : null}
                </span>
              ))}
            </p>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={idx} style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {b.items.map((it, i) => (
                <li key={i}>{renderInline(it)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={idx} style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
              {b.items.map((it, i) => (
                <li key={i}>{renderInline(it)}</li>
              ))}
            </ol>
          );
        }
        if (b.type === "hr") {
          return (
            <hr
              key={idx}
              style={{ border: "none", borderTop: "1px solid var(--border)", margin: "6px 0" }}
            />
          );
        }
        return (
          <pre
            key={idx}
            style={{
              margin: 0,
              padding: 12,
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "auto",
              fontSize: 12,
              color: "var(--foreground)",
              whiteSpace: "pre",
            }}
          >
            <code>{b.content}</code>
          </pre>
        );
      })}
    </div>
  );
}

