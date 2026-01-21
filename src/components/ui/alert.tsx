"use client";

import { type ComponentRenderProps } from "@json-render/react";
import { useData } from "@json-render/react";
import { getByPath } from "@json-render/core";

function useResolvedValue<T>(
  value: T | { path: string } | null | undefined,
): T | undefined {
  const { data } = useData();
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && "path" in value) {
    return getByPath(data, value.path) as T | undefined;
  }
  return value as T;
}

export function Alert({ element }: ComponentRenderProps) {
  const { message, variant } = element.props as {
    message: string | { path: string };
    variant?: string | null;
  };
  const resolvedMessage = useResolvedValue(message);

  const colors: Record<string, string> = {
    info: "var(--muted)",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  };

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        fontSize: 14,
        color: colors[variant || "info"],
      }}
    >
      {resolvedMessage}
    </div>
  );
}
