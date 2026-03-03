# PRD: Synnovator (HackFlow) — AI Hackathon 平台

> **Version:** 3.0
> **Updated:** 2026-03-03
> **Status:** Draft
> **Changelog:** V2→V3: 基于两份模拟档案（绿色AI大赛 + 金融风控挑战赛）重评估，
> 整合 14 项 P0 Gap，重构 Schema，确立 Git-native 工作流模式

---

## 1. Introduction

Synnovator（即 HackFlow）是一个专注于 AI 领域的 Git-native Hackathon 组织与管理平台。以 GitHub Monorepo 为核心基础设施，通过 **"静态页面生成 → GitHub Issue/PR 跳转 → Label 路由 → Actions 校验 → Reviewer 审核"** 的统一工作流模式，实现零后端服务的活动全生命周期管理。

平台支持多种活动类型（社区 Hackathon、企业悬赏、高校竞赛等），面向中国 AI 开发者出海场景提供中英双语原生支持。通过 GitHub Template Repository 提供活动模板继承，让不同类型的组织者都能快速上手。

### 1.1 核心理念

```
传统平台：  组织者 → 平台审核 → Web表单发布 → 参赛者注册 → Web表单提交 → Web评审面板
Synnovator：组织者 → PR 提交 YAML → 合并即上线 → Issue 报名 → PR 提交项目 → Issue 评分
                                 ↑                    ↑               ↑               ↑
                            静态页面预填         静态页面预填    静态页面预填    静态页面预填
                            → GitHub 跳转        → GitHub 跳转  → GitHub 跳转   → GitHub 跳转
```

### 1.2 Git-native 工作流模式

整个平台的交互建立在一个统一模式上：

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐     ┌────────────────┐
│  Synnovator 站点 │     │    GitHub        │     │  GitHub Actions  │     │   Reviewer     │
│  (静态页面)      │     │  Issue / PR      │     │  (自动校验)      │     │   (人工审核)    │
│                  │     │                  │     │                  │     │                │
│ 1. 用户填写表单  │────▶│ 2. 预填内容      │────▶│ 3. Label 路由    │────▶│ 4. 审核通过    │
│    选择选项      │     │    自动提交      │     │    格式校验      │     │    合并/关闭   │
│    生成内容      │     │    添加 Label    │     │    业务规则检查  │     │    Comment反馈 │
└─────────────────┘     └──────────────────┘     └─────────────────┘     └────────────────┘
```

适用于：Profile 注册、活动创建、项目提交、NDA 签署、评审评分、申诉仲裁。

### 1.3 项目定位

Synnovator 与 HackFlow 是同一项目。Synnovator 是面向用户的品牌名称，HackFlow 是项目内部代号。后续文档统一使用 Synnovator。

---

## 2. Goals

- **G-1**: 支持多种活动类型（社区 Hackathon / 企业悬赏 / 高校竞赛），通过 GitHub Template Repo 提供类型化模板
- **G-2**: 让组织者通过 PR 提交 `hackathon.yml` 即可创建活动，合并即上线，< 10 分钟完成
- **G-3**: 以 GitHub PR 作为项目提交机制，Issue 作为报名/评审/申诉通道，实现 Git-native 全流程
- **G-4**: 建立结构化的 Hacker Profile 系统，支撑 AI 组队匹配和开发者网络
- **G-5**: 集成 AI Agent 辅助组队匹配、项目评审摘要、自动化评分建议
- **G-6**: 提供中英双语原生支持，服务中国开发者出海与国际开发者参与
- **G-7**: MVP 阶段以 GitHub Pages + Cloudflare R2/D1 实现零后端运营

---

## 3. Target Users

| 角色 | 描述 | 核心需求 |
|------|------|----------|
| **Organizer** | 企业/社区/生态方 | 快速创建活动、管理 Track、查看提交、配置评审和合规规则 |
| **Hacker** | AI 开发者/工程师 | 注册 Profile、发现活动、组队、提交项目（PR）、展示作品 |
| **Builder** | AI 创业团队 | 展示项目、获取曝光、对接资源 |
| **Judge** | 投资人/技术专家/监管顾问 | 评审项目、结构化打分、提供反馈、声明利益冲突 |

---

## 4. GitHub Template Repositories

通过 GitHub Template Repo 实现活动模板继承，不同活动类型预填不同的默认值：

```
synnovator-templates/
├── synnovator-community-hackathon/     # 社区 Hackathon 模板
│   ├── hackathon.yml                    # 预填: type=community, license=Apache-2.0, vote=reactions
│   └── ...
├── synnovator-enterprise-bounty/       # 企业悬赏模板
│   ├── hackathon.yml                    # 预填: type=enterprise, ip=transfer, nda=true
│   └── ...
└── synnovator-youth-league/            # 高校/团委竞赛模板
    ├── hackathon.yml                    # 预填: type=youth-league, eligibility=student
    └── ...
```

组织者通过 `Use this template` 创建活动仓库，然后 PR 到主仓库注册。

---

## 5. Monorepo Structure

```
synnovator/                              # 主仓库
│
├── site/                                # 主站前端 (Astro SSG)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.astro              # 首页 / 活动列表
│   │   │   ├── hackathons/[slug].astro  # 活动详情页
│   │   │   └── hackers/[id].astro       # Hacker Profile 页
│   │   ├── components/
│   │   │   ├── GitHubRedirect.astro     # 核心组件：生成预填 Issue/PR URL
│   │   │   ├── ScoreCard.astro          # 评分卡生成器
│   │   │   ├── NDASign.astro            # NDA 签署引导
│   │   │   └── AppealForm.astro         # 申诉表单生成
│   │   └── layouts/
│   ├── i18n/
│   │   ├── en.yml
│   │   └── zh.yml
│   └── astro.config.mjs
│
├── hackathons/                          # 所有活动
│   ├── ai-agent-challenge-2026/
│   │   ├── hackathon.yml                # 活动配置（完整 Schema）
│   │   ├── assets/
│   │   │   └── banner.png
│   │   └── submissions/
│   │       ├── team-alpha/
│   │       │   ├── project.yml
│   │       │   └── proposal.pdf         # → Actions 上传 R2 后移除
│   │       └── team-beta/
│   │           └── project.yml
│   └── enterprise-risk-2026/
│       ├── hackathon.yml
│       └── submissions/
│           ├── team-a/
│           │   └── project.yml          # 模型优化赛道
│           └── team-a-track2/
│               └── project.yml          # 可解释性赛道（双报）
│
├── profiles/
│   ├── alice-dev-a1b2c3d4.yml
│   ├── bob-ai-e5f6g7h8.yml
│   └── _schema.yml
│
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml
│   │   ├── validate-hackathon.yml
│   │   ├── validate-submission.yml
│   │   ├── validate-profile.yml
│   │   ├── validate-score.yml           # 校验评分 Issue 格式
│   │   ├── ai-review.yml
│   │   ├── ai-team-match.yml
│   │   ├── status-update.yml
│   │   └── upload-assets.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── register.yml                 # 活动报名
│   │   ├── nda-sign.yml                 # NDA 签署确认
│   │   ├── judge-score.yml              # 评委评分
│   │   ├── appeal.yml                   # 申诉
│   │   └── team-formation.yml           # 组队
│   └── CODEOWNERS
│
├── scripts/
│   ├── create-hackathon.sh
│   ├── create-profile.sh
│   └── submit-project.sh
│
└── docs/
    ├── organizer-guide.md
    ├── hacker-guide.md
    └── judge-guide.md
```

---

## 6. Data Schemas

### 6.1 hackathon.yml（完整 Schema V2）

```yaml
# ============================================================
# Synnovator Hackathon Configuration — Schema V2
# ============================================================
synnovator_version: "2.0"

# ------------------------------------------------------------
# 基础信息
# ------------------------------------------------------------
hackathon:
  name: "AI Agent Innovation Challenge 2026"
  name_zh: "2026 AI Agent 创新挑战赛"
  slug: "ai-agent-challenge-2026"
  tagline: "Build the next generation of AI agents"
  tagline_zh: "构建下一代 AI Agent 应用"

  # ⬇️ [P0 Gap 1] 活动类型
  type: "community"
  # enum: community | enterprise | youth-league | open-source
  # 不同类型关联不同的 GitHub Template Repo 默认值

  description: |
    Full markdown description of the hackathon...
  description_zh: |
    活动完整描述（Markdown 格式）...

# ------------------------------------------------------------
# [P0 Gap 2] 主办方与合作方
# ------------------------------------------------------------
  organizers:                            # 主办方（1个或多个）
    - name: "Synnovator Community"
      name_zh: "Synnovator 社区"
      github: "synnovator"
      logo: "./assets/organizer-logo.png"
      website: "https://synnovator.dev"
      role: "host"                       # host | co-host
    - name: "Pengcheng Laboratory"
      name_zh: "鹏城实验室"
      role: "co-host"

  sponsors:                              # 赞助方
    - name: "BYD Energy Storage"
      name_zh: "比亚迪储能事业部"
      logo: "./assets/byd-logo.png"
      tier: "gold"                       # platinum | gold | silver

  partners:                              # 协办/合作方
    - name: "Shenzhen New Energy Association"
      name_zh: "深圳市新能源行业协会"
      role: "industry-partner"

# ------------------------------------------------------------
# [P0 Gap 3] 参赛资格约束
# ------------------------------------------------------------
  eligibility:
    open_to: "students"
    # enum: all | students | professionals | invited

    restrictions:
      - "全员须为中国大陆在读本科或硕士研究生（含应届）"
      - "须提供学信网在线核验或学校邮箱激活"
      - "港澳台学生可持相关学籍证明参赛"

    blacklist:
      - "主办方全体员工（含外包）不得参赛"     # 企业悬赏场景

    team_size:
      min: 2
      max: 5
    allow_solo: false

    mentor_rules:                        # 指导教师规则（高校竞赛场景）
      allowed: true
      max_contribution_pct: 10           # GitHub commit 贡献度上限
      count_in_team: false               # 不计入参赛成员
      count_in_award: false              # 不纳入奖项署名

# ------------------------------------------------------------
# [P0 Gap 4] IP / 合规 / 法律
# ------------------------------------------------------------
  legal:
    license: "Apache-2.0"
    # 开源场景: Apache-2.0 | MIT | GPL-3.0 | ...
    # 企业场景: proprietary

    ip_ownership: "creator"
    # enum: creator (参赛者保留) | organizer (转让给主办方) | shared

    nda:
      required: false
      # true → 报名时须签署 NDA Issue
      document_url: ""                   # NDA 全文链接（PDF in R2）
      summary: ""                        # NDA 摘要

    compliance_notes:
      - "参赛作品须采用 Apache 2.0 发布"
      - "主办方获得永久使用、展示和推广权利"
      - "主办方不得将作品闭源化或商业售卖"

    data_policy: ""                      # 数据使用合规说明（企业悬赏场景）

# ------------------------------------------------------------
# [P0 Gap 6] 时间线（7 阶段）
# ------------------------------------------------------------
  timeline:
    draft:                               # 创建与审核
      start: "2026-03-01T00:00:00Z"
      end: "2026-03-15T23:59:59Z"

    registration:                        # 报名期
      start: "2026-04-01T00:00:00Z"
      end: "2026-04-15T23:59:59Z"

    development:                         # 开发期
      start: "2026-04-16T00:00:00Z"
      end: "2026-05-25T23:59:59Z"

    submission:                          # 提交期（独立于开发期）
      start: "2026-05-26T00:00:00Z"
      end: "2026-05-31T23:59:59Z"

    judging:                             # 评审期
      start: "2026-06-01T00:00:00Z"
      end: "2026-06-14T23:59:59Z"

    announcement:                        # 公示期（含申诉窗口）
      start: "2026-06-15T00:00:00Z"
      end: "2026-06-21T23:59:59Z"

    award:                               # 颁奖期
      start: "2026-06-22T00:00:00Z"
      end: "2026-06-30T23:59:59Z"

# ------------------------------------------------------------
# [P0 Gap 19] 运营事件
# ------------------------------------------------------------
  events:
    - name: "Mentor AMA #1: Data & Scenarios"
      name_zh: "导师答疑 #1：数据集与场景解读"
      type: "ama"                        # ama | livestream | workshop | meetup | deadline
      datetime: "2026-04-20T14:00:00Z"
      duration_minutes: 90
      url: "https://meeting.tencent.com/xxx"
      description: "数据集字段解读 + 评估指标说明"

    - name: "Mid-term Demo Day"
      name_zh: "中期路演"
      type: "meetup"
      datetime: "2026-05-10T09:00:00Z"
      duration_minutes: 240
      location: "深圳南山创业公园"
      capacity: 50

# ------------------------------------------------------------
# 赛道配置
# ------------------------------------------------------------
  tracks:
    - name: "AI Agent Framework"
      name_zh: "AI Agent 框架"
      slug: "ai-agent-framework"
      description: "Build tools and frameworks for AI agent development"
      description_zh: "构建 AI Agent 开发工具和框架"

      # [P0 Gap 7] 奖励结构（多类型）
      rewards:
        - type: "cash"
          rank: "1st"
          amount: "¥60,000"
          description: "一等奖"
        - type: "cash"
          rank: "2nd"
          amount: "¥40,000"
        - type: "cash"
          rank: "3rd"
          amount: "¥25,000"
          count: 2                       # 三等奖 ×2
        - type: "internship"
          description: "实习直推 2 名额（比亚迪储能事业部）"
          count: 2
        - type: "certificate"
          description: "竞赛荣誉证书 + 学信网认定"
        - type: "other"
          description: "政府科技奖项推荐资格"

      # 评审配置
      judging:
        mode: "expert_only"
        # enum: expert_only | expert_plus_vote

        vote_weight: 0                   # 大众投票权重（0=不启用）
        # expert_plus_vote 时: vote_weight: 20 (即专家80%+投票20%)

        criteria:
          - name: "Innovation"
            name_zh: "创新性"
            weight: 30
            description: "方法是否有新意，是否超越已有公开方案"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Technical Depth"
            name_zh: "技术实现"
            weight: 30
            description: "代码质量、可运行性、指标达成"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Usability"
            name_zh: "完整度"
            weight: 20
            score_range: [0, 100]
          - name: "Presentation"
            name_zh: "展示"
            weight: 20
            score_range: [0, 100]

      # [P0 Gap 8] 提交物规范
      deliverables:
        required:
          - type: "repo"
            format: "github-url"
            description: "GitHub 仓库链接（须包含 LICENSE 文件）"
          - type: "document"
            format: "pdf|md"
            description: "技术文档"
        optional:
          - type: "video"
            format: "url"
            description: "演示视频（推荐 3-5 分钟）"
          - type: "demo"
            format: "url"
            description: "可交互 Demo 链接"
          - type: "slides"
            format: "url"
            description: "演示幻灯片"

    # 第二赛道示例（企业悬赏场景的评分硬约束）
    - name: "Model Optimization"
      name_zh: "模型优化"
      slug: "model-optimization"
      description: "Reduce false rejection rate below 8%"

      rewards:
        - type: "cash"
          rank: "1st"
          amount: "¥80,000"
        - type: "job"
          description: "入职绿色通道 2 名额"

      judging:
        mode: "expert_only"
        criteria:
          - name: "FRR_metric"
            name_zh: "误拒率指标"
            weight: 35
            hard_constraint: false
          - name: "Bad_debt_constraint"
            name_zh: "坏账率约束"
            weight: 25
            hard_constraint: true        # 超限则该维度 0 分
            constraint_rule: "坏账率变化须在 ±0.2pp 以内，超出则本项 0 分"
          - name: "Feasibility"
            name_zh: "技术可行性"
            weight: 25
          - name: "Completeness"
            name_zh: "完整度"
            weight: 15

      deliverables:
        required:
          - type: "repo"
            format: "github-url"
          - type: "model"
            format: "file"
            description: "模型权重文件"
          - type: "document"
            format: "pdf"
            description: "技术文档"
        optional:
          - type: "video"
            format: "url"

  # 评委列表
  judges:
    - github: "judge-one"
      name: "Dr. Wang"
      name_zh: "王教授"
      title: "AI Research Lead"
      affiliation: "Pengcheng Laboratory"
      expertise: "AI for Science"
      conflict_declaration: ""           # R2 PDF 链接（P1 阶段强制要求）

  # 数据集（企业悬赏场景）
  datasets:
    - name: "Credit Application Dataset v1.2"
      name_zh: "信贷申请数据集 v1.2"
      version: "1.2"
      description: "12万条脱敏历史申请记录，42个特征字段"
      access_control: "nda-required"     # public | nda-required
      format: "csv"
      size: "~180MB"
      download_url: ""                   # NDA 签署后通过 Issue Comment 发送 R2 presigned URL

  # [P0 Gap 18] FAQ
  faq:
    - q: "必须用 Apache 2.0 吗？"
      q_en: "Is Apache 2.0 mandatory?"
      a: "是的，本次统一使用 Apache 2.0，因其包含专利授权声明。"
      a_en: "Yes, Apache 2.0 is required for its patent grant clause."
    - q: "指导教师可以帮我们写代码吗？"
      a: "不可以。导师贡献度须 ≤10%（以 GitHub commit 记录为准）。"

  # [P0 赛道双报] 双报配置
  settings:
    allow_multi_track: true              # [P0 Gap 15] 允许双报
    multi_track_rule: "independent"      # independent (独立提交) | shared (共享提交)
    language: ["en", "zh"]
    ai_review: true
    ai_team_matching: true
    public_vote: "reactions"             # none | reactions (GitHub Reactions MVP)
    vote_emoji: "👍"                     # Reactions 使用的 emoji
```

### 6.2 Profile Schema (`profiles/{username}-{uuid}.yml`)

```yaml
synnovator_profile: "2.0"

hacker:
  github: "alice-dev"
  name: "Alice Zhang"
  name_zh: "张爱丽"
  avatar: "https://github.com/alice-dev.png"

  bio: "AI/ML engineer focused on agent systems"
  bio_zh: "专注于 Agent 系统的 AI 工程师"

  location: "Shanghai / San Francisco"
  languages: ["zh", "en"]

  # 身份信息（高校竞赛场景需要）
  identity:
    type: "student"                      # student | professional | academic
    affiliation: "South University of Science and Technology"
    degree: "master"                     # bachelor | master | phd
    major: "Computer Science"
    graduation_year: 2027

  skills:
    - category: "AI/ML"
      items: ["PyTorch", "LangChain", "RAG", "Fine-tuning"]
    - category: "Backend"
      items: ["Python", "FastAPI", "PostgreSQL"]
    - category: "Frontend"
      items: ["React", "TypeScript"]

  interests: ["AI Agent", "Developer Tools", "Code Generation"]

  looking_for:
    roles: ["Frontend Developer", "Product Designer"]
    team_size: "3-5"
    collaboration_style: "async-friendly"

  experience:
    years: 5
    hackathons:
      - name: "AI Agent Challenge 2025"
        result: "2nd Place"
        project_url: "https://github.com/alice/agentflow"
    projects:
      - name: "AgentFlow"
        url: "https://github.com/alice/agentflow"
        description: "Visual workflow builder for AI agents"

  links:
    twitter: "https://twitter.com/alice_dev"
    linkedin: "https://linkedin.com/in/alice-zhang"
    website: "https://alice.dev"

  # 评委相关字段（当该用户作为评委时填写）
  judge_profile:
    available: true
    expertise: ["AI Agent", "NLP", "Code Generation"]
    conflict_declaration: ""             # 利益冲突声明 PDF 链接（R2）
```

### 6.3 Project Submission Schema

```yaml
synnovator_submission: "2.0"

project:
  name: "AgentFlow"
  name_zh: "智能体工作流"
  tagline: "Visual workflow builder for AI agents"
  track: "ai-agent-framework"           # 对应 hackathon.yml 中 track.slug

  team:
    - github: "alice-dev"
      role: "Lead Developer"
    - github: "bob-ai"
      role: "AI Engineer"

  mentors:                               # 指导教师（可选，高校竞赛场景）
    - github: "prof-wang"
      name: "王教授"
      affiliation: "南方科技大学电气系"

  # 提交物（对应 hackathon.yml 中的 deliverables 规范）
  deliverables:
    repo: "https://github.com/team/agentflow"
    document:
      local_path: "./technical-report.pdf"
      r2_url: ""                         # Actions 自动填充
    video: "https://youtube.com/watch?v=xxx"
    demo: "https://agentflow.vercel.app"
    slides: "https://docs.google.com/presentation/d/xxx"

    # 额外附件
    attachments:
      - name: "architecture-diagram.png"
        local_path: "./architecture.png"
        r2_url: ""
      - name: "model-weights.tar.gz"     # 企业悬赏场景
        local_path: "./model.tar.gz"
        r2_url: ""

  tech_stack: ["Python", "LangChain", "React", "FastAPI"]

  # 开源代码参考声明（防抄袭）
  references:
    - name: "LangChain Agent Framework"
      url: "https://github.com/langchain-ai/langchain"
      usage: "Used as base framework for agent orchestration"
    - name: "React Flow"
      url: "https://reactflow.dev/"
      usage: "Used for visual workflow editor"

  description: |
    AgentFlow is a visual workflow builder...
  description_zh: |
    AgentFlow 是一个可视化工作流构建器...
```

### 6.4 Issue Templates

#### 评委评分 Issue (`judge-score.yml`)

```yaml
name: "Judge Score"
description: "Submit structured scoring for a hackathon submission"
title: "[Score] {team-name} — {hackathon-slug} / {track}"
labels: ["judge-score"]
body:
  - type: input
    id: hackathon
    attributes:
      label: "Hackathon Slug"
  - type: input
    id: team
    attributes:
      label: "Team Name"
  - type: input
    id: track
    attributes:
      label: "Track Slug"
  - type: textarea
    id: scores
    attributes:
      label: "Scores (YAML format)"
      value: |
        # 请按评审维度逐项打分 (0-100)
        scores:
          - criterion: "Innovation"
            score:
            comment: ""
          - criterion: "Technical Depth"
            score:
            comment: ""
          - criterion: "Usability"
            score:
            comment: ""
          - criterion: "Presentation"
            score:
            comment: ""

        overall_comment: |
          整体评语...
  - type: checkboxes
    id: conflict
    attributes:
      label: "利益冲突声明"
      options:
        - label: "我确认与该团队无利益冲突关系"
          required: true
```

---

## 7. Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          Synnovator Architecture V3                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     GitHub (核心基础设施)                               │  │
│  │                                                                        │  │
│  │   Monorepo                  Template Repos                             │  │
│  │   ┌──────────────┐         ┌────────────────────────┐                  │  │
│  │   │ synnovator/  │         │ synnovator-community/  │ ← Use Template  │  │
│  │   │ ├ hackathons/ │         │ synnovator-enterprise/ │                  │  │
│  │   │ ├ profiles/  │         │ synnovator-youth/      │                  │  │
│  │   │ └ site/      │         └────────────────────────┘                  │  │
│  │   └──────────────┘                                                     │  │
│  │                                                                        │  │
│  │   Issue (工作流引擎)          PR (数据提交)           Actions (自动化)  │  │
│  │   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │  │
│  │   │ • 报名        │         │ • Profile    │         │ • 格式校验    │  │  │
│  │   │ • NDA 签署    │         │ • hackathon  │         │ • 状态管理    │  │  │
│  │   │ • 评委评分    │         │ • submission │         │ • R2 上传     │  │  │
│  │   │ • 申诉        │         │ • 站点代码    │         │ • AI 评审     │  │  │
│  │   │ • 组队        │         │              │         │ • 部署        │  │  │
│  │   └──────────────┘         └──────────────┘         └──────────────┘  │  │
│  │                                                                        │  │
│  │   其他 GitHub 原生能力                                                  │  │
│  │   • Discussions (社区交流)    • Reactions (大众投票 MVP)                 │  │
│  │   • CODEOWNERS (审核路由)    • Labels (状态标记/分类)                   │  │
│  │   • OAuth (用户认证)         • Pages (站点托管)                         │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────┐   ┌──────────────────────────────────┐  │
│  │       Cloudflare               │   │        AI Services               │  │
│  │                                │   │                                  │  │
│  │   R2 (文件存储)                │   │  Claude API (评审摘要)           │  │
│  │   • PDF 提案                   │   │  组队匹配 (Profile 分析)         │  │
│  │   • 活动 Banner                │   │  PDF 内容提取                    │  │
│  │   • 模型权重                   │   │                                  │  │
│  │   • NDA 文档                   │   │  触发: GitHub Actions            │  │
│  │                                │   │  Key:   Repo Secrets             │  │
│  │   D1 (文件元数据)              │   │                                  │  │
│  │   • file_id, r2_key            │   │                                  │  │
│  │   • 关联 hackathon/team        │   │                                  │  │
│  └────────────────────────────────┘   └──────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                  Synnovator 站点 (GitHub Pages)                        │  │
│  │                                                                        │  │
│  │   静态页面 + 前端交互组件                                               │  │
│  │   ┌────────────────────────────────────────────────────────────┐       │  │
│  │   │                GitHubRedirect 引擎                         │       │  │
│  │   │                                                            │       │  │
│  │   │  用户在站点填写表单/选择选项                                 │       │  │
│  │   │    → JS 生成预填 Issue/PR body (YAML/Markdown)             │       │  │
│  │   │    → window.open(github.com/.../new?title=&body=&labels=)  │       │  │
│  │   │    → 用户在 GitHub 确认提交                                 │       │  │
│  │   │                                                            │       │  │
│  │   │  覆盖: 报名 | NDA签署 | 项目提交 | 评分 | 申诉 | 组队     │       │  │
│  │   └────────────────────────────────────────────────────────────┘       │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 核心数据流

```
                    ┌─── Profile 注册 ─────────────────────────────┐
                    │   站点表单 → PR profiles/xxx.yml              │
                    │   → Actions 校验 + UUID 生成                  │
                    │   → Bot 自动合并                              │
                    │                                               │
                    ├─── 活动创建 ──────────────────────────────────┤
                    │   Use Template → PR hackathons/slug/          │
                    │   → Actions 校验 hackathon.yml                │
                    │   → Maintainer 审核 → 合并 → 站点重建         │
                    │                                               │
                    ├─── 报名 ─────────────────────────────────────┤
                    │   站点 → Issue [Register] username - slug     │
                    │   → Actions 检查 Profile 存在 + 资格           │
                    │   → (NDA 场景) 触发 NDA 签署 Issue 流程       │
                    │   → Label: registered                         │
                    │                                               │
                    ├─── 项目提交 ──────────────────────────────────┤
                    │   站点 → PR submissions/team/project.yml      │
                    │   → Actions 校验格式 + 上传文件到 R2           │
                    │   → AI Agent 评审摘要 Comment                 │
                    │   → 时间窗口内 → 半自动合并                   │
                    │                                               │
                    ├─── 评审评分 ──────────────────────────────────┤
                    │   站点评分卡 → Issue [Score] team - slug       │
                    │   → Actions 校验评分格式 + 利益冲突声明        │
                    │   → Actions 加权计算 → 结果写入活动数据        │
                    │                                               │
                    ├─── 大众投票 (MVP) ────────────────────────────┤
                    │   项目 PR 上的 GitHub Reactions (👍)           │
                    │   → Actions 定期统计 Reactions 计数            │
                    │   → 按权重纳入最终评分                        │
                    │                                               │
                    └─── 申诉 ─────────────────────────────────────┘
                        站点 → Issue [Appeal] team - slug
                        → Label: appeal + slug → assign 组织者
                        → 组织者处理 → Label: resolved
```

---

## 8. User Stories (MVP — P0)

### US-001: Hacker 注册 Profile
（与 V2 相同，增加 identity 字段支持学生身份验证）

### US-002: 组织者创建 Hackathon
**Description:** 组织者通过 GitHub Template Repo 创建活动仓库，编辑 hackathon.yml（Schema V2），PR 到主仓库注册。

**Acceptance Criteria:**
- [ ] 提供 3 个 Template Repo（community / enterprise / youth-league）
- [ ] 组织者 `Use this template` 后编辑 hackathon.yml
- [ ] PR 到 `synnovator/synnovator` 主仓库的 `hackathons/` 目录
- [ ] Actions 校验 Schema V2 全部必填字段
- [ ] Maintainer 审核合并后活动上线
- [ ] 活动页面展示全部新字段（多主办方、资格约束、IP 规则、7阶段时间线、FAQ、Events）

### US-003: 参赛者浏览、报名、签署 NDA
**Description:** 参赛者在活动页面点击"报名"按钮，站点生成预填 Issue 内容并跳转 GitHub 提交。NDA 场景下先触发 NDA Issue 流程。

**Acceptance Criteria:**
- [ ] 活动页面"报名"按钮调用 GitHubRedirect 组件
- [ ] 生成预填 Issue（title、body、labels 含活动 slug）
- [ ] Actions 检查用户 Profile 是否存在
- [ ] Actions 检查 eligibility 约束（学生身份等）
- [ ] NDA 活动：报名后自动提示签署 NDA Issue
- [ ] 签署确认后添加 `nda-approved` label

### US-004: 参赛者提交项目（含双报）
**Description:** 参赛者通过 PR 提交项目到 `submissions/` 目录。支持双赛道独立提交。

**Acceptance Criteria:**
- [ ] 单赛道：`submissions/team-name/project.yml`
- [ ] 双报：`submissions/team-name-track1/project.yml` + `submissions/team-name-track2/project.yml`
- [ ] Actions 校验 deliverables 的 required 项是否齐全
- [ ] Actions 校验 track 是否在 hackathon.yml 的 tracks 列表中
- [ ] PDF/模型权重等文件上传 R2，`r2_url` 自动填充
- [ ] 代码参考声明 `references` 校验非空（建议性）

### US-005: 评委结构化评分
**Description:** 评委在活动页面通过评分卡组件打分，生成 Markdown 格式评分内容，跳转创建评分 Issue。

**Acceptance Criteria:**
- [ ] 站点 ScoreCard 组件读取 hackathon.yml 的评审维度、权重、分值范围
- [ ] 评委在页面上逐维度打分 + 写评语
- [ ] 组件生成 YAML 格式评分内容
- [ ] 跳转 GitHub 创建 Issue（预填 title、body、labels）
- [ ] Actions 校验评分格式和分值范围
- [ ] Actions 检查利益冲突声明（P1 增强）

### US-006: 活动状态自动管理（7 阶段）
（基于 V2 的 US-006 扩展为 7 阶段状态机）

### US-007: AI 辅助组队匹配
（与 V2 相同）

---

## 9. Functional Requirements

- **FR-1**: Monorepo 包含主站、所有活动、所有 Profile
- **FR-2**: 3 个 GitHub Template Repo 提供类型化活动模板
- **FR-3**: `hackathon.yml` Schema V2 覆盖活动全配置（类型/资格/IP/时间线/奖励/提交物/FAQ/事件）
- **FR-4**: GitHubRedirect 前端组件生成预填 Issue/PR URL
- **FR-5**: GitHub Actions 实现全部自动化校验和状态管理
- **FR-6**: GitHub OAuth 用户认证
- **FR-7**: Cloudflare R2 文件存储 + D1 元数据
- **FR-8**: AI Agent 评审摘要 + 组队匹配
- **FR-9**: 中英双语 i18n
- **FR-10**: GitHub Reactions 大众投票（MVP）
- **FR-11**: Issue Template 覆盖报名/NDA/评分/申诉/组队
- **FR-12**: 赛道双报支持（独立子目录）

---

## 10. Non-Goals (MVP)

- **NG-1**: 不做支付/奖金分发系统
- **NG-2**: 不做 Quadratic Funding / Grants
- **NG-3**: 不做实时聊天（用 GitHub Discussions）
- **NG-4**: 不做视频直播
- **NG-5**: 不做 Bounty 悬赏系统
- **NG-6**: 不做移动端 App
- **NG-7**: 不自建后端服务（MVP 阶段）
- **NG-8**: 不做高级投票防刷票系统（MVP 用 Reactions）
- **NG-9**: 不做自动代码抄袭检测

---

## 11. Priority Roadmap

```
P0 — MVP (Month 1-2)                        全部 Git-native，零后端
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── hackathon.yml Schema V2（全部 P0 字段）
├── project.yml Schema V2（deliverables + references）
├── Profile Schema V2（identity + judge_profile）
├── 3 个 GitHub Template Repo
├── GitHubRedirect 前端引擎组件
├── 评分卡前端组件 (ScoreCard)
├── Issue Templates（报名/评分/申诉）
├── GitHub Actions（校验/状态管理/R2上传/部署）
├── Astro SSG 主站（活动列表/详情/Profile）
├── Cloudflare R2 + D1 集成
├── GitHub Reactions 投票
├── 中英双语 i18n
├── CLI 工具（create-profile / create-hackathon / submit）
└── 首个示范活动上线

P1 — Git-native Workflows (Month 3-4)       全部通过 Issue/PR 实现
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├── NDA 签署流程（Issue 确认 + R2 presigned URL）
├── 数据集管理（Schema 声明 + 鉴权下载）
├── 评审模型增强（结构化评分 Issue + 加权计算 + 硬约束）
├── 评审利益冲突声明（Profile 必填 + @checker）
├── 代码安全扫描（Actions license-checker + 关键词扫描）
├── 导师贡献检测（project.yml 声明 + commit 分析）
├── 申诉仲裁系统（Issue Template + Label 路由）
├── AI 评审摘要（Claude API + Actions）
└── AI 组队匹配（Profile 分析）

P2 — Enhancement (Month 5+)                 唯一需要后端的功能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
└── 代码抄袭检测（Moss/JPlag 集成）
```

---

## 12. Success Metrics

| 指标 | MVP 目标 | 衡量方式 |
|------|----------|----------|
| 活动创建时间 | < 10 分钟 | 从 Use Template 到 PR 合并 |
| Profile 注册时间 | < 5 分钟 | 从表单填写到 PR 合并 |
| 项目提交体验 | < 5 分钟 | 从表单到 PR 提交 |
| Schema 覆盖率 | 100% 覆盖两档案场景 | 模拟档案→YAML 转换测试 |
| AI 评审覆盖率 | 100% 提交项目 | Actions 触发率 |
| 首批活动数量 | 3 个活动（含 1 个企业悬赏） | 60 天内 |
| 注册 Hacker 数 | 100+ Profiles | 60 天内 |
| 项目提交量 | 30+ 项目 | 首批活动合计 |

---

## 13. Open Questions (Updated)

1. **Reactions 投票的可信度**：MVP 用 Reactions 做大众投票，如何应对刷票（假账号批量点赞）？是否需要最低 Profile 要求？
2. **Actions 免费额度**：14 项 P0 功能的 Actions workflow 密度较高，需测算月消耗分钟数是否在 2000 分钟内
3. **大文件 PR**：模型权重文件（可能数百 MB）通过 PR 提交再上传 R2 后删除，Git 历史中是否会保留？是否需要 `git filter-branch` 或 BFG 清理？
4. **评分计算时机**：评委通过 Issue 提交评分后，Actions 何时触发加权汇总？实时？还是评审期结束后统一计算？
5. **Template Repo 同步**：Template Repo 更新后，已创建的活动仓库如何获取模板更新？
