# 编辑器内容加载修复 — 设计规格

## 问题

当前 MDX 编辑器有两个 bug 和一个系统性设计缺陷：

### Bug 1：活动编辑器默认打开英文

用户从中文页面点击"编辑活动"进入编辑器，编辑器硬编码 `lang="en"`，始终默认显示英文描述。

**断裂链路**：
1. `EditHackathonButton` 持有 `lang` prop，但链接 `/edit/hackathon/${slug}` 不传 `?lang=`
2. `HackathonEditorClient` 硬编码 `lang="en"` 传给 `<MdxEditor>`
3. `MdxEditor` 用 `lang` 决定哪个内容是"主内容"、哪个是"副内容"

### Bug 2：提案编辑器打开无内容

用户点击"编辑项目"进入提案编辑器，编辑器显示空白，即使 `project.yml` 中已有 `description` 和 `description_zh`。

**断裂链路**：
1. `ProposalEditorPage` (page.tsx) 调用 `listSubmissions()` 取到 `entry.project.description`
2. 但**没有传给** `ProposalEditorClient` — 接口中缺少 `description` 字段
3. `ProposalEditorClient` 硬编码 `initialContent=""`、`initialContentAlt=""`

### 系统性问题：无统一数据契约

每个编辑器 page.tsx 自行决定加载什么数据、传哪些 props。没有共享类型约束，TypeScript 无法在编译时检测遗漏。新增编辑器（如 Profile 编辑）时同样的 bug 会重复发生。

## 设计

### 1. `BilingualContent` 共享类型

```typescript
// apps/web/lib/editor-content.ts

import type { Lang } from '@synnovator/shared/i18n';

/** 双语内容对 — 编辑器的最小数据单元 */
export interface BilingualContent {
  en: string;
  zh: string;
}

/**
 * 根据 lang 返回主/副内容，映射到 MdxEditor 的 initialContent / initialContentAlt。
 *
 * MdxEditor 内部逻辑（MdxEditor.tsx:55-66）：
 *   contentEn = (lang === 'en') ? initialContent : initialContentAlt
 *   contentZh = (lang === 'zh') ? initialContent : initialContentAlt
 * 所以 initialContent 始终对应当前 lang 的内容，initialContentAlt 对应另一语言。
 *
 * 当两个语言的内容都是空字符串时，MdxEditor 的 resolveInitial() 会 fallback
 * 到 templateContent（如果提供了模板），这是预期行为。
 */
export function resolveBilingual(
  content: BilingualContent,
  lang: Lang,
): { primary: string; alt: string } {
  return lang === 'zh'
    ? { primary: content.zh, alt: content.en }
    : { primary: content.en, alt: content.zh };
}
```

所有编辑器 Client 组件的 props 使用 `BilingualContent` 替代分散的 `description` + `descriptionZh`。调用 `resolveBilingual()` 将 `BilingualContent` 映射到 `MdxEditor` 的 `initialContent` / `initialContentAlt`。

### 2. 统一加载函数

```typescript
// apps/web/lib/editor-content.ts
// 注意：当前仍使用 @/app/_generated/data 的 deprecated 函数，
// 与现有编辑器 page.tsx 保持一致。待 DataProvider 迁移完成后统一切换。

import { getHackathon, listSubmissions } from '@/app/_generated/data';

export interface HackathonEditorData {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: Array<{
    slug: string;
    name: BilingualContent;
  }>;
}

export function getHackathonEditorData(slug: string): HackathonEditorData | null {
  const entry = getHackathon(slug);
  if (!entry) return null;
  const h = entry.hackathon;
  return {
    slug: h.slug,
    name: { en: h.name, zh: h.name_zh ?? h.name },
    description: { en: h.description ?? '', zh: h.description_zh ?? '' },
    tracks: (h.tracks ?? []).map((tr) => ({
      slug: tr.slug,
      name: { en: tr.name, zh: tr.name_zh ?? tr.name },
    })),
  };
}

export interface ProposalEditorData {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;
}

export function getProposalEditorData(
  hackathonSlug: string,
  teamSlug: string,
): ProposalEditorData | null {
  const all = listSubmissions();
  const entry = all.find(
    (s) => s._hackathonSlug === hackathonSlug && s._teamSlug === teamSlug,
  );
  if (!entry) return null;
  return {
    hackathonSlug,
    teamSlug,
    projectName: {
      en: entry.project.name,
      zh: entry.project.name_zh ?? entry.project.name,
    },
    description: {
      en: entry.project.description ?? '',
      zh: entry.project.description_zh ?? '',
    },
  };
}
```

### 3. `lang` 上下文传递

编辑按钮在链接中传递当前语言：

```typescript
// EditHackathonButton.tsx
<Link href={`/edit/hackathon/${slug}?lang=${lang}`}>

// EditProjectButton.tsx
<Link href={`/edit/proposal/${hackathonSlug}/${teamSlug}?lang=${lang}`}>
```

编辑器 page.tsx 从 `searchParams` 读取 `lang`，传给 Client 组件。注意 Next.js 15 的 `searchParams` 值可能是 `string | string[] | undefined`，需要处理：

```typescript
// edit/hackathon/[slug]/page.tsx
import type { Lang } from '@synnovator/shared/i18n';

const sp = await searchParams;
const langRaw = Array.isArray(sp.lang) ? sp.lang[0] : sp.lang;
const lang: Lang = langRaw === 'en' ? 'en' : 'zh'; // 默认 zh
```

Client 组件接收 `lang` prop 并传给 `<MdxEditor lang={lang}>`。

> **注意**：共享包的 `getLangFromSearchParams()` 接收 `URLSearchParams` 对象，而 Next.js Server Component 的 `searchParams` 是 `Promise<Record<string, string | string[] | undefined>>`，类型不兼容。这里直接内联处理。

### 4. Client 组件 Props 更新

#### HackathonEditorClient

```typescript
interface HackathonEditorClientProps {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: Array<{ slug: string; name: BilingualContent }>;
  login: string;
  lang: Lang;  // 新增
}
```

使用方式（描述 tab **和** 赛道 tab 都需要修改）：
```typescript
// 描述 tab
const { primary, alt } = resolveBilingual(description, lang);
<MdxEditor initialContent={primary} initialContentAlt={alt} lang={lang} ... />

// 赛道 tab（当前也是 lang="en" 硬编码，同样需要修复）
<MdxEditor initialContent="" initialContentAlt="" lang={lang} ... />
```

> **注意**：赛道 tab 的 `initialContent` 暂时仍为空字符串，因为赛道 MDX 内容不在 YAML 中（存储在独立 `.mdx` 文件），当前数据层不加载。此问题超出本次修复范围，但 `lang` 必须修复。

#### ProposalEditorClient

```typescript
interface ProposalEditorClientProps {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;  // 新增
  login: string;
  lang: Lang;                     // 新增
}
```

### 5. MdxEditor — 不改动

`MdxEditor` 的 `initialContent` / `initialContentAlt` / `lang` 接口已经正确：
- `lang` 决定哪个内容是主内容（显示在当前编辑面板）
- `initialContent` 是主内容，`initialContentAlt` 是副内容
- 切换语言时在 `contentEn` / `contentZh` 之间切换

通过 `resolveBilingual()` 在调用方将 `BilingualContent` 正确映射到这些 props。

### 6. 附带修复：i18n 按钮文案

当前 `project.edit` 翻译为"编辑项目"，路由却是 `/edit/proposal/`。保持现有文案不变（项目 = proposal 在此上下文中可接受）。

## 影响范围

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `apps/web/lib/editor-content.ts` | **新增** | `BilingualContent`、`resolveBilingual()`、`getHackathonEditorData()`、`getProposalEditorData()` |
| `apps/web/components/EditHackathonButton.tsx` | 修改 | 链接加 `?lang=${lang}` |
| `apps/web/components/EditProjectButton.tsx` | 修改 | 链接加 `?lang=${lang}` |
| `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx` | 修改 | 用 `getHackathonEditorData()` + 读取 `searchParams.lang` |
| `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx` | 修改 | Props 改为 `BilingualContent` + 接收 `lang` prop |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx` | 修改 | 用 `getProposalEditorData()` + 读取 `searchParams.lang` + 传 description |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx` | 修改 | Props 加 `description: BilingualContent` + `lang` |

**不改动**：`MdxEditor`、数据生成脚本、Schema、API routes。

## 未来扩展模式

新增编辑器（如 Profile）时，遵循同一模式：

1. 在 `editor-content.ts` 添加 `getProfileEditorData()` 和 `ProfileEditorData` 接口
2. 所有 `BilingualContent` 字段必须填充（不允许 `undefined`）
3. 编辑按钮传 `?lang=`
4. Client 组件用 `resolveBilingual()` + 接收 `lang` prop

TypeScript 会在编译时强制检查：如果 `ProfileEditorData` 要求 `bio: BilingualContent`，page.tsx 不传就会报错。
