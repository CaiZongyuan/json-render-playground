"use client";

import { useMemo } from "react";
import { type ComponentRenderProps } from "@json-render/react";
import { useData } from "@json-render/react";
import { useFieldValidation } from "@/src/lib/validation";
import { getByPath } from "@json-render/core";

export function TextField({ element }: ComponentRenderProps) {
  const { label, valuePath, placeholder, type, checks, validateOn } =
    element.props as {
      label: string;
      valuePath: string;
      placeholder?: string | null;
      type?: string | null;
      checks?: Array<{ fn: string; message: string }> | null;
      validateOn?: string | null;
    };

  const { data, set } = useData();
  const value = getByPath(data, valuePath) as string | undefined;
  const validationConfig = useMemo(
    () => ({
      checks: checks ?? undefined,
      validateOn: (validateOn as "change" | "blur" | "submit") ?? "blur",
    }),
    [checks, validateOn],
  );
  const { state, errors, validate, touch } = useFieldValidation(valuePath, validationConfig);
  const showErrors = state.touched && errors.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 14, fontWeight: 500 }}>{label}</label>
      <input
        type={type || "text"}
        value={value ?? ""}
        onChange={(e) => {
          set(valuePath, e.target.value);
          if (validateOn === "change") validate();
        }}
        onBlur={() => {
          touch();
          if (validateOn === "blur" || !validateOn) validate();
        }}
        placeholder={placeholder ?? ""}
        style={{
          padding: "8px 12px",
          borderRadius: "var(--radius)",
          border:
            showErrors ? "1px solid #ef4444" : "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--foreground)",
          fontSize: 16,
          outline: "none",
        }}
      />
      {showErrors &&
        errors.map((error, i) => (
          <span key={i} style={{ fontSize: 12, color: "#ef4444" }}>
            {error}
          </span>
        ))}
    </div>
  );
}
