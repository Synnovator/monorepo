# API-Based PR Submission Design

**Date:** 2026-03-09
**Status:** Approved

## Problem

当前表单提交流程使用 `buildPRUrl()` 跳转到 GitHub 的 web editor（`/new/main`），存在三个问题：

1. 有 write 权限的用户可以直接提交到 main，跳过 PR 流程
2. 无 write 权限的外部用户需要手动 fork → branch → PR，流程复杂
3. 分支名由用户或 GitHub 自动生成（如 `username-patch-1`），无法遵循 `data/*` 命名规范

## Solution

使用现有 GitHub App（Synnovator, App ID: 2996003）的 Installation Token，在服务端创建分支 → 提交文件 → 创建 PR。用户只需点击"提交"按钮，一键完成。

## GitHub App 配置步骤

### 步骤 1：添加权限

在 GitHub 页面：**Settings → Developer settings → GitHub Apps → Synnovator → Permissions & events → Repository permissions**

| Repository permission | 当前 | 改为 |
|----------------------|------|------|
| Contents | No access | **Read and write** |
| Pull requests | No access | **Read and write** |
| Metadata | Read-only | Read-only（不变） |

保存后，GitHub 会提示已安装此 App 的组织需要 review and accept 新权限。

### 步骤 2：安装 App 到 Synnovator 组织

App 创建在个人账号下，需要安装到组织：

1. 进入 GitHub App 设置页：**Settings → Developer settings → GitHub Apps → Synnovator**
2. 左侧栏点击 **"Install App"**
3. 找到 **Synnovator** 组织 → 点击 **Install**
4. 选择 **"Only select repositories"** → 勾选 **monorepo** → 确认安装

安装后访问 `https://github.com/organizations/Synnovator/settings/installations`，点击 Synnovator App，URL 中的数字就是 Installation ID。

> 可选：可在 App Settings → Advanced → Transfer ownership 将 App 转移到 Synnovator 组织名下。

### 步骤 3：生成 Private Key

在 GitHub 页面：**Settings → Developer settings → GitHub Apps → Synnovator → General → Private keys**

点击 **Generate a private key** → 浏览器下载 `.pem` 文件。

### 步骤 4：配置环境变量

#### 生产/预览环境（Cloudflare Pages Dashboard）

**Cloudflare Dashboard → Pages → synnovator → Settings → Environment variables**

| 变量名 | 值 | 类型 | 说明 |
|--------|-----|------|------|
| `GITHUB_APP_ID` | `2996003` | Plain text | App ID |
| `GITHUB_APP_PRIVATE_KEY` | `.pem 文件完整内容` | **Encrypted** | 含 BEGIN/END 标记 |
| `GITHUB_APP_INSTALLATION_ID` | 从 URL 获取的数字 | Plain text | 步骤 2 的 Installation ID |

> Production 和 Preview 环境都需要设置。Private Key 必须用 Encrypted 类型。

#### 本地开发环境

创建 `apps/web/.dev.vars`（已在 `.gitignore` 中）：

```
GITHUB_APP_ID=2996003
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=12345678
```

提供 `apps/web/.dev.vars.example` 作为模板（不含实际密钥）。

## 服务端架构

### API Route: `POST /api/submit-pr`

```
Request:
{
  "type": "hackathon" | "proposal" | "profile",
  "filename": "hackathons/my-hack/hackathon.yml",
  "content": "synnovator_version: '2.0'\n...",
  "slug": "my-hack"
}

Response 200: { "pr_url": "https://github.com/Synnovator/monorepo/pull/30" }
Response 401: { "error": "unauthorized" }
Response 500: { "error": "failed to create PR" }
```

### 分支命名规范

| type | 分支名模式 | 示例 |
|------|-----------|------|
| `hackathon` | `data/create-hackathon-{slug}` | `data/create-hackathon-my-hack-2026` |
| `proposal` | `data/submit-{slug}` | `data/submit-team-alice-agentflow` |
| `profile` | `data/create-profile-{slug}` | `data/create-profile-allenwoods` |

### 服务端流程

```
1. 验证用户 session（从 cookie 解密，确认已登录）
2. 校验参数（type 合法、filename 匹配白名单模式、content 非空）
3. 用 GitHub App Private Key + App ID 通过 @octokit/auth-app 获取 Installation Token
4. 调用 GitHub API：
   a. GET  /repos/{owner}/{repo}/git/ref/heads/main        → 获取 main SHA
   b. POST /repos/{owner}/{repo}/git/refs                   → 创建分支
   c. PUT  /repos/{owner}/{repo}/contents/{filename}         → 提交文件
   d. POST /repos/{owner}/{repo}/pulls                       → 创建 PR
5. 返回 PR URL
```

### PR 模板

```
title: "{commitPrefix}: {description}"

body:
## 📋 {formType}

Submitted by @{username}

**File:** `{filename}`

---
> 🤖 Auto-created via [Synnovator Platform](https://home.synnovator.space)
```

Commit prefix 根据 type：
- hackathon → `feat(hackathons): create {slug}`
- proposal → `feat(submissions): submit {name} to {hackathon}`
- profile → `feat(profiles): create profile for {username}`

### 依赖

```bash
pnpm --filter @synnovator/web add @octokit/auth-app @octokit/rest
```

## 前端改动

### handleSubmit 改为 API 调用

```tsx
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState('');

async function handleSubmit() {
  setSubmitting(true);
  setSubmitError('');
  try {
    const res = await fetch('/api/submit-pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, filename, content: yamlContent, slug }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    window.open(data.pr_url, '_blank', 'noopener,noreferrer');
  } catch (e) {
    setSubmitError(e instanceof Error ? e.message : 'Unknown error');
  } finally {
    setSubmitting(false);
  }
}
```

### 按钮状态

- `submitting` 时显示 loading 状态，按钮禁用
- 错误时在按钮下方显示 error message

### 各表单参数

| 表单 | type | slug | filename |
|------|------|------|----------|
| CreateHackathonForm | `"hackathon"` | `slug \|\| toSlug(name)` | `hackathons/{slug}/hackathon.yml` |
| CreateProposalForm | `"proposal"` | `teamSlug` | `hackathons/{hackathon}/submissions/{teamSlug}/project.yml` |
| ProfileCreateForm | `"profile"` | `user.login` | `profiles/{user.login}-{uuid}.yml` |

### 清理

- 删除 `buildPRUrl`（不再使用）
- 保留 `buildIssueUrl` 和 `openGitHubUrl`（Issue-based 表单仍需要）

## 错误处理

### 分支名冲突

```
尝试创建分支 → 422 Reference already exists
→ 追加时间戳重试：data/create-hackathon-my-hack-1741502400
```

### 安全校验

1. 用户已登录（session cookie 验证）
2. filename 必须匹配白名单模式：
   - `hackathons/*/hackathon.yml`
   - `hackathons/*/submissions/*/project.yml`
   - `profiles/*.yml`
3. type 仅接受 `hackathon | proposal | profile`
4. content 非空

### 错误映射

| GitHub API 错误 | 用户提示 |
|----------------|---------|
| 401/403 | 系统错误，请联系管理员 |
| 422 分支冲突 | 自动重试（用户无感知） |
| 422 其他 | 提交内容格式有误 |
| 网络超时 | 提交超时，请重试 |

## 涉及文件

| 操作 | 文件 |
|------|------|
| 新增 | `apps/web/app/api/submit-pr/route.ts` |
| 新增 | `apps/web/lib/github-app.ts` |
| 新增 | `apps/web/.dev.vars.example` |
| 修改 | `apps/web/components/forms/CreateHackathonForm.tsx` |
| 修改 | `apps/web/components/forms/CreateProposalForm.tsx` |
| 修改 | `apps/web/components/forms/ProfileCreateForm.tsx` |
| 修改 | `packages/shared/src/i18n/en.json` |
| 修改 | `packages/shared/src/i18n/zh.json` |
| 修改 | `apps/web/lib/github-url.ts`（删除 buildPRUrl） |

## 不在此次范围

- YAML 内容的 Zod schema 校验（由 GitHub Actions CI 执行）
- Rate limiting（Installation Token 默认 5000 req/hour）
- 重复提交检测（依赖 PR review 流程）
- Issue-based 表单（RegisterForm、AppealForm 等）的迁移
