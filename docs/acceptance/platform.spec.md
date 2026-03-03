# 平台基础设施验收规范 — platform.spec.md

> **角色**: Platform（跨角色的基础设施和系统能力）
> **核心需求**: 站点构建部署、i18n、GitHubRedirect 引擎、Schema 校验、状态管理、基础设施初始化、管理后端

---

## US-P-001: Astro 站点构建与部署 [P0]

> **前置条件**: site/ 目录包含 Astro 项目配置，Cloudflare Pages 已连接仓库
> **涉及层**: site/ 源码 → pnpm build (hybrid) → Cloudflare Pages 部署

### SC-P-001.1: 本地构建成功

- **Given** site/ 目录包含完整的 Astro 项目（`astro.config.mjs`, `package.json`, `tsconfig.json`）
- **And** `astro.config.mjs` 配置 `output: 'hybrid'` 和 `@astrojs/cloudflare` adapter
- **And** 已安装依赖（`pnpm install`）
- **When** 执行 `pnpm build`（在 site/ 目录下）
- **Then** 构建成功，无错误输出
- **And** 生成静态页面（prerender: true）和 Functions 入口（/api/* 路由）

### SC-P-001.2: Cloudflare Pages 自动部署

- **Given** 代码推送到 main 分支
- **When** Cloudflare Pages 检测到 push 事件并自动触发构建
- **Then** 执行 `pnpm install` → `pnpm build` → 部署到 Cloudflare CDN
- **And** 部署成功后站点可通过 `https://{project}.pages.dev/` 访问
- **And** 如果配置了自定义域名，通过自定义域名也可访问

### SC-P-001.3: 数据驱动页面生成

- **Given** hackathons/ 目录下存在 `{slug}/hackathon.yml`
- **And** profiles/ 目录下存在 `{id}.yml`
- **When** Astro 构建时读取数据目录
- **Then** 自动生成 `/hackathons/{slug}` 页面（每个活动一个，prerender: true）
- **And** 自动生成 `/hackers/{id}` 页面（每个 Profile 一个，prerender: true）
- **And** 首页自动聚合所有活动数据生成列表

### SC-P-001.4: PR Preview 部署

- **Given** 开发者提交了修改 site/ 的 PR
- **When** Cloudflare Pages 检测到 PR
- **Then** 自动构建并部署到 Preview URL（`https://{hash}.{project}.pages.dev/`）
- **And** PR Comment 中显示 Preview 链接

---

## US-P-002: 双语支持 (i18n) [P0]

> **前置条件**: site/src/i18n/ 包含 en.yml 和 zh.yml
> **涉及层**: i18n 配置 → Astro 页面 → 语言切换

### SC-P-002.1: 中英文切换

- **Given** 站点支持中英文（`settings.language: ["en", "zh"]`）
- **When** 用户切换语言（通过 URL 参数或语言切换按钮）
- **Then** 页面 UI 文本切换为对应语言（导航栏、按钮文本、标签等）
- **And** 语言选择持久化（localStorage 或 URL 前缀）

### SC-P-002.2: 数据字段双语展示

- **Given** hackathon.yml 包含双语字段（`name` / `name_zh`, `tagline` / `tagline_zh`）
- **When** 用户以中文模式查看活动
- **Then** 展示 `name_zh`, `tagline_zh`, `description_zh` 等中文字段
- **When** 用户以英文模式查看活动
- **Then** 展示 `name`, `tagline`, `description` 等英文字段

### SC-P-002.3: 缺少翻译时的 fallback

- **Given** 某数据字段只有中文（如 `name_zh` 存在但 `name` 为空）
- **When** 英文站加载该字段
- **Then** 显示中文内容作为 fallback（不留空、不报错）

---

## US-P-003: GitHubRedirect 组件 [P0]

> **前置条件**: Astro 组件开发环境
> **涉及层**: Site GitHubRedirect.astro 组件 → GitHub URL 生成

### SC-P-003.1: Issue 预填 URL 生成

- **Given** GitHubRedirect 组件接收参数：`type="issue"`, `template`, `title`, `labels`, `body`
- **When** 组件渲染
- **Then** 生成正确的 GitHub Issue 创建 URL：
  `https://github.com/{org}/{repo}/issues/new?template={template}&title={encoded_title}&labels={encoded_labels}&body={encoded_body}`
- **And** 所有参数正确 URL encode

### SC-P-003.2: PR 预填 URL 生成

- **Given** GitHubRedirect 组件接收参数：`type="pr"`, `filename`, `value`（文件内容）, `branch`
- **When** 组件渲染
- **Then** 生成正确的 GitHub 新文件创建 URL：
  `https://github.com/{org}/{repo}/new/{branch}?filename={path}&value={encoded_content}`
- **And** 文件内容模板正确编码

### SC-P-003.3: 组件交互体验

- **Given** 页面中嵌入了 GitHubRedirect 按钮
- **When** 用户点击按钮
- **Then** 浏览器在新标签页打开 GitHub 页面（`target="_blank"`）
- **And** 按钮旁有简要操作提示文本

---

## US-P-004: YAML Schema 校验 [P0]

> **前置条件**: GitHub Actions workflow 配置
> **涉及层**: PR 提交 → Actions → Schema 校验脚本

### SC-P-004.1: hackathon.yml Schema 校验

- **Given** PR 修改了 `hackathons/{slug}/hackathon.yml`
- **When** Actions `validate-hackathon` workflow 被触发
- **Then** 校验以下规则：
  - `synnovator_version` = "2.0"
  - 必填字段：`hackathon.name`, `hackathon.slug`, `hackathon.type`, `hackathon.timeline`
  - `hackathon.type` 枚举值：community / enterprise / youth-league / open-source
  - `timeline` 7 个阶段时间顺序正确（draft < registration < ... < award）
  - `tracks[].judging.criteria[].weight` 总和 = 100
- **And** 校验结果通过 PR Comment 反馈

### SC-P-004.2: profile.yml Schema 校验

- **Given** PR 修改了 `profiles/{filename}.yml`
- **When** Actions `validate-profile` workflow 被触发
- **Then** 校验以下规则：
  - `synnovator_profile` = "2.0"
  - 必填字段：`hacker.github`, `hacker.name`
  - `hacker.identity.type` 枚举值（如有）：student / professional / academic
  - `hacker.skills` 数组结构正确（每项有 category 和 items）

### SC-P-004.3: project.yml Schema 校验

- **Given** PR 修改了 `hackathons/{slug}/submissions/{team}/project.yml`
- **When** Actions `validate-submission` workflow 被触发
- **Then** 校验以下规则：
  - `synnovator_submission` = "2.0"
  - 必填字段：`project.name`, `project.track`, `project.team`
  - `project.track` 在对应 hackathon.yml 的 `tracks[].slug` 中存在
  - `project.deliverables` 包含该 Track 所有 `required` deliverable 类型

### SC-P-004.4: 评分 Issue YAML 校验

- **Given** 评委提交了 `[Score]` Issue
- **When** Actions `validate-score` workflow 被触发
- **Then** 校验以下规则：
  - Issue body 中的 YAML 格式正确可解析
  - 每个 criterion 的 score 在 `score_range` 范围内
  - 所有 criterion 均已评分（无遗漏）
  - 提交者 GitHub 用户名在 hackathon.yml 的 `judges[].github` 中

---

## US-P-005: 状态自动管理 [P0]

> **前置条件**: hackathon.yml 包含 timeline 配置
> **涉及层**: Actions `status-update` cron → Label 管理 → Site 重建

### SC-P-005.1: 定时状态检查

- **Given** GitHub Actions `status-update` workflow 配置了 cron 定时任务（如每小时一次）
- **When** cron 触发 workflow
- **Then** workflow 遍历所有 `hackathons/*/hackathon.yml`
- **And** 根据当前时间与 `timeline` 各阶段对比，确定每个活动的当前阶段

### SC-P-005.2: Label 自动更新

- **Given** 某活动的当前阶段从 `registration` 变为 `development`
- **When** Actions 检测到阶段变化
- **Then** 移除旧 Label `stage:registration`
- **And** 添加新 Label `stage:development`
- **And** 触发站点重新构建（如通过 `workflow_dispatch` 或 push 事件）

### SC-P-005.3: 阶段变化通知

- **Given** 活动阶段发生变化
- **When** Actions 完成状态更新
- **Then** 在活动对应的 Issue/Discussion 中发布阶段变更通知
- **And** 通知内容包含新阶段信息和下一步操作提示

---

## US-P-006: Self-document 指南系统 [P0]

> **前置条件**: Site 路由和页面配置
> **涉及层**: Site 指南页面 + 功能页面内嵌引导

### SC-P-006.1: 指南页面路由存在

- **Given** 站点路由配置
- **When** 用户访问以下路径
- **Then** 每个路径返回对应的指南页面（非 404）：
  - `/guides/organizer` — 组织者指南
  - `/guides/hacker` — 参赛者指南
  - `/guides/judge` — 评委指南

### SC-P-006.2: 指南页面包含 GitHubRedirect 链接

- **Given** 指南页面描述了操作流程（如"创建 Profile"）
- **When** 页面渲染
- **Then** 每个操作步骤旁有对应的 GitHubRedirect 按钮或链接
- **And** 按钮生成正确的预填 URL（即使是说明性的通用链接）

### SC-P-006.3: 功能页面内嵌上下文引导

- **Given** 用户在活动详情页查看某个功能区域（如报名、提交、评分）
- **When** 该功能区域渲染
- **Then** 区域内包含上下文相关的操作提示：
  - 简短步骤说明（1-3 步）
  - GitHubRedirect 操作按钮
  - 指向完整指南的"了解更多"链接
- **And** 操作提示随活动阶段变化而变化

---

## US-P-007: R2 文件上传与安全访问 [P1]

> **前置条件**: R2 bucket 已创建（见 US-P-011），GitHub Secrets 包含 R2 凭证
> **涉及层**: PR 提交文件 → Actions `upload-assets` → Cloudflare R2 → YAML r2_url 填充 → Pages Functions 鉴权下载

### SC-P-007.1: 提交物文件自动上传

- **Given** 项目 PR 包含二进制文件（PDF、图片、模型权重）
- **And** 文件在 project.yml 的 `deliverables.attachments` 中声明
- **When** Actions `upload-assets` workflow 被触发
- **Then** 文件上传到 Cloudflare R2
- **And** project.yml 中对应的 `r2_url` 字段自动填充为 R2 URL
- **And** 原始二进制文件从 PR 中移除（通过 commit）

### SC-P-007.2: R2 上传失败处理

- **Given** R2 上传过程中发生错误（网络问题、权限问题）
- **When** 上传失败
- **Then** Actions 不修改 project.yml
- **And** Bot 评论 "⚠️ 文件上传失败，请重试或联系管理员"
- **And** PR 获得 `upload:failed` Label

### SC-P-007.3: NDA 文档上传

- **Given** 组织者在 hackathon.yml 中指定了 NDA 文档
- **And** 文档为本地 PDF 文件
- **When** hackathon PR 合并时
- **Then** Actions 将 NDA PDF 上传到 R2
- **And** 更新 `legal.nda.document_url` 为 R2 URL

---

## US-P-008: AI Review Workflow [P1]

> **前置条件**: Claude API Key 配置在 GitHub Secrets
> **涉及层**: Actions `ai-review.yml` → Claude API → PR Comment

### SC-P-008.1: AI 评审摘要生成

- **Given** 项目 PR 通过 `validate-submission` 校验
- **And** 活动配置 `settings.ai_review = true`
- **When** Actions 触发 `ai-review` workflow
- **Then** workflow 读取 project.yml 内容（description, tech_stack, references）
- **And** 调用 Claude API 生成评审摘要
- **And** Bot 在 PR 中评论摘要，包含：
  - 项目概述（1-2 句话）
  - 技术亮点
  - 潜在改进建议
  - 参考声明审查

### SC-P-008.2: API 调用失败处理

- **Given** Claude API 调用失败（超时、429、500）
- **When** workflow 执行出错
- **Then** Bot 评论 "⚠️ AI 评审暂时不可用，不影响提交流程"
- **And** PR 不受影响（不会因 AI 失败阻塞合并）

---

## US-P-009: AI Team Matching [P1]

> **前置条件**: Claude API Key 配置，用户提交组队 Issue
> **涉及层**: Actions `ai-team-match.yml` → Claude API → Issue Comment

### SC-P-009.1: 匹配算法执行

- **Given** 用户提交了组队 Issue（Label: `team-formation`）
- **And** 活动配置 `settings.ai_team_matching = true`
- **When** Actions 触发 `ai-team-match` workflow
- **Then** workflow 读取请求者 Profile（skills, interests, looking_for）
- **And** 读取同活动所有已注册用户的 Profile
- **And** 调用 Claude API 分析匹配度
- **And** Bot 评论推荐列表（Top 3-5 匹配用户），每人附带：
  - GitHub 用户名（链接到 Profile 页）
  - 技能互补分析
  - 匹配理由简述

### SC-P-009.2: 无匹配结果处理

- **Given** 同活动注册用户数量不足或无合适匹配
- **When** AI 分析完成
- **Then** Bot 评论 "暂未找到高度匹配的队友，建议查看以下 Profile 或在活动 Discussion 中发帖"
- **And** 提供活动 Discussion 链接

---

## US-P-010: 代码抄袭检测 [P2]

> **前置条件**: Moss/JPlag 服务配置
> **涉及层**: 提交物 repo → 抄袭检测服务 → 结果报告

### SC-P-010.1: 提交后自动检测

- **Given** 项目 PR 包含 `deliverables.repo` URL
- **When** PR 合并后触发抄袭检测 workflow
- **Then** 从 repo URL 拉取代码
- **And** 与同活动其他项目进行代码相似度分析
- **And** 生成检测报告（相似度百分比、相似代码段对比）

### SC-P-010.2: 检测结果报告

- **Given** 抄袭检测完成
- **When** 生成检测报告
- **Then** 如果相似度低于阈值 → 报告标记为 "通过"
- **Or** 如果相似度高于阈值 → 自动创建 Issue 通知组织者审查
- **And** 报告链接附在项目 PR 的 Comment 中

---

## US-P-011: Cloudflare Pages 项目初始化 [P0]

> **前置条件**: 拥有 Cloudflare 账号
> **涉及层**: Cloudflare Dashboard → Pages 项目 → Git 仓库连接

### SC-P-011.1: Pages 项目创建与仓库连接

- **Given** Cloudflare 账号已创建
- **When** 在 Cloudflare Dashboard 创建 Pages 项目
- **Then** 项目成功连接到 GitHub monorepo 仓库
- **And** 构建配置正确：
  - Build command: `cd site && pnpm install && pnpm build`
  - Build output directory: `site/dist`
  - Root directory: `/`（monorepo 根目录）
  - Node.js version: ≥ 18
- **And** 首次构建成功，站点可通过 `https://{project}.pages.dev/` 访问

### SC-P-011.2: Environment Variables 配置

- **Given** Pages 项目已创建
- **When** 在 Cloudflare Dashboard → Pages → Settings → Environment Variables 中配置
- **Then** 以下变量已配置（Production 和 Preview 环境）：
  - `R2_ACCESS_KEY_ID` — R2 API 凭证
  - `R2_SECRET_ACCESS_KEY` — R2 API 密钥（加密存储）
  - `R2_BUCKET_NAME` — R2 存储桶名称
  - `GITHUB_APP_ID` — GitHub OAuth App ID
  - `GITHUB_APP_SECRET` — GitHub OAuth App Secret（加密存储）
- **And** 变量值在 Pages Functions 中可通过 `env` 对象访问

### SC-P-011.3: 自定义域名配置

- **Given** 拥有自定义域名且 DNS 托管在 Cloudflare
- **When** 在 Pages 项目 → Custom domains 中添加域名
- **Then** Cloudflare 自动配置 DNS CNAME 记录
- **And** SSL 证书自动签发
- **And** 站点可通过自定义域名访问（HTTPS）

---

## US-P-012: Cloudflare R2 存储桶初始化 [P0]

> **前置条件**: Cloudflare 账号
> **涉及层**: Cloudflare Dashboard → R2 → API Token

### SC-P-012.1: R2 存储桶创建

- **Given** Cloudflare 账号已创建
- **When** 在 Cloudflare Dashboard → R2 中创建存储桶
- **Then** 存储桶名称为 `synnovator-assets`（或项目约定名称）
- **And** 存储桶 location hint 设置为 `apac`（亚太，贴近目标用户）

### SC-P-012.2: R2 API Token 生成

- **Given** R2 存储桶已创建
- **When** 在 Cloudflare Dashboard → R2 → Manage R2 API Tokens 中创建 Token
- **Then** Token 权限为 `Object Read & Write`
- **And** Token 关联到指定存储桶（非全局权限）
- **And** 生成的 `Access Key ID` 和 `Secret Access Key` 已配置到：
  - Cloudflare Pages Environment Variables（Functions 使用）
  - GitHub Repo Secrets（Actions 使用）

### SC-P-012.3: R2 访问验证

- **Given** R2 存储桶和 API Token 已配置
- **When** 通过 S3 兼容 API 上传一个测试文件
- **Then** 上传成功，文件可通过 R2 URL 访问
- **And** 从 Pages Functions 中可通过 R2 binding 或 S3 API 读取文件

---

## US-P-013: Presigned URL 安全鉴权 [P0]

> **前置条件**: R2 已配置（US-P-012），GitHub OAuth App 已创建，Pages Functions 可用
> **涉及层**: Site 前端 → Pages Functions `/api/presign` → GitHub API → R2 presigned URL

### SC-P-013.1: 鉴权成功 — 生成 presigned URL

- **Given** 用户已通过 GitHub OAuth 登录站点
- **And** 用户在某活动中已获得 `nda-approved` Label
- **When** 用户点击「获取数据集」，前端调用 `/api/presign`（携带 OAuth token）
- **Then** Functions 通过 GitHub API 验证用户身份
- **And** Functions 检查用户在该活动 Issue 中的 `nda-approved` Label
- **And** 验证通过 → 返回 R2 presigned URL（有效期 4 小时）
- **And** 用户可通过返回的 URL 下载数据集文件

### SC-P-013.2: 鉴权失败 — 未签署 NDA

- **Given** 用户已登录但未签署 NDA（无 `nda-approved` Label）
- **When** 用户调用 `/api/presign`
- **Then** Functions 返回 HTTP 403
- **And** 响应 body 包含错误信息："请先签署 NDA 后获取数据集"

### SC-P-013.3: 鉴权失败 — 未登录

- **Given** 用户未通过 GitHub OAuth 登录
- **When** 前端调用 `/api/presign`（无 token 或 token 无效）
- **Then** Functions 返回 HTTP 401
- **And** 响应 body 包含错误信息和 OAuth 登录链接

### SC-P-013.4: Presigned URL 过期处理

- **Given** 用户获取了 presigned URL
- **And** URL 已过期（超过 4 小时）
- **When** 用户尝试使用过期 URL 下载
- **Then** R2 返回 403 Forbidden
- **And** 站点前端提示用户重新获取链接

---

## US-P-014: GitHub OAuth 集成 [P0]

> **前置条件**: GitHub OAuth App 已在 GitHub Developer Settings 中创建
> **涉及层**: Site 前端 → GitHub OAuth → Pages Functions → 用户身份

### SC-P-014.1: GitHub OAuth 登录流程

- **Given** 用户访问站点，未登录
- **When** 用户点击「登录」按钮
- **Then** 浏览器跳转到 GitHub OAuth 授权页面
- **And** 授权范围仅包含 `read:user`（最小权限）
- **And** 授权成功后跳回站点，用户信息（username, avatar）显示在导航栏

### SC-P-014.2: OAuth Callback 处理

- **Given** 用户完成 GitHub 授权
- **When** GitHub 跳转回 callback URL（`https://{domain}/api/auth/callback`）
- **Then** Pages Functions 用 authorization code 换取 access token
- **And** token 存储在 HttpOnly cookie 中（非 localStorage）
- **And** 用户状态持久化，刷新页面后仍保持登录

### SC-P-014.3: 未登录时的功能降级

- **Given** 用户未登录
- **When** 用户浏览站点
- **Then** 所有公开页面（活动列表、详情、Profile）正常可见
- **And** 需要身份的操作（获取 NDA 数据集）显示「请先登录」提示
- **And** GitHubRedirect 操作（报名、提交）不受影响（跳转到 GitHub 时 GitHub 自身会要求登录）

---

## US-P-015: GitHub Secrets 与凭证管理 [P0]

> **前置条件**: GitHub 仓库 Admin 权限
> **涉及层**: GitHub Repo Settings → Secrets → Actions workflows

### SC-P-015.1: Actions Secrets 配置

- **Given** 仓库 Admin 访问 GitHub Repo → Settings → Secrets and variables → Actions
- **When** 配置以下 Secrets
- **Then** 以下 Secrets 已存在且值正确：
  - `R2_ACCESS_KEY_ID` — R2 API 凭证
  - `R2_SECRET_ACCESS_KEY` — R2 API 密钥
  - `R2_BUCKET_NAME` — R2 存储桶名称
  - `R2_ENDPOINT` — R2 S3 兼容 endpoint（`https://{account_id}.r2.cloudflarestorage.com`）
  - `ANTHROPIC_API_KEY` — Anthropic API Key（Claude Code Action + AI 评审/组队匹配）

### SC-P-015.2: Secrets 可用性验证

- **Given** 所有 Secrets 已配置
- **When** 手动触发 `validate-hackathon` workflow（使用示例数据）
- **Then** workflow 能成功读取 Secrets（不报 "secret not found" 错误）
- **And** R2 连接测试通过（可选：workflow 中加 R2 ping 步骤）

### SC-P-015.3: 凭证不泄露

- **Given** Actions workflow 正在运行
- **When** workflow 日志输出
- **Then** 所有 Secret 值在日志中显示为 `***`（GitHub 自动脱敏）
- **And** Secret 值不出现在 PR Comment、Issue Comment 或任何公开输出中

---

## US-P-016: Monorepo 管理后端与 RBAC [P0]

> **前置条件**: GitHub 仓库已创建，Collaborators 已配置
> **涉及层**: GitHub Repository Settings → CODEOWNERS → Collaborator Roles → PR 工作流

### SC-P-016.1: GitHub RBAC 权限模型生效

- **Given** 仓库已配置 Collaborators 及其角色：
  - Admin: 超级管理员（可管理 Secrets、Actions、Collaborators）
  - Write + CODEOWNERS: 活动管理员（可合并对应活动目录的 PR）
  - Write: Reviewer（可审核 PR、管理 Labels）
  - Triage: 协作者（可管理 Issue Labels，不可合并 PR）
- **When** 各角色用户尝试执行对应操作
- **Then** Admin 可以管理 Repo Settings、Secrets、Actions 配置
- **And** CODEOWNERS 中列出的活动管理员只在对应 `hackathons/{slug}/` 路径下被自动 assign 为 PR Reviewer
- **And** Triage 角色用户可以添加/移除 Issue Labels、assign Issues，但不能合并 PR
- **And** Read/Public 用户只能提交 Issue 和 PR（受 Actions 校验约束）

### SC-P-016.2: CODEOWNERS 路由配置

- **Given** 仓库根目录存在 `.github/CODEOWNERS` 文件
- **And** 文件包含路径→审核者映射规则
- **When** 有人提交修改 `hackathons/my-hackathon/` 下文件的 PR
- **Then** GitHub 自动将 CODEOWNERS 中对应的审核者设为 Required Reviewer
- **And** 未经指定审核者 Approve，PR 无法合并（Branch Protection Rule 生效时）

### SC-P-016.3: 管理操作审计追溯

- **Given** 管理员对 `hackathons/{slug}/hackathon.yml` 进行了多次修改并提交 PR
- **When** 需要审计该活动的配置变更历史
- **Then** `git log --oneline hackathons/{slug}/` 显示所有变更的 commit 记录（who + when + what）
- **And** 每个 PR 保留完整的 review 讨论记录和 approve/reject 记录
- **And** `git blame hackathons/{slug}/hackathon.yml` 可追溯每行配置的最后修改者

### SC-P-016.4: 管理操作回滚

- **Given** 某次管理操作（PR 合并）导致了错误的配置变更
- **When** 管理员需要回滚该变更
- **Then** 可通过 `git revert {commit}` 创建回滚 commit
- **And** 回滚 PR 经 Actions 校验后合并，站点自动重建恢复到正确状态
- **And** 回滚操作本身也有完整的 commit 记录

---

## US-P-017: synnovator-admin CLI Skill [P0]

> **前置条件**: 管理员已 clone 仓库到本地，已安装 Claude Code
> **涉及层**: 本地 CLI Skill → YAML 文件编辑 → git commit → PR 提交 → Actions 校验

### SC-P-017.1: Skill 安装与可用性

- **Given** 管理员已 clone Synnovator monorepo 到本地
- **And** 已安装 Claude Code
- **When** 管理员在仓库目录下执行 `/synnovator-admin`（或等效 Skill 调用）
- **Then** Skill 加载成功，显示可用管理命令列表
- **And** 命令列表包含：活动管理、数据导出、审计查询等分类

### SC-P-017.2: 通过 Skill 管理活动配置

- **Given** 管理员通过 Skill 执行活动管理命令（如修改时间线、更新 Track 配置）
- **When** Skill 执行完成
- **Then** 对应的 `hackathon.yml` 文件已在本地正确修改
- **And** 修改内容符合 Schema V2 规范（Skill 内置校验）
- **And** 自动创建 git commit（commit message 包含操作描述）
- **And** 提示管理员推送并创建 PR

### SC-P-017.3: 数据导出功能

- **Given** 管理员通过 Skill 执行数据导出命令（如导出某活动的报名列表、评分汇总）
- **When** Skill 读取仓库中的 YAML 数据和 Issue 数据（通过 GitHub API）
- **Then** 生成结构化导出文件（CSV / JSON）
- **And** 导出内容包含：报名者列表、项目提交状态、评分明细等
- **And** 导出操作不修改仓库数据（只读）

### SC-P-017.4: 审计查询功能

- **Given** 管理员通过 Skill 执行审计命令（如查询某活动在某时间段的所有变更）
- **When** Skill 分析 git log 和 GitHub API 数据
- **Then** 返回结构化审计报告：
  - 配置变更记录（commit hash、作者、时间、变更摘要）
  - Issue/PR 操作记录（创建、Label 变更、合并）
  - 异常检测提示（如非 CODEOWNERS 的 PR 合并、短时间大量操作等）
