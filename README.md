# Synnovator

> Git 原生的 Hackathon 平台 — 用 GitHub Issue/PR 驱动活动全流程。

## 目录结构

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| [`site/`](site/) | 官网 | Astro, Tailwind |
| [`hackathons/`](hackathons/) | 活动数据 | YAML |
| [`profiles/`](profiles/) | 用户 Profile | YAML |
| [`scripts/`](scripts/) | CLI 辅助脚本 | Bash |
| [`docs/`](docs/) | 设计文档 | Markdown |

## 快速开始

```bash
# 创建活动
./scripts/create-hackathon.sh my-hackathon-2026

# 注册 Profile
./scripts/create-profile.sh your-github-username

# 提交项目
./scripts/submit-project.sh my-hackathon-2026 team-name
```

## 开发

```bash
cd site
pnpm install
pnpm run dev
```

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

Apache 2.0
