# 评委验收规范 — judge.spec.md

> **角色**: Judge（投资人/技术专家/监管顾问）
> **核心需求**: 评审项目、结构化打分、提供反馈、声明利益冲突

---

## US-J-001: 查看待评分项目列表 [P0]

> **前置条件**: 用户在 hackathon.yml 的 `judges` 列表中
> **涉及层**: hackathons/{slug}/submissions/ → Site 评委视图

### SC-J-001.1: 评委视图展示待评项目

- **Given** 评委的 GitHub 用户名在 hackathon.yml 的 `judges[].github` 中
- **And** 活动处于 `judging` 阶段
- **When** 评委访问活动详情页
- **Then** 页面展示「评委面板」区域，列出所有已提交的项目
- **And** 每个项目显示：团队名称、项目名称、Track、提交时间
- **And** 每个项目旁有「评分」按钮

### SC-J-001.2: 非 judging 阶段的评委提示

- **Given** 评委访问活动详情页
- **And** 活动不处于 `judging` 阶段
- **When** 页面加载
- **Then** 评委面板显示："评审期尚未开始，将于 {judging.start} 开放评分"
- **Or** 显示："评审期已结束（{judging.start} — {judging.end}）"

---

## US-J-002: 提交评分 [P0]

> **前置条件**: 活动处于 judging 阶段，评委已被列入 judges 列表
> **涉及层**: Site ScoreCard 组件 → GitHubRedirect → Issue `judge-score.yml` → Actions 校验

### SC-J-002.1: ScoreCard 组件评分交互

- **Given** 评委点击某项目的「评分」按钮
- **When** ScoreCard 组件加载
- **Then** 组件展示该 Track 的所有评审维度（来自 hackathon.yml 的 `judging.criteria`）
- **And** 每个维度显示：名称（name_zh）、权重（weight%）、分值范围（score_range）、描述
- **And** 评委可逐维度输入分数和评语
- **And** 组件底部有「总体评语」文本框

### SC-J-002.2: 评分 Issue 提交

- **Given** 评委在 ScoreCard 中填写完所有评分
- **When** 评委点击「提交评分」
- **Then** ScoreCard 组件将评分内容序列化为 YAML 格式
- **And** GitHubRedirect 生成预填 Issue URL：
  - template: `judge-score.yml`
  - title: `[Score] {team-name} — {hackathon-slug} / {track}`
  - labels: `judge-score`, `hackathon:{slug}`, `track:{track-slug}`
  - body: 包含结构化评分 YAML
- **And** 浏览器跳转到 GitHub Issue 创建页

### SC-J-002.3: 评分格式校验

- **Given** 评委提交了评分 Issue
- **When** Actions `validate-score` workflow 被触发
- **Then** Actions 校验：
  - 每个 criterion 的分数在 `score_range` 范围内
  - 所有必填 criterion 均已评分
  - 评委 GitHub 用户名在 `judges` 列表中
  - 同一评委对同一团队未重复评分
- **And** 校验通过 → Issue 获得 `score-valid` Label
- **Or** 校验失败 → Bot 评论具体错误（如 "❌ Innovation 分数 120 超出范围 [0, 100]"）

---

## US-J-003: 声明利益冲突 [P1]

> **前置条件**: 评委已有 Profile 且包含 `judge_profile` 字段
> **涉及层**: Profile YAML → 评分 Issue → Actions 检查

### SC-J-003.1: 评分时利益冲突确认

- **Given** 评委提交评分 Issue
- **And** Issue Template 中包含利益冲突声明 checkbox："我确认与该团队无利益冲突关系"
- **When** Actions 处理评分 Issue
- **Then** Actions 检查 checkbox 是否已勾选
- **And** 如果未勾选 → Bot 评论 "❌ 请确认利益冲突声明" + Issue 获得 `blocked:conflict` Label

### SC-J-003.2: Profile 中的利益冲突声明

- **Given** 评委 Profile 中 `judge_profile.conflict_declaration` 字段非空（R2 PDF URL）
- **When** 活动详情页展示评委列表
- **Then** 该评委信息旁标注 "已提交利益冲突声明"
- **And** 声明文档链接可点击查看

---

## US-J-004: 结构化评分（加权计算）[P1]

> **前置条件**: 所有评委已提交评分，活动进入计算阶段
> **涉及层**: 评分 Issue 数据 → Actions 加权计算 → 结果写入

### SC-J-004.1: 加权分数计算

- **Given** 某项目收到多位评委的评分（多个 `score-valid` Issue）
- **When** Actions 执行评分汇总
- **Then** 按以下规则计算：
  - 每个 criterion 的分数 × weight 得到加权分
  - 所有 criterion 加权分求和 = 该评委总分
  - 多位评委总分取平均 = 项目专家得分
- **And** 如果 `judging.mode = "expert_plus_vote"` → 专家得分 × (100 - vote_weight)% + 投票得分 × vote_weight%

### SC-J-004.2: hard_constraint 检查

- **Given** 某评审维度设置了 `hard_constraint = true` 和 `constraint_rule`
- **And** 评委对该维度的评分触发了约束条件
- **When** Actions 执行评分计算
- **Then** 该维度分数强制设为 0
- **And** 计算结果中标注 "⚠️ {criterion_name} 触发硬约束：{constraint_rule}"

### SC-J-004.3: 评分结果写入

- **Given** 所有评委评分已提交且计算完成
- **When** Actions 执行结果写入
- **Then** 评分结果写入活动数据（如 `hackathons/{slug}/results/{track-slug}.json`）
- **And** 结果包含：各项目排名、各维度得分明细、评委评语汇总

---

## US-J-005: 查看评分结果汇总 [P1]

> **前置条件**: 评分计算已完成
> **涉及层**: 结果数据 → Site 结果页

### SC-J-005.1: 评分结果页面展示

- **Given** 活动进入 `announcement` 阶段（公示期）
- **When** 用户访问活动结果页面
- **Then** 页面按 Track 展示项目排名
- **And** 每个项目显示：最终得分、各维度得分雷达图/列表、获奖名次

### SC-J-005.2: 评分明细展示（评委视角）

- **Given** 评委查看评分结果页面
- **When** 点击某项目的评分明细
- **Then** 展示所有评委的评分详情（匿名化处理）
- **And** 显示各维度的分数分布和平均值
