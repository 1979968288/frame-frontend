# 剧本改写模块 PRD

> Frame AI 剧本生成平台 · 前端 PRD · 2026-06-23

---

## 1. 执行摘要

为 Frame 平台的「剧本改写」模块提供完整的前端功能规格。该模块允许用户导入已有剧本（PDF/FDX/Markdown/TXT），选择改写维度与深度，AI 将逐场优化并输出原文与改写版本的逐场对比，最终可导出为 PDF / Markdown / Final Draft 格式。模块采用与「剧本原创」一致的 4 步工作台模式，复用 Impeccable 设计系统（OKLCH 暖纸琥珀 + editorial typography），确保全平台体验一致。

---

## 2. 问题陈述

### 谁有这个问题？
- **编剧 / 剧本策划** — 已完成初稿，需要专业视角优化特定维度（节奏拖沓、对白生硬、人物扁平、冲突不足）
- **影视公司责编** — 收到外部投稿，需要快速改写为制作级剧本
- **网文作者转编剧** — 已有文本内容，需要将其转化为符合行业格式的剧本

### 问题是什么？
传统剧本改写依赖人工逐行修改，耗时巨大（一集 45 分钟剧本平均需要 2-3 天改写）。缺乏结构化的改写框架，修改方向模糊、缺少对比参照、导出格式碎片化。

### 为什么痛？
- **效率低下** — 人工改写一季 12 集剧本需要 30+ 工作日
- **质量不稳定** — 改写质量依赖个人经验，缺乏系统化维度拆解
- **对比困难** — 原文与改写版本缺少逐场对照工具，难以评估改写效果

---

## 3. 目标用户与角色

### 主要用户画像

| 维度 | 描述 |
|------|------|
| **角色** | 职业编剧 / 剧本策划 |
| **使用场景** | 完成剧本初稿后，使用 AI 工具对特定维度进行系统性优化 |
| **核心目标** | 在 1-2 个工作日内完成一季剧本的系统性改写 |
| **痛点** | 人工改写效率低；改写方向缺乏框架；难以量化评估改写效果 |
| **技术水平** | 中等 — 熟悉剧本软件，能操作文件导入导出 |

### 次级用户
- **责编** — 需要评估改写质量，查看对比差异
- **独立创作者** — 预算有限，需要 AI 替代昂贵的人工改写服务

---

## 4. 战略背景

### 与平台关系
- 「剧本改写」是 Frame 四大创作模块之一（剧本原创 / 剧本改写 / 网文改编 / 剧本评估）
- 补全平台从"从零创作"到"基于素材创作"的能力矩阵
- 复用现有 StepNav / FormControls / Sidebar 等工作台基础设施

### 技术约束
- 纯前端阶段（暂无后端 API / AI 集成），所有交互以 UI 原型 + mock 数据呈现
- React 19 + TypeScript + Tailwind CSS v4，不允许引入额外依赖
- 遵循现有 Impeccable 设计系统中的 CSS 变量（`--color-*`, `--radius-*`, `--font-*`）

---

## 5. 解决方案概述

### 4 步工作流

```
剧本导入 → 改写方向 → 深度优化 → 对比导出
  (Step 0)    (Step 1)    (Step 2)    (Step 3)
```

| 步骤 | 名称 | 用户目标 | 核心交互 |
|------|------|----------|----------|
| 01 | 剧本导入 | 将剧本文件导入系统 | 文件上传 (拖拽) / 文本粘贴 双模式切换 |
| 02 | 改写方向 | 选择优化维度与深度 | 4 维度 checkbox + 3 级深度选择器 |
| 03 | 深度优化 | 逐场查看/编辑原文与改写 | 场次 Tab 切换 + 左右双栏对比 + 差异高亮 |
| 04 | 对比导出 | 选择格式并导出 | 格式卡片选择 + 改写摘要统计面板 |

### 整体布局

```
┌──────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Bar (工作台 / 剧本改写)    [自动保存] [预览]   │
│         ├────────────────────────────────────────────────────┤
│ 剧本原创 │  StepNav:  01 剧本导入 → 02 改写方向 → 03 深度优化 → 04 对比导出   │
│ 剧本改写◀│────────────────────────────────────────────────────┤
│ 网文改编 │                                                    │
│ 剧本评估 │              Step Component Area                   │
│         │            (max-width: 880-1400px)                  │
│         │                                                    │
│         │  [保存并继续]  [AI xxx]        下一步：xxx →       │
│         ├────────────────────────────────────────────────────┤
│ 算力    │                                                    │
│ 用户    │                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. 成功指标

> 注：当前阶段为 UI 原型验证，指标以定性&可用性为准。

| 指标类型 | 指标 | 目标 |
|----------|------|------|
| **可用性** | 4 步流程完成率 | 用户能不借助提示走完 4 步 |
| **交互完备性** | 所有可交互元素响应率 | 100%（按钮/输入/切换/hover） |
| **视觉一致性** | 与设计系统的偏差 | 零偏差 — 仅使用 CSS 变量 |
| **代码质量** | TypeScript 编译 | 零错误 |

---

## 7. 用户故事与功能规格

### 史诗假设

> 我们相信为编剧提供一个结构化的 4 步剧本改写工作台（导入 → 选维度 → 逐场优化 → 导出对比），能使用户在 10 分钟内完成改写任务设定并预览对比效果，因为每一步都有清晰的目标、即时反馈和明确的操作路径。

---

### Story 1: 剧本导入 (Step 01)

**作为** 编剧，**我想要** 通过上传文件或粘贴文本导入已有剧本，**以便** 开始改写流程。

#### 功能规格

| 属性 | 说明 |
|------|------|
| 组件 | `rewrite/ImportStep.tsx` |
| 布局 | 居中单栏，max-width: 880px |

#### 交互说明

**模式切换：**
- 顶部提供"上传文件"和"粘贴文本"两个 Toggle 按钮（RadioGroup 风格）
- 默认选中"上传文件"模式
- 切换模式时不清除已导入内容

**文件上传模式：**
- 拖拽区域 (dashed border, 2px)：支持 click 选择 + drag & drop
- 接受格式：`.pdf, .fdx, .md, .txt, .docx`
- 拖入时 border 变为 accent 色 (`--color-accent`)，背景变为 `--color-accent-whisper`
- 选择文件后用 FileReader 读取文本内容
- 成功后在下方显示文件名 + 绿色对勾确认条
- 提供"移除"按钮清除已选文件

**文本粘贴模式：**
- 显示 TextArea (height: 320px)，带字数统计
- placeholder: "粘贴完整的剧本文本…"

**底部操作栏：**
- 左：[保存并继续] 按钮（primary，未导入时 disabled）
- 右：文字提示 "下一步：改写方向 →"

#### 状态定义

```typescript
interface ImportState {
  importMode: "file" | "paste";     // 当前导入模式
  dragOver: boolean;                 // 拖拽悬停状态
  fileName: string | null;          // 已选文件名
  pastedText: string;               // 粘贴/读取的文本内容
}
```

#### 验收条件
- [ ] 两种导入模式可切换
- [ ] 文件拖拽上传可触发 dragOver 视觉反馈
- [ ] 选中文件后显示文件名确认条
- [ ] 未导入内容时 [保存并继续] 按钮 disabled
- [ ] 粘贴模式下有字数统计

---

### Story 2: 改写方向 (Step 02)

**作为** 编剧，**我想要** 从节奏、对白、人物、冲突四个维度中选择改写方向并设定深度，**以便** AI 聚焦于我关心的维度进行优化。

#### 功能规格

| 属性 | 说明 |
|------|------|
| 组件 | `rewrite/DirectionStep.tsx` |
| 布局 | 居中单栏，max-width: 880px |

#### 交互说明

**维度卡片：**
- 4 个维度以卡片列表形式展示（gap: 16px）
- 每个卡片包含：
  - 左侧 checkbox（18×18，选中时 accent 色填充 + 白色对勾）
  - 维度名称（15px, fontWeight: 500）
  - 维度描述（12px, color-mid）
  - 选中时展开深度选择器（3 级按钮：轻度 / 中度 / 深度）
- 选中卡片整体边框变为 accent 色，背景变为 `--color-accent-whisper`

**深度选择器：**
- 仅在维度被选中时显示
- 3 个按钮：轻度(1) / 中度(2) / 深度(3)
- 当前选中级别用 accent 色填充，其余为 `--color-warm-cream` 背景
- 默认值为"中度"(2)

**底部操作栏：**
- 左：[保存并继续]（至少选中 1 个维度方可点击）
- 中：[AI 分析原文]（secondary，暂无 handler）
- 右："下一步：深度优化 →"

#### 状态定义

```typescript
interface Dimension {
  key: string;         // "rhythm" | "dialogue" | "character" | "conflict"
  label: string;       // 中文标签
  description: string; // 描述文案
  selected: boolean;   // 是否选中
  intensity: number;   // 改写深度: 1=轻度, 2=中度, 3=深度
}
```

#### 验收条件
- [ ] 页面加载时所有维度未选中，深度默认为 2
- [ ] 选中维度后展开深度选择器（含过渡动画）
- [ ] 至少选中 1 个维度方可继续
- [ ] 未选中任何维度时 [保存并继续] disabled
- [ ] 卡片选中/取消选中切换正常

---

### Story 3: 深度优化 (Step 03)

**作为** 编剧，**我想要** 逐场对比原文与 AI 改写后的版本，**以便** 评估改写质量并手动调整。

#### 功能规格

| 属性 | 说明 |
|------|------|
| 组件 | `rewrite/OptimizeStep.tsx` |
| 布局 | 宽幅双栏，max-width: 1400px |

#### 交互说明

**场次标签栏：**
- 顶部横向排列场次按钮（Tag 风格）
- 格式："第N场 · 标题"
- 选中标签 accent 高亮
- 当前使用 3 个 mock 场次：开场·码头相遇 / 冲突·会议室对峙 / 转折·雨夜追车

**差异高亮开关：**
- Toggle 按钮（checkbox + "高亮差异" 标签）
- 默认开启，控制 diff 标记的显示

**左右双栏对比：**
- 左栏标题 "原文"（灰色标签），背景 `--color-warm-cream`
- 右栏标题 "改写"（accent 色标签），背景 `--color-accent-whisper`
- 各含一个 TextArea (height: 400px, font-mono, 13px, line-height: 1.8)
- 右侧 TextArea border 使用 `--color-accent-veil`

**底部操作栏：**
- 左：[保存并继续]
- 中：[AI 逐场优化]（secondary，暂无 handler）
- 右："下一步：对比导出 →"

#### 状态定义

```typescript
interface Scene {
  id: string;
  number: number;
  title: string;
  original: string;   // 原文内容
  rewritten: string;  // 改写后内容
}

// Step 状态
interface OptimizeState {
  scenes: Scene[];
  activeScene: string;     // 当前选中场次 ID
  highlightDiff: boolean;  // 是否高亮差异
}
```

#### 验收条件
- [ ] 场次标签点击切换正常，对应内容加载到双栏
- [ ] 左右 TextArea 可独立编辑
- [ ] 差异高亮 Toggle 正常切换
- [ ] 双栏编辑区获得焦点时边框变色

---

### Story 4: 对比导出 (Step 04)

**作为** 编剧，**我想要** 选择导出格式并查看改写摘要，**以便** 将改写结果以合适的格式保存或分享。

#### 功能规格

| 属性 | 说明 |
|------|------|
| 组件 | `rewrite/ExportStep.tsx` |
| 布局 | 左右双栏：格式选择 (620px) + 统计面板 (340px, sticky) |

#### 交互说明

**导出格式选择：**
- 3 种格式以卡片形式展示（垂直排列，gap: 12px）
  - PDF — "印刷级排版，含对比标注与修订摘要"
  - Markdown — "纯文本格式，适合版本管理与协作"
  - Final Draft (FDX) — "行业标准剧本格式，可直接导入编辑"
- 每个卡片包含：格式图标 (48×48, accent色) + 标题 + 描述
- 使用 Radio 选中模式（圆点指示器）
- 默认选中 PDF

**改写摘要面板（右侧，sticky）：**
- 卡片容器，padding: 28px
- 统计项：
  - 原文字数：42,000
  - 改写后字数：43,800（accent 色）
  - 修改场次：24 / 36
  - 变动比例：67%
- 底部 info 条：导出内容说明

**底部操作栏：**
- 左：[完成]（primary）
- 中：[导出 {FORMAT}]（secondary，点击后无实际导出，仅交互反馈）

#### 状态定义

```typescript
type ExportFormat = "pdf" | "markdown" | "fdx";

interface ExportStats {
  originalWords: number;
  rewrittenWords: number;
  scenesChanged: number;
  totalScenes: number;
}
```

#### 验收条件
- [ ] 3 种格式可切换，选中状态正确
- [ ] 统计面板数字正确显示
- [ ] [导出 {FORMAT}] 按钮文字随所选格式动态更新
- [ ] [完成] 按钮触发 onComplete 回调

---

## 8. 布局与响应式

### 断点策略

| 断点 | 宽度 | Step 03 布局 | Step 04 布局 |
|------|------|-------------|-------------|
| Desktop (lg+) | ≥1024px | 左右双栏 | 左右双栏（含统计面板） |
| Tablet/Phone | <1024px | 双栏叠放 | 统计面板隐藏 |

### 通用布局规则
- 所有 Step 组件包裹在 `padding: 40px 80px 96px` 的内容区
- 最大内容宽度：Step 01/02 为 880px，Step 03 为 1400px，Step 04 为 1040px
- 底部操作栏固定有 `border-top: 1px solid var(--color-mist)` 分隔

---

## 9. 组件架构

```
src/components/workbench/
├── rewrite/
│   ├── ImportStep.tsx        # Step 01: 剧本导入
│   ├── DirectionStep.tsx     # Step 02: 改写方向
│   ├── OptimizeStep.tsx      # Step 03: 深度优化
│   └── ExportStep.tsx        # Step 04: 对比导出
├── FormControls.tsx          # 共享表单原语 (Field, TextInput, TextArea, Select, RadioGroup, Button)
└── Workbench.tsx             # 工作台外壳：Sidebar + StepNav + Step 路由
```

### 共享依赖
- 所有 Step 组件通过 `Props { onComplete: () => void }` 接口与 Workbench 通信
- 所有样式使用内联 `style` 对象 + CSS 变量（`--color-*`, `--radius-*`, `--font-*`）
- Button / TextArea / Field 等基础组件从 `../FormControls` 导入

---

## 10. 范围之外

### 本期不包含
- **后端 API 集成** — 所有数据为 mock/state-only，无持久化
- **AI LLM 调用** — "AI 分析原文""AI 逐场优化"等按钮无 handler
- **实际文件导出** — [导出 PDF/MD/FDX] 按钮仅做交互反馈，不触发真实下载
- **自动保存** — 顶栏显示"自动保存于 2 分钟前"为静态文案
- **用户认证** — Sidebar 显示 "Luna Chen / Pro 会员" 为 hardcode
- **i18n** — 语言切换器 UI 存在但无翻译逻辑
- **差异高亮的实际算法** — Step 03 的 diff 高亮开关仅为 UI 状态，不执行实际 diff

### 后续考虑
- AI 集成（接入 LLM API 驱动改写生成）
- 实时协作改写
- 改写历史版本管理
- Mobile 端适配

---

## 11. 依赖与风险

### 依赖
| 依赖项 | 状态 | 说明 |
|--------|------|------|
| FormControls 组件 | ✅ 已有 | 共享表单原语 |
| StepNav / Sidebar | ✅ 已有 | 工作台框架 |
| 设计系统 CSS 变量 | ✅ 已有 | index.css |
| TypeScript 编译 | 待验证 | 需确保零 TS 错误 |

### 风险与缓解
| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 12 个新组件代码量大 | 维护复杂度上升 | 强复用 FormControls，统一 props 接口 |
| 各 Step 样式不一致 | 体验割裂 | 严格使用 CSS 变量，不引入硬编码颜色 |
| 与 original 模块体验路由冲突 | Step 切换 Bug | Workbench 每次 module 切换重置 step/completed 状态 |

---

## 12. 待决问题

- [ ] **文件解析策略** — 当后端接入后，PDF/FDX/DOCX 的解析在前端还是后端完成？
- [ ] **改写结果存储** — 用户的改写内容是否需要自动持久化（localStorage / 后端）？
- [ ] **场次自动识别** — Step 03 的场次拆分由 AI 完成还是用户手动标记？
- [ ] **导出模板** — PDF 报告的版式、字体、封面是否需要设计稿？
- [ ] **改写维度扩展** — 未来是否需要支持超过 4 个维度的改写方向？

---

## 附录 A: 文件清单

| 文件路径 | 说明 |
|----------|------|
| `src/components/workbench/rewrite/ImportStep.tsx` | Step 01 — 剧本导入 |
| `src/components/workbench/rewrite/DirectionStep.tsx` | Step 02 — 改写方向 |
| `src/components/workbench/rewrite/OptimizeStep.tsx` | Step 03 — 深度优化 |
| `src/components/workbench/rewrite/ExportStep.tsx` | Step 04 — 对比导出 |
| `src/components/workbench/Workbench.tsx` | 工作台外壳（已更新路由） |

## 附录 B: 设计 Token 参考

| Token | 用途 |
|-------|------|
| `--color-accent` / `--color-accent-deep` | 主强调色（琥珀），用于选中态、CTA |
| `--color-accent-whisper` | 强调色 12% 透明度，选中背景 |
| `--color-accent-veil` | 强调色 22% 透明度，改写区边框 |
| `--color-warm-cream` | 页面底色 / 非活跃输入区背景 |
| `--color-paper` | 卡片/输入区白色背景 |
| `--color-ink` | 主文本色 |
| `--color-charcoal` | 次要文本色 |
| `--color-mid` | 辅助/提示文本色 |
| `--color-mist` | 边框/分隔线 |
| `--font-body` | 正文：Instrument Sans |
| `--font-display` | 展示：Cormorant Garamond (italic) |
| `--font-mono` | 等宽：Space Grotesk (剧本编辑器) |
