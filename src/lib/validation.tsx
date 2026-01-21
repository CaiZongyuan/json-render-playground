"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type {
  AuthState,
  DataModel,
  ValidationConfig,
  ValidationFunction,
  ValidationResult,
} from "@json-render/core";
import { getByPath, runValidation } from "@json-render/core";
import { useData } from "@json-render/react";

type FieldValidationState = {
  touched: boolean;
  validated: boolean;
  result: ValidationResult | null;
};

type ValidationContextValue = {
  customFunctions: Record<string, ValidationFunction>;
  fieldStates: Record<string, FieldValidationState>;
  validate: (path: string, config: ValidationConfig) => ValidationResult;
  touch: (path: string) => void;
  clear: (path: string) => void;
  validateAll: () => boolean;
  registerField: (path: string, config: ValidationConfig) => void;
};

const ValidationContext = createContext<ValidationContextValue | null>(null);

export function ValidationProvider({
  customFunctions = {},
  children,
}: {
  customFunctions?: Record<string, ValidationFunction>;
  children: React.ReactNode;
}) {
  const { data, authState } = useData() as { data: DataModel; authState?: AuthState };
  const [fieldStates, setFieldStates] = useState<
    Record<string, FieldValidationState>
  >({});
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, ValidationConfig>>(
    {},
  );

  const registerField = useCallback((path: string, config: ValidationConfig) => {
    setFieldConfigs((prev) => ({ ...prev, [path]: config }));
    setFieldStates((prev) =>
      prev[path]
        ? prev
        : {
            ...prev,
            [path]: { touched: false, validated: false, result: null },
          },
    );
  }, []);

  const validate = useCallback(
    (path: string, config: ValidationConfig) => {
      const value = getByPath(data, path);
      const result = runValidation(config, {
        value,
        dataModel: data,
        customFunctions,
        authState,
      });

      setFieldStates((prev) => ({
        ...prev,
        [path]: {
          touched: true,
          validated: true,
          result,
        },
      }));

      return result;
    },
    [data, customFunctions, authState],
  );

  const touch = useCallback((path: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [path]: {
        touched: true,
        validated: prev[path]?.validated ?? false,
        result: prev[path]?.result ?? null,
      },
    }));
  }, []);

  const clear = useCallback((path: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [path]: { touched: false, validated: false, result: null },
    }));
  }, []);

  const validateAll = useCallback(() => {
    let allValid = true;
    for (const [path, config] of Object.entries(fieldConfigs)) {
      const result = validate(path, config);
      if (!result.valid) allValid = false;
    }
    return allValid;
  }, [fieldConfigs, validate]);

  const value = useMemo<ValidationContextValue>(
    () => ({
      customFunctions,
      fieldStates,
      validate,
      touch,
      clear,
      validateAll,
      registerField,
    }),
    [customFunctions, fieldStates, validate, touch, clear, validateAll, registerField],
  );

  return (
    <ValidationContext.Provider value={value}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const ctx = useContext(ValidationContext);
  if (!ctx) throw new Error("useValidation must be used within a ValidationProvider");
  return ctx;
}

export function useFieldValidation(path: string, config?: ValidationConfig) {
  const { fieldStates, validate: validateField, touch: touchField, clear, registerField } =
    useValidation();

  React.useEffect(() => {
    if (config) registerField(path, config);
  }, [path, config, registerField]);

  const state = fieldStates[path] ?? {
    touched: false,
    validated: false,
    result: null,
  };

  const validate = useCallback(
    () => validateField(path, config ?? { checks: [] }),
    [path, config, validateField],
  );
  const touch = useCallback(() => touchField(path), [path, touchField]);

  return {
    state,
    validate,
    touch,
    clear: () => clear(path),
    errors: state.result?.errors ?? [],
    isValid: state.result?.valid ?? true,
  };
}
