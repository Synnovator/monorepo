# Neon Forge — Synnovator Design System
> SYNNOVATOR DESIGN SYSTEM / 协创者设计系统

A vibrant, high-energy dark theme with electric neon accents for the Synnovator creative collaboration platform.
一个充满活力、高能量的暗色主题，搭配电光霓虹色调，专为协创者创意协作平台设计。

---

## Color Palette / 色彩系统

Core accent colors and backgrounds for the Neon Forge theme.
霓虹锻造主题的核心强调色与背景色。

### Accent Colors / 强调色

| Name | Variable | Hex |
|------|----------|-----|
| Lime Green / 青柠绿 | `$lime-primary` | `#BBFD3B` |
| Yellow / 荧光黄 | — | `#F0FF31` |
| Light Green / 浅绿 | — | `#8AFF80` |
| Mint / 薄荷绿 | `$mint` | `#74FFBB` |
| Cyan / 青色 | `$cyan` | `#41FAF4` |
| Pink / 粉色 | `$pink` | `#FF74A7` |
| Blue / 蓝色 | `$blue` | `#4C78FF` |
| Orange / 橙色 | `$orange` | `#FB7A38` |

### Backgrounds / 背景色

| Name | Variable | Hex |
|------|----------|-----|
| Surface / 表面 | `$surface` | `#181818` |
| Near Black / 近黑 | `$near-black` | `#00000E` |
| Dark BG / 深色背景 | `$dark-bg` | `#222222` |
| Secondary BG / 次级背景 | `$secondary-bg` | `#333333` |

### Semantic & Text / 语义与文字色

| Name | Variable | Hex |
|------|----------|-----|
| Success / 成功 | `$success` | `#00B42A` |
| Error / 错误 | `$error` | `#FA541C` |
| Warning / 警告 | `$warning` | `#FAAD14` |
| White / 白色 | `$white` | `#FFFFFF` |
| Muted / 柔灰 | `$muted` | `#A0A0A0` |
| Light Gray / 浅灰 | `$light-gray` | `#DCDCDC` |

---

## Typography / 字体排版

Font families, weights, and scale for the Neon Forge design language.
霓虹锻造设计语言的字体家族、字重与尺度。

### Font Families / 字体家族

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| **HEADERS / 标题** | Space Grotesk | 700–900 | Headings, display text, primary titles / 标题、展示文字和主标题 |
| **BODY TEXT / 正文** | Inter | 400 | Body copy, descriptions, UI labels / 正文、描述和界面标签 |
| **NUMBERS & CODE / 数字与代码** | Poppins | 500 | Numeric values, code snippets, monospaced contexts / 数值、代码片段和等宽字体场景 |
| **SECONDARY / 辅助中文** | Noto Sans SC | 400 | Chinese secondary text and UI labels / 中文辅助文本和界面标签 |

### Type Scale / 字体尺度

| Size | Name | Font | Weight |
|------|------|------|--------|
| `48px` | Display Large / 超大展示 | Space Grotesk | 700 |
| `36px` | Heading 1 / 一级标题 | Space Grotesk | 700 |
| `28px` | Heading 2 / 二级标题 | Space Grotesk | 700 |
| `22px` | Heading 3 / 三级标题 | Space Grotesk | 700 |
| `16px` | Body / 正文 | Inter | 400 |
| `14px` | Secondary / 辅助 | Inter | 400 |
| `10–12px` | Code / 代码数值 | Poppins | 500 |

---

## Spacing & Border Radius / 间距与圆角

Consistent spacing tokens and corner radius values.
统一的间距令牌与圆角数值。

### Spacing Tokens / 间距令牌

> **CSS 变量**: 已在 `site/src/styles/global.css` 的 `@theme` 块中实现。

| Token | Variable | Value |
|-------|----------|-------|
| XS / 极小 | `--spacing-xs` | `4px` |
| SM / 小 | `--spacing-sm` | `8px` |
| MD / 中 | `--spacing-md` | `16px` |
| LG / 大 | `--spacing-lg` | `24px` |
| XL / 极大 | `--spacing-xl` | `32px` |
| XXL / 极大+ | `--spacing-xxl` | `36px` |

### Border Radius / 圆角

| Token | Variable | Value |
|-------|----------|-------|
| SM / 小圆角 | `$radius-sm` | `4px` |
| MD / 中圆角 | `$radius-md` | `8px` |
| LG / 大圆角 | `$radius-lg` | `12px` |
| XL / 超大圆角 | `$radius-xl` | `20px` |
| Pill / 胶囊 | `$radius-pill` | `50px` |

## shadcn/ui 语义映射层

站点使用 shadcn/ui 组件库，通过 CSS 变量将 Neon Forge token 映射到 shadcn/ui 的语义化接口。
以下映射定义在 `site/src/styles/global.css` 的 `:root` 中：

| shadcn 变量 | 映射到 Neon Forge Token | 用途 |
|------------|----------------------|------|
| `--background` | `var(--color-surface)` | 页面背景 |
| `--foreground` | `var(--color-light-gray)` | 默认文字 |
| `--card` | `var(--color-dark-bg)` | 卡片背景 |
| `--primary` | `var(--color-lime-primary)` | 主操作色 |
| `--secondary` | `var(--color-secondary-bg)` | 次要背景 |
| `--muted` | `var(--color-secondary-bg)` | 弱化背景 |
| `--accent` | `var(--color-secondary-bg)` | 强调背景 |
| `--destructive` | `var(--color-error)` | 危险操作 |
| `--border` | `var(--color-secondary-bg)` | 边框 |
| `--ring` | `var(--color-lime-primary)` | 焦点环 |

**字体 CSS 变量**（同样在 `:root` 定义）：

| 变量 | 值 | 用途 |
|------|-----|------|
| `--font-heading` | `'Space Grotesk', sans-serif` | 标题 |
| `--font-body` | `'Inter', sans-serif` | 正文 |
| `--font-code` | `'Poppins', sans-serif` | 代码/数字 |
| `--font-zh` | `'Noto Sans SC', sans-serif` | 中文 |

---

## Page Layout / 页面布局

> **CSS 变量**: 布局尺寸已在 `site/src/styles/global.css` 的 `@theme` 块中定义为 CSS 变量。
> 当前站点使用 Tailwind 响应式工具类实现布局，CSS 变量作为参考值提供。

Page layout grid for the Synnovator platform at W>1440 breakpoint.
协创者平台在 W>1440 断点下的页面布局网格。

```
┌─────────────────────────────────────────────────┐
│              搜索区  Search Bar  1440 × 60        │
├────────┬────────────────────────────┬────────────┤
│        │                            │            │
│  导航  │         内容区              │  多功能区  │
│  168   │     Content  W: 856         │    328     │
│   ×    │   starts at (188, 84)       │    ×       │
│  900   │                            │   720      │
│        │                            │            │
└────────┴────────────────────────────┴────────────┘
```

### Layout Regions / 布局区域

| Region | Variable | Dimensions | Position |
|--------|----------|------------|----------|
| 搜索区 Search Bar | `--layout-search-height` | 1440 × 60 | Top, full width |
| 导航栏 Navigation | `--layout-nav-width` | 168 × 900 | Left, full height |
| 内容区 Content | `--layout-content-width` | W: 856 | Starts at (188, 84) |
| 多功能区 Sidebar | `--layout-sidebar-width` × `--layout-sidebar-height` | 328 × 720 | Starts at (1076, 144) |

### Spacing Between Regions / 区域间距

| Gap | Variable | Value |
|-----|----------|-------|
| 导航栏 → 内容区 | `--layout-gap-nav-content` | `20px` |
| 搜索区 → 内容区 | `--layout-gap-search-content` | `24px` |
| 内容区 → 多功能区 | `--layout-gap-content-sidebar` | `32px` |
| 搜索区 → 多功能区 | `--layout-gap-search-sidebar` | `84px` |
| 多功能区 → 右边缘/底边缘 | `--layout-sidebar-margin` | `36px` |

---

## Design Tokens Reference / 设计令牌速查

```css
/* Colors */
--lime-primary:   #BBFD3B;
--mint:           #74FFBB;
--cyan:           #41FAF4;
--pink:           #FF74A7;
--blue:           #4C78FF;
--orange:         #FB7A38;
--surface:        #181818;
--dark-bg:        #222222;
--secondary-bg:   #333333;
--near-black:     #00000E;
--white:          #FFFFFF;
--muted:          #A0A0A0;
--light-gray:     #DCDCDC;
--success:        #00B42A;
--error:          #FA541C;
--warning:        #FAAD14;

/* Spacing */
--spacing-xs:  4px;
--spacing-sm:  8px;
--spacing-md:  16px;
--spacing-lg:  24px;
--spacing-xl:  32px;
--spacing-xxl: 36px;

/* Border Radius */
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   20px;
--radius-pill: 50px;

/* Layout */
--layout-page-width:           1440px;
--layout-page-height:          900px;
--layout-nav-width:            168px;
--layout-search-height:        60px;
--layout-content-width:        856px;
--layout-sidebar-width:        328px;
--layout-sidebar-height:       720px;
--layout-gap-nav-content:      20px;
--layout-gap-search-content:   24px;
--layout-gap-content-sidebar:  32px;
--layout-gap-search-sidebar:   84px;
--layout-sidebar-margin-right: 36px;
--layout-sidebar-margin-bottom:36px;
```
