# P0 Site Core Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Synnovator site with working pages (home, hackathon detail, profile, 404) rendering YAML data with the Neon Forge dark theme.

**Architecture:** 4-layer bottom-up build: demo data YAML → Neon Forge CSS tokens + layout → Astro Content Collections data loading → pages and components. All static output, no Functions.

**Tech Stack:** Astro 5 (static), Tailwind CSS 4 (`@theme`), Astro Content Collections with `glob()` loader, YAML data from monorepo root.

---

## Task 1: Create demo hackathon YAML data

**Files:**
- Create: `hackathons/enterprise-fintech-risk-2025/hackathon.yml`
- Create: `hackathons/enterprise-fintech-risk-2025/assets/.gitkeep`

**Step 1: Create directory structure**

Run: `mkdir -p hackathons/enterprise-fintech-risk-2025/assets hackathons/enterprise-fintech-risk-2025/submissions`

**Step 2: Write hackathon.yml from docx archive data**

Create `hackathons/enterprise-fintech-risk-2025/hackathon.yml` with full Schema V2 content based on the enterprise-fintech-risk-2025.docx simulation archive. Key data points:

```yaml
synnovator_version: "2.0"

hackathon:
  name: "AI Smart Risk Control Optimization Challenge 2025"
  name_zh: "AI智能风控优化挑战赛2025"
  slug: "enterprise-fintech-risk-2025"
  tagline: "Reduce false rejection rate below 8% while maintaining credit risk standards"
  tagline_zh: "在坏账率不变前提下，将消费信贷误拒率从12.3%降至8%以下"
  type: "enterprise"
  description: |
    Xinchen FinTech (Shenzhen) is seeking innovative solutions to reduce the false rejection rate
    in consumer credit applications. The current model rejects approximately 8,600 qualified users
    monthly, resulting in an estimated annual loss of ¥140M. Two tracks: Model Optimization and
    Explainability for regulatory compliance.
  description_zh: |
    星辰金融科技（深圳）有限公司现有风控模型误拒率12.3%，导致每月约8,600名优质用户被错误拒绝，
    估算年化损失约¥1.4亿。本次挑战赛设置模型优化和可解释性两个赛道，寻求创新解法。

  organizers:
    - name: "Xinchen FinTech"
      name_zh: "星辰金融科技（深圳）有限公司"
      role: "host"
      website: "https://example.com/xinchen"

  sponsors: []

  partners: []

  eligibility:
    open_to: "all"
    restrictions:
      - "主办方全体员工（含外包）不得参赛"
    blacklist:
      - "星辰金融科技全体员工（含外包）"
    team_size:
      min: 1
      max: 4
    allow_solo: true
    mentor_rules:
      allowed: false

  legal:
    license: "proprietary"
    ip_ownership: "organizer"
    nda:
      required: true
      document_url: ""
      summary: "参赛前须签署《保密及竞赛参与协议》，数据集仅限本地使用，严禁上传至任何公开存储。"
    compliance_notes:
      - "参赛提交的模型权重、特征工程代码、方案文档，所有权自动转让予星辰金融科技"
      - "参赛者不得将竞赛方案用于其他商业项目或对外发表（获主办方书面许可除外）"
      - "数据集已完成差分隐私脱敏处理，使用须符合数据最小化原则"
    data_policy: "数据集经k-anonymity（k≥5）处理，不含可直接识别个人的信息"

  timeline:
    draft:
      start: "2025-04-21T00:00:00+08:00"
      end: "2025-04-30T23:59:59+08:00"
    registration:
      start: "2025-05-06T00:00:00+08:00"
      end: "2025-05-19T23:59:59+08:00"
    development:
      start: "2025-05-20T00:00:00+08:00"
      end: "2025-06-22T23:59:59+08:00"
    submission:
      start: "2025-06-23T00:00:00+08:00"
      end: "2025-06-27T23:59:59+08:00"
    judging:
      start: "2025-06-28T00:00:00+08:00"
      end: "2025-07-11T23:59:59+08:00"
    announcement:
      start: "2025-07-12T00:00:00+08:00"
      end: "2025-07-18T23:59:59+08:00"
    award:
      start: "2025-07-19T00:00:00+08:00"
      end: "2025-07-31T23:59:59+08:00"

  events:
    - name: "Mentor AMA #1: Dataset & Metrics"
      name_zh: "导师答疑 #1：数据集字段解读与评估指标说明"
      type: "ama"
      datetime: "2025-05-30T14:00:00+08:00"
      duration_minutes: 90
      url: ""
      description: "数据集字段解读 + 评估指标说明"
    - name: "Mentor AMA #2: Regulatory Compliance"
      name_zh: "导师答疑 #2：可解释性监管合规答疑"
      type: "ama"
      datetime: "2025-06-09T14:00:00+08:00"
      duration_minutes: 72
      url: ""
      description: "可解释性监管合规答疑，邀请外部监管顾问出席"

  tracks:
    - name: "Model Optimization"
      name_zh: "模型优化赛道"
      slug: "model-optimization"
      description: "Reduce false rejection rate below 8% while keeping bad debt rate within ±0.2pp of baseline"
      description_zh: "在坏账率不超过现有基线±0.2pp的前提下，将误拒率降至8%以下"
      rewards:
        - type: "cash"
          rank: "1st"
          amount: "¥80,000"
          description: "一等奖"
        - type: "cash"
          rank: "2nd"
          amount: "¥60,000"
          description: "二等奖"
        - type: "cash"
          rank: "3rd"
          amount: "¥40,000"
          description: "三等奖"
        - type: "job"
          description: "入职绿色通道 2 名额"
          count: 2
      judging:
        mode: "expert_only"
        vote_weight: 0
        criteria:
          - name: "FRR_metric"
            name_zh: "误拒率指标"
            weight: 35
            description: "是否达到<8%目标；距离基线的改善幅度"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Bad_debt_constraint"
            name_zh: "坏账率约束"
            weight: 25
            description: "坏账率变化是否在±0.2pp约束内"
            score_range: [0, 100]
            hard_constraint: true
            constraint_rule: "坏账率变化须在 ±0.2pp 以内，超出则本项 0 分"
          - name: "Feasibility"
            name_zh: "技术可行性"
            weight: 25
            description: "代码质量、可复现性、部署复杂度"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Completeness"
            name_zh: "完整度"
            weight: 15
            description: "文档、视频、说明清晰程度"
            score_range: [0, 100]
            hard_constraint: false
      deliverables:
        required:
          - type: "repo"
            format: "github-url"
            description: "GitHub 仓库链接"
          - type: "model"
            format: "file"
            description: "模型权重文件"
          - type: "document"
            format: "pdf"
            description: "技术文档"
        optional:
          - type: "video"
            format: "url"
            description: "演示视频"

    - name: "Explainability"
      name_zh: "可解释性赛道"
      slug: "explainability"
      description: "Provide post-hoc explainability for the existing GBDT model, passing regulatory compliance review"
      description_zh: "为现有梯度提升模型提供事后可解释性方案，通过监管合规审查"
      rewards:
        - type: "cash"
          rank: "1st"
          amount: "¥60,000"
          description: "一等奖"
        - type: "cash"
          rank: "2nd"
          amount: "¥40,000"
          description: "二等奖"
        - type: "job"
          description: "入职绿色通道 2 名额"
          count: 2
      judging:
        mode: "expert_only"
        vote_weight: 0
        criteria:
          - name: "Explanation_quality"
            name_zh: "解释质量"
            weight: 40
            description: "语言准确性、业务可读性、Top-3因素完整"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Regulatory_format"
            name_zh: "监管格式适配"
            weight: 30
            description: "与《商业银行算法治理指引》对标程度"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Technical_implementation"
            name_zh: "技术实现"
            weight: 20
            description: "代码可运行、输出稳定、推理效率"
            score_range: [0, 100]
            hard_constraint: false
          - name: "Completeness"
            name_zh: "完整度"
            weight: 10
            description: "文档与交付物完整"
            score_range: [0, 100]
            hard_constraint: false
      deliverables:
        required:
          - type: "repo"
            format: "github-url"
            description: "GitHub 仓库链接"
          - type: "document"
            format: "pdf"
            description: "技术文档（含监管报告模板）"
        optional:
          - type: "video"
            format: "url"
            description: "演示视频"

  judges:
    - github: "zhao-wenbo"
      name: "Zhao Wenbo"
      name_zh: "赵文博"
      title: "Chief Review Officer"
      affiliation: "Xinchen FinTech"
      expertise: "信贷风控，18年"
      conflict_declaration: ""
    - github: "lin-xiaohui"
      name: "Lin Xiaohui"
      name_zh: "林晓慧"
      title: "Algorithm Lead"
      affiliation: "Xinchen FinTech"
      expertise: "机器学习，7年"
      conflict_declaration: ""
    - github: "wu-hao"
      name: "Wu Hao"
      name_zh: "吴昊"
      title: "Former Chief Risk Scientist"
      affiliation: "External Expert"
      expertise: "风控算法，14年"
      conflict_declaration: ""
    - github: "zhang-ruping"
      name: "Zhang Ruping"
      name_zh: "张汝萍"
      title: "Regulatory Compliance Researcher"
      affiliation: "Fintech Regulatory Research Institute"
      expertise: "算法合规，8年"
      conflict_declaration: ""
    - github: "qian-shining"
      name: "Qian Shining"
      name_zh: "钱世宁"
      title: "Product Director"
      affiliation: "Xinchen FinTech"
      expertise: "风控产品，5年"
      conflict_declaration: ""

  datasets:
    - name: "Credit Application Dataset v1.2"
      name_zh: "信贷申请数据集 v1.2"
      version: "1.2"
      description: "120,000 de-identified historical credit applications with 42 feature fields"
      access_control: "nda-required"
      format: "csv"
      size: "~180MB"
      download_url: ""

  faq:
    - q: "数据集可以在云端GPU服务器上训练吗？"
      q_en: "Can I train on cloud GPU servers?"
      a: "可以，但须确保服务器为私有或受控环境，不得使用公开共享计算资源（如Kaggle Kernel）。"
      a_en: "Yes, but the server must be private or controlled. Public shared resources (e.g. Kaggle Kernels) are not allowed."
    - q: "如果方案使用了SHAP/LIME等开源库，IP如何处理？"
      q_en: "How is IP handled if we use open source libraries like SHAP/LIME?"
      a: "开源库本身不受影响，但你基于数据训练的模型权重和自研代码归主办方所有。"
      a_en: "Open source libraries are unaffected, but model weights trained on the data and custom code belong to the organizer."
    - q: "奖金是税前还是税后？"
      q_en: "Are prizes before or after tax?"
      a: "税前金额，个人所得税按劳务报酬20%预扣，主办方代扣代缴。"
      a_en: "Pre-tax. Individual income tax at 20% is withheld by the organizer."
    - q: "数据集中有时序特征吗？"
      q_en: "Does the dataset include time-series features?"
      a: "有，包含历史还款记录时间窗口特征（最近3/6/12月），具体见数据集文档第4.2节。"
      a_en: "Yes, including repayment history time window features (last 3/6/12 months). See dataset documentation section 4.2."
    - q: "可解释性赛道的方案可以同时投技术论文吗？"
      q_en: "Can explainability track entries be published as papers?"
      a: "不可以。根据IP条款，参赛成果不得在未获主办方书面同意前对外发表。"
      a_en: "No. Per IP terms, entries may not be published externally without written consent from the organizer."

  settings:
    allow_multi_track: true
    multi_track_rule: "independent"
    language: ["en", "zh"]
    ai_review: true
    ai_team_matching: false
    public_vote: "none"
```

**Step 3: Create assets placeholder**

Create `hackathons/enterprise-fintech-risk-2025/assets/.gitkeep` (empty file).

**Step 4: Verify YAML is valid**

Run: `cd /Users/h2oslabs/Workspace/Synnovator/monorepo/.claude/worktrees/p0-implementation && python3 -c "import yaml; yaml.safe_load(open('hackathons/enterprise-fintech-risk-2025/hackathon.yml')); print('OK')"`
Expected: `OK`

**Step 5: Commit**

```bash
git add hackathons/enterprise-fintech-risk-2025/
git commit -m "feat(data): add enterprise-fintech-risk-2025 demo hackathon data"
```

---

## Task 2: Create demo submission YAML data

**Files:**
- Create: `hackathons/enterprise-fintech-risk-2025/submissions/team-refuse-zero/project.yml`
- Create: `hackathons/enterprise-fintech-risk-2025/submissions/team-compliance-express/project.yml`

**Step 1: Write team-refuse-zero/project.yml**

Model Optimization track 1st place winner "拒绝清零", based on docx archive section 4.5–4.6:

```yaml
synnovator_submission: "2.0"

project:
  name: "Refuse Zero"
  name_zh: "拒绝清零"
  tagline: "Dual-stage model: XGBoost screening + LightGBM refinement, FRR 7.1%"
  track: "model-optimization"

  team:
    - github: "zhou-haoran"
      role: "Lead Developer"
    - github: "chen-wei"
      role: "ML Engineer"
    - github: "li-ming"
      role: "Data Analyst"

  mentors: []

  deliverables:
    repo: "https://github.com/team-refuse-zero/fintech-risk-model"
    document:
      local_path: ""
      r2_url: ""
    video: "https://example.com/demo-video"

  tech_stack: ["Python", "XGBoost", "LightGBM", "scikit-learn", "pandas"]

  references:
    - name: "XGBoost"
      url: "https://github.com/dmlc/xgboost"
      usage: "Used as first-stage screening model"
    - name: "LightGBM"
      url: "https://github.com/microsoft/LightGBM"
      usage: "Used as second-stage refinement model"

  description: |
    Dual-stage credit scoring model combining XGBoost for coarse screening with LightGBM
    for precision refinement. Achieved false rejection rate of 7.1% with bad debt rate
    increase of only +0.09pp, well within the ±0.2pp constraint.
  description_zh: |
    双阶段信贷评分模型：粗筛XGBoost + 精筛LightGBM。误拒率达7.1%，坏账率仅+0.09pp，
    远在±0.2pp约束范围内。方案工程化程度高，可直接交接给落地团队。
```

**Step 2: Write team-compliance-express/project.yml**

Explainability track 1st place winner "合规快车":

```yaml
synnovator_submission: "2.0"

project:
  name: "Compliance Express"
  name_zh: "合规快车"
  tagline: "Cross-functional compliance + tech solution with highest regulatory format score"
  track: "explainability"

  team:
    - github: "liu-compliance"
      role: "Compliance Manager"
    - github: "wang-algo"
      role: "Algorithm Engineer"

  mentors: []

  deliverables:
    repo: "https://github.com/team-compliance-express/explainability"
    document:
      local_path: ""
      r2_url: ""
    video: "https://example.com/compliance-demo"

  tech_stack: ["Python", "SHAP", "scikit-learn", "Jinja2"]

  references:
    - name: "SHAP"
      url: "https://github.com/shap/shap"
      usage: "Used for Shapley value-based feature attribution"

  description: |
    Cross-functional compliance + engineering approach to credit decision explainability.
    Highest regulatory format adaptation score. Decision explanation templates follow
    CFPB Adverse Action Notice framework, readable by compliance officers.
  description_zh: |
    合规+技术跨职能组合方案，监管格式适配得分最高。决策理由单语言符合监管官员的阅读习惯，
    参考CFPB不利行动通知框架组织拒绝理由。
```

**Step 3: Verify YAML files**

Run: `python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['hackathons/enterprise-fintech-risk-2025/submissions/team-refuse-zero/project.yml', 'hackathons/enterprise-fintech-risk-2025/submissions/team-compliance-express/project.yml']]; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add hackathons/enterprise-fintech-risk-2025/submissions/
git commit -m "feat(data): add demo submission data for two winning teams"
```

---

## Task 3: Create demo profile YAML data

**Files:**
- Create: `profiles/zhou-haoran-a1b2c3d4.yml`
- Create: `profiles/song-yuhan-e5f6g7h8.yml`

**Step 1: Write zhou-haoran profile**

"拒绝清零" team lead, from docx section 4.3:

```yaml
synnovator_profile: "2.0"

hacker:
  github: "zhou-haoran"
  name: "Zhou Haoran"
  name_zh: "周昊然"
  avatar: "https://github.com/zhou-haoran.png"

  bio: "Consumer finance algorithm engineer with 6 years of experience in credit risk modeling"
  bio_zh: "消费金融公司算法工程师，6年信贷风控建模经验"

  location: "Shenzhen"
  languages: ["zh", "en"]

  identity:
    type: "professional"
    affiliation: "Consumer Finance Company"

  skills:
    - category: "AI/ML"
      items: ["XGBoost", "LightGBM", "scikit-learn", "Feature Engineering"]
    - category: "Backend"
      items: ["Python", "FastAPI", "PostgreSQL"]
    - category: "Data"
      items: ["pandas", "SQL", "Spark"]

  interests: ["Credit Risk", "ML Ops", "Financial AI"]

  looking_for:
    roles: ["ML Engineer", "Data Scientist"]
    team_size: "2-4"
    collaboration_style: "sync-preferred"

  experience:
    years: 6
    hackathons:
      - name: "AI Smart Risk Control Optimization Challenge 2025"
        result: "1st Place — Model Optimization Track"
        project_url: "https://github.com/team-refuse-zero/fintech-risk-model"
    projects:
      - name: "Credit Scoring Engine"
        url: ""
        description: "Production credit scoring system serving 10M+ applications annually"

  links:
    linkedin: "https://linkedin.com/in/zhou-haoran"
```

**Step 2: Write song-yuhan profile**

"可信决策" team member:

```yaml
synnovator_profile: "2.0"

hacker:
  github: "song-yuhan"
  name: "Song Yuhan"
  name_zh: "宋雨涵"
  avatar: "https://github.com/song-yuhan.png"

  bio: "Data scientist specializing in SHAP/LIME interpretability research"
  bio_zh: "数据科学家，专注 SHAP/LIME 可解释性研究方向"

  location: "Beijing"
  languages: ["zh", "en"]

  identity:
    type: "professional"
    affiliation: "AI Research Lab"

  skills:
    - category: "AI/ML"
      items: ["SHAP", "LIME", "PyTorch", "Interpretable ML"]
    - category: "Backend"
      items: ["Python", "Flask"]
    - category: "Research"
      items: ["Causal Inference", "XAI"]

  interests: ["Explainable AI", "Regulatory Tech", "Trustworthy AI"]

  looking_for:
    roles: ["Compliance Expert", "Frontend Developer"]
    team_size: "2-3"
    collaboration_style: "async-friendly"

  experience:
    years: 4
    hackathons:
      - name: "AI Smart Risk Control Optimization Challenge 2025"
        result: "2nd Place — Explainability Track"
        project_url: ""
    projects:
      - name: "XAI Toolkit"
        url: ""
        description: "Open-source toolkit for post-hoc model explanations"

  links:
    twitter: "https://twitter.com/song_yuhan"
```

**Step 3: Verify YAML files**

Run: `python3 -c "import yaml; [yaml.safe_load(open(f)) for f in ['profiles/zhou-haoran-a1b2c3d4.yml', 'profiles/song-yuhan-e5f6g7h8.yml']]; print('OK')"`
Expected: `OK`

**Step 4: Commit**

```bash
git add profiles/zhou-haoran-a1b2c3d4.yml profiles/song-yuhan-e5f6g7h8.yml
git commit -m "feat(data): add demo profile data for two participants"
```

---

## Task 4: Install dependencies and configure Astro

**Files:**
- Modify: `site/package.json`
- Modify: `site/tsconfig.json`

**Step 1: Install YAML support for Astro Content Collections**

Astro 5 Content Collections with `glob()` loader needs no extra YAML package — Astro handles `.yml` files natively. But we need to ensure we're on Astro 5+ and install dependencies:

Run:
```bash
cd site && pnpm install
```
Expected: lockfile resolves, `node_modules/` created.

**Step 2: Verify Astro version is 5+**

Run: `cd site && pnpm exec astro --version`
Expected: Output contains `5.x.x`

**Step 3: Verify dev server starts with current config**

Run: `cd site && pnpm run build`
Expected: Build succeeds (the "Coming soon" placeholder page builds fine).

**Step 4: Commit** (only if package.json/lockfile changed)

```bash
git add site/pnpm-lock.yaml
git commit -m "chore(site): install dependencies"
```

---

## Task 5: Neon Forge design tokens in global.css

**Files:**
- Modify: `site/src/styles/global.css`

**Step 1: Write Neon Forge CSS design tokens**

Replace `site/src/styles/global.css` with full design tokens from `docs/specs/design-system.md`:

```css
@import "tailwindcss";

@theme {
  /* === Neon Forge Color Palette === */

  /* Accent Colors */
  --color-lime-primary: #BBFD3B;
  --color-yellow-neon: #F0FF31;
  --color-light-green: #8AFF80;
  --color-mint: #74FFBB;
  --color-cyan: #41FAF4;
  --color-pink: #FF74A7;
  --color-neon-blue: #4C78FF;
  --color-orange: #FB7A38;

  /* Background Colors */
  --color-surface: #181818;
  --color-near-black: #00000E;
  --color-dark-bg: #222222;
  --color-secondary-bg: #333333;

  /* Semantic Colors */
  --color-success: #00B42A;
  --color-error: #FA541C;
  --color-warning: #FAAD14;

  /* Text Colors */
  --color-muted: #8E8E8E;
  --color-light-gray: #DCDCDC;

  /* === Border Radius === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 20px;
  --radius-pill: 50px;

  /* === Font Families === */
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-code: 'Poppins', sans-serif;
  --font-zh: 'Noto Sans SC', sans-serif;
}

/* === Base Styles === */
html {
  background-color: var(--color-surface);
  color: var(--color-light-gray);
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  color: white;
}

/* Scrollbar styling for dark theme */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: var(--color-dark-bg);
}
::-webkit-scrollbar-thumb {
  background: var(--color-secondary-bg);
  border-radius: var(--radius-pill);
}

/* Selection color */
::selection {
  background-color: color-mix(in srgb, var(--color-lime-primary) 30%, transparent);
  color: white;
}
```

**Step 2: Verify Tailwind picks up the theme tokens**

Run: `cd site && pnpm run build`
Expected: Build succeeds with no CSS errors.

**Step 3: Commit**

```bash
git add site/src/styles/global.css
git commit -m "feat(site): add Neon Forge design tokens to global CSS"
```

---

## Task 6: Upgrade BaseLayout with fonts, NavBar, Footer

**Files:**
- Modify: `site/src/layouts/BaseLayout.astro`
- Create: `site/src/components/NavBar.astro`
- Create: `site/src/components/Footer.astro`

**Step 1: Create NavBar component**

Create `site/src/components/NavBar.astro`:

```astro
---
// NavBar — top navigation for Synnovator
---

<nav class="fixed top-0 left-0 right-0 z-50 bg-near-black/80 backdrop-blur-md border-b border-secondary-bg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 text-lime-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
      Synnovator
    </a>

    <!-- Navigation Links -->
    <div class="hidden md:flex items-center gap-8">
      <a href="/" class="text-light-gray hover:text-white transition-colors text-sm">活动</a>
      <a href="#" class="text-muted hover:text-white transition-colors text-sm">参赛者</a>
      <a href="#" class="text-muted hover:text-white transition-colors text-sm">指南</a>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <!-- Language switcher placeholder -->
      <button id="lang-switch" class="text-muted hover:text-white text-sm transition-colors">
        EN / 中
      </button>

      <!-- GitHub link -->
      <a
        href="https://github.com/synnovator/monorepo"
        target="_blank"
        rel="noopener noreferrer"
        class="text-muted hover:text-white transition-colors"
        aria-label="GitHub"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    </div>
  </div>
</nav>
```

**Step 2: Create Footer component**

Create `site/src/components/Footer.astro`:

```astro
---
// Footer — site footer for Synnovator
const currentYear = new Date().getFullYear();
---

<footer class="border-t border-secondary-bg bg-near-black py-12 mt-24">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col md:flex-row justify-between items-start gap-8">
      <!-- Brand -->
      <div>
        <span class="text-lime-primary font-heading font-bold text-lg">Synnovator</span>
        <p class="text-muted text-sm mt-2 max-w-xs">
          Git-native Hackathon Platform for AI Developers
        </p>
      </div>

      <!-- Links -->
      <div class="flex gap-12">
        <div>
          <h4 class="text-white text-sm font-medium mb-3">平台</h4>
          <ul class="space-y-2">
            <li><a href="/" class="text-muted hover:text-white text-sm transition-colors">活动列表</a></li>
            <li><a href="#" class="text-muted hover:text-white text-sm transition-colors">参赛者</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white text-sm font-medium mb-3">指南</h4>
          <ul class="space-y-2">
            <li><a href="#" class="text-muted hover:text-white text-sm transition-colors">参赛者指南</a></li>
            <li><a href="#" class="text-muted hover:text-white text-sm transition-colors">组织者指南</a></li>
            <li><a href="#" class="text-muted hover:text-white text-sm transition-colors">评委指南</a></li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-10 pt-6 border-t border-secondary-bg flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-muted text-xs">
        &copy; {currentYear} Synnovator. Built with GitHub + Astro + Cloudflare.
      </p>
      <a
        href="https://github.com/synnovator/monorepo"
        target="_blank"
        rel="noopener noreferrer"
        class="text-muted hover:text-white text-xs transition-colors"
      >
        GitHub Repository
      </a>
    </div>
  </div>
</footer>
```

**Step 3: Upgrade BaseLayout**

Replace `site/src/layouts/BaseLayout.astro` with Google Fonts, global CSS import, NavBar, Footer, meta tags:

```astro
---
import NavBar from '../components/NavBar.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Git-native Hackathon Platform for AI Developers' } = Astro.props;
---

<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Sans+SC:wght@400;500&family=Poppins:wght@500&family=Space+Grotesk:wght@700&display=swap"
      rel="stylesheet"
    />

    <title>{title} — Synnovator</title>
  </head>
  <body class="min-h-screen bg-surface text-light-gray">
    <NavBar />
    <main class="pt-16">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

**Step 4: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add site/src/layouts/BaseLayout.astro site/src/components/NavBar.astro site/src/components/Footer.astro
git commit -m "feat(site): add NavBar, Footer, and upgrade BaseLayout with Neon Forge theme"
```

---

## Task 7: Content Collections config (data loading layer)

**Files:**
- Create: `site/src/content.config.ts`

**Step 1: Write content collection definitions**

Astro 5 uses `src/content.config.ts` (not `src/content/config.ts`) with `glob()` loader for external directories. YAML files are natively supported.

Create `site/src/content.config.ts`:

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// === Shared sub-schemas ===

const timeRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

const rewardSchema = z.object({
  type: z.string(),
  rank: z.string().optional(),
  amount: z.string().optional(),
  description: z.string().optional(),
  count: z.number().optional(),
});

const criterionSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  weight: z.number(),
  description: z.string().optional(),
  score_range: z.array(z.number()).optional(),
  hard_constraint: z.boolean().optional(),
  constraint_rule: z.string().optional(),
});

const deliverableItemSchema = z.object({
  type: z.string(),
  format: z.string().optional(),
  description: z.string().optional(),
});

const trackSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  slug: z.string(),
  description: z.string().optional(),
  description_zh: z.string().optional(),
  rewards: z.array(rewardSchema).optional(),
  judging: z.object({
    mode: z.string(),
    vote_weight: z.number().optional(),
    criteria: z.array(criterionSchema).optional(),
  }).optional(),
  deliverables: z.object({
    required: z.array(deliverableItemSchema).optional(),
    optional: z.array(deliverableItemSchema).optional(),
  }).optional(),
});

const judgeSchema = z.object({
  github: z.string(),
  name: z.string(),
  name_zh: z.string().optional(),
  title: z.string().optional(),
  affiliation: z.string().optional(),
  expertise: z.string().optional(),
  conflict_declaration: z.string().optional(),
});

const eventSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  type: z.string(),
  datetime: z.string(),
  duration_minutes: z.number().optional(),
  url: z.string().optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  description: z.string().optional(),
});

const faqSchema = z.object({
  q: z.string(),
  q_en: z.string().optional(),
  a: z.string(),
  a_en: z.string().optional(),
});

const datasetSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  access_control: z.string().optional(),
  format: z.string().optional(),
  size: z.string().optional(),
  download_url: z.string().optional(),
});

// === Hackathon Collection ===

const hackathons = defineCollection({
  loader: glob({ pattern: '**/hackathon.yml', base: '../hackathons' }),
  schema: z.object({
    synnovator_version: z.string(),
    hackathon: z.object({
      name: z.string(),
      name_zh: z.string().optional(),
      slug: z.string(),
      tagline: z.string().optional(),
      tagline_zh: z.string().optional(),
      type: z.enum(['community', 'enterprise', 'youth-league', 'open-source']),
      description: z.string().optional(),
      description_zh: z.string().optional(),
      organizers: z.array(z.object({
        name: z.string().optional(),
        name_zh: z.string().optional(),
        github: z.string().optional(),
        logo: z.string().optional(),
        website: z.string().optional(),
        role: z.string().optional(),
      })).optional(),
      sponsors: z.array(z.object({
        name: z.string().optional(),
        name_zh: z.string().optional(),
        logo: z.string().optional(),
        tier: z.string().optional(),
      })).optional(),
      partners: z.array(z.object({
        name: z.string().optional(),
        name_zh: z.string().optional(),
        role: z.string().optional(),
      })).optional(),
      eligibility: z.object({
        open_to: z.string().optional(),
        restrictions: z.array(z.string()).optional(),
        blacklist: z.array(z.string()).optional(),
        team_size: z.object({
          min: z.number(),
          max: z.number(),
        }).optional(),
        allow_solo: z.boolean().optional(),
        mentor_rules: z.object({
          allowed: z.boolean().optional(),
          max_contribution_pct: z.number().optional(),
          count_in_team: z.boolean().optional(),
          count_in_award: z.boolean().optional(),
        }).optional(),
      }).optional(),
      legal: z.object({
        license: z.string().optional(),
        ip_ownership: z.string().optional(),
        nda: z.object({
          required: z.boolean().optional(),
          document_url: z.string().optional(),
          summary: z.string().optional(),
        }).optional(),
        compliance_notes: z.array(z.string()).optional(),
        data_policy: z.string().optional(),
      }).optional(),
      timeline: z.object({
        draft: timeRangeSchema.optional(),
        registration: timeRangeSchema.optional(),
        development: timeRangeSchema.optional(),
        submission: timeRangeSchema.optional(),
        judging: timeRangeSchema.optional(),
        announcement: timeRangeSchema.optional(),
        award: timeRangeSchema.optional(),
      }).optional(),
      events: z.array(eventSchema).optional(),
      tracks: z.array(trackSchema).optional(),
      judges: z.array(judgeSchema).optional(),
      datasets: z.array(datasetSchema).optional(),
      faq: z.array(faqSchema).optional(),
      settings: z.object({
        allow_multi_track: z.boolean().optional(),
        multi_track_rule: z.string().optional(),
        language: z.array(z.string()).optional(),
        ai_review: z.boolean().optional(),
        ai_team_matching: z.boolean().optional(),
        public_vote: z.string().optional(),
        vote_emoji: z.string().optional(),
      }).optional(),
    }),
  }),
});

// === Profile Collection ===

const profiles = defineCollection({
  loader: glob({ pattern: '*.yml', base: '../profiles' }),
  schema: z.object({
    synnovator_profile: z.string(),
    hacker: z.object({
      github: z.string(),
      name: z.string(),
      name_zh: z.string().optional(),
      avatar: z.string().optional(),
      bio: z.string().optional(),
      bio_zh: z.string().optional(),
      location: z.string().optional(),
      languages: z.array(z.string()).optional(),
      identity: z.object({
        type: z.string().optional(),
        affiliation: z.string().optional(),
        degree: z.string().optional(),
        major: z.string().optional(),
        graduation_year: z.number().optional(),
      }).optional(),
      skills: z.array(z.object({
        category: z.string(),
        items: z.array(z.string()),
      })).optional(),
      interests: z.array(z.string()).optional(),
      looking_for: z.object({
        roles: z.array(z.string()).optional(),
        team_size: z.string().optional(),
        collaboration_style: z.string().optional(),
      }).optional(),
      experience: z.object({
        years: z.number().optional(),
        hackathons: z.array(z.object({
          name: z.string(),
          result: z.string().optional(),
          project_url: z.string().optional(),
        })).optional(),
        projects: z.array(z.object({
          name: z.string(),
          url: z.string().optional(),
          description: z.string().optional(),
        })).optional(),
      }).optional(),
      links: z.object({
        twitter: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
      }).optional(),
      judge_profile: z.object({
        available: z.boolean().optional(),
        expertise: z.array(z.string()).optional(),
        conflict_declaration: z.string().optional(),
      }).optional(),
    }),
  }),
});

export const collections = { hackathons, profiles };
```

**Step 2: Verify content collections load**

Run: `cd site && pnpm run build`
Expected: Build succeeds. Astro discovers the hackathon and profile YAML files via glob loaders. If there are schema validation errors, the build output will say what field is wrong.

**Step 3: Commit**

```bash
git add site/src/content.config.ts
git commit -m "feat(site): add Astro Content Collections config for hackathons and profiles"
```

---

## Task 8: i18n utility

**Files:**
- Create: `site/src/i18n/zh.yml`
- Create: `site/src/i18n/en.yml`
- Create: `site/src/lib/i18n.ts`

**Step 1: Create zh.yml translation file**

```yaml
# site/src/i18n/zh.yml
site:
  title: "Synnovator"
  tagline: "Git-native Hackathon 平台"
nav:
  hackathons: "活动"
  hackers: "参赛者"
  guides: "指南"
home:
  title: "发现 AI Hackathon"
  subtitle: "浏览活动，注册 Profile，组队参赛"
  empty: "暂无活动，敬请期待"
  empty_cta: "想举办活动？查看组织者指南"
  filter_all: "全部"
  filter_active: "进行中"
  filter_upcoming: "即将开始"
  filter_ended: "已结束"
hackathon:
  register: "立即报名"
  submit: "提交项目"
  appeal: "提交申诉"
  nda_warning: "需签署 NDA"
  track: "赛道"
  tracks: "赛道"
  judges: "评委"
  timeline: "时间线"
  faq: "常见问题"
  events: "活动日程"
  rewards: "奖项"
  criteria: "评审标准"
  deliverables: "提交要求"
  eligibility: "参赛资格"
  legal: "合规信息"
  datasets: "数据集"
  organizers: "主办方"
  sponsors: "赞助方"
  type_community: "社区"
  type_enterprise: "企业悬赏"
  type_youth_league: "高校竞赛"
  type_open_source: "开源"
stage:
  draft: "筹备中"
  registration: "报名中"
  development: "开发中"
  submission: "提交中"
  judging: "评审中"
  announcement: "公示中"
  award: "颁奖"
  ended: "已结束"
profile:
  skills: "技能"
  interests: "兴趣方向"
  experience: "经历"
  looking_for: "组队偏好"
  projects: "项目"
  links: "链接"
  edit: "编辑 Profile"
  hackathons: "参赛记录"
common:
  back_home: "返回首页"
  not_found: "页面未找到"
  not_found_desc: "抱歉，您访问的页面不存在"
```

**Step 2: Create en.yml translation file**

```yaml
# site/src/i18n/en.yml
site:
  title: "Synnovator"
  tagline: "Git-native Hackathon Platform"
nav:
  hackathons: "Events"
  hackers: "Hackers"
  guides: "Guides"
home:
  title: "Discover AI Hackathons"
  subtitle: "Browse events, register your profile, and join a team"
  empty: "No events yet. Stay tuned!"
  empty_cta: "Want to host an event? Check the organizer guide"
  filter_all: "All"
  filter_active: "Active"
  filter_upcoming: "Upcoming"
  filter_ended: "Ended"
hackathon:
  register: "Register Now"
  submit: "Submit Project"
  appeal: "Submit Appeal"
  nda_warning: "NDA Required"
  track: "Track"
  tracks: "Tracks"
  judges: "Judges"
  timeline: "Timeline"
  faq: "FAQ"
  events: "Events"
  rewards: "Rewards"
  criteria: "Judging Criteria"
  deliverables: "Deliverables"
  eligibility: "Eligibility"
  legal: "Compliance"
  datasets: "Datasets"
  organizers: "Organizers"
  sponsors: "Sponsors"
  type_community: "Community"
  type_enterprise: "Enterprise Bounty"
  type_youth_league: "Youth League"
  type_open_source: "Open Source"
stage:
  draft: "Draft"
  registration: "Registration"
  development: "Development"
  submission: "Submission"
  judging: "Judging"
  announcement: "Announcement"
  award: "Award"
  ended: "Ended"
profile:
  skills: "Skills"
  interests: "Interests"
  experience: "Experience"
  looking_for: "Looking For"
  projects: "Projects"
  links: "Links"
  edit: "Edit Profile"
  hackathons: "Hackathon History"
common:
  back_home: "Back to Home"
  not_found: "Page Not Found"
  not_found_desc: "Sorry, the page you are looking for does not exist"
```

**Step 3: Create i18n utility**

Create `site/src/lib/i18n.ts`:

```typescript
import zhData from '../i18n/zh.yml';
import enData from '../i18n/en.yml';

export type Lang = 'zh' | 'en';

const translations: Record<Lang, Record<string, unknown>> = {
  zh: zhData as Record<string, unknown>,
  en: enData as Record<string, unknown>,
};

/**
 * Get a translated string by dot-notation key.
 * Example: t('zh', 'hackathon.register') → "立即报名"
 */
export function t(lang: Lang, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[lang];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback to zh, then return key
      let fallback: unknown = translations['zh'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as Record<string, unknown>)[fk];
        } else {
          return key;
        }
      }
      return typeof fallback === 'string' ? fallback : key;
    }
  }
  return typeof result === 'string' ? result : key;
}

/**
 * Pick localized field: returns name_zh for zh, name for en, with fallback.
 */
export function localize(lang: Lang, en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}

/**
 * Determine current stage from hackathon timeline.
 */
export function getCurrentStage(timeline: Record<string, { start: string; end: string } | undefined>): string {
  const now = new Date();
  const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'] as const;

  for (const stage of stages) {
    const range = timeline[stage];
    if (!range) continue;
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (now >= start && now <= end) return stage;
  }

  // Check if past all stages
  const lastStage = timeline['award'];
  if (lastStage && now > new Date(lastStage.end)) return 'ended';

  // Check if before all stages
  const firstStage = timeline['draft'];
  if (firstStage && now < new Date(firstStage.start)) return 'draft';

  return 'draft';
}
```

**Step 4: Add YAML import type declaration**

Astro may not recognize `.yml` imports by default. Add a type declaration. Create or update `site/src/env.d.ts`:

```typescript
/// <reference types="astro/client" />

declare module '*.yml' {
  const value: Record<string, unknown>;
  export default value;
}
```

**Step 5: Add Vite YAML plugin to astro.config.mjs**

We need `@modyfi/vite-plugin-yaml` to import YAML files as JS objects in lib code.

Run: `cd site && pnpm add -D @modyfi/vite-plugin-yaml`

Then update `site/astro.config.mjs`:

```javascript
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import yaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
  site: 'https://synnovator.github.io',
  output: 'static',
  vite: {
    plugins: [tailwindcss(), yaml()],
  },
});
```

**Step 6: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

**Step 7: Commit**

```bash
git add site/src/i18n/ site/src/lib/i18n.ts site/src/env.d.ts site/astro.config.mjs site/package.json site/pnpm-lock.yaml
git commit -m "feat(site): add i18n system with zh/en translations and utility functions"
```

---

## Task 9: Home page with hackathon card list

**Files:**
- Modify: `site/src/pages/index.astro`
- Create: `site/src/components/HackathonCard.astro`

**Step 1: Create HackathonCard component**

Create `site/src/components/HackathonCard.astro`:

```astro
---
import { getCurrentStage, t, localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  hackathon: {
    name: string;
    name_zh?: string;
    slug: string;
    tagline?: string;
    tagline_zh?: string;
    type: string;
    timeline?: Record<string, { start: string; end: string }>;
  };
  lang: Lang;
}

const { hackathon, lang } = Astro.props;
const stage = hackathon.timeline ? getCurrentStage(hackathon.timeline) : 'draft';
const typeKey = `hackathon.type_${hackathon.type.replace('-', '_')}`;

const stageColors: Record<string, string> = {
  draft: 'bg-muted/20 text-muted',
  registration: 'bg-lime-primary/20 text-lime-primary',
  development: 'bg-cyan/20 text-cyan',
  submission: 'bg-orange/20 text-orange',
  judging: 'bg-neon-blue/20 text-neon-blue',
  announcement: 'bg-pink/20 text-pink',
  award: 'bg-mint/20 text-mint',
  ended: 'bg-muted/20 text-muted',
};
---

<a
  href={`/hackathons/${hackathon.slug}/`}
  class="block group rounded-lg border border-secondary-bg bg-dark-bg hover:border-lime-primary/40 transition-all duration-200 p-6"
>
  <!-- Type + Stage badges -->
  <div class="flex items-center gap-2 mb-3">
    <span class="text-xs px-2 py-0.5 rounded-full bg-secondary-bg text-muted">
      {t(lang, typeKey)}
    </span>
    <span class={`text-xs px-2 py-0.5 rounded-full ${stageColors[stage] || stageColors.draft}`}>
      {t(lang, `stage.${stage}`)}
    </span>
  </div>

  <!-- Title -->
  <h3 class="text-white font-heading font-bold text-lg mb-2 group-hover:text-lime-primary transition-colors">
    {localize(lang, hackathon.name, hackathon.name_zh)}
  </h3>

  <!-- Tagline -->
  {hackathon.tagline && (
    <p class="text-muted text-sm line-clamp-2">
      {localize(lang, hackathon.tagline, hackathon.tagline_zh)}
    </p>
  )}

  <!-- Timeline hint -->
  {hackathon.timeline?.registration && (
    <div class="mt-4 text-xs text-muted">
      {t(lang, 'stage.registration')}: {new Date(hackathon.timeline.registration.start).toLocaleDateString()} — {new Date(hackathon.timeline.registration.end).toLocaleDateString()}
    </div>
  )}
</a>
```

**Step 2: Rewrite index.astro**

Replace `site/src/pages/index.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import HackathonCard from '../components/HackathonCard.astro';
import { getCollection } from 'astro:content';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

const lang: Lang = 'zh'; // Default language; will be dynamic later

const allHackathons = await getCollection('hackathons');

// Sort by registration start date (newest first), with fallback
const hackathons = allHackathons.sort((a, b) => {
  const aStart = a.data.hackathon.timeline?.registration?.start || '';
  const bStart = b.data.hackathon.timeline?.registration?.start || '';
  return bStart.localeCompare(aStart);
});
---

<BaseLayout title={t(lang, 'home.title')}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- Hero -->
    <div class="mb-12">
      <h1 class="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
        {t(lang, 'home.title')}
      </h1>
      <p class="text-lg text-muted max-w-2xl">
        {t(lang, 'home.subtitle')}
      </p>
    </div>

    <!-- Hackathon list -->
    {hackathons.length > 0 ? (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hackathons.map(entry => (
          <HackathonCard hackathon={entry.data.hackathon} lang={lang} />
        ))}
      </div>
    ) : (
      <div class="text-center py-24">
        <p class="text-muted text-lg mb-4">{t(lang, 'home.empty')}</p>
        <a href="#" class="text-lime-primary hover:underline">
          {t(lang, 'home.empty_cta')}
        </a>
      </div>
    )}
  </div>
</BaseLayout>
```

**Step 3: Verify build and check output**

Run: `cd site && pnpm run build`
Expected: Build succeeds. Home page renders with the enterprise-fintech-risk-2025 hackathon card.

**Step 4: Commit**

```bash
git add site/src/pages/index.astro site/src/components/HackathonCard.astro
git commit -m "feat(site): add home page with hackathon card listing"
```

---

## Task 10: Hackathon detail page

**Files:**
- Create: `site/src/pages/hackathons/[...slug].astro`
- Create: `site/src/components/Timeline.astro`
- Create: `site/src/components/TrackSection.astro`
- Create: `site/src/components/JudgeCard.astro`
- Create: `site/src/components/FAQAccordion.astro`
- Create: `site/src/components/EventCalendar.astro`
- Create: `site/src/components/GitHubRedirect.astro`

This is a large task. The implementer should create each component one at a time and test the build after adding each. All components are pure Astro (no client JS framework needed except for FAQ accordion toggle and GitHubRedirect URL generation).

**Step 1: Create Timeline component**

Create `site/src/components/Timeline.astro` — a horizontal/vertical 7-stage timeline with the current stage highlighted:

```astro
---
import { t, getCurrentStage } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  timeline: Record<string, { start: string; end: string } | undefined>;
  lang: Lang;
}

const { timeline, lang } = Astro.props;
const currentStage = getCurrentStage(timeline);
const stages = ['draft', 'registration', 'development', 'submission', 'judging', 'announcement', 'award'] as const;

function isPast(stage: string): boolean {
  const idx = stages.indexOf(stage as typeof stages[number]);
  const currentIdx = stages.indexOf(currentStage as typeof stages[number]);
  if (currentStage === 'ended') return true;
  return idx < currentIdx;
}
---

<div class="flex flex-col gap-1">
  {stages.map((stage) => {
    const range = timeline[stage];
    const isCurrent = stage === currentStage;
    const past = isPast(stage);
    return (
      <div class={`flex items-center gap-3 py-2 px-3 rounded-md ${isCurrent ? 'bg-lime-primary/10 border border-lime-primary/30' : ''}`}>
        {/* Dot */}
        <div class={`w-3 h-3 rounded-full shrink-0 ${isCurrent ? 'bg-lime-primary' : past ? 'bg-muted' : 'bg-secondary-bg border border-muted'}`} />

        {/* Label */}
        <div class="flex-1 min-w-0">
          <span class={`text-sm font-medium ${isCurrent ? 'text-lime-primary' : past ? 'text-muted' : 'text-light-gray'}`}>
            {t(lang, `stage.${stage}`)}
          </span>
        </div>

        {/* Date range */}
        {range && (
          <span class="text-xs text-muted shrink-0">
            {new Date(range.start).toLocaleDateString()} — {new Date(range.end).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  })}
</div>
```

**Step 2: Create TrackSection component**

Create `site/src/components/TrackSection.astro`:

```astro
---
import { t, localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  track: {
    name: string;
    name_zh?: string;
    slug: string;
    description?: string;
    description_zh?: string;
    rewards?: Array<{ type: string; rank?: string; amount?: string; description?: string; count?: number }>;
    judging?: { mode: string; criteria?: Array<{ name: string; name_zh?: string; weight: number; description?: string; hard_constraint?: boolean; constraint_rule?: string }> };
    deliverables?: { required?: Array<{ type: string; description?: string }>; optional?: Array<{ type: string; description?: string }> };
  };
  lang: Lang;
}

const { track, lang } = Astro.props;
---

<div class="rounded-lg border border-secondary-bg bg-dark-bg p-6">
  <h3 class="text-xl font-heading font-bold text-white mb-2">
    {localize(lang, track.name, track.name_zh)}
  </h3>
  {track.description && (
    <p class="text-muted text-sm mb-6">
      {localize(lang, track.description, track.description_zh)}
    </p>
  )}

  {/* Rewards */}
  {track.rewards && track.rewards.length > 0 && (
    <div class="mb-6">
      <h4 class="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.rewards')}</h4>
      <div class="space-y-2">
        {track.rewards.map(r => (
          <div class="flex items-center gap-3 text-sm">
            {r.rank && <span class="text-lime-primary font-code font-medium w-12">{r.rank}</span>}
            {r.amount && <span class="text-white">{r.amount}</span>}
            {r.description && <span class="text-muted">{r.description}</span>}
            {r.count && r.count > 1 && <span class="text-muted">x{r.count}</span>}
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Judging Criteria */}
  {track.judging?.criteria && track.judging.criteria.length > 0 && (
    <div class="mb-6">
      <h4 class="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.criteria')}</h4>
      <div class="space-y-2">
        {track.judging.criteria.map(c => (
          <div class="flex items-start gap-3 text-sm">
            <span class="text-lime-primary font-code font-medium w-10 shrink-0">{c.weight}%</span>
            <div>
              <span class="text-white">{localize(lang, c.name, c.name_zh)}</span>
              {c.description && <p class="text-muted text-xs mt-0.5">{c.description}</p>}
              {c.hard_constraint && (
                <span class="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-error/20 text-error">
                  {c.constraint_rule || 'Hard constraint'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Deliverables */}
  {track.deliverables && (
    <div>
      <h4 class="text-sm font-medium text-light-gray mb-3">{t(lang, 'hackathon.deliverables')}</h4>
      {track.deliverables.required && (
        <ul class="space-y-1 mb-2">
          {track.deliverables.required.map(d => (
            <li class="text-sm text-white flex items-start gap-2">
              <span class="text-lime-primary mt-0.5">*</span>
              <span>{d.description || d.type}</span>
            </li>
          ))}
        </ul>
      )}
      {track.deliverables.optional && (
        <ul class="space-y-1">
          {track.deliverables.optional.map(d => (
            <li class="text-sm text-muted flex items-start gap-2">
              <span class="mt-0.5">-</span>
              <span>{d.description || d.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>
```

**Step 3: Create JudgeCard component**

Create `site/src/components/JudgeCard.astro`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  judge: {
    github: string;
    name: string;
    name_zh?: string;
    title?: string;
    affiliation?: string;
    expertise?: string;
  };
  lang: Lang;
}

const { judge, lang } = Astro.props;
---

<div class="flex items-start gap-4 p-4 rounded-lg border border-secondary-bg bg-dark-bg">
  <img
    src={`https://github.com/${judge.github}.png`}
    alt={localize(lang, judge.name, judge.name_zh)}
    class="w-12 h-12 rounded-full bg-secondary-bg"
    loading="lazy"
  />
  <div>
    <p class="text-white font-medium text-sm">
      {localize(lang, judge.name, judge.name_zh)}
    </p>
    {judge.title && <p class="text-muted text-xs">{judge.title}</p>}
    {judge.affiliation && <p class="text-muted text-xs">{judge.affiliation}</p>}
    {judge.expertise && (
      <p class="text-cyan text-xs mt-1">{judge.expertise}</p>
    )}
  </div>
</div>
```

**Step 4: Create FAQAccordion component**

Create `site/src/components/FAQAccordion.astro`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  items: Array<{ q: string; q_en?: string; a: string; a_en?: string }>;
  lang: Lang;
}

const { items, lang } = Astro.props;
---

<div class="space-y-2">
  {items.map((item, i) => (
    <details class="group rounded-lg border border-secondary-bg bg-dark-bg">
      <summary class="cursor-pointer px-4 py-3 text-sm text-white font-medium flex items-center justify-between hover:text-lime-primary transition-colors">
        <span>{localize(lang, item.q_en, item.q)}</span>
        <svg class="w-4 h-4 text-muted group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div class="px-4 pb-4 text-sm text-muted">
        {localize(lang, item.a_en, item.a)}
      </div>
    </details>
  ))}
</div>
```

**Step 5: Create EventCalendar component**

Create `site/src/components/EventCalendar.astro`:

```astro
---
import { localize } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

interface Props {
  events: Array<{
    name: string;
    name_zh?: string;
    type: string;
    datetime: string;
    duration_minutes?: number;
    url?: string;
    location?: string;
    description?: string;
  }>;
  lang: Lang;
}

const { events, lang } = Astro.props;

const typeColors: Record<string, string> = {
  ama: 'bg-cyan/20 text-cyan',
  livestream: 'bg-pink/20 text-pink',
  workshop: 'bg-neon-blue/20 text-neon-blue',
  meetup: 'bg-mint/20 text-mint',
  deadline: 'bg-error/20 text-error',
};
---

<div class="space-y-3">
  {events.map(event => (
    <div class="flex items-start gap-4 p-4 rounded-lg border border-secondary-bg bg-dark-bg">
      <div class="text-center shrink-0 w-14">
        <div class="text-xs text-muted">{new Date(event.datetime).toLocaleDateString(undefined, { month: 'short' })}</div>
        <div class="text-xl font-code font-medium text-white">{new Date(event.datetime).getDate()}</div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class={`text-xs px-2 py-0.5 rounded-full ${typeColors[event.type] || 'bg-secondary-bg text-muted'}`}>
            {event.type.toUpperCase()}
          </span>
          {event.duration_minutes && (
            <span class="text-xs text-muted">{event.duration_minutes} min</span>
          )}
        </div>
        <p class="text-white text-sm font-medium">
          {localize(lang, event.name, event.name_zh)}
        </p>
        {event.description && <p class="text-muted text-xs mt-1">{event.description}</p>}
        {event.location && <p class="text-muted text-xs mt-1">{event.location}</p>}
      </div>
    </div>
  ))}
</div>
```

**Step 6: Create GitHubRedirect component**

Create `site/src/components/GitHubRedirect.astro`:

```astro
---
interface Props {
  action: 'register' | 'submit' | 'appeal' | 'create-profile' | 'edit-file';
  hackathonSlug?: string;
  label: string;
  class?: string;
}

const { action, hackathonSlug, label, class: className } = Astro.props;

// GitHub repo info — will be configurable later
const GITHUB_ORG = 'synnovator';
const GITHUB_REPO = 'monorepo';
const baseUrl = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

function buildUrl(): string {
  switch (action) {
    case 'register':
      return `${baseUrl}/issues/new?template=register.yml&title=${encodeURIComponent(`[Register] — ${hackathonSlug}`)}&labels=${encodeURIComponent(`register,hackathon:${hackathonSlug}`)}`;
    case 'submit':
      return `${baseUrl}/issues/new?title=${encodeURIComponent(`[Submit] — ${hackathonSlug}`)}&labels=${encodeURIComponent(`submission,hackathon:${hackathonSlug}`)}`;
    case 'appeal':
      return `${baseUrl}/issues/new?template=appeal.yml&title=${encodeURIComponent(`[Appeal] — ${hackathonSlug}`)}&labels=${encodeURIComponent(`appeal,hackathon:${hackathonSlug}`)}`;
    case 'create-profile':
      return `${baseUrl}/new/main?filename=profiles/your-username.yml&value=${encodeURIComponent('synnovator_profile: "2.0"\n\nhacker:\n  github: ""\n  name: ""\n')}`;
    case 'edit-file':
      return baseUrl;
    default:
      return baseUrl;
  }
}

const url = buildUrl();
---

<a
  href={url}
  target="_blank"
  rel="noopener noreferrer"
  class:list={[
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200',
    className,
  ]}
>
  {label}
  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
</a>
```

**Step 7: Create hackathon detail page**

Create `site/src/pages/hackathons/[...slug].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Timeline from '../../components/Timeline.astro';
import TrackSection from '../../components/TrackSection.astro';
import JudgeCard from '../../components/JudgeCard.astro';
import FAQAccordion from '../../components/FAQAccordion.astro';
import EventCalendar from '../../components/EventCalendar.astro';
import GitHubRedirect from '../../components/GitHubRedirect.astro';
import { getCollection } from 'astro:content';
import { t, localize, getCurrentStage } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';

export async function getStaticPaths() {
  const hackathons = await getCollection('hackathons');
  return hackathons.map(entry => ({
    params: { slug: entry.data.hackathon.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const h = entry.data.hackathon;
const lang: Lang = 'zh';
const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';
---

<BaseLayout title={localize(lang, h.name, h.name_zh)} description={localize(lang, h.tagline, h.tagline_zh)}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

    {/* --- Hero --- */}
    <div class="mb-12">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-xs px-3 py-1 rounded-full bg-secondary-bg text-muted">
          {t(lang, `hackathon.type_${h.type.replace('-', '_')}`)}
        </span>
        <span class="text-xs px-3 py-1 rounded-full bg-lime-primary/20 text-lime-primary">
          {t(lang, `stage.${stage}`)}
        </span>
      </div>

      <h1 class="text-3xl md:text-4xl font-heading font-bold text-white mb-3">
        {localize(lang, h.name, h.name_zh)}
      </h1>

      <p class="text-lg text-muted max-w-3xl mb-6">
        {localize(lang, h.tagline, h.tagline_zh)}
      </p>

      {/* Action buttons */}
      <div class="flex flex-wrap gap-3">
        {(stage === 'registration') && (
          <GitHubRedirect
            action="register"
            hackathonSlug={h.slug}
            label={t(lang, 'hackathon.register')}
            class="bg-lime-primary text-near-black hover:bg-lime-primary/80"
          />
        )}
        {(stage === 'submission') && (
          <GitHubRedirect
            action="submit"
            hackathonSlug={h.slug}
            label={t(lang, 'hackathon.submit')}
            class="bg-lime-primary text-near-black hover:bg-lime-primary/80"
          />
        )}
        {(stage === 'announcement') && (
          <GitHubRedirect
            action="appeal"
            hackathonSlug={h.slug}
            label={t(lang, 'hackathon.appeal')}
            class="bg-secondary-bg text-white hover:bg-secondary-bg/80"
          />
        )}
        {h.legal?.nda?.required && (
          <span class="inline-flex items-center text-xs text-warning px-3 py-2 rounded-lg bg-warning/10">
            {t(lang, 'hackathon.nda_warning')}
          </span>
        )}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* --- Main content (2/3) --- */}
      <div class="lg:col-span-2 space-y-12">

        {/* Description */}
        <section>
          <div class="prose prose-invert prose-sm max-w-none text-light-gray">
            <p>{localize(lang, h.description, h.description_zh)}</p>
          </div>
        </section>

        {/* Organizers */}
        {h.organizers && h.organizers.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.organizers')}</h2>
            <div class="flex flex-wrap gap-4">
              {h.organizers.map(org => (
                <div class="flex items-center gap-3 px-4 py-3 rounded-lg border border-secondary-bg bg-dark-bg">
                  <div>
                    <p class="text-white text-sm font-medium">{localize(lang, org.name, org.name_zh)}</p>
                    {org.role && <p class="text-muted text-xs">{org.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tracks */}
        {h.tracks && h.tracks.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.tracks')}</h2>
            <div class="space-y-6">
              {h.tracks.map(track => (
                <TrackSection track={track} lang={lang} />
              ))}
            </div>
          </section>
        )}

        {/* Eligibility */}
        {h.eligibility && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.eligibility')}</h2>
            <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6 space-y-3">
              {h.eligibility.team_size && (
                <p class="text-sm text-light-gray">
                  Team size: {h.eligibility.team_size.min}–{h.eligibility.team_size.max}
                  {h.eligibility.allow_solo && ' (solo allowed)'}
                </p>
              )}
              {h.eligibility.restrictions && h.eligibility.restrictions.map(r => (
                <p class="text-sm text-muted">{r}</p>
              ))}
              {h.eligibility.blacklist && h.eligibility.blacklist.map(b => (
                <p class="text-sm text-error">{b}</p>
              ))}
            </div>
          </section>
        )}

        {/* Datasets */}
        {h.datasets && h.datasets.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.datasets')}</h2>
            {h.datasets.map(ds => (
              <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6">
                <p class="text-white font-medium text-sm">{localize(lang, ds.name, ds.name_zh)}</p>
                {ds.description && <p class="text-muted text-sm mt-1">{ds.description}</p>}
                <div class="flex gap-4 mt-3 text-xs text-muted">
                  {ds.format && <span>Format: {ds.format}</span>}
                  {ds.size && <span>Size: {ds.size}</span>}
                  {ds.access_control && <span class="text-warning">Access: {ds.access_control}</span>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Legal / Compliance */}
        {h.legal && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.legal')}</h2>
            <div class="rounded-lg border border-secondary-bg bg-dark-bg p-6 space-y-3">
              {h.legal.license && <p class="text-sm text-light-gray">License: {h.legal.license}</p>}
              {h.legal.ip_ownership && <p class="text-sm text-light-gray">IP: {h.legal.ip_ownership}</p>}
              {h.legal.compliance_notes && h.legal.compliance_notes.map(note => (
                <p class="text-sm text-muted">{note}</p>
              ))}
              {h.legal.data_policy && <p class="text-sm text-muted">{h.legal.data_policy}</p>}
            </div>
          </section>
        )}

        {/* FAQ */}
        {h.faq && h.faq.length > 0 && (
          <section>
            <h2 class="text-xl font-heading font-bold text-white mb-4">{t(lang, 'hackathon.faq')}</h2>
            <FAQAccordion items={h.faq} lang={lang} />
          </section>
        )}
      </div>

      {/* --- Sidebar (1/3) --- */}
      <aside class="space-y-8">

        {/* Timeline */}
        {h.timeline && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.timeline')}</h2>
            <Timeline timeline={h.timeline} lang={lang} />
          </section>
        )}

        {/* Events */}
        {h.events && h.events.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.events')}</h2>
            <EventCalendar events={h.events} lang={lang} />
          </section>
        )}

        {/* Judges */}
        {h.judges && h.judges.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'hackathon.judges')}</h2>
            <div class="space-y-3">
              {h.judges.map(judge => (
                <JudgeCard judge={judge} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  </div>
</BaseLayout>
```

**Step 8: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds. `/hackathons/enterprise-fintech-risk-2025/index.html` is generated.

**Step 9: Commit**

```bash
git add site/src/pages/hackathons/ site/src/components/Timeline.astro site/src/components/TrackSection.astro site/src/components/JudgeCard.astro site/src/components/FAQAccordion.astro site/src/components/EventCalendar.astro site/src/components/GitHubRedirect.astro
git commit -m "feat(site): add hackathon detail page with all sections and components"
```

---

## Task 11: Profile page

**Files:**
- Create: `site/src/pages/hackers/[...id].astro`
- Create: `site/src/components/SkillBadge.astro`

**Step 1: Create SkillBadge component**

Create `site/src/components/SkillBadge.astro`:

```astro
---
interface Props {
  label: string;
}
const { label } = Astro.props;
---

<span class="inline-block text-xs px-2.5 py-1 rounded-full border border-secondary-bg bg-dark-bg text-light-gray hover:border-lime-primary/40 transition-colors">
  {label}
</span>
```

**Step 2: Create profile page**

Create `site/src/pages/hackers/[...id].astro`:

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import SkillBadge from '../../components/SkillBadge.astro';
import { getCollection } from 'astro:content';
import { t, localize } from '../../lib/i18n';
import type { Lang } from '../../lib/i18n';

export async function getStaticPaths() {
  const profiles = await getCollection('profiles');
  return profiles.map(entry => ({
    // entry.id will be the filename without extension, e.g. "zhou-haoran-a1b2c3d4"
    params: { id: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const h = entry.data.hacker;
const lang: Lang = 'zh';
---

<BaseLayout title={localize(lang, h.name, h.name_zh)} description={localize(lang, h.bio, h.bio_zh)}>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

    {/* Header */}
    <div class="flex items-start gap-6 mb-10">
      <img
        src={h.avatar || `https://github.com/${h.github}.png`}
        alt={localize(lang, h.name, h.name_zh)}
        class="w-24 h-24 rounded-full bg-secondary-bg"
        loading="lazy"
      />
      <div>
        <h1 class="text-2xl font-heading font-bold text-white">
          {localize(lang, h.name, h.name_zh)}
        </h1>
        <p class="text-muted text-sm mt-1">@{h.github}</p>
        {h.location && <p class="text-muted text-sm mt-1">{h.location}</p>}
        <p class="text-light-gray text-sm mt-3 max-w-xl">
          {localize(lang, h.bio, h.bio_zh)}
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Main */}
      <div class="md:col-span-2 space-y-10">

        {/* Skills */}
        {h.skills && h.skills.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.skills')}</h2>
            {h.skills.map(group => (
              <div class="mb-4">
                <h3 class="text-xs text-muted mb-2">{group.category}</h3>
                <div class="flex flex-wrap gap-2">
                  {group.items.map(skill => (
                    <SkillBadge label={skill} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Interests */}
        {h.interests && h.interests.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.interests')}</h2>
            <div class="flex flex-wrap gap-2">
              {h.interests.map(interest => (
                <SkillBadge label={interest} />
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {h.experience?.projects && h.experience.projects.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.projects')}</h2>
            <div class="space-y-3">
              {h.experience.projects.map(proj => (
                <div class="rounded-lg border border-secondary-bg bg-dark-bg p-4">
                  <p class="text-white text-sm font-medium">{proj.name}</p>
                  {proj.description && <p class="text-muted text-xs mt-1">{proj.description}</p>}
                  {proj.url && (
                    <a href={proj.url} target="_blank" class="text-lime-primary text-xs mt-2 inline-block hover:underline">
                      View project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Hackathon History */}
        {h.experience?.hackathons && h.experience.hackathons.length > 0 && (
          <section>
            <h2 class="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.hackathons')}</h2>
            <div class="space-y-3">
              {h.experience.hackathons.map(hack => (
                <div class="rounded-lg border border-secondary-bg bg-dark-bg p-4">
                  <p class="text-white text-sm font-medium">{hack.name}</p>
                  {hack.result && <p class="text-lime-primary text-xs mt-1">{hack.result}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <aside class="space-y-8">

        {/* Looking for */}
        {h.looking_for && (
          <section>
            <h2 class="text-sm font-heading font-bold text-white mb-3">{t(lang, 'profile.looking_for')}</h2>
            <div class="rounded-lg border border-secondary-bg bg-dark-bg p-4 space-y-2">
              {h.looking_for.roles && (
                <div>
                  <p class="text-xs text-muted">Seeking:</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {h.looking_for.roles.map(r => (
                      <span class="text-xs px-2 py-0.5 rounded-full bg-cyan/10 text-cyan">{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {h.looking_for.team_size && (
                <p class="text-xs text-muted">Team size: {h.looking_for.team_size}</p>
              )}
              {h.looking_for.collaboration_style && (
                <p class="text-xs text-muted">Style: {h.looking_for.collaboration_style}</p>
              )}
            </div>
          </section>
        )}

        {/* Identity */}
        {h.identity && (
          <section>
            <h2 class="text-sm font-heading font-bold text-white mb-3">Identity</h2>
            <div class="rounded-lg border border-secondary-bg bg-dark-bg p-4 space-y-1">
              {h.identity.type && <p class="text-xs text-light-gray capitalize">{h.identity.type}</p>}
              {h.identity.affiliation && <p class="text-xs text-muted">{h.identity.affiliation}</p>}
            </div>
          </section>
        )}

        {/* Links */}
        {h.links && (
          <section>
            <h2 class="text-sm font-heading font-bold text-white mb-3">{t(lang, 'profile.links')}</h2>
            <div class="space-y-2">
              {h.links.twitter && (
                <a href={h.links.twitter} target="_blank" class="block text-xs text-muted hover:text-white transition-colors">Twitter</a>
              )}
              {h.links.linkedin && (
                <a href={h.links.linkedin} target="_blank" class="block text-xs text-muted hover:text-white transition-colors">LinkedIn</a>
              )}
              {h.links.website && (
                <a href={h.links.website} target="_blank" class="block text-xs text-muted hover:text-white transition-colors">Website</a>
              )}
            </div>
          </section>
        )}

        {/* Edit profile link */}
        <a
          href={`https://github.com/synnovator/monorepo/edit/main/profiles/${entry.id}.yml`}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-xs text-muted hover:text-lime-primary transition-colors"
        >
          {t(lang, 'profile.edit')}
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </aside>
    </div>
  </div>
</BaseLayout>
```

**Step 3: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds. `/hackers/zhou-haoran-a1b2c3d4/index.html` and `/hackers/song-yuhan-e5f6g7h8/index.html` are generated.

**Step 4: Commit**

```bash
git add site/src/pages/hackers/ site/src/components/SkillBadge.astro
git commit -m "feat(site): add hacker profile page with skills, experience, and sidebar"
```

---

## Task 12: 404 page

**Files:**
- Create: `site/src/pages/404.astro`

**Step 1: Create 404 page**

Create `site/src/pages/404.astro`:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { t } from '../lib/i18n';
import type { Lang } from '../lib/i18n';

const lang: Lang = 'zh';
---

<BaseLayout title={t(lang, 'common.not_found')}>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
    <h1 class="text-6xl font-heading font-bold text-lime-primary mb-4">404</h1>
    <p class="text-xl text-white mb-2">{t(lang, 'common.not_found')}</p>
    <p class="text-muted mb-8">{t(lang, 'common.not_found_desc')}</p>
    <a
      href="/"
      class="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary-bg text-white hover:bg-secondary-bg/80 transition-colors"
    >
      {t(lang, 'common.back_home')}
    </a>
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `cd site && pnpm run build`
Expected: Build succeeds. `/404.html` is generated.

**Step 3: Commit**

```bash
git add site/src/pages/404.astro
git commit -m "feat(site): add 404 page with Neon Forge theme"
```

---

## Task 13: Final build verification and dev server test

**Files:** None new.

**Step 1: Full build**

Run: `cd site && pnpm run build`
Expected: Build succeeds with no errors. Output shows generated pages:
- `/index.html`
- `/hackathons/enterprise-fintech-risk-2025/index.html`
- `/hackers/zhou-haoran-a1b2c3d4/index.html`
- `/hackers/song-yuhan-e5f6g7h8/index.html`
- `/404.html`

**Step 2: Preview the built site**

Run: `cd site && pnpm run preview`
Expected: Site serves at `localhost:4321`. Open browser, verify:
1. Home page shows hackathon card
2. Click card → hackathon detail with timeline, tracks, judges, FAQ
3. Navigate to a profile page
4. 404 page works for non-existent routes

**Step 3: Check for TypeScript errors**

Run: `cd site && pnpm exec astro check`
Expected: No errors (warnings are OK).

**Step 4: Commit any final adjustments**

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix(site): resolve build issues from final verification"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Demo hackathon YAML | `hackathons/enterprise-fintech-risk-2025/hackathon.yml` |
| 2 | Demo submission YAML | `submissions/team-*/project.yml` |
| 3 | Demo profile YAML | `profiles/*.yml` |
| 4 | Install deps + verify Astro | `site/package.json` |
| 5 | Neon Forge CSS tokens | `site/src/styles/global.css` |
| 6 | BaseLayout + NavBar + Footer | `site/src/layouts/`, `site/src/components/` |
| 7 | Content Collections config | `site/src/content.config.ts` |
| 8 | i18n utility | `site/src/lib/i18n.ts`, `site/src/i18n/*.yml` |
| 9 | Home page | `site/src/pages/index.astro`, `HackathonCard.astro` |
| 10 | Hackathon detail page | `site/src/pages/hackathons/`, 6 components |
| 11 | Profile page | `site/src/pages/hackers/`, `SkillBadge.astro` |
| 12 | 404 page | `site/src/pages/404.astro` |
| 13 | Final verification | Build + preview + check |
