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

---

## 快速开始

```bash
bun install
bun run dev
```

打开 `http://localhost:3000`。

---

## Playground 工作原理

UI 是三栏布局：
- **左侧**：补丁编辑器 + "添加"构建器 + 学习面板（数据/验证/动作）
- **中间**：**实时预览**（渲染当前的树）
- **右侧**：**JSON 树查看器**（元素默认折叠）

使用 **实时预览**上方的面板按钮来**隐藏/显示** Playground 或 JSON 面板。

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

---

## 仓库文件指针

- UI 页面：`src/app/page.tsx`
- 组件注册表：`src/components/ui/index.ts`
- 补丁工具 + 示例：`src/lib/patchUtils.ts`
- 演示初始树：`src/lib/mockPatches.ts`
- 演示数据/动作：`src/lib/mockData.ts`
- 故障排除说明：`docs/troubleshooting-nextjs-hydration-and-update-depth.md`

