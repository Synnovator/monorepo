# Header Refactor — 设计文档

**日期**: 2026-03-11
**状态**: 已批准

## 目标

将 Header 中的导航链接迁移到统一的 MainSidebar，Header 瘦身为搜索栏 + 核心操作栏，并引入 cmdk CommandDialog 实现全局搜索。

## 设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Sidebar 范围 | 统一 MainSidebar，覆盖 public + admin | 一致体验，减少代码重复 |
| AdminSidebar | 并入 MainSidebar "管理"折叠组 | 项目少(5项)，无需独立侧边栏 |
| Sidebar 结构 | 扁平 + 折叠子项 | 层级少、紧凑，契合 shadcn Collapsible |
| Header 保留元素 | Logo, 搜索触发器, + 创建, 语言, 主题, 头像 | "+"创建"是核心 CTA 需突出 |
| 搜索交互 | cmdk CommandDialog (Cmd+K) | 主流范式，可扩展命令/跳转 |

## 架构

### AppShell 组件

封装整体布局的共享组件，被 `(public)` 和 `(admin)` layout 共同使用。

```
AppShell
├─ SidebarProvider
│   ├─ MainSidebar
│   │   ├─ SidebarHeader — Logo (collapsed: icon only)
│   │   ├─ SidebarContent
│   │   │   ├─ 活动 (/)
│   │   │   ├─ 提案 (/proposals)
│   │   │   ├─ ▶ 指南 (Collapsible)
│   │   │   │   ├─ 黑客指南 (/guides/hacker)
│   │   │   │   ├─ 组织者指南 (/guides/organizer)
│   │   │   │   └─ 评委指南 (/guides/judge)
│   │   │   └─ ▶ 管理 (Collapsible, 权限控制)
│   │   │       ├─ Dashboard (/admin)
│   │   │       ├─ Hackathons (/admin/hackathons)
│   │   │       ├─ Profiles (/admin/profiles)
│   │   │       ├─ Submissions (/admin/submissions)
│   │   │       └─ Theme (/admin/theme)
│   │   └─ SidebarRail — 点击收起/展开
│   └─ SidebarInset
│       ├─ SlimHeader
│       │   ├─ SidebarTrigger (hamburger)
│       │   ├─ 搜索触发器 (Cmd+K 提示)
│       │   ├─ + 创建 DropdownMenu
│       │   ├─ 语言切换
│       │   ├─ ModeToggle
│       │   └─ OAuthButton
│       └─ <main> {children}
```

### SlimHeader

```
┌──────────────────────────────────────────────────────┐
│ [☰] [Logo]  [🔍 搜索... ⌘K]  [+ 创建 ▼] [EN] [◑] [👤] │
└──────────────────────────────────────────────────────┘
```

- 固定顶部，高度保持 `h-14`（比当前 `h-16` 略减）
- `SidebarTrigger` 替代原 hamburger，统一控制 Sidebar
- 搜索触发器：只读按钮，点击/`Cmd+K` 打开 CommandDialog
- "+ 创建"保留 DropdownMenu（创建活动/创建提案）

### CommandSearch

基于 `cmdk` 的全局搜索对话框：

```
CommandDialog (Cmd+K)
├─ CommandInput — 搜索输入
├─ CommandList
│   ├─ CommandGroup "活动"
│   │   └─ 复用 HackathonFilter 匹配逻辑 (name/tagline/type)
│   ├─ CommandGroup "页面"
│   │   └─ 静态页面跳转 (提案、指南、管理等)
│   └─ CommandEmpty — 无结果提示
└─ 选择 → router.push()
```

搜索数据源：
- 活动：从 `_generated/data` 读取 hackathon 列表，复用 `getSearchText()` 匹配
- 页面：硬编码的导航页面列表（与 MainSidebar 项一致）

### MainSidebar

| 属性 | 值 |
|------|-----|
| `collapsible` | `"icon"` — 收起时显示图标 |
| `side` | `"left"` |
| 宽度 | `--sidebar-width: 16rem`, `--sidebar-width-icon: 3rem` |
| 持久化 | Cookie `sidebar_state`（已有实现） |
| 快捷键 | `Ctrl+B` / `Cmd+B`（已有实现） |

管理组可见性：根据用户权限条件渲染（复用 admin layout 的权限检查逻辑）。

### 移动端

- Sidebar → Sheet drawer（shadcn 内置）
- SlimHeader 的 `SidebarTrigger` 触发 drawer
- CommandDialog 在移动端保持全屏弹出
- 不需要单独的 hamburger 菜单逻辑

### PagePreview 更新

`PagePreview` 组件（admin/theme 工具）需要反映新布局：

- 添加迷你 SlimHeader 预览（搜索栏 + 创建按钮骨架）
- 添加迷你 MainSidebar 预览（折叠状态，显示图标）
- 保留现有 HackathonCard / ProjectCard 预览区域
- 让主题预览更真实地反映实际页面布局

## 变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `components/AppShell.tsx` | SidebarProvider + MainSidebar + SlimHeader + SidebarInset |
| 新增 | `components/MainSidebar.tsx` | 统一侧边栏 |
| 新增 | `components/SlimHeader.tsx` | 瘦身后的 Header |
| 新增 | `components/CommandSearch.tsx` | cmdk CommandDialog |
| 新增 | `packages/ui/src/components/command.tsx` | shadcn Command 组件（基于 cmdk） |
| 重构 | `app/(public)/layout.tsx` | 使用 AppShell 替代 NavBar |
| 重构 | `app/(admin)/admin/layout.tsx` | 使用 AppShell 替代独立 SidebarProvider + AdminSidebar |
| 修改 | `components/admin/theme/PagePreview.tsx` | 添加 SlimHeader + Sidebar 预览 |
| 修改 | `components/HackathonFilter.tsx` | 抽取搜索逻辑为 hook `useHackathonSearch` |
| 删除 | `components/NavBar.tsx` | 功能已迁移 |
| 删除 | `components/admin/AdminSidebar.tsx` | 功能并入 MainSidebar |
| 新增 | `cmdk` 依赖 | `pnpm add cmdk` in apps/web |
| 修改 | i18n `zh.yml` / `en.yml` | 添加 sidebar + search 翻译 key |

## 不在范围内

- 搜索逻辑优化（模糊搜索、权重排序等）— 后续迭代
- Footer 改动 — 保持不变
- 路由结构变更 — 复用现有 `(public)` / `(admin)` 分组
- 认证流程变更 — 复用现有 auth guard
