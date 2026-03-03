# Synnovator Monorepo 初始化 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize the Synnovator monorepo with docs/, page/, synnovator/ directories, git subtree CI sync, and Claude Code configuration.

**Architecture:** Simplified monorepo modeled after ezagent42/monorepo. 3 sub-projects (docs, page, synnovator) managed as git subtrees with CI auto-sync to read-only mirror repos. TypeScript ecosystem with pnpm enforced.

**Tech Stack:** Astro + Tailwind (page), TypeScript (synnovator), pnpm, GitHub Actions

---

### Task 1: Root .gitignore

**Files:**
- Create: `.gitignore`

**Step 1: Create .gitignore**

```gitignore
# OS
.DS_Store
._*
*~
Thumbs.db

# Editor
.vscode/
.idea/
*.swp

# Claude Code
.claude/settings.local.json
.claude/worktrees/
.claude/plugins/cache/

# Git worktrees
.worktrees/

# Node.js
node_modules/
dist/
.astro/

# Logs
*.log
```

**Step 2: Verify**

Run: `cat .gitignore | head -5`
Expected: First lines visible

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add root .gitignore"
```

---

### Task 2: Root README.md

**Files:**
- Create: `README.md`

**Step 1: Create README.md**

```markdown
# Synnovator

> Synnovator monorepo — CLI、后端系统与官网。

## 子项目

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| [`docs/`](docs/) | 设计文档 | Markdown |
| [`page/`](page/) | 官网 | Astro, Tailwind |
| [`synnovator/`](synnovator/) | CLI + 后端 | TypeScript |

## 开发

所有开发只在 monorepo 进行，子仓库是只读发布镜像。

详见 [MONOREPO.md](MONOREPO.md) 和 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

Apache 2.0
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add root README"
```

---

### Task 3: CLAUDE.md (root)

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md**

```markdown
# CLAUDE.md — Synnovator Monorepo

## 项目概述

Synnovator monorepo 是唯一的开发入口，使用 git subtree 管理 3 个子项目。

## 子项目导航

| 目录 | 说明 | 技术栈 | 指南 |
|------|------|--------|------|
| [`docs/`](docs/CLAUDE.md) | 设计文档 | Markdown | [docs/CLAUDE.md](docs/CLAUDE.md) |
| [`page/`](page/CLAUDE.md) | 官网 | Astro, Tailwind | [page/CLAUDE.md](page/CLAUDE.md) |
| [`synnovator/`](synnovator/CLAUDE.md) | CLI + 后端 | TypeScript | [synnovator/CLAUDE.md](synnovator/CLAUDE.md) |

## 关键文档

- **MONOREPO.md** — Monorepo 管理指南（subtree 操作、CI 同步、分支策略）
- **CONTRIBUTING.md** — 开发规范（Commit 格式、PR 流程）
- **docs/plans/** — 实施计划
- **docs/specs/** — 系统规格文档

## 核心规则

1. **所有开发只在 monorepo 进行**，子仓库是只读发布镜像
2. **subtree add/pull 必须用 `--squash`**，subtree push 不加 `--squash`
3. **推送到 main 后 CI 自动同步子仓库**
4. **JavaScript 用 `pnpm`，禁止 `npm`/`npx`**（PreToolUse hook 强制执行）

## 开发流程

```
feat/xxx → dev → main → [CI 自动同步到子仓库]
```

- Commit 格式：`type(scope): description`，scope 使用子项目名
- 详见 CONTRIBUTING.md

## Claude Code 配置

- `.claude/hooks/` — PreToolUse hook（工具约束强制执行）
- `.claude/settings.local.json` — 本地会话配置（已 gitignore）
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add root CLAUDE.md"
```

---

### Task 4: CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

**Step 1: Create CONTRIBUTING.md**

```markdown
# Contributing to Synnovator

## Commit 规范

格式：`type(scope): description`

### Type

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `refactor` | 重构（不改变行为） |
| `test` | 测试相关 |
| `chore` | 构建、依赖、配置等杂项 |
| `ci` | CI/CD 变更 |

### Scope

使用子项目名：`synnovator`, `page`, `docs`

### 示例

```
feat(synnovator): add CLI entry point
fix(page): fix responsive layout
docs(docs): add architecture spec
ci: add subtree sync workflow
```

## 分支策略

```
feat/xxx → dev → main → [CI 自动同步到子仓库]
```

| 分支 | 用途 |
|------|------|
| `main` | 稳定主分支，子仓库同步来源 |
| `dev` | 日常开发分支 |
| `feat/*` | 功能分支，从 `dev` 开出 |

## Pull Request

1. 从 `dev` 创建功能分支：`feat/my-feature`
2. 开发完成后提交 PR 到 `dev`
3. PR 标题遵循 Commit 规范格式
4. 合并到 `main` 后 CI 自动同步子仓库

## 工具约束

### JavaScript: 使用 pnpm（禁止 npm/npx）

| 禁止 | 使用 |
|------|------|
| `npm install` | `pnpm install` |
| `npm install foo` | `pnpm add foo` |
| `npm run dev` | `pnpm run dev` |
| `npm init` | `pnpm create` |
| `npm ci` | `pnpm install --frozen-lockfile` |
| `npx foo` | `pnpm dlx foo`（一次性）或 `pnpm exec foo`（本地） |

## 重要注意

- **所有开发只在 monorepo 进行**，不要直接向子仓库提交
- subtree 操作规范详见 **MONOREPO.md**
```

**Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add CONTRIBUTING.md"
```

---

### Task 5: MONOREPO.md

**Files:**
- Create: `MONOREPO.md`

**Step 1: Create MONOREPO.md**

Note: Replace `Synnovator` GitHub org/user with actual values. Using `Synnovator` as placeholder.

```markdown
# Monorepo 管理指南

本文件用于指导 agent 和用户管理 Synnovator 的 monorepo。

---

## 仓库结构

```
monorepo/
├── docs/                    → 设计文档 (subtree, CC0-1.0)
├── page/                    → 官网 (subtree, Apache 2.0)
├── synnovator/              → CLI + 后端 (subtree, Apache 2.0)
├── .claude/                 → Claude Code 项目配置
├── .github/workflows/       → CI/CD（subtree 自动同步）
└── MONOREPO.md              → 本文件
```

### 仓库地址

| 仓库 | 用途 | URL |
|------|------|-----|
| **monorepo** | 主开发仓库 | git@github.com:Synnovator/monorepo.git |
| **docs** | 设计文档（发布镜像） | git@github.com:Synnovator/docs.git |
| **page** | 官网（发布镜像） | git@github.com:Synnovator/page.git |
| **synnovator** | CLI + 后端（发布镜像） | git@github.com:Synnovator/synnovator.git |

> **核心原则**：所有开发工作只在 monorepo 进行，子仓库是单向的发布镜像。

---

## 新成员设置

```bash
git clone git@github.com:Synnovator/monorepo.git
cd monorepo

# 添加 remote 别名
git remote add docs       git@github.com:Synnovator/docs.git
git remote add page       git@github.com:Synnovator/page.git
git remote add synnovator git@github.com:Synnovator/synnovator.git

# 验证
git remote -v
```

<details>
<summary>初始化记录（首次设置，待执行）</summary>

以下命令在首次初始化时执行：

```bash
git subtree add --prefix=docs git@github.com:Synnovator/docs.git main --squash
git subtree add --prefix=page git@github.com:Synnovator/page.git main --squash
git subtree add --prefix=synnovator git@github.com:Synnovator/synnovator.git main --squash
```
</details>

---

## 日常开发流程

### 正常开发（在 monorepo 中）

```bash
# 编辑文件
vim synnovator/src/index.ts

# 正常提交
git add synnovator/src/index.ts
git commit -m "feat(synnovator): add CLI entry point"

# 推送 monorepo
git push origin main
```

### 同步到子仓库

```bash
git subtree push --prefix=docs docs main
git subtree push --prefix=page page main
git subtree push --prefix=synnovator synnovator main
```

> **注意**：`--squash` 用于 `subtree add` 和 `subtree pull`，不用于 `subtree push`。

---

## 自动化同步（GitHub Actions）

已配置 `.github/workflows/sync-subtrees.yml`，在 `main` 分支有新 push 时自动同步子仓库。

**配置要求**：
- GitHub → Settings → Secrets → Actions 中需配置 `GH_TOKEN`（Fine-grained PAT，对 3 个子仓库有 Contents 写权限）

---

## 分支策略

| 分支 | 用途 |
|------|------|
| `main` | 稳定主分支，子仓库同步来源 |
| `dev` | 日常开发分支 |
| `feat/*` | 功能分支 |

```
feat/xxx → dev → main → [自动同步到子仓库]
```

---

## 常用命令速查

```bash
# 查看所有 remote
git remote -v

# 同步单个子仓库
git subtree push --prefix=synnovator synnovator main

# 从子仓库拉取更新（紧急修复时使用）
git subtree pull --prefix=synnovator synnovator main --squash

# 查看某个目录的提交历史
git log --oneline -- synnovator/
```

---

## 注意事项

1. **永远不要在子仓库直接提交**。如果紧急情况在子仓库修改，需立即用 `git subtree pull` 拉回 monorepo。
2. **`--squash` 规则**：`subtree add/pull` 加 `--squash`，`subtree push` 不加。
3. **subtree push 较慢是正常现象**。推荐通过 CI 自动化。
4. **CI 必须 `fetch-depth: 0`**。`git subtree` 需要完整历史。
```

**Step 2: Commit**

```bash
git add MONOREPO.md
git commit -m "docs: add MONOREPO.md"
```

---

### Task 6: Claude Code 配置 (.claude/)

**Files:**
- Create: `.claude/settings.json`
- Create: `.claude/hooks/enforce-tools.sh`

**Step 1: Create .claude/settings.json**

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/enforce-tools.sh"
          }
        ]
      }
    ]
  }
}
```

**Step 2: Create .claude/hooks/enforce-tools.sh**

```bash
#!/usr/bin/env bash
# enforce-tools.sh — Block forbidden package managers, suggest alternatives.
# Configured as a PreToolUse hook for the Bash tool.

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

[ -z "$COMMAND" ] && exit 0

# --- JavaScript: npm/npx → pnpm ---
if echo "$COMMAND" | grep -qE '(^|[;&|])[[:space:]]*npm([[:space:]]|$)'; then
  cat >&2 <<'MSG'
BLOCKED: npm is not allowed. Use pnpm instead.

  npm install           → pnpm install
  npm install foo       → pnpm add foo
  npm run dev           → pnpm run dev
  npm init              → pnpm create
  npm exec foo          → pnpm exec foo
  npm ci                → pnpm install --frozen-lockfile

See CONTRIBUTING.md for details.
MSG
  exit 2
fi

if echo "$COMMAND" | grep -qE '(^|[;&|])[[:space:]]*npx([[:space:]]|$)'; then
  echo "BLOCKED: npx is not allowed. Use 'pnpm dlx' (one-off) or 'pnpm exec' (local) instead. See CONTRIBUTING.md." >&2
  exit 2
fi

exit 0
```

**Step 3: Make hook executable**

Run: `chmod +x .claude/hooks/enforce-tools.sh`

**Step 4: Commit**

```bash
git add .claude/settings.json .claude/hooks/enforce-tools.sh
git commit -m "chore: add Claude Code config with pnpm enforcement hook"
```

---

### Task 7: GitHub Actions CI sync workflow

**Files:**
- Create: `.github/workflows/sync-subtrees.yml`

**Step 1: Create workflow**

```yaml
name: Sync Subtrees to Sub-repos

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout monorepo (full history)
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GH_TOKEN }}

      - name: Configure git
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Add remotes and fetch
        run: |
          git remote add docs       https://x-token:${{ secrets.GH_TOKEN }}@github.com/Synnovator/docs
          git remote add page       https://x-token:${{ secrets.GH_TOKEN }}@github.com/Synnovator/page
          git remote add synnovator https://x-token:${{ secrets.GH_TOKEN }}@github.com/Synnovator/synnovator
          git fetch --all --no-tags

      - name: Sync docs
        continue-on-error: true
        run: |
          git subtree split --prefix=docs -b _split-docs
          git push docs _split-docs:main --force
          git branch -D _split-docs

      - name: Sync page
        continue-on-error: true
        run: |
          git subtree split --prefix=page -b _split-page
          git push page _split-page:main --force
          git branch -D _split-page

      - name: Sync synnovator
        continue-on-error: true
        run: |
          git subtree split --prefix=synnovator -b _split-synnovator
          git push synnovator _split-synnovator:main --force
          git branch -D _split-synnovator
```

**Step 2: Commit**

```bash
git add .github/workflows/sync-subtrees.yml
git commit -m "ci: add subtree auto-sync workflow"
```

---

### Task 8: docs/ sub-project

**Files:**
- Create: `docs/CLAUDE.md`
- Create: `docs/README.md`
- Create: `docs/specs/.gitkeep`
- Already exists: `docs/plans/2026-03-03-monorepo-init-design.md`

**Step 1: Create docs/CLAUDE.md**

```markdown
# CLAUDE.md — docs（设计文档）

本目录是 Synnovator 的文档仓库，包含系统规格和实施计划。License: CC0-1.0。

## 目录结构

```
docs/
├── specs/       → 系统规格文档
└── plans/       → 实施计划
```

## 文档编写规范

- 文档主体使用**中文**，技术术语保留英文原文
- 使用 Markdown 格式，标题层级不超过 4 级
- 代码示例使用 fenced code blocks，标注语言类型

### 命名约定

- 规格文档：`{domain}-spec.md`
- 计划文档：`YYYY-MM-DD-{name}.md`

## 注意事项

- 修改 spec 后检查交叉引用是否仍然正确
- 添加新文档时更新 `README.md` 的文档导航
```

**Step 2: Create docs/README.md**

```markdown
# Synnovator 文档

## 文档导航

### `specs/` — 系统规格

（待添加）

### `plans/` — 实施计划

| 文档 | 内容 |
|------|------|
| [monorepo-init-design](plans/2026-03-03-monorepo-init-design.md) | Monorepo 初始化设计 |
| [monorepo-init](plans/2026-03-03-monorepo-init.md) | Monorepo 初始化实施计划 |

## License

CC0-1.0
```

**Step 3: Create docs/specs/.gitkeep**

Empty file to preserve directory.

**Step 4: Commit**

```bash
git add docs/
git commit -m "docs(docs): initialize docs sub-project with specs/ and plans/"
```

---

### Task 9: page/ sub-project (Astro + Tailwind skeleton)

**Files:**
- Create: `page/CLAUDE.md`
- Create: `page/package.json`
- Create: `page/astro.config.mjs`
- Create: `page/tsconfig.json`
- Create: `page/src/pages/index.astro`
- Create: `page/src/layouts/BaseLayout.astro`
- Create: `page/src/styles/global.css`
- Create: `page/src/components/.gitkeep`
- Create: `page/public/favicon.svg`
- Create: `page/README.md`
- Create: `page/LICENSE`

**Step 1: Create page/package.json**

```json
{
  "name": "synnovator-page",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "astro": "^5.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "tailwindcss": "^4.1.0"
  }
}
```

**Step 2: Create page/astro.config.mjs**

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://synnovator.github.io',
  base: '/page',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Step 3: Create page/tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

**Step 4: Create page/src/styles/global.css**

```css
@import "tailwindcss";
```

**Step 5: Create page/src/layouts/BaseLayout.astro**

```astro
---
interface Props {
  title: string;
}
const { title } = Astro.props;
---

<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Step 6: Create page/src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Synnovator">
  <main>
    <h1>Synnovator</h1>
    <p>Coming soon.</p>
  </main>
</BaseLayout>
```

**Step 7: Create page/public/favicon.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="24">S</text>
</svg>
```

**Step 8: Create page/src/components/.gitkeep**

Empty file.

**Step 9: Create page/CLAUDE.md**

```markdown
# CLAUDE.md — page（官网）

Synnovator 官方网站。License: Apache 2.0。

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro | 静态站点框架 |
| Tailwind CSS | 样式 |
| GitHub Pages | 部署 |
| pnpm | 包管理（**禁止 npm/npx**） |

## 目录结构

```
page/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/            # 页面路由
│   ├── layouts/          # 页面布局
│   ├── components/       # 可复用组件
│   └── styles/           # CSS
└── public/               # 静态资源
```

## 开发指南

```bash
pnpm install          # 安装依赖
pnpm run dev          # 开发服务器
pnpm run build        # 生产构建
pnpm run preview      # 预览构建结果
```

## Commit 规范

```
feat(page): add hero section
fix(page): fix responsive layout
```
```

**Step 10: Create page/README.md**

```markdown
# Synnovator Page

Synnovator 官方网站，使用 Astro + Tailwind CSS 构建。

## 开发

```bash
pnpm install
pnpm run dev
```

## License

Apache 2.0
```

**Step 11: Create page/LICENSE**

Standard Apache 2.0 license text.

**Step 12: Install dependencies**

Run: `cd page && pnpm install`

**Step 13: Verify build**

Run: `cd page && pnpm run build`
Expected: Build succeeds, dist/ directory created

**Step 14: Commit**

```bash
git add page/
git commit -m "feat(page): initialize Astro + Tailwind project skeleton"
```

---

### Task 10: synnovator/ sub-project (TypeScript skeleton)

**Files:**
- Create: `synnovator/CLAUDE.md`
- Create: `synnovator/package.json`
- Create: `synnovator/tsconfig.json`
- Create: `synnovator/src/index.ts`
- Create: `synnovator/README.md`
- Create: `synnovator/LICENSE`

**Step 1: Create synnovator/package.json**

```json
{
  "name": "synnovator",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

**Step 2: Create synnovator/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src"]
}
```

**Step 3: Create synnovator/src/index.ts**

```typescript
export const VERSION = '0.1.0';
```

**Step 4: Create synnovator/CLAUDE.md**

```markdown
# CLAUDE.md — synnovator（CLI + 后端）

Synnovator 核心系统。License: Apache 2.0。

## 技术栈

| 技术 | 用途 |
|------|------|
| TypeScript | 语言 |
| pnpm | 包管理（**禁止 npm/npx**） |

## 目录结构

```
synnovator/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts          # 入口
```

## 开发指南

```bash
pnpm install          # 安装依赖
pnpm run build        # 编译
pnpm run dev          # 监听模式编译
```

## Commit 规范

```
feat(synnovator): add CLI entry point
fix(synnovator): handle edge case
```
```

**Step 5: Create synnovator/README.md**

```markdown
# Synnovator

Synnovator CLI + 后端系统。

## 开发

```bash
pnpm install
pnpm run build
```

## License

Apache 2.0
```

**Step 6: Create synnovator/LICENSE**

Standard Apache 2.0 license text.

**Step 7: Install dependencies**

Run: `cd synnovator && pnpm install`

**Step 8: Verify build**

Run: `cd synnovator && pnpm run build`
Expected: Build succeeds, dist/index.js created

**Step 9: Commit**

```bash
git add synnovator/
git commit -m "feat(synnovator): initialize TypeScript project skeleton"
```

---

### Task 11: Final verification and squash commit

**Step 1: Verify directory structure**

Run: `find . -not -path './node_modules/*' -not -path './.git/*' -not -path './page/node_modules/*' -not -path './synnovator/node_modules/*' -not -path './page/dist/*' -not -path './synnovator/dist/*' -not -path './page/.astro/*' | sort`

Expected: Full tree matching the design document.

**Step 2: Verify git log**

Run: `git log --oneline`
Expected: Sequential commits for each task.

**Step 3: Verify page build**

Run: `cd page && pnpm run build`
Expected: Clean build.

**Step 4: Verify synnovator build**

Run: `cd synnovator && pnpm run build`
Expected: Clean build.
