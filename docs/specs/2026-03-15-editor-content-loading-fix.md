# 编辑器内容加载修复 — 设计规格

## 核心原则

**YAML 是索引，MDX 是内容。** 编辑器的数据源始终是 `.mdx` 文件，YAML 只提供元数据（slug、track 列表、名称等），告诉编辑器要加载哪些 MDX 文件。编辑器不应读取 YAML 的 `description` 字段作为编辑内容。

**缺失 MDX = 错误。** 如果编辑器需要的 `.mdx` 文件不存在，应当抛出明确错误，而非静默显示空白。Let it crash.

**MDX 必须在数据创建时同步生成。** 创建 hackathon、track、submission 时，必须同时从模板生成对应的 `.mdx` 文件。

## 问题

当前 MDX 编辑器有三个 bug 和两个系统性缺陷：

### Bug 1：活动编辑器默认打开英文

用户从中文页面点击"编辑活动"进入编辑器，编辑器硬编码 `lang="en"`，始终默认显示英文描述。

**断裂链路**：
1. `EditHackathonButton` 持有 `lang` prop，但链接 `/edit/hackathon/${slug}` 不传 `?lang=`
2. `HackathonEditorClient` 硬编码 `lang="en"` 传给 `<MdxEditor>`
3. `MdxEditor` 用 `lang` 决定哪个内容是"主内容"、哪个是"副内容"

### Bug 2：提案编辑器打开无内容

用户点击"编辑项目"进入提案编辑器，编辑器显示空白。`README.mdx` 存在但从未被加载。

**断裂链路**：
1. `generate-static-data.mjs` 只读取 YAML，不读取 MDX 文件的原始源码
2. `ProposalEditorClient` 硬编码 `initialContent=""`、`initialContentAlt=""`
3. 编辑器没有任何途径获取 MDX 文件内容

### Bug 3：赛道编辑器打开无内容

活动编辑器的赛道 tab 始终显示空白。

**断裂链路**：
1. 赛道 `.mdx` 文件根本不存在（从未被创建）
2. `HackathonEditorClient` 赛道 tab 硬编码 `initialContent=""`、`initialContentAlt=""`

### 系统性问题 1：无 MDX 原始源码加载管道

`generate-static-data.mjs` 只处理 YAML 数据。MDX 文件的原始源码无法在 Cloudflare Workers 运行时获取（无 `node:fs`），也没有被预生成到可导入的 JSON 中。编辑器无法加载 MDX 内容。

### 系统性问题 2：无统一数据契约

每个编辑器 page.tsx 自行决定加载什么数据、传哪些 props。没有共享类型约束，TypeScript 无法在编译时检测遗漏。

## MDX 文件约定

| 内容类型 | 英文路径 | 中文路径 |
|----------|----------|----------|
| 活动描述 | `hackathons/{slug}/description.mdx` | `hackathons/{slug}/description.zh.mdx` |
| 赛道描述 | `hackathons/{slug}/tracks/{track}.mdx` | `hackathons/{slug}/tracks/{track}.zh.mdx` |
| 提案内容 | `hackathons/{slug}/submissions/{team}/README.mdx` | `hackathons/{slug}/submissions/{team}/README.zh.mdx` |

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

`BilingualContent` 的值来自 **MDX 文件的原始源码**，不是 YAML 的 `description` 字段。

### 2. 扩展 `generate-static-data.mjs` — 生成原始 MDX 源码

在现有 YAML 处理之外，新增 MDX 原始源码收集，输出到 `app/_generated/editor-mdx.json`：

```javascript
// apps/web/scripts/generate-static-data.mjs — 新增部分

/**
 * 收集所有 MDX 文件的原始源码（不编译），供编辑器加载。
 * 输出格式：{ [key: string]: string }
 * key 约定：
 *   - "hackathon:{slug}:description"       → description.mdx
 *   - "hackathon:{slug}:description.zh"    → description.zh.mdx
 *   - "track:{slug}:{track}"              → tracks/{track}.mdx
 *   - "track:{slug}:{track}.zh"           → tracks/{track}.zh.mdx
 *   - "submission:{slug}:{team}"          → submissions/{team}/README.mdx
 *   - "submission:{slug}:{team}.zh"       → submissions/{team}/README.zh.mdx
 */
async function collectEditorMdx(hackathonsDir) {
  const result = {};

  for (const hackathonDir of await fs.readdir(hackathonsDir)) {
    const base = path.join(hackathonsDir, hackathonDir);

    // 活动描述
    for (const suffix of ['', '.zh']) {
      const file = path.join(base, `description${suffix}.mdx`);
      try {
        result[`hackathon:${hackathonDir}:description${suffix}`] =
          await fs.readFile(file, 'utf-8');
      } catch { /* 文件不存在 — 后续由编辑器校验 */ }
    }

    // 赛道
    const tracksDir = path.join(base, 'tracks');
    try {
      for (const tf of (await fs.readdir(tracksDir)).filter(f => f.endsWith('.mdx'))) {
        const key = tf.replace('.mdx', '');
        result[`track:${hackathonDir}:${key}`] =
          await fs.readFile(path.join(tracksDir, tf), 'utf-8');
      }
    } catch { /* 无 tracks 目录 */ }

    // 提案
    const subsDir = path.join(base, 'submissions');
    try {
      for (const teamDir of await fs.readdir(subsDir)) {
        for (const name of ['README.mdx', 'README.zh.mdx']) {
          const file = path.join(subsDir, teamDir, name);
          const suffix = name === 'README.zh.mdx' ? '.zh' : '';
          try {
            result[`submission:${hackathonDir}:${teamDir}${suffix}`] =
              await fs.readFile(file, 'utf-8');
          } catch { /* 文件不存在 */ }
        }
      }
    } catch { /* 无 submissions 目录 */ }
  }

  return result;
}

// 在 main() 中调用：
const editorMdx = await collectEditorMdx(hackathonsDir);
await fs.writeFile(
  path.join(generatedDir, 'editor-mdx.json'),
  JSON.stringify(editorMdx),
);
```

### 3. 统一加载函数 — 从 MDX 源码加载

```typescript
// apps/web/lib/editor-content.ts

import { getHackathon, listSubmissions } from '@/app/_generated/data';
import editorMdx from '@/app/_generated/editor-mdx.json';

/** 从预生成的 editor-mdx.json 加载原始 MDX 源码 */
function loadMdx(key: string): string {
  const content = (editorMdx as Record<string, string>)[key];
  if (content === undefined) {
    throw new Error(`Missing MDX file: ${key}. Run data migration or check file existence.`);
  }
  return content;
}

/** 加载双语 MDX，缺失时抛错 */
function loadBilingualMdx(keyBase: string): BilingualContent {
  return {
    en: loadMdx(keyBase),
    zh: loadMdx(`${keyBase}.zh`),
  };
}

export interface HackathonEditorData {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;  // 来自 description.mdx / description.zh.mdx
  tracks: Array<{
    slug: string;
    name: BilingualContent;
    description: BilingualContent;  // 来自 tracks/{slug}.mdx / tracks/{slug}.zh.mdx
  }>;
}

export function getHackathonEditorData(slug: string): HackathonEditorData {
  const entry = getHackathon(slug);
  if (!entry) throw new Error(`Hackathon not found: ${slug}`);
  const h = entry.hackathon;

  return {
    slug: h.slug,
    name: { en: h.name, zh: h.name_zh ?? h.name },
    description: loadBilingualMdx(`hackathon:${slug}:description`),
    tracks: (h.tracks ?? []).map((tr) => ({
      slug: tr.slug,
      name: { en: tr.name, zh: tr.name_zh ?? tr.name },
      description: loadBilingualMdx(`track:${slug}:${tr.slug}`),
    })),
  };
}

export interface ProposalEditorData {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;  // 来自 README.mdx / README.zh.mdx
}

export function getProposalEditorData(
  hackathonSlug: string,
  teamSlug: string,
): ProposalEditorData {
  const all = listSubmissions();
  const entry = all.find(
    (s) => s._hackathonSlug === hackathonSlug && s._teamSlug === teamSlug,
  );
  if (!entry) throw new Error(`Submission not found: ${hackathonSlug}/${teamSlug}`);

  return {
    hackathonSlug,
    teamSlug,
    projectName: {
      en: entry.project.name,
      zh: entry.project.name_zh ?? entry.project.name,
    },
    description: loadBilingualMdx(`submission:${hackathonSlug}:${teamSlug}`),
  };
}
```

YAML 提供的元数据（`slug`、`name`、`tracks[]`）告诉加载函数要读取哪些 MDX 文件。MDX 源码从 `editor-mdx.json` 获取。缺失 MDX 文件直接 `throw Error`。

### 4. `lang` 上下文传递

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

### 5. Client 组件 Props 更新

#### HackathonEditorClient

```typescript
interface HackathonEditorClientProps {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: Array<{ slug: string; name: BilingualContent; description: BilingualContent }>;
  login: string;
  lang: Lang;
}
```

使用方式：
```typescript
// 描述 tab
const { primary, alt } = resolveBilingual(description, lang);
<MdxEditor initialContent={primary} initialContentAlt={alt} lang={lang} ... />

// 赛道 tab
const { primary: trackPrimary, alt: trackAlt } = resolveBilingual(track.description, lang);
<MdxEditor initialContent={trackPrimary} initialContentAlt={trackAlt} lang={lang} ... />
```

#### ProposalEditorClient

```typescript
interface ProposalEditorClientProps {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  description: BilingualContent;
  login: string;
  lang: Lang;
}
```

### 6. MdxEditor — 不改动

`MdxEditor` 的 `initialContent` / `initialContentAlt` / `lang` 接口已经正确。通过 `resolveBilingual()` 在调用方将 `BilingualContent`（MDX 源码）正确映射到这些 props。

### 7. 数据迁移 — 补充缺失的 MDX 文件

现有数据缺少大量 MDX 文件，需要在实施前补充：

| 内容类型 | 现有 | 缺失 | 迁移方式 |
|----------|------|------|----------|
| 活动描述 `description.mdx` | 0 | 全部（en + zh） | 从 YAML `description` / `description_zh` 生成初始 MDX |
| 赛道 `tracks/*.mdx` | 0 | 全部（en + zh） | 从 YAML `tracks[].description` / `description_zh` 生成初始 MDX |
| 提案 `README.zh.mdx` | 0 | 4 个提案缺中文版 | 从 YAML `description_zh` 生成，或复制英文版 |

迁移脚本：

```bash
# scripts/migrate-mdx.sh — 一次性迁移
# 遍历所有 hackathon，为缺失的 MDX 文件生成初始内容

for hackathon_dir in hackathons/*/; do
  slug=$(basename "$hackathon_dir")

  # 活动描述：从 YAML description 生成 MDX
  if [ ! -f "${hackathon_dir}description.mdx" ]; then
    # 从 hackathon.yml 提取 description 字段作为初始 MDX 内容
    echo "Generating ${hackathon_dir}description.mdx"
  fi

  # 赛道：从 YAML tracks[].description 生成 MDX
  # 提案中文版：从 description_zh 生成
done
```

> **YAML `description` 字段在迁移后的定位**：YAML 的 `description` 保留为短摘要（用于列表页、SEO meta），MDX 文件是完整的富文本内容。迁移时用 YAML 描述作为 MDX 的初始种子内容。

### 8. 创建脚本更新 — 未来预防

`scripts/create-hackathon.sh` 和 `scripts/submit-project.sh` 需要同步创建 MDX 文件：

```bash
# create-hackathon.sh — 新增
cat > "${HACKATHON_DIR}/description.mdx" << 'MDX'
# {hackathon_name}

Add your hackathon description here.
MDX

cat > "${HACKATHON_DIR}/description.zh.mdx" << 'MDX'
# {hackathon_name_zh}

在此添加活动描述。
MDX
```

同理，创建 track 时生成 `tracks/{slug}.mdx` 和 `tracks/{slug}.zh.mdx`。

### 9. 附带修复：i18n 按钮文案

当前 `project.edit` 翻译为"编辑项目"，路由却是 `/edit/proposal/`。保持现有文案不变（项目 = proposal 在此上下文中可接受）。

## 影响范围

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `apps/web/scripts/generate-static-data.mjs` | **修改** | 新增 `collectEditorMdx()` → 生成 `editor-mdx.json` |
| `apps/web/app/_generated/editor-mdx.json` | **新增（自动生成）** | MDX 原始源码 JSON |
| `apps/web/lib/editor-content.ts` | **新增** | `BilingualContent`、`resolveBilingual()`、`loadMdx()`、`getHackathonEditorData()`、`getProposalEditorData()` |
| `apps/web/components/EditHackathonButton.tsx` | 修改 | 链接加 `?lang=${lang}` |
| `apps/web/components/EditProjectButton.tsx` | 修改 | 链接加 `?lang=${lang}` |
| `apps/web/app/(auth)/edit/hackathon/[slug]/page.tsx` | 修改 | 用 `getHackathonEditorData()` + 读取 `searchParams.lang` |
| `apps/web/app/(auth)/edit/hackathon/[slug]/HackathonEditorClient.tsx` | 修改 | Props 改为 `BilingualContent`（MDX 源码）+ 接收 `lang` prop |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/page.tsx` | 修改 | 用 `getProposalEditorData()` + 读取 `searchParams.lang` |
| `apps/web/app/(auth)/edit/proposal/[hackathon]/[team]/ProposalEditorClient.tsx` | 修改 | Props 加 `description: BilingualContent` + `lang` |
| `scripts/migrate-mdx.sh` | **新增** | 一次性迁移：为现有数据生成缺失的 MDX 文件 |
| `scripts/create-hackathon.sh` | 修改 | 同步创建 MDX 模板文件 |
| `scripts/submit-project.sh` | 修改 | 同步创建 README.mdx 模板 |
| `hackathons/*/description[.zh].mdx` | **新增（迁移生成）** | 活动描述 MDX |
| `hackathons/*/tracks/*[.zh].mdx` | **新增（迁移生成）** | 赛道描述 MDX |
| `hackathons/*/submissions/*/README.zh.mdx` | **新增（迁移生成）** | 提案中文版 MDX |

**不改动**：`MdxEditor`、Schema、API routes。

## 未来扩展模式

新增编辑器（如 Profile）时，遵循同一模式：

1. 定义 MDX 文件路径约定（如 `profiles/{github}/bio.mdx`）
2. 创建脚本同步生成 MDX 模板
3. `generate-static-data.mjs` 收集 MDX 源码
4. `editor-content.ts` 添加 `getProfileEditorData()` — 从 MDX 加载，缺失则 throw
5. Client 组件用 `resolveBilingual()` + 接收 `lang` prop

TypeScript 会在编译时强制检查接口完整性。运行时通过 `loadMdx()` 的 throw 确保 MDX 文件存在。
