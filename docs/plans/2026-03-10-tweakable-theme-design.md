# Tweakable Theme — Admin 主题编辑器设计

> 2026-03-10 | Status: Approved | Author: Claude + User

## 背景

Synnovator 的设计系统基于 OKLCH CSS custom properties，token 值硬编码在 `packages/ui/src/styles/global.css` 中。管理员无法在线调整平台主题——任何色彩、字体、圆角的变更都需要直接编辑 CSS 文件。

本设计在现有 `/admin` 管理后台中新增主题编辑器页面，参考 [tweakcn.com/editor/theme](https://tweakcn.com/editor/theme) 的交互模式，允许管理员：

1. 可视化编辑全局平台主题和每活动独立主题
2. 实时预览组件和页面效果
3. 通过 PR 工作流发布变更，merge 后自动重新部署

## 设计决策

### 方案选型：Theme-as-YAML

| 考虑方案 | 说明 | 结论 |
|----------|------|------|
| A. Theme-as-YAML | 主题配置存为 YAML，prebuild 编译为 CSS | **选中** — 复用 "YAML → PR → Build" 数据流 |
| B. Theme-as-CSS | 编辑器直接生成 CSS 文件 | 否 — CSS 难校验、不好与活动数据关联 |
| C. Runtime Theme | JSON + API 运行时加载 | 否 — 偏离 Git-native 理念 |

**理由**：方案 A 与 Synnovator "产品即 repo" 理念完全一致 — 主题是数据，数据是 YAML。复用现有 PR 工作流和 prebuild 管线，Schema 校验（Zod）可直接复用。

---

## §1 数据模型

### 全局主题：`config/theme.yml`

从当前 `global.css` 提取的初始值，YAML 成为唯一真相源。

```yaml
light:
  # Surfaces
  background: "oklch(0.98 0.005 80)"
  foreground: "oklch(0.15 0.01 70)"
  card: "oklch(1 0.003 80)"
  card-foreground: "oklch(0.15 0.01 70)"
  popover: "oklch(1 0.003 80)"
  popover-foreground: "oklch(0.15 0.01 70)"
  # Actions
  primary: "oklch(0.55 0.2 35)"
  primary-foreground: "oklch(0.98 0.005 80)"
  secondary: "oklch(0.95 0.005 75)"
  secondary-foreground: "oklch(0.15 0.01 70)"
  muted: "oklch(0.95 0.005 75)"
  muted-foreground: "oklch(0.52 0.015 60)"
  accent: "oklch(0.95 0.005 75)"
  accent-foreground: "oklch(0.15 0.01 70)"
  destructive: "oklch(0.55 0.22 25)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  # Borders & Focus
  border: "oklch(0.92 0.005 75)"
  input: "oklch(0.92 0.005 75)"
  ring: "oklch(0.55 0.2 35)"
  # Brand extensions
  brand: "oklch(0.55 0.2 35)"
  brand-foreground: "oklch(0.98 0.005 80)"
  highlight: "oklch(0.75 0.2 128)"
  highlight-foreground: "oklch(0.40 0.12 128)"
  info: "oklch(0.48 0.2 270)"
  info-foreground: "oklch(0.35 0.15 270)"

dark:
  background: "oklch(0.16 0.008 60)"
  foreground: "oklch(0.94 0.005 70)"
  card: "oklch(0.20 0.008 60)"
  card-foreground: "oklch(0.94 0.005 70)"
  popover: "oklch(0.20 0.008 60)"
  popover-foreground: "oklch(0.94 0.005 70)"
  primary: "oklch(0.68 0.19 38)"
  primary-foreground: "oklch(0.16 0.008 60)"
  secondary: "oklch(0.24 0.008 55)"
  secondary-foreground: "oklch(0.94 0.005 70)"
  muted: "oklch(0.24 0.008 55)"
  muted-foreground: "oklch(0.60 0.01 60)"
  accent: "oklch(0.24 0.008 55)"
  accent-foreground: "oklch(0.94 0.005 70)"
  destructive: "oklch(0.58 0.2 22)"
  destructive-foreground: "oklch(0.98 0.005 80)"
  border: "oklch(1 0 0 / 10%)"
  input: "oklch(1 0 0 / 15%)"
  ring: "oklch(0.68 0.19 38)"
  brand: "oklch(0.68 0.19 38)"
  brand-foreground: "oklch(0.16 0.008 60)"
  highlight: "oklch(0.88 0.25 125)"
  highlight-foreground: "oklch(0.16 0.008 60)"
  info: "oklch(0.58 0.18 270)"
  info-foreground: "oklch(0.94 0.005 70)"

fonts:
  heading: "Space Grotesk"
  sans: "Inter"
  code: "Poppins"
  zh: "Noto Sans SC"

radius: "0.75rem"
```

### 每活动主题：`hackathons/<slug>/theme.yml`

增量覆盖 — 只声明需要覆盖的 tokens，未声明的继承全局主题。

```yaml
# 示例：hackathons/ai-summit-2026/theme.yml
light:
  brand: "oklch(0.48 0.2 270)"
  brand-foreground: "oklch(0.98 0.005 80)"
  primary: "oklch(0.48 0.2 270)"

dark:
  brand: "oklch(0.58 0.18 270)"
  brand-foreground: "oklch(0.98 0.005 80)"
  primary: "oklch(0.58 0.18 270)"
```

### Schema 校验

在 `@synnovator/shared` 中定义 `ThemeSchema`（Zod），校验：
- Token 名必须在允许列表中
- 值必须匹配 `oklch(...)` 格式（含 `/alpha%` 变体）
- `fonts` 字段为可选字符串
- `radius` 为可选 CSS 长度值

---

## §2 Build 管线

### 数据流

```
config/theme.yml (全局)  ─┐
                          ├→ generate-theme-css.mjs ─→ packages/ui/src/styles/generated-themes.css
hackathons/*/theme.yml ───┘
                                    ↓ @import
                          packages/ui/src/styles/global.css
                                    ↓ @import
                          apps/web/app/globals.css
```

### `scripts/generate-theme-css.mjs`

1. 读取 `config/theme.yml` → 生成 `:root { ... }` 和 `.dark { ... }` 块
2. 扫描 `hackathons/*/theme.yml` → 每个生成 `[data-hackathon="<slug>"] { ... }` 和 `.dark [data-hackathon="<slug>"] { ... }` 块
3. 每活动的缺失 tokens 不输出（CSS cascade 自然继承全局值）
4. 输出到 `packages/ui/src/styles/generated-themes.css`

### `global.css` 变更

```css
/* 删除硬编码的 :root / .dark / [data-hackathon-type] 块 */
/* 新增 @import */
@import "./generated-themes.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* 映射不变 */
}

@layer base { /* 不变 */ }
/* scrollbar、selection 规则不变 */
```

### 集成到 prebuild

```json
"prebuild": "node scripts/generate-static-data.mjs && node scripts/generate-theme-css.mjs"
```

### 选择器迁移

| 之前 | 之后 |
|------|------|
| `[data-hackathon-type="enterprise"]` | `[data-hackathon="<slug>"]` |
| 3 种 type 硬编码 CSS | 按 slug 动态生成 |
| 组件用 `data-hackathon-type={h.type}` | 组件用 `data-hackathon={h.slug}` |

向后兼容：没有 `theme.yml` 的活动不生成选择器，使用全局主题。`hackathonCardClass(type)` 形状区分（圆角、边框样式）保持不变 — 形状按 type，颜色按 slug。

---

## §3 编辑器 UI 架构

### 页面布局：`/admin/theme`

```
┌─ AdminSidebar ─┬──────────────────────────────────────────────┐
│                │  ┌─ 工具栏 ──────────────────────────────────┐│
│  Dashboard     │  │ [全局主题 ▼] [light/dark 切换] [发布 PR]  ││
│  Hackathons    │  └───────────────────────────────────────────┘│
│  Profiles      │  ┌─ 编辑面板 ──────┬─ 预览面板 ─────────────┐│
│  Submissions   │  │                 │                         ││
│ ★Theme         │  │  Colors         │  [组件预览 | 页面预览]  ││
│                │  │   ├ primary     │                         ││
│                │  │   ├ background  │   Button  Card  Badge  ││
│                │  │   ├ brand       │   Input   Table ...     ││
│                │  │   ├ highlight   │                         ││
│                │  │   └ info        │   ── 或 ──              ││
│                │  │                 │                         ││
│                │  │  Typography     │   Hero 区块             ││
│                │  │  Radius         │   HackathonCard         ││
│                │  │                 │   活动详情片段           ││
│                │  └─────────────────┴─────────────────────────┘│
└────────────────┴──────────────────────────────────────────────┘
```

### 组件拆分

| 组件 | 类型 | 职责 |
|------|------|------|
| `ThemeEditorPage` | Client | 顶层状态管理，协调编辑/预览 |
| `ThemeSelector` | Client | 下拉选择 "全局主题" 或具体活动 slug |
| `ColorTokenEditor` | Client | OKLCH 色轮 + L/C/H 滑块，编辑单个 token |
| `TokenGroup` | Client | 按分组展示 tokens（Colors / Typography / Radius） |
| `PreviewPanel` | Client | 预览容器，切换组件/页面模式 |
| `ComponentPreview` | Client | 渲染 shadcn/ui 组件样本（Button、Card、Badge、Input 等） |
| `PagePreview` | Client | 渲染 Synnovator 真实页面片段（Hero、HackathonCard、活动详情） |
| `PublishButton` | Client | 序列化 YAML，调用 `/api/admin/theme` 创建 PR |
| `ContrastChecker` | Client | 实时计算并显示 WCAG 对比度比值 |

### 编辑交互

**色彩编辑器**：
- 每个 token 点击展开 OKLCH 编辑面板
- 2D 色轮（Hue × Chroma）+ Lightness 滑块
- 实时显示 OKLCH 值 + 十六进制预览
- 对比度检查器：自动计算与 background/foreground 的 WCAG 对比度

**主题选择器**：
- 下拉列表显示 "全局主题" + 所有 hackathon slug
- 选中活动后，编辑面板只显示该活动的覆盖值
- 未覆盖的 token 显示灰色（继承），可点击 "覆盖" 添加

**Light/Dark 切换**：
- 切换编辑面板和预览面板模式
- 两套值独立编辑

### 实时预览机制

```typescript
function applyPreview(tokens: Record<string, string>) {
  for (const [key, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(`--${key}`, value);
  }
}
```

直接在 `:root` 注入 CSS 变量 — 无需 iframe 或 shadow DOM。所有组件通过 `var(--token)` 消费颜色，改变量值整棵渲染树即时响应。离开编辑器页面后注入的 inline style 随页面卸载自然消失。

### 预览模式

**组件预览**：渲染一组 shadcn/ui 组件样本，覆盖 Button（各变体）、Card、Badge、Input、Table 等，直观展示 token 在 UI 组件上的效果。

**页面预览**：渲染 Synnovator 真实页面片段 — Hero 区块、HackathonCard、活动详情等，管理员能看到平台实际效果。

---

## §4 API 与 PR 工作流

### API Route：`/api/admin/theme`

| Method | 参数 | 用途 |
|--------|------|------|
| `GET` | `?target=global` | 读取 `config/theme.yml` |
| `GET` | `?target=<slug>` | 读取 `hackathons/<slug>/theme.yml`（无则返回空） |
| `POST` | body（见下） | 提交主题变更，创建 PR |

### POST 请求体

```typescript
interface ThemeSubmission {
  target: "global" | string;        // "global" 或 hackathon slug
  light: Record<string, string>;    // 变更的 light tokens
  dark: Record<string, string>;     // 变更的 dark tokens
  fonts?: {
    heading?: string;
    sans?: string;
    code?: string;
    zh?: string;
  };
  radius?: string;
  message?: string;                 // 可选 PR 描述
}
```

### PR 创建流程

1. API route 验证 session + 权限（复用 admin layout 逻辑）
2. Zod `ThemeSchema` 校验 token 名和 OKLCH 格式
3. 序列化为 YAML
4. 通过 GitHub App（复用 `/api/submit-pr` 的 client）：
   - 创建分支 `theme/<target>-<timestamp>`
   - 写入 `config/theme.yml` 或 `hackathons/<slug>/theme.yml`
   - 创建 PR，标题格式：`theme(global): update platform theme` 或 `theme(<slug>): update hackathon theme`
5. 返回 PR URL，编辑器显示成功链接

### 数据读取

编辑器初始化时 GET 获取当前 YAML 值。对于活动主题：
- 返回覆盖值 + 标记继承状态
- 前端灰色显示继承值，实色显示覆盖值

---

## §5 迁移策略

### Step 1：提取当前 CSS → `config/theme.yml`

从 `packages/ui/src/styles/global.css` 的 `:root` 和 `.dark` 块提取全部 token 值，生成初始 `config/theme.yml`。YAML 成为唯一真相源。

### Step 2：创建 `generate-theme-css.mjs`

脚本从 YAML 生成 `generated-themes.css`。`global.css` 删除 `:root` / `.dark` / `[data-hackathon-type]` 硬编码块，改为 `@import "./generated-themes.css"`。

### Step 3：迁移 `data-hackathon-type` → `data-hackathon`

- 组件中 `data-hackathon-type={h.type}` → `data-hackathon={h.slug}`
- 删除 3 种 type 的硬编码 CSS
- 为现有活动按其 type 色值创建对应 `hackathons/<slug>/theme.yml`
- `hackathonCardClass(type)` 形状函数保持不变（形状按 type，颜色按 slug）

### Step 4：校验

- `token-audit.test.ts` 更新：确认 `global.css` 中不再有硬编码 OKLCH 值
- 新增测试：`generated-themes.css` 输出与 YAML 一致
- `pnpm build` 端到端验证

---

## §6 实施后审计

实施完成后使用 `/audit` skill 对 `/admin/theme` 页面进行全面视觉审计，覆盖：
- 无障碍（WCAG AA 对比度、键盘导航、focus 可见性）
- 响应式（编辑器在不同屏幕尺寸下的可用性）
- 主题一致性（编辑器本身是否正确使用 design tokens）
- 性能（实时预览的渲染性能）

---

## 文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `config/theme.yml` | 全局主题配置（从 CSS 提取） |
| `hackathons/<slug>/theme.yml` | 每活动主题覆盖（按需创建） |
| `scripts/generate-theme-css.mjs` | YAML → CSS 编译脚本 |
| `packages/ui/src/styles/generated-themes.css` | 编译产物（gitignore 或提交均可） |
| `apps/web/app/(admin)/admin/theme/page.tsx` | 编辑器页面 |
| `apps/web/components/admin/theme/ThemeEditorPage.tsx` | 编辑器顶层组件 |
| `apps/web/components/admin/theme/ThemeSelector.tsx` | 主题选择器 |
| `apps/web/components/admin/theme/ColorTokenEditor.tsx` | OKLCH 色彩编辑器 |
| `apps/web/components/admin/theme/TokenGroup.tsx` | Token 分组展示 |
| `apps/web/components/admin/theme/PreviewPanel.tsx` | 预览面板容器 |
| `apps/web/components/admin/theme/ComponentPreview.tsx` | 组件预览 |
| `apps/web/components/admin/theme/PagePreview.tsx` | 页面预览 |
| `apps/web/components/admin/theme/PublishButton.tsx` | 发布按钮 |
| `apps/web/components/admin/theme/ContrastChecker.tsx` | 对比度检查器 |
| `apps/web/app/api/admin/theme/route.ts` | 主题 API Route |
| `packages/shared/src/schema/theme.ts` | ThemeSchema（Zod） |

### 修改文件

| 文件 | 变更 |
|------|------|
| `packages/ui/src/styles/global.css` | 删除 `:root` / `.dark` / `[data-hackathon-type]` 硬编码块，新增 `@import "./generated-themes.css"` |
| `apps/web/components/admin/AdminSidebar.tsx` | 新增 Theme 导航项 |
| `apps/web/components/HackathonCard.tsx` | `data-hackathon-type` → `data-hackathon` |
| `apps/web/app/(public)/hackathons/[slug]/page.tsx` | `data-hackathon-type` → `data-hackathon` |
| `apps/web/lib/hackathon-theme.ts` | 保持 `hackathonCardClass(type)` 形状函数不变 |
| `apps/web/package.json` | prebuild 增加 `generate-theme-css.mjs` |
| `apps/web/__tests__/token-audit.test.ts` | 更新断言 |
