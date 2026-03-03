# CLAUDE.md — page（官网）

Synnovator 官方网站。License: Apache 2.0。

## 技术栈

| 技术 | 用途 |
|------|------|
| Astro | 静态站点框架 |
| Tailwind CSS | 样式 |
| GitHub Pages | 部署 |
| pnpm | 包管理（**禁止 npm/npx**） |

## 目录结构

```
page/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── pages/            # 页面路由
│   ├── layouts/          # 页面布局
│   ├── components/       # 可复用组件
│   └── styles/           # CSS
└── public/               # 静态资源
```

## 开发指南

```bash
pnpm install          # 安装依赖
pnpm run dev          # 开发服务器
pnpm run build        # 生产构建
pnpm run preview      # 预览构建结果
```

## Commit 规范

```
feat(page): add hero section
fix(page): fix responsive layout
```
