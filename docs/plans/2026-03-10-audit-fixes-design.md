# Audit Fixes Design — UI 质量修复方案

> 日期: 2026-03-10
> 基于: `/audit` skill 生成的 25 项 issue 报告

## 背景

对 `apps/web/` 执行 `/audit` skill 后发现 25 个 UI 质量问题（3 Critical, 8 High, 6 Medium, 8 Low），涵盖可访问性、设计 token、响应式、性能四个维度。Anti-pattern verdict: PASS（无 AI slop）。

## 策略

按 skill 分 4 个批次执行修复，每批次独立 commit。执行顺序按依赖关系排列：

```
/harden (16) → /normalize (3) → /adapt (4) → /optimize (3)
```

## 批次 1: `/harden` — 可访问性 (16 issues)

### Critical (C1-C3)

| ID | 组件 | 修复 |
|----|------|------|
| C1 | `HackathonTabs.tsx`, `LoginForm.tsx` | 添加 `role="tab"`, `aria-selected`, `aria-controls`; panel 添加 `role="tabpanel"`, `aria-labelledby` |
| C2 | `NavBar.tsx`, `OAuthButton.tsx` | 用 shadcn/ui `DropdownMenu` 替换手写 dropdown（自带键盘导航） |
| C3 | `hackathons/[slug]/page.tsx` | tab panel 添加 `role="tabpanel"`, `aria-labelledby`; `style={{display:'none'}}` 改 Tailwind `hidden` |

### High (H1-H8)

| ID | 范围 | 修复 |
|----|------|------|
| H1 | 所有 form 组件 (8 文件) | 添加 `htmlFor`/`id` label-input 关联 |
| H2 | `HackathonFilter.tsx` | 搜索输入添加 `aria-label` |
| H3 | 含错误消息的 form 组件 | 添加 `aria-describedby` + `aria-live="polite"` |
| H4 | 所有 form 组件 | 添加 `aria-required`, `aria-invalid` |
| H5 | `HackathonFilter.tsx`, `ProposalsViewToggle.tsx` | 添加 `aria-pressed` |
| H6 | `CreateProposalForm.tsx`, `CreateHackathonForm.tsx` | step indicator 添加 `aria-label`, `aria-current="step"` |
| H7 | `ScoreCard.tsx` | range slider 添加 `aria-label` |
| H8 | `OAuthButton.tsx` | avatar `alt=""` → `alt={user.login}` |

### Low (L1-L4)

| ID | 范围 | 修复 |
|----|------|------|
| L1 | Layout | 添加 skip-to-main-content link |
| L2 | `EventCalendar.tsx`, `Timeline.tsx` | 改用 `<ul>`/`<li>` 语义列表 |
| L3 | 多个组件 | 装饰性 SVG 统一 `aria-hidden="true"` |
| L4 | `TeamsTab.tsx` | 外部链接 icon 添加 `aria-hidden` |

**Commit**: `fix(web): harden accessibility — ARIA, forms, keyboard`

## 批次 2: `/normalize` — 设计 token (3 issues)

| ID | 范围 | 修复 |
|----|------|------|
| M1 | `packages/ui/src/styles/global.css`, `docs/specs/design-system.md` | `--color-muted` 从 `#8E8E8E` 提升至 `~#A0A0A0`（AA 4.5:1） |
| M5 | `LoginForm.tsx` | `bg-[#24292f]` 替换为 token（`bg-secondary-bg` 或新增 `--color-github`） |
| L5 | `TimelineEditor.tsx` | `text-[10px]` → `text-xs` |

**Commit**: `fix(web): normalize design tokens — contrast, colors`

## 批次 3: `/adapt` — 响应式 (4 issues)

| ID | 范围 | 修复 |
|----|------|------|
| M2 | `NavBar.tsx` | 添加 hamburger menu（`md:hidden`） |
| M4 | `HackathonFilter.tsx`, `ProposalsViewToggle.tsx`, `NavBar.tsx` | 交互元素 `min-h-11 min-w-11`（44px） |
| L6 | 多个页面 | 标题 `text-2xl sm:text-3xl md:text-4xl lg:text-5xl` 渐进缩放 |
| L8 | `CreateProposalForm.tsx`, `CreateHackathonForm.tsx` | 小屏隐藏 step 文字标签，只显示圆点 |

**Commit**: `fix(web): adapt responsive — mobile nav, touch targets`

## 批次 4: `/optimize` — 性能 (3 issues)

| ID | 范围 | 修复 |
|----|------|------|
| M3 | `CreateHackathonForm.tsx` | 提取 `React.memo` 子组件 + `useCallback` handler |
| M6 | `layout.tsx` | Space Grotesk/Inter `preload`; Noto Sans SC 按 `?lang=zh` 条件加载 |
| L7 | `Footer.tsx` | Image 添加 `loading="lazy"` |

**Commit**: `perf(web): optimize — memoization, font loading`

## 验证流程

```bash
pnpm --filter @synnovator/shared test   # schema 测试
pnpm --filter @synnovator/web build     # 生产构建
git push → PR
```

## 约束

- 不引入新外部依赖（shadcn/ui DropdownMenu 已在 packages/ui）
- 不改业务逻辑
- 每批次 skill 执行后独立 commit
