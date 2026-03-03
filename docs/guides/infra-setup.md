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

## 1. Cloudflare Pages

### 1.1 创建项目

- Dashboard → Workers & Pages → Create → Pages → Connect to Git
- 选择 GitHub 账号 → 授权 → 选择 `synnovator/monorepo`
- 项目名称: `synnovator`（默认域名 `synnovator.pages.dev`）

### 1.2 构建设置

- Framework preset: `Astro`
- Build command: `cd site && pnpm install && pnpm build`
- Build output directory: `site/dist`
- Root directory: `/`（留空，不要设为 `site/`）
- Node.js version: 环境变量 `NODE_VERSION` = `20`

### 1.3 自定义域名

- Pages 项目 → Custom domains → Add → `home.synnovator.space`
- 前提：`synnovator.space` 的 DNS 已托管在 Cloudflare
- CF 自动创建 CNAME 记录并签发 SSL

### 1.4 根域名重定向

- Dashboard → `synnovator.space` → Rules → Redirect Rules → Create
- 规则 1：匹配 hostname = `synnovator.space` → 301 重定向到 `https://home.synnovator.space`
- 规则 2：匹配 hostname = `www.synnovator.space` → 301 重定向到 `https://home.synnovator.space`

### 1.5 PR Preview

- 默认启用，无需额外配置
- 每个 PR 自动构建预览站点，格式: `https://{hash}.synnovator.pages.dev/`

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
- 这两个值后续填入 CF Pages 环境变量:
  - Client ID → `GITHUB_APP_ID`
  - Client Secret → `GITHUB_APP_SECRET`

---

## 4. 环境变量与 Secrets

### 4.1 Cloudflare Pages Environment Variables

Pages 项目 → Settings → Environment variables → Add

| 变量名 | 值来源 | Production | Preview |
|--------|--------|:---:|:---:|
| `R2_ACCESS_KEY_ID` | §2.2 API Token | ✓ | ✓ |
| `R2_SECRET_ACCESS_KEY` | §2.2 API Token | ✓ | ✓ |
| `R2_BUCKET_NAME` | `synnovator-assets` | ✓ | ✓ |
| `GITHUB_APP_ID` | §3.2 Client ID | ✓ | ✓ |
| `GITHUB_APP_SECRET` | §3.2 Client Secret | ✓ | ✓ |
| `SITE_URL` | `https://home.synnovator.space` | ✓ | ✗ |
| `NODE_VERSION` | `20` | ✓ | ✓ |

> Encrypt 打开（敏感值自动加密，后续不可查看）

### 4.2 GitHub Repo Secrets

Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret 名 | 值来源 | 用途 |
|-----------|--------|------|
| `R2_ACCESS_KEY_ID` | §2.2 API Token | Actions 上传文件到 R2 |
| `R2_SECRET_ACCESS_KEY` | §2.2 API Token | 同上 |
| `R2_BUCKET_NAME` | `synnovator-assets` | 同上 |
| `R2_ENDPOINT` | §2.2 S3 Endpoint | 同上 |
| `CLAUDE_CODE_OAUTH_TOKEN` | §4.3 本地生成 | Claude Code Action（PR Review Bot） |

### 4.3 Claude Code OAuth Token

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
- 自定义 AI workflow（ai-review、ai-team-match）暂不使用此 token，待迁移 `ANTHROPIC_API_KEY` 后启用

---

## 5. Claude Code GitHub Action（PR Review Bot）

### 5.1 安装 Claude GitHub App

1. 打开 https://github.com/apps/claude → Install
2. 选择 `synnovator/monorepo` 仓库 → 授权

### 5.2 创建 workflow

创建 `.github/workflows/claude-review.yml`：

```yaml
name: Claude Code Review
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    if: |
      (github.event_name == 'pull_request') ||
      (contains(github.event.comment.body, '@claude'))
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

**功能说明**：
- PR 创建/更新时自动审查
- PR 评论中 `@claude` 可触发对话
- 审查标准读取仓库根目录的 `CLAUDE.md`

---

## 6. 代码变更

### 6.1 安装 Cloudflare adapter

```bash
cd site && pnpm add @astrojs/cloudflare
```

### 6.2 修改 site/astro.config.mjs

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://home.synnovator.space',
  output: 'hybrid',
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
  },
});
```

变更点:
- `output`: `'static'` → `'hybrid'`
- 新增 `adapter: cloudflare()`
- `site` URL 更新为 `https://home.synnovator.space`

### 6.3 wrangler.toml（可选）

如需本地调试 Pages Functions 或配置 R2 binding:

```toml
name = "synnovator"
compatibility_date = "2026-03-01"

[[r2_buckets]]
binding = "R2"
bucket_name = "synnovator-assets"
```

> 仅本地 `wrangler pages dev` 时使用，CF Pages 部署时通过 Dashboard 绑定

---

## 7. 验证清单

### 7.1 Cloudflare Pages

- [ ] 首次构建成功（Dashboard → Deployments 无报错）
- [ ] `https://synnovator.pages.dev/` 可访问
- [ ] `https://home.synnovator.space` 可访问
- [ ] `synnovator.space` 301 重定向到 `home.synnovator.space`
- [ ] PR 提交后自动生成 Preview 部署

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

- [ ] CF Pages: Settings → Environment variables 7 项已配置
- [ ] GitHub: Settings → Secrets → Actions 5 项已配置
- [ ] 验证: `gh secret list` 显示 5 条记录

---

## 附录：后续迁移到 ANTHROPIC_API_KEY

当需要启用自定义 AI workflow（ai-review、ai-team-match）或需要更稳定的 token 时：

1. [console.anthropic.com](https://console.anthropic.com) → Create Key + 充值 credits
2. `gh secret set ANTHROPIC_API_KEY`
3. 修改 `claude-review.yml`: `claude_code_oauth_token` → `anthropic_api_key`
4. 自定义 workflow 中引用 `${{ secrets.ANTHROPIC_API_KEY }}`
5. 可选：`gh secret delete CLAUDE_CODE_OAUTH_TOKEN`
