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
