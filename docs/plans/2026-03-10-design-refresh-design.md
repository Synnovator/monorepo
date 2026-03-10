# Design Refresh — Synnovator Web App

> 2026-03-10 | Status: Approved | Author: Claude + User

## 背景

基于对 `apps/web/` 的完整设计 Critique（使用 impeccable/critique skill），识别出以下核心问题：

1. **AI Slop** — 深色模式 + 霓虹绿 + Inter 字体，无法与 2024-2025 AI 生成界面区分
2. **Card Fatigue** — 全站唯一容器模式 `rounded-lg border border-secondary-bg bg-dark-bg`
3. **Typography Flat** — 正文集中在 14px，标题层级不清
4. **No Motion** — 仅 `transition-colors` hover，无入场动画
5. **Empty States Dead** — 纯灰色文字，无引导性
6. **No Light/Dark Switch** — 硬编码深色，无切换机制
7. **不符合 shadcn/ui v4 Best Practice** — Hex 色值、无 `@theme inline`、无 `@custom-variant dark`

## 设计决策

### 1. Light 为默认，Dark 为匹配

- Light 模式是主视觉，Dark 是同品牌夜间表达
- 所有中性色偏暖（hue 60-80，amber/yellow 方向）
- 无纯黑 `#000`、无纯白 `#fff`、无纯灰

### 2. 3 色体系

| 角色 | 名称 | Light OKLCH | Dark OKLCH | 用途 |
|---|---|---|---|---|
| Primary/Action | **Brand (Orange)** | `oklch(0.62 0.2 35)` | `oklch(0.68 0.19 38)` | CTA、主链接、active 状态、focus ring |
| Accent/Energy | **Highlight (Lime)** | `oklch(0.75 0.2 128)` | `oklch(0.88 0.25 125)` | Badge、装饰标注、图标填充、Sketch Layer |
| Info/Depth | **Info (Indigo)** | `oklch(0.48 0.2 270)` | `oklch(0.58 0.18 270)` | 次要链接、info badge、track 标签 |

语义色独立：Success `oklch(0.55 0.16 155)` / Error `oklch(0.55 0.22 25)` / Warning `oklch(0.65 0.15 80)`

### 3. Hackathon Type 视觉区分

| Type | Accent Override | 圆角 | 卡片特征 | 图标 |
|---|---|---|---|---|
| Community | Orange (默认) | `radius-xl` (20px) | 顶部 3px border-top | `globe` |
| Enterprise | Indigo | `radius-sm` (4px) | 左侧 3px border-left | `shield-check` |
| Youth League | Lime | `radius-lg` (12px) | 虚线边框 + 微倾斜 `-rotate-[0.3deg]` | `rocket` |

通过 `data-hackathon-type` CSS custom property override，组件内代码无需分支。

### 4. Sketch Layer (克制版)

手绘 SVG 标注系统，6 个组件（Circle, Arrow, Underline, Star, Bracket, Doodle）。

规则：
- 每页最多 2 处
- 不进入导航栏、表单内部、侧边栏、页脚
- 颜色跟随 `--muted-foreground`，opacity 0.3
- 仅首次进入视口时 draw-in 0.4s ease-out，无循环动画
- 最大 60px

放置位置（共 6 处）：首页标题旁箭头、active badge 圆圈、详情页 CTA 下划线、空状态涂鸦 ×2、404 涂鸦。

### 5. Detail Page Article Flow

从卡片堆叠改为杂志长文流：
- 移除 Description/Organizers/Tracks/Eligibility/Legal 的卡片容器
- 保留表单类和空状态的卡片
- 正文 `text-sm` → `text-base` (16px)
- 间距节奏：16 → 12 → 12 → 8 → 8 → 16（松紧交替）
- Section 分隔用细线 + 间距，不用卡片边框

## 技术方案 — 对齐 shadcn/ui v4

### 切换机制

- `next-themes` + `attribute="class"` + `defaultTheme="system"` + `enableSystem` + `disableTransitionOnChange`
- `<html suppressHydrationWarning>` 防止 SSR 闪烁
- NavBar 中添加 ModeToggle（Sun/Moon 图标切换 light/dark/system）

### CSS 架构

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

@theme inline {
  /* shadcn 标准语义 token → var() 映射 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Synnovator 品牌扩展 */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  /* 圆角 */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.75rem;

  /* 表面 — 暖白体系 */
  --background: oklch(0.98 0.005 80);
  --foreground: oklch(0.15 0.01 70);
  --card: oklch(1 0.003 80);
  --card-foreground: oklch(0.15 0.01 70);
  --popover: oklch(1 0.003 80);
  --popover-foreground: oklch(0.15 0.01 70);
  --primary: oklch(0.62 0.2 35);
  --primary-foreground: oklch(0.98 0.005 80);
  --secondary: oklch(0.95 0.005 75);
  --secondary-foreground: oklch(0.15 0.01 70);
  --muted: oklch(0.95 0.005 75);
  --muted-foreground: oklch(0.52 0.015 60);
  --accent: oklch(0.95 0.005 75);
  --accent-foreground: oklch(0.15 0.01 70);
  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0.005 80);
  --border: oklch(0.92 0.005 75);
  --input: oklch(0.92 0.005 75);
  --ring: oklch(0.62 0.2 35);
  --brand: oklch(0.62 0.2 35);
  --brand-foreground: oklch(0.98 0.005 80);
  --highlight: oklch(0.75 0.2 128);
  --highlight-foreground: oklch(0.40 0.12 128);
  --info: oklch(0.48 0.2 270);
  --info-foreground: oklch(0.35 0.15 270);
}

.dark {
  --background: oklch(0.16 0.008 60);
  --foreground: oklch(0.94 0.005 70);
  --card: oklch(0.20 0.008 60);
  --card-foreground: oklch(0.94 0.005 70);
  --popover: oklch(0.20 0.008 60);
  --popover-foreground: oklch(0.94 0.005 70);
  --primary: oklch(0.68 0.19 38);
  --primary-foreground: oklch(0.16 0.008 60);
  --secondary: oklch(0.24 0.008 55);
  --secondary-foreground: oklch(0.94 0.005 70);
  --muted: oklch(0.24 0.008 55);
  --muted-foreground: oklch(0.60 0.01 60);
  --accent: oklch(0.24 0.008 55);
  --accent-foreground: oklch(0.94 0.005 70);
  --destructive: oklch(0.62 0.2 22);
  --destructive-foreground: oklch(0.98 0.005 80);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.68 0.19 38);
  --brand: oklch(0.68 0.19 38);
  --brand-foreground: oklch(0.16 0.008 60);
  --highlight: oklch(0.88 0.25 125);
  --highlight-foreground: oklch(0.16 0.008 60);
  --info: oklch(0.58 0.18 270);
  --info-foreground: oklch(0.94 0.005 70);
}

/* Hackathon Type Overrides */
[data-hackathon-type="enterprise"] {
  --brand: oklch(0.48 0.2 270);
  --brand-foreground: oklch(0.98 0.005 80);
}
.dark [data-hackathon-type="enterprise"] {
  --brand: oklch(0.58 0.18 270);
  --brand-foreground: oklch(0.16 0.008 60);
}
[data-hackathon-type="youth-league"] {
  --brand: oklch(0.75 0.2 128);
  --brand-foreground: oklch(0.15 0.01 70);
}
.dark [data-hackathon-type="youth-league"] {
  --brand: oklch(0.88 0.25 125);
  --brand-foreground: oklch(0.16 0.008 60);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

### 组件 Class 替换映射

| 旧 | 新 |
|---|---|
| `bg-surface` / `bg-near-black` | `bg-background` |
| `bg-dark-bg` | `bg-card` |
| `bg-secondary-bg` | `bg-secondary` / `bg-muted` |
| `border-secondary-bg` | `border-border` |
| `text-white` / `text-light-gray` | `text-foreground` |
| `text-muted` | `text-muted-foreground` |
| `bg-lime-primary` | `bg-primary` |
| `text-lime-primary` | `text-primary` |
| `text-near-black` (按钮上) | `text-primary-foreground` |
| `bg-error/10` | `bg-destructive/10` |
| `text-error` | `text-destructive` |

## 实施阶段

| Phase | 范围 | Impeccable Skills | 文件量 |
|---|---|---|---|
| **P1** | CSS token + next-themes + 切换基础设施 | `/colorize` | ~5 |
| **P2** | 全站硬编码色 → 语义 token | `/distill` `/polish` | ~25 |
| **P3** | Hackathon type themes + 卡片变体 | `/colorize` `/delight` | ~8 |
| **P4** | Sketch Layer 组件库 + 放置 | `/animate` `/delight` | ~15 |
| **P5** | 详情页 article flow 重构 | `/distill` `/polish` | ~5 |
| **Post** | 质量 + 设计系统落地 | `/audit` `/extract` `/teach-impeccable` | config |

## SVG 图标适配

- `#BBFD3B` lime 填充 → Light 模式下保留（暖白背景上仍醒目）
- `white` 填充 → 两种模式有效（图标自带 `#00000E` 轮廓线提供对比）
- `#00000E` 轮廓 → 两种模式有效
- 后续可考虑 `currentColor` 适配，但不在本次范围

## 风险

| 风险 | 缓解 |
|---|---|
| P2 替换遗漏导致 Light 模式下元素不可见 | `/audit` 的 theming 检查覆盖 |
| OKLCH 浏览器兼容性 | Tailwind v4 + 现代浏览器全部支持；若需 Safari 15 以下加 PostCSS fallback |
| Sketch Layer 过度使用 | 设计规则硬性限制（6 处，每页最多 2 个） |
| 详情页重构影响 SEO 结构 | heading 层级保持不变，只改容器和间距 |
