# 登录页重构 + 登录后引导设计

> **日期**：2026-03-11
> **状态**：Draft
> **范围**：`/login` 页面视觉升级 + 新用户 Welcome Modal

## 背景

当前登录页（`/login`）是一个居中卡片 + 表单的简单布局，缺少品牌展示和价值传达。登录成功后也没有任何引导，新用户不知道平台能做什么。

### 当前问题

1. 登录页视觉单薄，无品牌感
2. 新用户登录后缺乏引导，直接跳转到目标页
3. 无法区分新老用户

## 设计决策

### 方案选择

| 方案 | 登录页 | 登录后引导 | 选择理由 |
|------|--------|-----------|---------|
| **A（选定）** | 左右分栏 | Welcome Modal | 不新增路由，不打断 returnTo 流程，桌面体验最佳 |
| B | 左右分栏 | 独立 `/welcome` 页 | 打断 returnTo 流程 |
| C | 左右分栏 | 首页 Banner | 引导信息有限，易被忽略 |

### 关键决策

- **登录页独立 Layout**：从 `(public)` 移到 `(auth)` route group，去除 NavBar/Footer，实现全屏沉浸式
- **新老用户区分**：使用客户端 cookie（非数据库），轻量无侵入
- **通用引导**：不区分角色（Hacker/Organizer/Judge），展示平台核心功能
- **Dialog 组件**：通过 shadcn/ui 添加 Dialog 到 `@synnovator/ui`

## Part 1：登录页左右分栏

### 布局结构

```
┌────────────────────────────┬─────────────────────────┐
│      Brand Panel (55%)     │    Login Form (45%)     │
│      bg-muted              │    bg-background        │
│                            │                         │
│  Logo (light/dark)         │    "登录"               │
│                            │    [Password | GitHub]   │
│  "Git 原生的               │    ┌─────────────────┐  │
│   AI Hackathon 平台"       │    │ Username        │  │
│                            │    │ Password        │  │
│  ── SketchUnderline ──     │    │ [Sign In]       │  │
│                            │    └─────────────────┘  │
│  ✦ 浏览并参与 AI Hackathon  │                         │
│  ✦ 组建团队，提交项目       │    "还没有账号？"        │
│  ✦ 展示成果，赢得认可       │    "通过 GitHub 登录"   │
│                            │    "即可自动创建"        │
│      ~ SketchDoodle ~      │                         │
└────────────────────────────┴─────────────────────────┘
```

### 响应式行为

| 断点 | 行为 |
|------|------|
| `lg+`（≥1024px） | 左右分栏，55/45 比例 |
| `<lg` | 左面板隐藏（`hidden lg:flex`），右面板全宽，顶部显示简化标语 |

### 样式要点

- **左面板**：`bg-muted` 暖色背景，Brand Orange（H35）强调标语
- **右面板**：`bg-background`，跟随 light/dark 主题
- **全屏高度**：`min-h-screen`（`min-h-dvh`）
- **Sketch 装饰**：SketchUnderline 在标语下方，SketchDoodle 在左下角（遵循设计系统 max 2 per page）
- **无 NavBar/Footer**：独立 layout

### 文件结构变更

```
app/
  (auth)/
    login/
      page.tsx          # 登录页（从 (public)/login/ 移入）
    layout.tsx          # Auth layout（无 NavBar/Footer，仅 ThemeProvider）
  (public)/
    login/              # 删除
```

### 登录逻辑

保持现有逻辑不变：
- Password tab → `POST /api/auth/dev-login`
- GitHub tab → redirect `/api/auth/login`
- `returnTo` 参数传递不变

## Part 2：Welcome Modal

### 触发流程

```
用户登录成功
  → 跳转到 returnTo（默认 `/`）
  → (public)/layout.tsx 中的 <WelcomeDialog /> 检测 cookie
  → cookie `synnovator_onboarded` 不存在？
      → 弹出 Welcome Dialog
      → 用户关闭（任意方式）→ 写入 cookie → 不再弹出
  → cookie 存在？
      → 不渲染 Dialog
```

### Dialog 内容

```
┌──────────────────────────────────────────────────┐
│                                            [X]   │
│                                                  │
│   欢迎来到 Synnovator！                           │
│   一站式 AI Hackathon 平台                        │
│                                                  │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐  │
│   │  🔍        │ │  👤        │ │  🚀        │  │
│   │  浏览活动   │ │  创建档案   │ │  提交项目   │  │
│   │            │ │            │ │            │  │
│   │  发现正在   │ │  展示你的   │ │  组队参赛   │  │
│   │  进行的 AI  │ │  技能，匹配 │ │  提交作品   │  │
│   │  Hackathon │ │  理想队友   │ │  赢得认可   │  │
│   └────────────┘ └────────────┘ └────────────┘  │
│                                                  │
│              [ 开始探索 ]                          │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Cookie 规格

| 属性 | 值 |
|------|---|
| name | `synnovator_onboarded` |
| value | `1` |
| maxAge | 365 天（`31536000`） |
| path | `/` |
| httpOnly | `false`（客户端 JS 读写） |
| sameSite | `lax` |

### 关闭行为

以下操作均触发写 cookie + 关闭 Dialog：
- 点击「开始探索」CTA 按钮
- 点击右上角 X 按钮
- 点击背景遮罩
- 按 ESC 键

### 组件设计

```
components/
  WelcomeDialog.tsx     # Client Component, 读写 cookie, 控制显隐
```

- 使用 `@synnovator/ui` 的 Dialog（基于 shadcn/ui，需先添加）
- i18n 支持：所有文案通过 `t(lang, key)` 翻译
- 功能卡片：`bg-muted` + `rounded-lg` + `p-6`
- CTA 按钮：`bg-primary text-primary-foreground`
- 移动端：3 卡片竖排（`flex-col`）

### 在 Layout 中渲染

```tsx
// app/(public)/layout.tsx
<main>
  {children}
  <WelcomeDialog lang={lang} />
</main>
```

`WelcomeDialog` 内部自行判断是否显示（读 cookie），不需要 Server 端逻辑。

## Part 3：前置依赖

### 添加 Dialog 组件到 @synnovator/ui

通过 shadcn/ui CLI 添加 Dialog 组件到 `packages/ui/`，并从 `index.ts` 导出。

## i18n 新增 Keys

```json
{
  "auth.brand_tagline": "Git 原生的 AI Hackathon 平台",
  "auth.brand_highlight_1": "浏览并参与 AI Hackathon",
  "auth.brand_highlight_2": "组建团队，提交项目",
  "auth.brand_highlight_3": "展示成果，赢得认可",
  "auth.no_account_hint": "还没有账号？通过 GitHub 登录即可自动创建",
  "welcome.title": "欢迎来到 Synnovator！",
  "welcome.subtitle": "一站式 AI Hackathon 平台",
  "welcome.browse_title": "浏览活动",
  "welcome.browse_desc": "发现正在进行的 AI Hackathon",
  "welcome.profile_title": "创建档案",
  "welcome.profile_desc": "展示你的技能，匹配理想队友",
  "welcome.submit_title": "提交项目",
  "welcome.submit_desc": "组队参赛，提交作品，赢得认可",
  "welcome.cta": "开始探索"
}
```

## 不在范围内

- 首页（`/`）改动 — 保持现状
- 角色区分引导 — 本次通用引导
- 数据库用户状态追踪 — 仅用 cookie
- 注册流程 — GitHub OAuth 即注册，无独立注册页
