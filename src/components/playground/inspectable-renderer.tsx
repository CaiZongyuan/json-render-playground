"use client";

import type { ComponentType, ReactNode } from "react";
import type { Action, UIElement, UITree } from "@json-render/core";
import { useActions, useIsVisible } from "@json-render/react";

type ComponentRenderProps<P = Record<string, unknown>> = {
  element: UIElement<string, P>;
  children?: ReactNode;
  onAction?: (action: Action) => void;
  loading?: boolean;
};

type UnknownElementProps = Record<string, unknown>;

type ComponentRegistry = Record<
  string,
  ComponentType<ComponentRenderProps<UnknownElementProps>>
>;

type InspectableRendererProps = {
  tree: UITree | null;
  registry: ComponentRegistry;
  loading?: boolean;
  fallback?: ComponentType<ComponentRenderProps<UnknownElementProps>>;
};

function InspectableElementRenderer({
  element,
  tree,
  registry,
  loading,
  fallback,
}: {
  element: UIElement;
  tree: UITree;
  registry: ComponentRegistry;
  loading?: boolean;
  fallback?: ComponentType<ComponentRenderProps<UnknownElementProps>>;
}) {
  const isVisible = useIsVisible(element.visible);
  const { execute } = useActions();

  if (!isVisible) return null;

  const Component = registry[element.type] ?? fallback;
  if (!Component) {
    console.warn(`No renderer for component type: ${element.type}`);
    return null;
  }

  const children = element.children?.map((childKey) => {
    const childElement = tree.elements[childKey];
    if (!childElement) return null;
    return (
      <InspectableElementRenderer
        key={childKey}
        element={childElement}
        tree={tree}
        registry={registry}
        loading={loading}
        fallback={fallback}
      />
    );
  });

  return (
    <div
      data-ui-key={element.key}
      data-ui-type={element.type}
      style={{ display: "contents" }}
    >
      <Component element={element} onAction={execute} loading={loading}>
        {children}
      </Component>
    </div>
  );
}

export function InspectableRenderer({
  tree,
  registry,
  loading,
  fallback,
}: InspectableRendererProps) {
  if (!tree || !tree.root) return null;
  const rootElement = tree.elements[tree.root];
  if (!rootElement) return null;

  return (
    <InspectableElementRenderer
      element={rootElement}
      tree={tree}
      registry={registry}
      loading={loading}
      fallback={fallback}
    />
  );
}
