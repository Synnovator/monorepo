# Synnovator 设计系统

> 基于 OKLCH 色彩空间的 Light/Dark 双主题系统，通过 shadcn/ui v4 语义令牌层实现。

**源文件**: `packages/ui/src/styles/global.css`
**技术栈**: Tailwind CSS v4 + shadcn/ui + next-themes + OKLCH

---

## 色彩系统

所有颜色使用 [OKLCH](https://oklch.com/) 色彩空间，确保感知均匀性。
格式：`oklch(Lightness Chroma Hue)`

### 核心语义令牌

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| `--background` | `oklch(0.98 0.005 80)` | `oklch(0.16 0.008 60)` | 页面背景 |
| `--foreground` | `oklch(0.15 0.01 70)` | `oklch(0.94 0.005 70)` | 默认文字 |
| `--card` | `oklch(1 0.003 80)` | `oklch(0.20 0.008 60)` | 卡片背景 |
| `--muted` | `oklch(0.95 0.005 75)` | `oklch(0.24 0.008 55)` | 弱化背景 |
| `--muted-foreground` | `oklch(0.52 0.015 60)` | `oklch(0.60 0.01 60)` | 次要文字 |
| `--border` | `oklch(0.92 0.005 75)` | `oklch(1 0 0 / 10%)` | 边框 |
| `--input` | `oklch(0.92 0.005 75)` | `oklch(1 0 0 / 15%)` | 输入框边框 |
| `--primary` | `oklch(0.55 0.2 35)` | `oklch(0.68 0.19 38)` | 主操作色（橙） |
| `--destructive` | `oklch(0.55 0.22 25)` | `oklch(0.58 0.2 22)` | 危险/错误 |
| `--ring` | = `--primary` | = `--primary` | 焦点环 |

> **设计原则**: 中性色带有微暖色调（Hue 55–80），营造亲和感而非冰冷的灰色。

### 品牌扩展令牌

三色系统：Brand（橙）+ Highlight（青柠）+ Info（靛蓝）

| Token | Light | Dark | 色相 | 用途 |
|-------|-------|------|------|------|
| `--brand` | `oklch(0.55 0.2 35)` | `oklch(0.68 0.19 38)` | 橙 H35 | 主品牌色，= primary |
| `--highlight` | `oklch(0.75 0.2 128)` | `oklch(0.88 0.25 125)` | 青柠 H128 | 成就、活跃标识 |
| `--highlight-foreground` | `oklch(0.40 0.12 128)` | `oklch(0.16 0.008 60)` | — | highlight 上的文字 |
| `--info` | `oklch(0.48 0.2 270)` | `oklch(0.58 0.18 270)` | 靛蓝 H270 | 信息提示、企业主题 |
| `--info-foreground` | `oklch(0.35 0.15 270)` | `oklch(0.94 0.005 70)` | — | info 上的文字 |

> **注意**: `--highlight` 仅用于背景/徽章，不直接用作文字色（对比度不足）。文字使用 `--highlight-foreground`。

### Hackathon 类型色彩覆盖

通过 `data-hackathon-type` 属性在 CSS 中覆盖 `--brand`：

| 类型 | Light `--brand` | Dark `--brand` | 色相 |
|------|----------------|----------------|------|
| Community（默认） | `oklch(0.55 0.2 35)` | `oklch(0.68 0.19 38)` | 橙 H35 |
| Enterprise | `oklch(0.48 0.2 270)` | `oklch(0.58 0.18 270)` | 靛蓝 H270 |
| Youth League | `oklch(0.75 0.2 128)` | `oklch(0.88 0.25 125)` | 青柠 H128 |

```html
<div data-hackathon-type="enterprise">
  <!-- 内部所有 bg-brand / text-brand 自动变为靛蓝 -->
</div>
```

### WCAG 对比度审计

| 组合 | Light | Dark | 状态 |
|------|-------|------|------|
| muted-fg / background | 5.20:1 | 4.92:1 | ✓ AA |
| muted-fg / card | 5.51:1 | 4.59:1 | ✓ AA |
| muted-fg / muted | 4.76:1 | 4.17:1 | ⚠ Dark 边缘 |
| primary / background | 4.58:1 | — | ✓ AA |
| destructive / card | 4.85:1 | 4.23:1 | ⚠ Dark 边缘 |

---

## 字体

### 字体家族

| 角色 | 字体 | 字重 | CSS 变量 |
|------|------|------|----------|
| 标题 | Space Grotesk | 700 | `font-heading` |
| 正文 | Inter | 400, 500 | `font-sans`（默认） |
| 数字/代码 | Poppins | 500 | `font-code` |
| 中文辅助 | Noto Sans SC | 400, 500 | `font-zh` |

加载策略：Latin 字体和 Chinese 字体分请求，`display=swap`，`<link rel="preconnect">`。

### 字体尺度

| Tailwind | 用途 | 示例 |
|----------|------|------|
| `text-4xl` (`text-2xl sm:text-3xl md:text-4xl`) | 页面标题 h1 | 活动名称 |
| `text-xl` | 区块标题 h2 | 赛道、评委、FAQ 等 |
| `text-lg` | 重要提示 | Hero tagline、侧栏标题 |
| `text-sm` | 正文 | 描述、列表项 |
| `text-xs` | 标签/徽章 | 阶段、类型、时间 |

---

## 间距节奏

### 页面级

```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12
```

### 文章流节奏（详情页）

| 间距 | 用途 |
|------|------|
| `mb-12` / `mt-12` | 主要区块（描述、组织者、赛道、FAQ） |
| `mb-8` / `mt-8` | 次要区块（参赛条件、数据集、法律条款） |
| `<hr class="border-border">` | 区块之间的分割线 |
| `gap-8` | 主内容与侧栏之间 |
| `space-y-3` | 侧栏内部组件间距 |

### 组件级

| 间距 | 用途 |
|------|------|
| `p-6` | 卡片内边距 |
| `p-4` / `px-4 py-3` | 列表项内边距 |
| `gap-2` ~ `gap-4` | 徽章/标签间距 |
| `mb-3` ~ `mb-4` | 标题与内容间距 |

---

## 圆角

| Token | 值 | 计算方式 |
|-------|-----|----------|
| `--radius` | `0.75rem` (12px) | 基准值 |
| `--radius-sm` | `calc(var(--radius) - 4px)` = 8px | |
| `--radius-md` | `calc(var(--radius) - 2px)` = 10px | |
| `--radius-lg` | `var(--radius)` = 12px | |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 16px | |

---

## Hackathon 类型视觉系统

三种活动类型有不同的卡片形态和交互特征：

| 类型 | 卡片形态 | 悬浮效果 | 图标 |
|------|---------|----------|------|
| Community（默认） | `rounded-xl border-t-3 border-t-brand` | `hover:-translate-y-0.5` | GlobeIcon |
| Enterprise | `rounded-sm border-l-3 border-l-brand` | `hover:scale-[1.01]` | ShieldCheckIcon |
| Youth League | `rounded-lg border-dashed -rotate-[0.3deg]` | `hover:rotate-0` | RocketIcon |

实现：`apps/web/lib/hackathon-theme.ts` 导出 `hackathonCardClass()`、`hackathonHoverClass()`、`hackathonTypeIcon()`。

---

## 动效系统

### Sketch 手绘注解层

手绘 SVG 线描动画，为界面添加有机感。

| 组件 | 尺寸 | 用途 | 位置限制 |
|------|------|------|----------|
| `SketchCircle` | 40×40 | 活跃阶段徽章圈注 | HackathonCard 阶段徽章 |
| `SketchUnderline` | 可变宽×8 | CTA 按钮下划线 | 注册按钮 |
| `SketchArrow` | 60×30 | 指向性标注 | 首页提案区 |
| `SketchDoodle` | 48×48（3变体） | 空状态插图 | 无提交时的占位 |

**技术实现**:
- `stroke-dashoffset` 动画，`stroke-dasharray` = 路径长度
- `IntersectionObserver`（`useInView` hook）触发，一次性播放
- `prefers-reduced-motion: reduce` 时跳过动画直接显示
- 样式：`stroke: var(--muted-foreground)`，`opacity: 0.3`
- **限制**: 每页最多 2 个 sketch 元素（全站共 6 处）

```css
/* sketch-anim.css */
@keyframes sketch-draw {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}
.sketch-mark[data-visible="true"] {
  animation: sketch-draw 0.4s ease-out forwards;
}
```

### 过渡效果

| 场景 | 时长 | 缓动 |
|------|------|------|
| 颜色/透明度变化 | `transition-colors` (150ms) | Tailwind 默认 |
| 全属性过渡 | `transition-all duration-200` | ease |
| Sketch 绘制 | 400ms | ease-out |

> **原则**: 仅动画 `transform` 和 `opacity`。不使用 bounce/elastic 缓动。

---

## 主题基础设施

### 技术架构

```
next-themes (ThemeProvider)
  ↓ attribute="class"
html.dark / html (light)
  ↓
packages/ui/src/styles/global.css
  ↓ :root (light) / .dark (dark) → CSS custom properties
  ↓ @theme inline → Tailwind CSS v4 映射
  ↓ @custom-variant dark → .dark 后代选择器
apps/web/app/globals.css
  ↓ @import "@synnovator/ui/styles"
  ↓ @import "sketch-anim.css"
```

### @theme inline 映射

Tailwind CSS v4 通过 `@theme inline` 将 CSS 变量暴露为工具类：

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-brand: var(--brand);
  /* ... 完整映射见 global.css */
}
```

使用方式：`bg-background`、`text-primary`、`border-brand` 等。

### 基础层

```css
@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

---

## 组件模式

### 交互状态

| 元素 | 悬浮 | 焦点 | 禁用 |
|------|------|------|------|
| 主按钮 | `hover:bg-primary/80` | `focus-visible:ring-2 ring-ring/50` | `disabled:opacity-50` |
| 次按钮 | `hover:bg-muted/80` | 同上 | 同上 |
| 链接 | `hover:text-primary` | 同上 | — |
| 输入框 | — | `focus:border-ring focus:outline-none` | 同上 |
| 标签页 | `hover:text-foreground` | `focus-visible:ring-2 ring-ring/50` | — |
| 图标按钮 | `hover:text-foreground` | `focus-visible:ring-2 ring-ring/50` | — |

### 空状态

- 使用 `bg-muted/30 rounded-lg p-12 text-center`（轻量背景，无边框）
- 配合 `SketchDoodle` 组件增加有机感
- 文字使用 `text-muted-foreground text-lg`

### 徽章/标签

```
text-xs px-2 py-0.5 rounded-full bg-{color}/20 text-{color}
```

### 卡片

```
border border-border bg-card hover:border-primary/40 transition-all duration-200 p-6
```

---

## 弃用令牌（回归测试守护）

以下旧 Neon Forge 令牌已全部替换为语义令牌，由 `__tests__/token-audit.test.ts` 自动检测回归：

```
bg-dark-bg, bg-near-black, bg-surface, text-white, text-light-gray,
border-secondary-bg, bg-secondary-bg, text-lime-primary, bg-lime-primary,
text-cyan, text-orange, text-neon-blue, text-pink, text-mint,
text-error, bg-error, border-error, hover:text-white, hover:bg-lime-primary
```
