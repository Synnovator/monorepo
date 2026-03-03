# CLAUDE.md — site（官网）

Synnovator 官方网站，读取 `hackathons/` 和 `profiles/` 数据生成静态页面。License: Apache 2.0。

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro | 静态站点框架 |
| Tailwind CSS | 样式 |
| GitHub Pages | 部署 |
| pnpm | 包管理（**禁止 npm/npx**） |

## 目录结构

```
site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/            # 页面路由
│   │   ├── index.astro           # 首页 / 活动列表
│   │   ├── hackathons/[slug].astro  # 活动详情
│   │   └── hackers/[id].astro    # Hacker Profile
│   ├── layouts/          # 页面布局
│   ├── components/       # PRD 组件
│   │   ├── GitHubRedirect.astro  # Issue/PR 预填跳转
│   │   ├── ScoreCard.astro       # 评分卡片
│   │   └── AppealForm.astro      # 申诉表单
│   ├── styles/           # CSS
│   └── i18n/             # 国际化 (en.yml, zh.yml)
└── public/               # 静态资源
```

## 数据来源

站点在构建时读取 monorepo 根目录的数据：
- `../hackathons/*/hackathon.yml` — 活动数据
- `../profiles/*.yml` — 用户 Profile

## 开发指南

```bash
pnpm install          # 安装依赖
pnpm run dev          # 开发服务器
pnpm run build        # 生产构建
pnpm run preview      # 预览构建结果
```

## Commit 规范

```
feat(site): add hackathon listing page
fix(site): fix responsive layout
```
