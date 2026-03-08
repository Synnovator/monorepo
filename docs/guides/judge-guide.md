# 评委指南

> 如何进行结构化评分和利益冲突声明。
>
> 完整操作流程和技术细节详见 [hackers-user-flow.md](./hackers-user-flow.md) 中的 Judge 操作部分。

## 概述

评委通过 GitHub Issue 提交结构化评分。评分维度和权重由活动 `hackathon.yml` 中各赛道的 `judging.criteria` 定义。

## 前置条件

1. 你的 GitHub username 需要在 `hackathon.yml` 的 `judges[]` 列表中
2. 活动必须处于 `judging` 阶段

## 评分流程

1. 访问活动详情页 `/hackathons/{slug}`，切换到 "Submissions" tab
2. 查看参赛项目列表
3. 对每个项目，点击 "Score" 按钮，打开 ScoreCard 组件
4. 对每个评审维度打分（滑块 + 数字输入，分数范围由 `score_range` 定义）
5. 为每个维度写评语（可选）
6. 填写整体评语
7. **勾选利益冲突声明**（必选）："我确认与该团队无利益冲突关系"
8. 点击提交 → 创建 `[Score]` Issue

## 评分校验

Actions 自动校验：

- 所有评审维度是否都已打分
- 分数是否在允许范围内
- 你是否是授权评委（在 `judges[]` 中）
- 是否重复评分（同一评委对同一队伍）
- 利益冲突 checkbox 是否勾选

校验通过 → Issue 打 `score-validated` label。

## 评分聚合

评分阶段结束后，Actions 自动聚合所有 `score-validated` Issue：

```
每个维度: 分数 × 权重 → 加权得分
所有维度加权得分求和 → 项目总分
所有评委的总分取平均 → 最终排名
```

结果写入 `hackathons/{slug}/results/{track}.json`，在 `/results/{slug}` 展示。

## 利益冲突声明

评分前必须确认无利益冲突。如果你与某个参赛团队存在以下关系，应**回避评分**：

- 直接指导关系（导师/学生）
- 同一公司/团队
- 直系亲属
- 财务利益关系

## Issue 格式

评分 Issue 标题格式: `[Score] {team-name} — {hackathon-slug} / {track}`

评分 Issue 使用 [judge-score 模板](../../.github/ISSUE_TEMPLATE/judge-score.yml)，body 中包含 YAML 格式的评分数据：

```yaml
scores:
  - criterion: "Innovation"
    score: 85
    comment: "独特的方法论"
  - criterion: "Technical Depth"
    score: 90
    comment: "架构设计优秀"

overall_comment: |
  项目整体完成度高...
```
