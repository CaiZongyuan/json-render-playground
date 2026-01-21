"use client";

import { type ComponentRenderProps } from "@json-render/react";
import { useData } from "@json-render/react";
import { getByPath } from "@json-render/core";

type Datum = { label: string; value: number };

function formatNumber(value: number) {
  const abs = Math.abs(value);
  const hasFraction = Math.abs(value % 1) > 0.000001;
  if (abs >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
}

function normalizeToSeries(
  input: unknown,
  opts?: { labelKey?: string | null; valueKey?: string | null },
): Array<Datum> | null {
  if (!Array.isArray(input)) return null;

  const labelKey = opts?.labelKey ?? null;
  const valueKey = opts?.valueKey ?? null;

  const pickValueKey = (record: Record<string, unknown>) => {
    const preferred = [
      valueKey,
      "value",
      "sales",
      "visitors",
      "count",
      "amount",
      "total",
    ].filter(Boolean) as Array<string>;
    for (const key of preferred) {
      if (typeof record[key] === "number") return key;
    }
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "number") return key;
    }
    return null;
  };

  const pickLabelKey = (record: Record<string, unknown>) => {
    const preferred = [
      labelKey,
      "label",
      "name",
      "month",
      "source",
      "title",
      "id",
    ].filter(Boolean) as Array<string>;
    for (const key of preferred) {
      if (typeof record[key] === "string") return key;
    }
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === "string") return key;
    }
    return null;
  };

  const result: Array<Datum> = [];

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    if (item === null || item === undefined) continue;

    if (typeof item === "number") {
      result.push({ label: String(i + 1), value: item });
      continue;
    }

    if (typeof item === "object") {
      const record = item as Record<string, unknown>;
      const resolvedValueKey = pickValueKey(record);
      const resolvedLabelKey = pickLabelKey(record);

      const value =
        resolvedValueKey && typeof record[resolvedValueKey] === "number"
          ? (record[resolvedValueKey] as number)
          : null;

      const label =
        resolvedLabelKey && typeof record[resolvedLabelKey] === "string"
          ? (record[resolvedLabelKey] as string)
          : resolvedLabelKey
            ? String(record[resolvedLabelKey])
            : String(i + 1);

      if (value === null) continue;
      result.push({ label, value });
    }
  }

  return result;
}

export function Chart({ element }: ComponentRenderProps) {
  const { title, dataPath, labelKey, valueKey } = element.props as {
    title?: string | null;
    dataPath: string;
    labelKey?: string | null;
    valueKey?: string | null;
  };
  const { data } = useData();
  const raw = getByPath(data, dataPath);
  const chartData = normalizeToSeries(raw, { labelKey, valueKey });

  if (!chartData || chartData.length === 0) {
    return <div style={{ padding: 20, color: "var(--muted)" }}>No data</div>;
  }

  const maxValue = Math.max(...chartData.map((d) => d.value));
  const axisMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
  const ticks = [1, 2 / 3, 1 / 3, 0].map((t) => axisMax * t);
  const barAreaHeight = 120;

  return (
    <div>
      {title && (
        <h4 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600 }}>
          {title}
        </h4>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 10 }}>
        <div
          style={{
            height: barAreaHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          {ticks.map((t, i) => (
            <span key={i}>{formatNumber(t)}</span>
          ))}
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              height: barAreaHeight,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              pointerEvents: "none",
            }}
          >
            {ticks.map((_, i) => (
              <div
                key={i}
                style={{
                  borderTop: "1px solid var(--border)",
                  opacity: i === ticks.length - 1 ? 0.7 : 0.35,
                }}
              />
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            {chartData.map((d, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    height: barAreaHeight,
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    title={`${d.label}: ${formatNumber(d.value)}`}
                    style={{
                      width: "100%",
                      height: `${(d.value / axisMax) * 100}%`,
                      background: "var(--foreground)",
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={d.label}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
