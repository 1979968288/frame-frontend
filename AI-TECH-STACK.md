# Frame AI 剧本创作平台 — 技术栈与 AI 功能实现文档

> 最后更新：2026-06-28

---

## 一、项目总览

Frame 是一个 **AI 辅助剧本创作平台**，采用前后端分离架构：

```
frame-frontend/
├── src/                     # React 前端
│   ├── components/workbench/  # 工作台（4 个创作模块）
│   ├── lib/api.ts            # AI 调用封装
│   └── ...
├── server/                  # Express 后端
│   ├── index.ts             # SSE 路由
│   ├── providers.ts         # AI 供应商适配（Anthropic / OpenAI）
│   └── prompts.ts           # 所有 Prompt 模板（14 种 Action）
└── vite.config.ts           # 开发代理 /api → localhost:3001
```

---

## 二、前端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 19.x | UI 构建 |
| 语言 | TypeScript | ~5.7 | 类型安全 |
| 构建 | Vite | 8.x | 开发/打包 |
| 样式 | Tailwind CSS | v4 | 原子化 CSS |
| 设计系统 | Impeccable Editorial | — | 暖纸/琥珀色系，oklch 色彩空间 |
| 文档解析 | mammoth | — | DOCX 文件读取 |
| HTTP | 原生 fetch | — | AI 流式请求 |

### 关键依赖（前端无 AI SDK）

前端 `package.json` 不包含任何 AI SDK（如 `@anthropic-ai/sdk`、`openai`），所有 AI 能力通过 `/api/generate` 代理实现。

---

## 三、后端技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 运行时 | Node.js + tsx | — | TypeScript 直接运行 |
| 框架 | Express | 4.x | HTTP 服务 |
| AI SDK | @anthropic-ai/sdk | ^0.39 | Anthropic Claude API |
| AI SDK | openai | ^4.73 | OpenAI / 兼容 API |
| 配置 | dotenv | ^16 | 环境变量 |
| 中间件 | cors | ^2.8 | 跨域 |

### 环境变量（`server/.env`）

```env
OPENAI_BASE_URL=https://api.openai.com/v1   # 非 Anthropic 密钥的 API 地址
OPENAI_MODEL=gpt-4o                          # 非 Anthropic 密钥的默认模型
PORT=3001                                     # 服务端口
```

---

## 四、AI 调用全链路（核心架构）

### 4.1 整体数据流

```
用户点击 "AI 生成" → React 组件调用 streamGenerate()
    → fetch POST /api/generate (SSE)
        → Vite 代理 → Express server (port 3001)
            → providers.ts: 根据 API Key 前缀选择供应商
                → Anthropic SDK / OpenAI SDK 流式调用
            → prompts.ts: 构建 System + User Prompt
        → SSE 流式返回 chunks
    → AsyncGenerator 逐块 yield
→ React 组件逐块更新 UI 状态
```

### 4.2 前端层 (`src/lib/api.ts`)

```typescript
// 核心函数：流式生成（AsyncGenerator 模式）
export async function* streamGenerate(
  module: "original" | "rewrite" | "adapt" | "evaluate",
  action: "synopsis" | "outline" | "script" | "polish" | ...,
  context: Record<string, unknown>
): AsyncGenerator<string, void, undefined>
```

**工作原理**：
1. 从 `localStorage` 读取 API Key（`frame_api_key`）
2. `fetch("/api/generate", { method: "POST", body: JSON.stringify({ module, action, context, apiKey }) })`
3. 使用 **ReadableStream API** 逐行解析 SSE 格式
4. `yield` 每个 `data: {"text":"..."}` 中的文本块
5. 遇到 `data: [DONE]` 结束

**组件调用模式**（每个 Step 组件都一样）：

```typescript
const handleGenerate = async () => {
  setGenerating(true);
  setOutput("");
  try {
    for await (const chunk of streamGenerate("original", "synopsis", {
      audience, genre, style, setting, worldview, highlight
    })) {
      setOutput((prev) => prev + chunk);  // 逐字显示
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setGenerating(false);
  }
};
```

### 4.3 后端路由层 (`server/index.ts`)

- **端点**：`POST /api/generate`
- **请求体**：`{ module, action, context, apiKey }`
- **响应**：SSE 流（`text/event-stream`）

```
data: {"text":"第一段文字..."}\n\n
data: {"text":"第二段文字..."}\n\n
data: [DONE]\n\n
```

- **限流**：`express.json({ limit: "50mb" })` 支持长文本上传
- **错误处理**：捕获后写入 `data: {"error":"..."}\n\n` + `data: [DONE]\n\n`

### 4.4 AI 供应商路由 (`server/providers.ts`)

根据 API Key 前缀自动选择供应商：

| API Key 前缀 | 供应商 | SDK | 默认模型 |
|-------------|--------|-----|---------|
| `sk-ant-` | Anthropic | `@anthropic-ai/sdk` | `claude-sonnet-4-20250514` |
| 其他 | OpenAI 兼容 | `openai` SDK | `OPENAI_MODEL` 环境变量（默认 `gpt-4o`） |

**OpenAI 兼容模式**支持任意符合 OpenAI API 格式的服务（DeepSeek、通义千问、Moonshot 等），只需设置 `OPENAI_BASE_URL` 和 `OPENAI_MODEL` 环境变量。

### 4.5 Prompt 工程层 (`server/prompts.ts`)

`buildPrompts(module, action, context)` 返回 `{ system, user }`：

```
buildPrompts(module, action, context)
  ├── module = "original"
  │   ├── "synopsis"          → 生成故事梗概（纯文本）
  │   ├── "generate_character" → 生成人物档案（纯文本）
  │   ├── "outline"            → 生成分集大纲（纯文本）
  │   ├── "script"             → 生成剧本正文（纯文本）
  │   └── "polish"             → 润色文本（纯文本）
  ├── module = "rewrite"
  │   ├── "detect_scenes"      → 场次识别（JSON）
  │   ├── "analyze_for_rewrite"→ 改写维度分析（JSON）
  │   └── "optimize"           → 逐场优化（纯文本）
  ├── module = "adapt"
  │   ├── "detect_chapters"    → 章节识别（JSON）
  │   ├── "extract_characters" → 人物提取（JSON）
  │   ├── "breakdown_chapters" → 章节拆解方案（JSON）
  │   ├── "adapt_chapter"      → 章节改编（纯文本）
  │   └── "polish"             → 润色（纯文本）
  └── module = "evaluate"
      ├── "recommend_dimensions" → 推荐评估维度（JSON）
      └── "analyze"              → 执行评估（JSON）
```

**输出类型**：
- **纯文本 Action**（6 个）：`synopsis`、`generate_character`、`outline`、`script`、`polish`、`optimize`、`adapt_chapter` — 直接流式显示
- **JSON Action**（7 个）：`detect_chapters`、`extract_characters`、`breakdown_chapters`、`detect_scenes`、`analyze_for_rewrite`、`recommend_dimensions`、`analyze` — 前端用正则 `/\{[\s\S]*\}/` 解析

**输入保护**：`truncateText()` 截断超过 80,000 字符的输入，防止超 context 限制。

---

## 五、四种创作模块 AI 功能清单

### 5.1 剧本原创 (original)

| 步骤 | 组件 | AI Action | 触发按钮 | 输入内容 | 输出 |
|------|------|-----------|---------|---------|------|
| 1. 故事梗概 | `SynopsisStep` | `synopsis` | "AI 补全" | 受众、类型、风格、设定、世界观、亮点 | 200-500 字梗概 |
| 2. 人物小传 | `CharacterStep` | `generate_character` | "AI 生成本人物" | 姓名、定位、年龄、性格、背景 + 梗概 | 性格+背景描写 |
| 3. 分集大纲 | `OutlineStep` | `outline` | "AI 生成集纲" | 梗概、人物、粗纲、已有集纲 | 12 集分集大纲 |
| 4. 剧本正文 | `ScriptStep` | `script` / `polish` | "AI 生成本集" / "AI 润色" | 梗概、人物、集纲 | 3000-5000 字剧本 |

### 5.2 剧本改写 (rewrite)

| 步骤 | 组件 | AI Action | 触发按钮 | 输入内容 | 输出 |
|------|------|-----------|---------|---------|------|
| 1. 剧本导入 | `ImportStep` | 无 | — | — | — |
| 2. 改写方向 | `DirectionStep` | `analyze_for_rewrite` | "AI 分析原文" | 剧本正文 | 维度推荐 JSON |
| 3. 深度优化 | `OptimizeStep` | `optimize` | "AI 逐场优化" | 场次原文、优化维度 | 改写后场次 |
| 4. 对比导出 | `ExportStep` | 无 | — | — | — |

### 5.3 网文改编 (adapt)

| 步骤 | 组件 | AI Action | 触发按钮 | 输入内容 | 输出 |
|------|------|-----------|---------|---------|------|
| 1. 网文导入 | `ImportStep` | `detect_chapters` | "AI 解析章节" | 网文全文 | 章节列表 JSON |
| 2. 人物梳理 | `CharacterStep` | `extract_characters` | "AI 提取人物" | 网文 + 章节信息 | 人物列表 JSON |
| 3. 章节拆解 | `BreakdownStep` | `breakdown_chapters` | "AI 拆解章节" | 章节 + 人物 | 改编方案 JSON |
| 4. 剧本生成 | `GenerateStep` | `adapt_chapter` / `polish` | "AI 生成本章" / "AI 润色" | 章节、情节、人物 | 2000-4000 字剧本 |

### 5.4 剧本评估 (evaluate)

| 步骤 | 组件 | AI Action | 触发按钮 | 输入内容 | 输出 |
|------|------|-----------|---------|---------|------|
| 1. 剧本上传 | `UploadStep` | 无 | — | — | — |
| 2. 维度选择 | `DimensionStep` | `recommend_dimensions` | "AI 推荐维度" | 剧本正文 | 维度推荐 JSON |
| 3. AI 分析 | `AnalysisStep` | `analyze` | "重新分析" | 剧本 + 维度配置 | 8 维评分 JSON |
| 4. 报告导出 | `ReportStep` | 无 | — | — | — |

---

## 六、如何新增一个 AI 功能

### 场景：在"剧本原创"模块新增一个"世界观生成"功能

### 步骤 1：定义 Action 类型（前端 + 后端同步）

```typescript
// src/lib/api.ts 和 server/prompts.ts 中的 Action 类型各添加
type Action = "..." | "world_building";
```

### 步骤 2：编写 Prompt（`server/prompts.ts`）

```typescript
case "world_building": {
  const genre = (ctx.genre as string) || "";
  return {
    system: `你是一个世界观设计师。根据题材生成详细的世界设定...`,
    user: `题材：${genre}\n请生成世界观设定。`,
  };
}
```

### 步骤 3：在组件中调用

```typescript
// WorldBuildingStep.tsx
import { streamGenerate } from "../../lib/api";

const handleGenerate = async () => {
  setGenerating(true);
  try {
    for await (const chunk of streamGenerate("original", "world_building", {
      genre, style, setting
    })) {
      setOutput((prev) => prev + chunk);
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setGenerating(false);
  }
};
```

### 步骤 4：在 Workbench 中注册新步骤

```typescript
// Workbench.tsx
const MODULE_STEPS: Record<ModuleKey, string[]> = {
  original: ["故事梗概", "世界观", "人物小传", "分集大纲", "剧本正文"], // 新增
  // ...
};
```

---

## 七、API Key 管理

- **存储位置**：浏览器 `localStorage`，键名 `frame_api_key`
- **设置入口**：左侧 Sidebar 底部 → 展开 → API Key 区域
- **前端读取**：每次调用 `streamGenerate()` 时从 localStorage 实时读取，传给后端
- **后端校验**：检查必填，但不持久化存储
- **多供应商**：以 `sk-ant-` 开头的 Key 走 Anthropic，其他走 OpenAI 兼容接口
- **安全建议**：生产环境应将 Key 移到服务端环境变量或用户认证系统，不再经浏览器传输

---

## 八、流式传输 (SSE) 协议规范

### 请求

```http
POST /api/generate HTTP/1.1
Content-Type: application/json

{
  "module": "original",
  "action": "synopsis",
  "context": { "genre": "科幻", "style": "硬核" },
  "apiKey": "sk-ant-..."
}
```

### 响应

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no

data: {"text":"在公元2147年，"}\n\n
data: {"text":"人类已经..."}\n\n
data: [DONE]\n\n
```

### 前端解析（`api.ts`）

```typescript
const reader = res.body!.getReader();       // ReadableStream
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6);
      if (data === "[DONE]") return;
      const { text, error } = JSON.parse(data);
      if (error) throw new Error(error);
      if (text) yield text;
    }
  }
}
```

---

## 九、开发与部署

### 本地开发

```bash
# 前端（端口 5173）
npm run dev

# 后端（端口 3001）
cd server && npm run dev
```

Vite 自动将 `/api/*` 代理到 `http://localhost:3001`。

### 生产部署

- **前端**：`npm run build` → `dist/` 静态文件，部署到 CDN / Nginx
- **后端**：`npm run build` (tsc) + `npm start`，需设置环境变量
- **代理**：Nginx 将 `/api/` 反向代理到 Node.js 服务

---

## 十、技术选型决策说明

| 决策 | 原因 |
|------|------|
| AsyncGenerator 而非回调 | 流式消费语义更自然，组件用 `for await...of` 即可 |
| API Key 由前端传到后端 | 无需用户系统即可使用；Key 不做服务端存储 |
| 单端点 `/api/generate` | 减少路由碎片；module + action 枚举即可覆盖所有功能 |
| SSE 而非 WebSocket | 单向流（服务端→客户端）足够；SSE 实现更轻量 |
| Prompt 集中在服务端 | 跨供应商一致性；避免前端泄露 Prompt 细节 |
| 双供应商支持 | Anthropic 侧重创作质量；OpenAI 兼容接口提供灵活性 |
