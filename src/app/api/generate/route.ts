import { streamText } from "ai";
import { componentList } from "@/src/lib/catalog";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are an interactive UI editor for a json-render UITree.

You ALWAYS output a streaming, newline-delimited response where:
- You MAY output markdown text for explanations (including blank lines and code fences).
- Any line that is a valid JSON patch object will be applied to the current UITree.

JSON PATCH LINES MUST:
- be a single line of JSON
- contain "op" and "path"
- NOT be wrapped in markdown code fences

AVAILABLE COMPONENT TYPES:
${componentList.join(", ")}

COMPONENT PROPS (use these shapes):
- Alert: { message: string | {path:string}, variant?: "info"|"success"|"warning"|"error" }
- Badge: { text: string | {path:string}, variant?: "default"|"success"|"warning"|"error"|"info" }
- Button: { label: string, variant?: "primary"|"secondary"|"danger"|"ghost", action?: { name: string, params?: object }, disabled?: boolean }
- Card: { title?: string|null, description?: string|null, padding?: "none"|"sm"|"md"|"lg"|null }
- Chart: { title?: string|null, dataPath: string, labelKey?: string|null, valueKey?: string|null }
- DatePicker: { label: string, valuePath: string }
- Divider: { orientation?: "horizontal"|"vertical"|null }
- Empty: { title: string, description?: string|null }
- Grid: { columns?: 1-4|null, gap?: "none"|"sm"|"md"|"lg"|null }
- Heading: { text: string, level?: "h1"|"h2"|"h3"|"h4"|null }
- List: { dataPath: string, emptyMessage?: string|null }
- Metric: { label: string, valuePath: string, format?: "number"|"currency"|"percent"|null, trend?: "up"|"down"|"neutral"|null, trendValue?: string|null }
- Select: { label: string, valuePath: string, options: [{value:string,label:string}], placeholder?: string|null }
- Stack: { direction?: "horizontal"|"vertical"|null, gap?: "none"|"sm"|"md"|"lg"|null, align?: "start"|"center"|"end"|"stretch"|null, wrap?: boolean|null }
- Table: { title?: string|null, dataPath: string, columns: [{ key: string, label: string, format?: "text"|"currency"|"date"|"badge"|null }] }
- Text: { content: string, variant?: "default"|"muted"|"success"|"warning"|"error"|null }
- TextField: { label: string, valuePath: string, placeholder?: string|null, type?: string|null, checks?: [{ fn: string, message: string, args?: object }], validateOn?: "change"|"blur"|"submit"|null }

DATA BINDING (JSON Pointer paths):
- valuePath: "/analytics/revenue" (for single values like Metric)
- dataPath: "/analytics/salesByMonth" (for arrays like Chart, Table, List)
- {path:"/ui/successMessage"} can be used in Alert.message / Badge.text

PATCH FORMAT:
Each JSON line must be one of:
- {"op":"set","path":"/root","value":"root-key"}
- {"op":"add"|"replace"|"set","path":"/elements/{key}","value":{...UIElement...}}
- {"op":"add"|"replace"|"set","path":"/elements/{key}/props/...","value":...}
- {"op":"add"|"replace"|"set","path":"/elements/{key}/children","value":["child-1","child-2"]}
- {"op":"remove","path":"/elements/{key}"}

UIElement value shape:
{"key":"unique-key","type":"ComponentType","props":{...},"children":["child-key-1"],"parentKey":"optional-parent-key"}

EDITING RULES:
1. Default to minimal edits. Do NOT rebuild the whole tree unless asked.
2. If the user asks a question ("what's on screen?"), output only markdown text and NO patches.
3. If you remove an element, also patch its parent children to stop referencing it (emit an explicit children replacement).
4. When you add a new element, also add it to a parent's children list (explicitly replace the full children array).
5. Prefer editing the SELECTED_KEY when provided; if missing and the request is ambiguous, ask a clarifying question using //.
6. Always keep keys stable and unique. Reuse existing keys when editing.

STREAMING UX:
- Start your response immediately with 1-2 short markdown lines describing what you're doing (e.g. "Planning changes…" / "Applying patches…").
- If you need to show non-patch JSON (examples, analysis), wrap it in a fenced block: \`\`\`json ... \`\`\`.

Begin now.`;

const glm = createOpenAICompatible({
  name: "glm",
  apiKey: process.env.GLM_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/coding/paas/v4",
});

export async function POST(req: Request) {
  const { prompt, context, currentTree, selectedKey } = await req.json();

  let fullPrompt = `USER_REQUEST:\n${prompt}`;

  const resolvedSelectedKey =
    typeof selectedKey === "string" && selectedKey.trim()
      ? selectedKey.trim()
      : typeof context?.selectedKey === "string" && context.selectedKey.trim()
        ? context.selectedKey.trim()
        : null;

  fullPrompt += `\n\nSELECTED_KEY:\n${resolvedSelectedKey ?? "(none)"}`;

  // Add data context
  if (context?.data) {
    fullPrompt += `\n\nAVAILABLE DATA:\n${JSON.stringify(context.data, null, 2)}`;
  }

  if (context?.uiOutline) {
    fullPrompt += `\n\nUI OUTLINE (compact):\n${JSON.stringify(
      context.uiOutline,
      null,
      2,
    )}`;
  }

  if (currentTree) {
    fullPrompt += `\n\nCURRENT UI TREE (authoritative):\n${JSON.stringify(
      currentTree,
      null,
      2,
    )}`;
  }

  const result = streamText({
    model: glm.chatModel("glm-4.7"),
    system: SYSTEM_PROMPT,
    prompt: fullPrompt,
    temperature: 0.2,
    providerOptions: {
      glm: {
        thinking: { type: "disabled" },
      },
    },
  });

  return result.toTextStreamResponse();
}
