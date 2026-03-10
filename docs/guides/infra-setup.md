# 基础设施配置指南

> **日期**: 2026-03-03
> **范围**: Cloudflare Pages + R2 + GitHub OAuth — P0 所需全部平台配置与代码变更
> **关联**: [架构设计文档](./2026-03-03-architecture-design.md)

## 前置条件

- Cloudflare 账号（Free Plan 即可）
- GitHub 仓库 `synnovator/monorepo` 已存在且 public
- `synnovator.space` DNS 已托管在 Cloudflare
- 本地已安装 `pnpm`

---

## 1. Cloudflare Workers 部署

> **架构变更（2026-03-10）**：已从 Cloudflare Pages 原生 GitHub 集成迁移到 **GitHub Actions + wrangler deploy**。
> 原因：原生集成会在所有分支（包括 `data/*`）触发构建，而我们只需在 `main` 上部署。

### 1.1 部署方式

通过 GitHub Actions 工作流 `.github/workflows/deploy.yml` 自动部署：

- **触发条件**：仅 `push` 到 `main` 分支
- **构建命令**：`pnpm run deploy`（= `opennextjs-cloudflare build && wrangler deploy`）
- **Worker 名称**：`synnovator`（配置在 `apps/web/wrangler.jsonc`）

> **重要**：Cloudflare dashboard 中 Pages 项目的 GitHub 集成应保持**断开**状态，
> 否则会与 Actions workflow 重复触发部署。

### 1.2 GitHub Repo Secrets（部署所需）

Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret 名 | 值来源 | 说明 |
|-----------|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens | 权限：Account.Workers Scripts (Edit)、Account.Account Settings (Read) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → 右侧边栏 Account ID | 账号标识 |

> **API Token 权限**：可复用已有的 `synnovator-wrangler-cli` token，或新建 token 使用 "Edit Cloudflare Workers" 模板。

### 1.3 自定义域名

- Workers & Pages → `synnovator` → Settings → Domains & Routes → Add → `home.synnovator.space`
- 前提：`synnovator.space` 的 DNS 已托管在 Cloudflare
- CF 自动创建 CNAME 记录并签发 SSL

### 1.4 根域名重定向

- Dashboard → `synnovator.space` → Rules → Redirect Rules → Create
- 规则 1：匹配 hostname = `synnovator.space` → 301 重定向到 `https://home.synnovator.space`
- 规则 2：匹配 hostname = `www.synnovator.space` → 301 重定向到 `https://home.synnovator.space`

### 1.5 PR Preview

当前未启用自动 PR Preview 部署。如需启用，可在 deploy.yml 中添加 `pull_request` 触发器并使用 `wrangler versions upload`。

---

## 2. Cloudflare R2

### 2.1 创建存储桶

- Dashboard → R2 Object Storage → Create bucket
- Bucket 名称: `synnovator-assets`
- Location hint: `Asia Pacific`（APAC）

### 2.2 创建 API Token

- R2 → Overview → Manage R2 API Tokens → Create API token
- 权限: Object Read & Write
- 指定桶: `synnovator-assets`（不要选 All buckets）
- 记录以下值（后续填入环境变量）:
  - Access Key ID
  - Secret Access Key
  - S3 Endpoint（格式: `https://<account-id>.r2.cloudflarestorage.com`）

### 2.3 免费额度备忘

- 10 GB 存储
- 10M 次 Class A 操作（写入）/ 月
- 10M 次 Class B 操作（读取）/ 月
- 无出站流量费

---

## 3. GitHub OAuth App

### 3.1 创建 OAuth App

- GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
- Application name: `Synnovator`
- Homepage URL: `https://home.synnovator.space`
- Authorization callback URL: `https://home.synnovator.space/api/auth/callback`
- Enable Device Flow: 不勾选

### 3.2 记录凭证

- 创建后记录 Client ID（页面直接显示）
- 点击 Generate a new client secret → 记录 Secret（仅显示一次）
- Client ID → `GITHUB_CLIENT_ID`（已写入 `wrangler.toml [vars]`）
- Client Secret → `GITHUB_CLIENT_SECRET`（通过 Worker Secrets 配置）

---

## 4. 环境变量与 Secrets

> **架构说明**: 站点通过 GitHub Actions + `wrangler deploy` 部署为 Cloudflare Worker。
> 非敏感运行时变量写入 `wrangler.jsonc [vars]`，敏感值通过 Worker Secrets 配置。
> 部署所需的 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID` 配置在 GitHub Repo Secrets（见 §1.2）。

### 4.1 wrangler.jsonc 变量（非敏感，提交到仓库）

`apps/web/wrangler.jsonc` 的 `vars` 区段已包含：

| 变量名 | 值 | 说明 |
|--------|------|------|
| `SITE_URL` | `https://home.synnovator.space` | 站点 URL（构建回调 URI） |
| `GITHUB_CLIENT_ID` | `Iv23li...` | GitHub OAuth App Client ID（公开值） |
| `GITHUB_OWNER` | `Synnovator` | GitHub 组织名 |
| `GITHUB_REPO` | `monorepo` | 仓库名 |

### 4.2 Worker Secrets（敏感，通过 Dashboard 或 CLI 配置）

Workers & Pages → `synnovator` → Settings → Variables and Secrets → Add

| Secret 名 | 值来源 | 说明 |
|-----------|--------|------|
| `GITHUB_CLIENT_SECRET` | §3.2 Client Secret | OAuth token 交换 |
| `AUTH_SECRET` | `openssl rand -base64 32` | Session cookie AES-GCM 加密密钥 |
| `R2_ACCESS_KEY_ID` | §2.2 API Token | R2 presigned URL 签发 |
| `R2_SECRET_ACCESS_KEY` | §2.2 API Token | 同上 |
| `R2_BUCKET_NAME` | `synnovator-assets` | 同上 |
| `R2_ENDPOINT` | §2.2 S3 Endpoint | 同上 |

CLI 方式配置 Secrets（需 `CLOUDFLARE_API_TOKEN`）：
```bash
cd apps/web
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put AUTH_SECRET
# 按提示粘贴值
```

> **注意**: 所有运行时变量必须通过 `wrangler.jsonc [vars]` 或 Worker Secrets 配置。

### 4.3 GitHub Repo Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret 名 | 值来源 | 用途 |
|-----------|--------|------|
| `CLOUDFLARE_API_TOKEN` | §1.2 API Token | GitHub Actions 部署到 Cloudflare Workers |
| `CLOUDFLARE_ACCOUNT_ID` | §1.2 Account ID | 同上 |
| `R2_ACCESS_KEY_ID` | §2.2 API Token | Actions 上传文件到 R2 |
| `R2_SECRET_ACCESS_KEY` | §2.2 API Token | 同上 |
| `R2_BUCKET_NAME` | `synnovator-assets` | 同上 |
| `R2_ENDPOINT` | §2.2 S3 Endpoint | 同上 |
| `CLAUDE_CODE_OAUTH_TOKEN` | §4.4 本地生成 | Claude Code Action（PR Review Bot） |

### 4.4 Claude Code OAuth Token

MVP 阶段使用 `CLAUDE_CODE_OAUTH_TOKEN`（个人 Claude Pro/Max 订阅额度）驱动 Claude Code GitHub Action。无需单独充值 API credits。

> **后续迁移**：稳定后可切换到 `ANTHROPIC_API_KEY`（console.anthropic.com 按量计费），适合团队共享和更高并发。

**生成步骤**：
```bash
claude setup-token
# 按提示完成 OAuth 授权，终端输出 token 值
```

**存入 GitHub Secret**：
```bash
gh secret set CLAUDE_CODE_OAUTH_TOKEN
# 粘贴 token 值，回车确认
```

**注意事项**：
- Token 有过期时间（约 1 天），过期后需重新运行 `claude setup-token` 并更新 Secret
- 使用个人订阅额度，不产生额外 API 费用
- 自定义 AI workflow（ai-review）暂不使用此 token，待迁移 `ANTHROPIC_API_KEY` 后启用

---

## 5. Claude Code GitHub Action（PR Review Bot）

### 5.1 安装 Claude GitHub App

1. 打开 https://github.com/apps/claude → Install
2. 选择 `synnovator/monorepo` 仓库 → 授权

### 5.2 Workflow 文件

仓库中已有两个 Claude Code 相关 workflow：

- **`.github/workflows/claude-code-review.yml`** — PR 自动 Code Review（使用 code-review plugin）
- **`.github/workflows/claude.yml`** — PR/Issue 中 `@claude` 对话触发

**bot 权限**：`claude-code-review.yml` 中配置了 `allowed_bots: 'synnovator'`，允许 synnovator GitHub App 创建的 PR 触发 Code Review。

**功能说明**：
- PR 创建/更新时自动审查
- PR 评论中 `@claude` 可触发对话
- 审查标准读取仓库根目录的 `CLAUDE.md`

---

## 6. 代码配置

> **架构变更**：站点已从 Astro 迁移到 Next.js 15 + OpenNext Cloudflare 适配器。

### 6.1 OpenNext 配置

`apps/web/open-next.config.ts`:
```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
export default defineCloudflareConfig({});
```

### 6.2 wrangler.jsonc

Worker 部署配置（`apps/web/wrangler.jsonc`）:

```jsonc
{
  "name": "synnovator",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "vars": {
    "SITE_URL": "https://home.synnovator.space",
    "GITHUB_CLIENT_ID": "Iv23li...",
    "GITHUB_OWNER": "Synnovator",
    "GITHUB_REPO": "monorepo",
    "GITHUB_APP_ID": "...",
    "GITHUB_APP_INSTALLATION_ID": "..."
  }
}
```

> `vars` 存放非敏感运行时变量，敏感值通过 Worker Secrets 配置（见 §4.2）。

### 6.3 部署脚本

`apps/web/package.json` 中的部署相关脚本：

```json
{
  "build:worker": "opennextjs-cloudflare build",
  "deploy": "opennextjs-cloudflare build && wrangler deploy",
  "deploy:preview": "opennextjs-cloudflare build && wrangler versions upload"
}
```

---

## 7. 验证清单

### 7.1 Cloudflare Workers 部署

- [ ] GitHub Actions `deploy.yml` 在 push to main 时触发成功
- [ ] `data/*` 分支不触发部署
- [ ] Cloudflare dashboard Pages 项目已断开 GitHub 集成
- [ ] `https://home.synnovator.space` 可访问
- [ ] `synnovator.space` 301 重定向到 `home.synnovator.space`

### 7.2 R2

- [ ] Dashboard → R2 → `synnovator-assets` 存储桶存在
- [ ] 用 API Token 测试上传:
  ```bash
  aws s3 cp test.txt s3://synnovator-assets/ --endpoint-url <endpoint>
  ```
- [ ] 上传的文件在 Dashboard 中可见

### 7.3 OAuth

- [ ] 访问 `https://home.synnovator.space/api/auth/login` 跳转到 GitHub 授权页
- [ ] 授权后回调到 `/api/auth/callback` 不报错
- [ ] （需 Functions 代码就绪后验证）

### 7.4 Claude Code Action

- [ ] Claude GitHub App 已安装到仓库
- [ ] `CLAUDE_CODE_OAUTH_TOKEN` Secret 已配置
- [ ] `.github/workflows/claude-review.yml` 已创建
- [ ] PR 中 `@claude` 可触发审查回复

### 7.5 环境变量

- [ ] `wrangler.jsonc [vars]`: `SITE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID` 已配置
- [ ] Worker Secrets: `GITHUB_CLIENT_SECRET`, `AUTH_SECRET`, `GITHUB_APP_PRIVATE_KEY`, R2 相关 4 项已配置
- [ ] GitHub Actions Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, R2 4 项, `CLAUDE_CODE_OAUTH_TOKEN` 已配置（`gh secret list` 验证）

---

## 附录：后续迁移到 ANTHROPIC_API_KEY

当需要启用自定义 AI workflow（ai-review）或需要更稳定的 token 时：

1. [console.anthropic.com](https://console.anthropic.com) → Create Key + 充值 credits
2. `gh secret set ANTHROPIC_API_KEY`
3. 修改 `claude-review.yml`: `claude_code_oauth_token` → `anthropic_api_key`
4. 自定义 workflow 中引用 `${{ secrets.ANTHROPIC_API_KEY }}`
5. 可选：`gh secret delete CLAUDE_CODE_OAUTH_TOKEN`
