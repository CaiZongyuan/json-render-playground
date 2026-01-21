## nextjs-json-render

在真实的 Next.js 应用中学习 **json-render** 的交互式 Playground。

**json-render**: [https://github.com/vercel-labs/json-render](https://github.com/vercel-labs/json-render)

本项目专注于 json-render 项目中的核心概念：
- **UI Tree** (`UITree`)：`root` + 扁平的 `elements` 映射
- **组件注册表**：映射 `type -> React 组件`
- **JSONL 补丁**：使用 `set/add/replace/remove` 修改树
- **数据绑定**：通过 JSON Pointer 路径读/写数据（例如 `/form/email`）
- **验证**：字段检查 + 验证状态调试
- **动作**：由应用处理的命名动作，带执行日志

额外的学习友好特性：
- **Live preview 悬浮定位 JSON**：鼠标悬浮到组件 → 右侧 JSON tree 高亮对应 element
- **JSON tree 顺序更贴近渲染**：Elements 按 UI 树遍历顺序展示（root → children）
- **List/Chart 默认可见**：示例数据能直接渲染成列表/图表（无需额外 children 模板）

---

## 快速开始

```bash
bun install
bun run dev
```

打开 `http://localhost:3000`。

其他命令：
```bash
bun run lint
bun run build
```

---

## Playground 工作原理

UI 是三栏布局：
- **左侧**：补丁编辑器 + "添加"构建器 + 学习面板（数据/验证/动作）
- **中间**：**实时预览**（渲染当前的树）
- **右侧**：**JSON 树查看器**（元素默认折叠）

使用 **实时预览**上方的面板按钮来**隐藏/显示** Playground 或 JSON 面板。

### Live preview 悬浮 → JSON 高亮（元素定位）

为了方便“从 UI 找回 JSON”，本项目在渲染时为每个 element 包了一层 `data-ui-key`：
- **渲染侧**：`src/components/playground/inspectable-renderer.tsx`
- **事件代理**：`src/app/page.tsx` 的 Live preview 容器使用 `onPointerMoveCapture` + `closest('[data-ui-key]')` 得到 `element.key`
- **高亮展示**：`src/components/playground/json-tree-panel.tsx`

这套方式的优点是：
- 不需要改每个 UI 组件的 DOM 结构（统一在 Renderer 层做 “打标”）
- 高亮不会影响布局（wrapper 使用 `display: contents`）

---

## 截图

**实时预览 + Playground**

![实时预览 + Playground](assets/images/playground01.png)

**实时预览 + JSON 树**

![实时预览 + JSON 树](assets/images/playground02.png)

**Playground + 实时预览 + JSON 树**

![Playground + 实时预览 + JSON 树](assets/images/playground03.png)

---

## JSONL 补丁（支持的操作）

编辑器接受 **JSON Lines**（每行一个 JSON 对象）。
- 空行和以 `//` 开头的行会被忽略。
- 支持的操作：`set`、`add`、`replace`、`remove`

常用路径：
- `/root` (字符串) — 设置根元素键
- `/elements/{key}` — 添加/替换整个元素
- `/elements/{key}/props/...` — 更新嵌套的属性
- `/elements/{key}/children` — 替换子元素数组（推荐）

示例：替换标题
```json
{"op":"replace","path":"/elements/main-heading/props/text","value":"Hello from patches!"}
```

示例：添加 `Text` 元素并将其附加到 `root.children`
```json
{"op":"add","path":"/elements/demo-text","value":{"key":"demo-text","type":"Text","props":{"content":"(Added) This is a new Text element","variant":"muted"},"parentKey":"root"}}
{"op":"replace","path":"/elements/root/children","value":["page-header","alert-section","metrics-grid","charts-grid","forms-section","data-table-section","actions-section","divider-demo","list-demo","demo-text"]}
```

注意事项：
- `remove` 会删除元素键（在本演示中也会删除其后代 + 清理悬空引用）。
- 删除父元素引用的元素时，通常还需要修补父元素的 `children`（或使用演示的 subtree-remove 行为）。

---

## 动作

按钮可以按名称声明动作（以及可选参数）：
```json
{
  "type": "Button",
  "props": {
    "label": "Export (JSON)",
    "variant": "secondary",
    "action": { "name": "exportData", "params": { "format": "json" } }
  }
}
```

动作由应用代码处理（`src/lib/mockData.ts`），Playground 记录：
- 动作名称
- 参数
- 状态（运行中/成功/错误）

关于 `params`：
- `@json-render/core` 会把没有参数的 action 归一化成 `params: {}`，为了不让日志充满空对象，本项目把它展示为 `params: (none)`

试试看：
1. 在 Playground 中点击 **Add action button (example)**。
2. 在 UI 中点击新按钮。
3. 查看 **Actions (execution log)** 面板。

---

## 数据绑定 + 验证

`TextField`、`Select` 和 `DatePicker` 等组件使用 JSON Pointer 路径绑定到数据（例如 `/form/email`）。

Playground 包括：
- **数据面板**：设置任何路径/值以查看实时更新
- **验证面板**：查看字段验证状态并运行 `Validate all`

试试看：
1. 使用数据面板将 `/form/email` 设置为 `"bad-email"`。
2. 聚焦/失焦邮件字段（或使用 **Validate all**）。
3. 在 UI + 验证面板中查看验证错误。

### 关于 Touch / Validate 的语义

- `Touch`：只标记“用户已交互”，通常用于“决定何时展示错误”
- `Validate`：真正运行校验规则并写入 `fieldStates[path].result`

因此 `Touch all` 可能看起来“没反应”，但你会看到 Validation panel 里的 `touched=true`；只有 `Validate all`（或输入框触发 validate）才会产生错误列表。

### 校验实现说明（学习用重要）

本项目使用本地实现的 ValidationProvider（`src/lib/validation.tsx`），原因是当前 `@json-render/react` 内部校验对嵌套路径取值方式不适配（会导致 `/form/email` 一类路径取值为 `undefined`，从而一直 invalid）。

---

## List / Chart 的数据形状（示例能跑通）

### List

`List` 默认会读取 `dataPath` 的数组并做一个“学习友好”的默认渲染：
- `string/number/boolean` 直接显示
- `{ name, value }` 显示为 “name — value”
- 其他对象 fallback 为 JSON

实现：`src/components/ui/list.tsx`

### Chart

`Chart` 默认支持常见的数组对象形状：
- `{ label, value }`（最标准）
- `{ month, sales }`（Monthly Sales）
- `{ source, visitors }`（Traffic by Source）

也支持用 `labelKey/valueKey` 显式指定字段名（当你的数据不是上述命名时）。

实现：`src/components/ui/chart.tsx`

---

## 仓库文件指针

- UI 页面：`src/app/page.tsx`
- 组件注册表：`src/components/ui/index.ts`
- 补丁工具 + 示例：`src/lib/patchUtils.ts`
- 演示初始树：`src/lib/mockPatches.ts`
- 演示数据/动作：`src/lib/mockData.ts`
- 校验 Provider（应用侧）：`src/lib/validation.tsx`
- 故障排除说明：`docs/troubleshooting-nextjs-hydration-and-update-depth.md`

---

## 常见问题（Troubleshooting）

- 网络受限环境 Google Fonts 失败：`src/app/layout.tsx` 使用 `next/font/google`，离线构建时可切换到 `next/font/local`（或移除字体）
- 状态更新/渲染抖动问题：参考 `docs/troubleshooting-nextjs-hydration-and-update-depth.md`
