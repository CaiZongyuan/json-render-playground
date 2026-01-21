import { UITree, setByPath } from "@json-render/core";

function cloneTree(tree: UITree): UITree {
  if (typeof structuredClone === "function") {
    return structuredClone(tree);
  }
  return JSON.parse(JSON.stringify(tree)) as UITree;
}

function getDescendantKeys(tree: UITree, rootKey: string): Set<string> {
  const keysToRemove = new Set<string>();
  const stack: Array<string> = [rootKey];

  while (stack.length > 0) {
    const currentKey = stack.pop();
    if (!currentKey || keysToRemove.has(currentKey)) continue;
    keysToRemove.add(currentKey);

    const element = tree.elements[currentKey] as unknown as
      | { children?: unknown }
      | undefined;
    if (!element) continue;

    const children = element.children;
    if (!Array.isArray(children)) continue;

    for (const childKey of children) {
      if (typeof childKey === "string") {
        stack.push(childKey);
      }
    }
  }

  return keysToRemove;
}

/**
 * Apply a single patch operation to a tree
 */
export function applySinglePatch(
  tree: UITree,
  patchStr: string
): { success: boolean; tree: UITree; error?: string } {
  try {
    const patch = JSON.parse(patchStr);

    // Deep clone the tree to avoid mutations
    const newTree: UITree = cloneTree(tree);

    if (patch.op === "remove") {
      // Remove operation
      if (patch.path.startsWith("/elements/")) {
        const key = patch.path.replace("/elements/", "");
        const keysToRemove = getDescendantKeys(newTree, key);
        for (const k of keysToRemove) {
          delete newTree.elements[k];
        }

        // Remove any remaining references to removed keys
        for (const element of Object.values(newTree.elements) as Array<{
          children?: unknown;
          parentKey?: unknown;
        }>) {
          if (Array.isArray(element.children)) {
            element.children = element.children.filter(
              (childKey) =>
                typeof childKey === "string" && !keysToRemove.has(childKey),
            );
          }
          if (
            typeof element.parentKey === "string" &&
            keysToRemove.has(element.parentKey)
          ) {
            element.parentKey = null;
          }
        }

        if (keysToRemove.has(newTree.root)) {
          newTree.root = "";
        }
      } else {
        return {
          success: false,
          tree,
          error: "Remove only supports /elements/{key}",
        };
      }
    } else {
      // set/add/replace operations - use setByPath
      const target: Record<string, unknown> =
        newTree as unknown as Record<string, unknown>;
      setByPath(target, patch.path, patch.value);
    }

    return { success: true, tree: newTree };
  } catch (e) {
    return {
      success: false,
      tree,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Apply multiple patches
 */
export function applyPatches(
  tree: UITree,
  patchesStr: string
): { success: boolean; tree: UITree; error?: string } {
  try {
    const lines = patchesStr.trim().split("\n");
    let currentTree = tree;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) continue;

      const result = applySinglePatch(currentTree, trimmed);
      if (!result.success) {
        return result;
      }
      currentTree = result.tree;
    }

    return { success: true, tree: currentTree };
  } catch (e) {
    return {
      success: false,
      tree,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Example patches for testing
 */
export const EXAMPLE_PATCHES = {
  // Replace: Change the main heading text
  replaceHeading: `{"op":"replace","path":"/elements/main-heading/props/text","value":"Hello, Patched Title!"}`,

  // Replace: Change card title
  replaceCardTitle: `{"op":"replace","path":"/elements/metric-revenue/props/title","value":"Updated Revenue (Patched)"}`,

  // Add: Add a Text element to the root (assumes the initial demo tree)
  addTextToRoot: `{"op":"add","path":"/elements/demo-text","value":{"key":"demo-text","type":"Text","props":{"content":"(Added) This is a new Text element","variant":"muted"},"parentKey":"root"}}
{"op":"replace","path":"/elements/root/children","value":["page-header","alert-section","metrics-grid","charts-grid","forms-section","data-table-section","actions-section","divider-demo","list-demo","demo-text"]}`,

  // Add + Action: Add an export button (assumes the initial demo tree)
  addActionButton: `{"op":"add","path":"/elements/btn-export-data","value":{"key":"btn-export-data","type":"Button","props":{"label":"Export (JSON)","variant":"secondary","action":{"name":"exportData","params":{"format":"json"}}},"parentKey":"actions-stack"}}
{"op":"replace","path":"/elements/actions-stack/children","value":["btn-primary","btn-secondary","btn-danger","btn-ghost","btn-disabled","btn-export-data"]}`,

  // Add + Validation: Add a phone field with checks (assumes the initial demo tree)
  addValidatedField: `{"op":"add","path":"/elements/text-field-phone","value":{"key":"text-field-phone","type":"TextField","props":{"label":"Phone","valuePath":"/form/phone","placeholder":"e.g. +1 555 123 4567","type":"tel","checks":[{"fn":"required","message":"Phone is required"},{"fn":"pattern","args":{"pattern":"^\\\\+?[0-9\\\\- ]{7,}$"},"message":"Invalid phone format"}],"validateOn":"change"},"parentKey":"form-stack"}}
{"op":"replace","path":"/elements/form-stack/children","value":["text-field-name","text-field-email","text-field-phone","select-role","date-picker-start","form-buttons"]}`,

  // Replace: Change children array (remove metric-growth)
  removeGrowthFromChildren: `{"op":"replace","path":"/elements/metrics-grid/children","value":["metric-revenue","metric-users","metric-orders"]}`,

  // Remove: Delete an element completely
  removeListDemo: `{"op":"remove","path":"/elements/list-demo"}`,

  // Remove + Replace: Remove element and update parent's children
  removeListDemoAndUpdateParent: `{"op":"remove","path":"/elements/list-demo"}
{"op":"replace","path":"/elements/root/children","value":["page-header","alert-section","metrics-grid","charts-grid","forms-section","data-table-section","actions-section","divider-demo"]}`,
};
