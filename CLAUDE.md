# CLAUDE.md — Synnovator Monorepo

## 项目概述

Synnovator 是 Git 原生的 Hackathon 平台。本仓库是"产品即 repo"模式：`hackathons/` 和 `profiles/` 存放用户通过 PR/Issue 提交的数据，`apps/web/` 读取数据生成页面。仓库同时也是管理后端——管理员通过 Claude Code Skill 执行管理操作，GitHub RBAC 控制权限。

## 目录导航

| 目录 | 说明 | 指南 |
|------|------|------|
| [`apps/web/`](apps/web/CLAUDE.md) | 官网（Next.js App Router + OpenNext Cloudflare） | [apps/web/CLAUDE.md](apps/web/CLAUDE.md) |
| [`packages/ui/`](packages/ui/) | 共享 UI 组件库 | — |
| [`packages/shared/`](packages/shared/) | 共享逻辑（Schema、数据读取、i18n、Auth） | — |
| [`hackathons/`](hackathons/) | 活动数据（YAML） | — |
| [`profiles/`](profiles/) | 用户 Profile（YAML） | [profiles/_schema.yml](profiles/_schema.yml) |
| [`teams/`](teams/) | 队伍数据（YAML） | [teams/_schema.yml](teams/_schema.yml) |
| [`scripts/`](scripts/) | 底层脚本（由 Skill 调用，管理员无需直接使用） | — |
| [`docs/`](docs/CLAUDE.md) | 设计文档 | [docs/CLAUDE.md](docs/CLAUDE.md) |
| [`.claude/skills/`](.claude/) | Claude Code Skills（管理操作入口） | — |

## 关键文档

- **docs/specs/synnovator-prd.md** — PRD 权威源（数据 Schema、架构设计）
- **docs/specs/design-system.md** — 设计系统（OKLCH 色彩令牌、字体、间距、动效、组件模式）
- **docs/acceptance/** — 验收规范（Given-When-Then BDD，按角色组织）
- **docs/plans/** — 实施计划和架构设计
- **CONTRIBUTING.md** — 开发规范（Commit 格式、PR 流程）

## 常用命令

```bash
pnpm install              # 安装所有依赖
pnpm dev                  # 启动 apps/web 开发服务器（Turbopack）
pnpm build                # 构建所有包
pnpm --filter @synnovator/shared test   # 运行 shared 包测试（Vitest）
pnpm --filter @synnovator/web build     # 构建 web 生产版本
bash scripts/validate-hackathon.sh <path>  # 校验 hackathon YAML 文件
```

## 核心规则

1. **JavaScript 用 `pnpm`，禁止 `npm`/`npx`**（PreToolUse hook 强制执行）
2. **数据变更通过 PR 提交**，Actions 自动校验
3. **`apps/web/` 从数据目录读取 YAML 生成页面**，推送到 main 后通过 GitHub Actions（`.github/workflows/deploy.yml`）自动部署到 Cloudflare Workers
4. **管理操作通过 Skill 执行**，Skill 调用 `scripts/` 底层脚本，管理员无需直接操作脚本

## 管理模型

本仓库即管理后端。管理员通过 Claude Code Skill 管理平台，无需独立的 Admin Panel。

```
管理员 clone 仓库 → /synnovator-admin → Skill 编辑 YAML / 调用 scripts/ → git commit → PR → Actions 校验 → 合并
```

**Skill 与 scripts 的关系**：
- `scripts/` 包含底层脚本（`create-hackathon.sh`, `create-profile.sh`, `submit-project.sh`）
- Skill 是用户界面层，封装 scripts/ 调用 + YAML 编辑 + Schema 校验 + PR 创建
- 管理员只与 Skill 交互，不需要直接执行 scripts/ 或手动编辑 YAML

**权限控制**：GitHub RBAC（Admin / Write+CODEOWNERS / Triage / Read），详见 PRD §7.4。

## 数据流

```
用户 PR → hackathons/*.yml / profiles/*.yml → Actions 校验 → Merge → deploy.yml 构建 → Cloudflare Workers
用户 Issue → 注册/NDA/评分/申诉/组队 → Actions 校验 → Label → sync-issue-data → PR → Merge
管理员 Skill → scripts/ + YAML 编辑 → PR → Actions 校验 → Merge
```

## 开发流程

```
feat/xxx ──→ main → [自动部署]
data/xxx ──→ main → [自动部署]  (平台数据变更)
```

- Commit 格式：`type(scope): description`，scope 使用 `web`, `ui`, `shared`, `docs`
- 代码分支：`feat/*`, `fix/*`, `docs/*`；数据分支：`data/*`
- 详见 CONTRIBUTING.md

## GitHub Actions 工作流

| Workflow | 触发条件 | 用途 |
|----------|----------|------|
| `deploy.yml` | push to main | 构建并部署到 Cloudflare Workers |
| `claude-code-review.yml` | PR opened/sync | 自动 Code Review |
| `claude.yml` | PR/Issue 中 @claude | Claude Code 对话 |
| `validate-hackathon.yml` | PR 修改 `hackathons/**` | 校验 hackathon YAML |
| `validate-profile.yml` | PR 修改 `profiles/**` | 校验 profile YAML |
| `validate-submission.yml` | PR 修改 submissions | 校验提交 YAML |
| `sync-issue-data.yml` | Issue labeled | 将 Issue 数据同步到 YAML PR |
| `status-update.yml` | schedule | 自动更新活动状态 |

其余 workflow: `validate-register`, `validate-score`, `validate-nda`, `validate-appeal`, `validate-team`, `aggregate-scores`

## Claude Code 配置

- `.claude/skills/` — 管理 Skills（`synnovator-admin` 等，管理操作入口）
- `.claude/hooks/` — PreToolUse hook（`enforce-tools.sh` 强制 pnpm、`check-plugins.sh` 检查插件、`pre-commit.sh` 提交检查）
- `.claude/settings.local.json` — 本地会话配置（已 gitignore）

## 注意事项

- `pnpm deploy` 是 pnpm 内置命令（workspace 包发布），部署脚本应使用 `pnpm run deploy`
- `apps/web/` 的 `prebuild` 脚本会自动运行 `generate-static-data.mjs` 生成静态数据
- Cloudflare dashboard 中 Pages 项目的 GitHub 集成应保持**断开**状态（部署由 Actions 控制）

## Design Context

### Users
Hackathon organizers and participants — developers, students, and tech professionals who create and join AI hackathon events. They use the platform to browse hackathons, register teams, submit projects, and view results. Organizers manage events through Git-native YAML workflows. Context: high-energy competition environment where clarity and speed matter; users are technically skilled but time-constrained during events.

### Brand Personality
**Energetic · Professional · Warm**

The platform should feel like a well-organized hackathon venue: buzzing with creative energy but clearly structured. Warm orange tones convey approachability and action. The interface should inspire confidence in the platform's reliability while encouraging participation and creativity.

### Aesthetic Direction
- **Visual tone**: Editorial warmth — magazine-like article flow for content, purposeful restraint in decoration
- **Theme**: Light/Dark dual mode via `next-themes` with system preference detection. Warm-tinted neutrals (Hue 55–80 in OKLCH) avoid cold gray; never pure black or pure white
- **Color system**: 3-color brand palette — Brand Orange (H35), Highlight Lime (H128), Info Indigo (H270) — with per-hackathon-type overrides via CSS custom properties
- **Signature detail**: Hand-drawn SVG sketch annotations (SketchCircle, SketchUnderline, SketchArrow, SketchDoodle) add organic warmth to key moments; limited to max 2 per page
- **Anti-references**: Generic AI interfaces (cyan-on-dark, purple gradients, glassmorphism, neon glow), over-decorated dashboards, card-soup layouts

### Design Principles

1. **Semantic tokens, not hard-coded values** — All colors through OKLCH CSS custom properties mapped via `@theme inline`. No hex/rgb in components. Hackathon types override `--brand` through `data-hackathon-type` attribute cascading.

2. **Article flow over card soup** — Content sections separated by `<hr>` dividers and spacing rhythm (`mb-12` major, `mb-8` minor), not wrapped in redundant card containers. Cards reserved for genuinely distinct items (tracks, projects, judges).

3. **Type differentiation through shape, not just color** — Each hackathon type has a distinct card silhouette (Community: rounded-xl + top border, Enterprise: rounded-sm + left border, Youth League: rounded-lg + dashed + tilt) and hover personality (lift / scale / snap-back).

4. **Motion with purpose and restraint** — Only `transform` and `opacity` animations. Sketch draw animation (400ms ease-out) triggers once via IntersectionObserver. `prefers-reduced-motion` always respected. No bounce or elastic easing.

5. **Accessibility as baseline** — WCAG AA contrast (4.5:1) for all text-on-background combinations. Semantic HTML landmarks. Keyboard arrow navigation for tabs. `focus-visible` rings on all interactive elements. `aria-*` attributes on dynamic UI. Token audit regression test prevents reintroduction of deprecated tokens.

@.claude/RTK.md

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->