# Create Proposal Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/create-proposal` page that lets hackers submit project proposals (submissions) to a hackathon via a multi-step form that generates a PR on GitHub.

**Architecture:** SSR Astro page reads hackathon data at request time, passes it to a React form component. The form walks users through 5 steps (select hackathon, project info, team, deliverables, preview). On submit, it generates `project.yml` YAML and opens GitHub's "new file" page via `buildPRUrl()`.

**Tech Stack:** Astro (SSR page), React (form component), Tailwind CSS (Neon Forge design system), existing utils (`buildPRUrl`, `formatYaml`, `useAuth`)

---

## Task 1: Add i18n keys for create_proposal form

**Files:**
- Modify: `site/src/i18n/en.yml` (after line 282, add `create_proposal:` block)
- Modify: `site/src/i18n/zh.yml` (after line 282, add `create_proposal:` block)

**Step 1: Add English i18n keys**

In `site/src/i18n/en.yml`, add after the `create_hackathon:` block (after `tagline_placeholder_zh: ""`):

```yaml
  create_proposal:
    sign_in_first: "Please sign in with GitHub first"
    sign_in_github: "Sign in with GitHub"
    select_hackathon: "Select a hackathon"
    no_hackathons: "No hackathons available"
    project_name_en: "Project Name (English) *"
    project_name_zh: "Project Name (Chinese)"
    tagline_en: "Tagline (English) *"
    tagline_zh: "Tagline (Chinese)"
    track: "Track *"
    select_track: "Select a track"
    tech_stack: "Tech Stack *"
    tech_stack_hint: "Press Enter to add a tag"
    tech_stack_placeholder: "e.g. Python, React, LangChain"
    team_members: "Team Members"
    team_hint: "Add at least one team member"
    github_username: "GitHub Username *"
    role: "Role *"
    role_placeholder: "e.g. Lead Developer"
    add_member: "Add member"
    repo_url: "Repository URL *"
    repo_placeholder: "https://github.com/your-org/your-repo"
    video_url: "Demo Video URL"
    demo_url: "Live Demo URL"
    description_en: "Project Description (English)"
    description_zh: "Project Description (Chinese)"
    description_placeholder: "Describe your project..."
    preview_yaml: "Preview YAML"
    submit_hint: "Clicking submit will create a PR on GitHub with file path"
    back: "Back"
    next: "Next"
    submit_pr: "Submit PR on GitHub"
```

**Step 2: Add Chinese i18n keys**

In `site/src/i18n/zh.yml`, add after the `create_hackathon:` block (after `tagline_placeholder_zh:`):

```yaml
  create_proposal:
    sign_in_first: "请先登录 GitHub"
    sign_in_github: "登录 GitHub"
    select_hackathon: "选择活动"
    no_hackathons: "暂无可用活动"
    project_name_en: "项目名称 (英文) *"
    project_name_zh: "项目名称 (中文)"
    tagline_en: "一句话描述 (英文) *"
    tagline_zh: "一句话描述 (中文)"
    track: "赛道 *"
    select_track: "请选择赛道"
    tech_stack: "技术栈 *"
    tech_stack_hint: "按回车添加标签"
    tech_stack_placeholder: "例如：Python, React, LangChain"
    team_members: "团队成员"
    team_hint: "至少添加一位成员"
    github_username: "GitHub 用户名 *"
    role: "角色 *"
    role_placeholder: "例如：Lead Developer"
    add_member: "添加成员"
    repo_url: "代码仓库 URL *"
    repo_placeholder: "https://github.com/your-org/your-repo"
    video_url: "演示视频链接"
    demo_url: "在线演示链接"
    description_en: "项目描述 (英文)"
    description_zh: "项目描述 (中文)"
    description_placeholder: "描述你的项目..."
    preview_yaml: "预览 YAML"
    submit_hint: "点击提交后将在 GitHub 上创建 PR，文件路径为"
    back: "上一步"
    next: "下一步"
    submit_pr: "前往 GitHub 提交 PR"
```

**Step 3: Commit**

```bash
git add site/src/i18n/en.yml site/src/i18n/zh.yml
git commit -m "feat(site): add i18n keys for create-proposal form"
```

---

## Task 2: Create the Astro page

**Files:**
- Create: `site/src/pages/create-proposal.astro`
- Reference: `site/src/pages/create-hackathon.astro` (pattern to follow)

**Step 1: Create the page**

Create `site/src/pages/create-proposal.astro`:

```astro
---
export const prerender = false;
import BaseLayout from '../layouts/BaseLayout.astro';
import CreateProposalForm from '../components/forms/CreateProposalForm';
import { getLangFromUrl } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { globSync } from 'node:fs';

const lang: Lang = getLangFromUrl(Astro.url);

// Load all hackathons with their tracks
interface TrackInfo {
  name: string;
  name_zh?: string;
  slug: string;
}

interface HackathonInfo {
  slug: string;
  name: string;
  name_zh?: string;
  tracks: TrackInfo[];
}

const hackathonDirs = globSync('hackathons/*/hackathon.yml', { cwd: path.resolve('.') });
const hackathons: HackathonInfo[] = [];

for (const relPath of hackathonDirs) {
  const fullPath = path.resolve(relPath);
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    const data = yaml.load(raw) as { hackathon?: { slug?: string; name?: string; name_zh?: string; tracks?: TrackInfo[] } };
    if (data?.hackathon?.slug && data?.hackathon?.name) {
      hackathons.push({
        slug: data.hackathon.slug,
        name: data.hackathon.name,
        name_zh: data.hackathon.name_zh,
        tracks: (data.hackathon.tracks || []).map(t => ({
          name: t.name,
          name_zh: t.name_zh,
          slug: t.slug,
        })),
      });
    }
  } catch { /* skip invalid */ }
}
---

<BaseLayout title="Create Proposal" description="Submit a project proposal to a hackathon" lang={lang}>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-heading font-bold text-white mb-8">
      {lang === 'zh' ? '提交项目提案' : 'Submit Project Proposal'}
    </h1>
    <CreateProposalForm client:load hackathons={hackathons} lang={lang} />
  </div>
</BaseLayout>
```

**Important notes for implementer:**
- `globSync` is from Node.js `fs` module (Node 22+). If not available, use `import { sync as globSync } from 'glob'` or iterate hackathon directories manually with `fs.readdirSync('hackathons')`.
- The page mirrors the `create-hackathon.astro` pattern exactly: SSR + data loading + pass to React form.

**Step 2: Verify the page loads**

Run: `cd site && pnpm run dev`
Visit: `http://localhost:4321/create-proposal`
Expected: Page renders with heading (form component will error since it doesn't exist yet — that's OK at this step)

**Step 3: Commit**

```bash
git add site/src/pages/create-proposal.astro
git commit -m "feat(site): add create-proposal SSR page"
```

---

## Task 3: Create the CreateProposalForm component

**Files:**
- Create: `site/src/components/forms/CreateProposalForm.tsx`
- Reference: `site/src/components/forms/CreateHackathonForm.tsx` (pattern to follow)
- Reference: `site/src/components/forms/form-utils.ts` (reuse `formatYaml`, `validateRequired`)
- Reference: `site/src/lib/github-url.ts` (reuse `buildPRUrl`, `openGitHubUrl`)
- Reference: `site/src/hooks/useAuth.ts` (reuse `useAuth`)

**Step 1: Create the form component**

Create `site/src/components/forms/CreateProposalForm.tsx`:

```tsx
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import { formatYaml } from './form-utils';

interface TrackInfo {
  name: string;
  name_zh?: string;
  slug: string;
}

interface HackathonInfo {
  slug: string;
  name: string;
  name_zh?: string;
  tracks: TrackInfo[];
}

interface CreateProposalFormProps {
  hackathons: HackathonInfo[];
  lang: Lang;
}

interface TeamMember {
  github: string;
  role: string;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const STEP_LABELS_ZH = ['选择活动', '项目信息', '团队', '提交物', '预览'];
const STEP_LABELS_EN = ['Hackathon', 'Project', 'Team', 'Deliverables', 'Preview'];
const TOTAL_STEPS = 5;

export function CreateProposalForm({ hackathons, lang }: CreateProposalFormProps) {
  const { loading, isLoggedIn } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0: Select hackathon
  const [selectedHackathon, setSelectedHackathon] = useState('');

  // Step 1: Project info
  const [name, setName] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineZh, setTaglineZh] = useState('');
  const [track, setTrack] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  // Step 2: Team
  const [members, setMembers] = useState<TeamMember[]>([{ github: '', role: 'Lead Developer' }]);

  // Step 3: Deliverables
  const [repo, setRepo] = useState('');
  const [video, setVideo] = useState('');
  const [demo, setDemo] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');

  const currentHackathon = hackathons.find(h => h.slug === selectedHackathon);
  const stepLabels = lang === 'zh' ? STEP_LABELS_ZH : STEP_LABELS_EN;

  // Tech stack tag handlers
  function handleTechKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = techInput.trim();
      if (val && !techStack.includes(val)) {
        setTechStack(prev => [...prev, val]);
      }
      setTechInput('');
    }
  }
  function removeTech(idx: number) {
    setTechStack(prev => prev.filter((_, i) => i !== idx));
  }

  // Team member handlers
  function addMember() {
    setMembers(prev => [...prev, { github: '', role: '' }]);
  }
  function removeMember(idx: number) {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  }
  function updateMember(idx: number, field: keyof TeamMember, value: string) {
    setMembers(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], [field]: value };
      return n;
    });
  }

  // Build team slug
  const teamSlug = useMemo(() => {
    const firstGithub = members[0]?.github?.trim() || 'team';
    const projectSlug = toSlug(name) || 'project';
    return `team-${firstGithub}-${projectSlug}`;
  }, [members, name]);

  // Build YAML
  const yamlContent = useMemo(() => {
    const teamArr = members.filter(m => m.github).map(m => ({
      github: m.github.trim(),
      role: m.role.trim() || 'Developer',
    }));

    const deliverables: Record<string, unknown> = {
      repo: repo || undefined,
    };
    if (video) deliverables.video = video;
    if (demo) deliverables.demo = demo;

    const data: Record<string, unknown> = {
      synnovator_submission: '2.0',
      project: {
        name: name || undefined,
        name_zh: nameZh || undefined,
        tagline: tagline || undefined,
        tagline_zh: taglineZh || undefined,
        track: track || undefined,
        team: teamArr.length > 0 ? teamArr : undefined,
        deliverables: Object.keys(deliverables).some(k => deliverables[k]) ? deliverables : undefined,
        tech_stack: techStack.length > 0 ? techStack : undefined,
        description: description || undefined,
        description_zh: descriptionZh || undefined,
      },
    };
    return formatYaml(data);
  }, [name, nameZh, tagline, taglineZh, track, members, repo, video, demo, techStack, description, descriptionZh]);

  function handleSubmit() {
    const filename = `hackathons/${selectedHackathon}/submissions/${teamSlug}/project.yml`;
    const url = buildPRUrl({
      filename,
      value: yamlContent,
      message: `feat(submissions): submit ${name || 'project'} to ${selectedHackathon}`,
    });
    openGitHubUrl(url);
  }

  // Shared CSS classes (match CreateHackathonForm)
  const inputClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const labelClass = 'block text-sm text-muted mb-2';
  const selectClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const btnRemove = 'px-2 text-muted hover:text-error transition-colors';
  const btnAdd = 'text-sm text-lime-primary hover:text-lime-primary/80 transition-colors';

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx === step ? 'bg-lime-primary text-near-black'
                  : idx < step ? 'bg-lime-primary/30 text-lime-primary' : 'bg-secondary-bg text-muted'
              }`}>
                {idx < step ? '\u2713' : idx + 1}
              </div>
              <span className={`mt-1 text-xs whitespace-nowrap ${idx === step ? 'text-lime-primary' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {idx < TOTAL_STEPS - 1 && (
              <div className={`hidden sm:block w-6 h-px mx-0.5 mt-[-1rem] ${idx < step ? 'bg-lime-primary/30' : 'bg-secondary-bg'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">
            {t(lang, 'form.create_proposal.sign_in_first')}
          </p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'form.create_proposal.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Step 0: Select Hackathon */}
        {step === 0 && (
          <>
            <p className="text-sm text-muted mb-4">
              {t(lang, 'form.create_proposal.select_hackathon')}
            </p>
            {hackathons.length === 0 ? (
              <p className="text-muted text-sm">{t(lang, 'form.create_proposal.no_hackathons')}</p>
            ) : (
              <div className="grid gap-3">
                {hackathons.map(h => (
                  <button
                    key={h.slug}
                    type="button"
                    onClick={() => { setSelectedHackathon(h.slug); setTrack(''); }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedHackathon === h.slug
                        ? 'border-lime-primary bg-lime-primary/10'
                        : 'border-secondary-bg hover:border-light-gray'
                    }`}
                  >
                    <div className={`font-medium ${selectedHackathon === h.slug ? 'text-lime-primary' : 'text-white'}`}>
                      {lang === 'zh' ? (h.name_zh || h.name) : h.name}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {h.tracks.length} {lang === 'zh' ? '个赛道' : 'track(s)'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 1: Project Info */}
        {step === 1 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.project_name_en')}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="AgentFlow" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.project_name_zh')}</label>
              <input type="text" value={nameZh} onChange={e => setNameZh(e.target.value)}
                placeholder="智能体工作流" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.tagline_en')}</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="Visual workflow builder for AI agents" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.tagline_zh')}</label>
              <input type="text" value={taglineZh} onChange={e => setTaglineZh(e.target.value)}
                placeholder="可视化 AI 智能体工作流构建器" className={inputClass} />
            </div>
            {currentHackathon && currentHackathon.tracks.length > 0 && (
              <div>
                <label className={labelClass}>{t(lang, 'form.create_proposal.track')}</label>
                <select value={track} onChange={e => setTrack(e.target.value)} className={selectClass}>
                  <option value="">{t(lang, 'form.create_proposal.select_track')}</option>
                  {currentHackathon.tracks.map(tr => (
                    <option key={tr.slug} value={tr.slug}>
                      {lang === 'zh' ? (tr.name_zh || tr.name) : tr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.tech_stack')}</label>
              <p className="text-xs text-muted mb-2">{t(lang, 'form.create_proposal.tech_stack_hint')}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {techStack.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-lime-primary/15 text-lime-primary text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTech(idx)} className="hover:text-white">{'\u2715'}</button>
                  </span>
                ))}
              </div>
              <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder={t(lang, 'form.create_proposal.tech_stack_placeholder')} className={inputClass} />
            </div>
          </>
        )}

        {/* Step 2: Team */}
        {step === 2 && (
          <>
            <p className="text-sm text-muted">{t(lang, 'form.create_proposal.team_hint')}</p>
            <div className="space-y-4">
              {members.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" value={m.github} onChange={e => updateMember(idx, 'github', e.target.value)}
                      placeholder={t(lang, 'form.create_proposal.github_username')} className={inputClass} />
                    <input type="text" value={m.role} onChange={e => updateMember(idx, 'role', e.target.value)}
                      placeholder={t(lang, 'form.create_proposal.role_placeholder')} className={inputClass} />
                  </div>
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(idx)} className={btnRemove}>{'\u2715'}</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addMember} className={btnAdd}>
              + {t(lang, 'form.create_proposal.add_member')}
            </button>
          </>
        )}

        {/* Step 3: Deliverables */}
        {step === 3 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.repo_url')}</label>
              <input type="url" value={repo} onChange={e => setRepo(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.repo_placeholder')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.video_url')}</label>
              <input type="url" value={video} onChange={e => setVideo(e.target.value)}
                placeholder="https://youtube.com/watch?v=..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.demo_url')}</label>
              <input type="url" value={demo} onChange={e => setDemo(e.target.value)}
                placeholder="https://your-demo.vercel.app" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.description_en')}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.description_placeholder')}
                className={`${inputClass} resize-none h-24`} />
            </div>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.description_zh')}</label>
              <textarea value={descriptionZh} onChange={e => setDescriptionZh(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.description_placeholder')}
                className={`${inputClass} resize-none h-24`} />
            </div>
          </>
        )}

        {/* Step 4: Preview & Submit */}
        {step === 4 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.preview_yaml')}</label>
              <pre className="w-full bg-surface border border-secondary-bg rounded-md px-4 py-3 text-lime-primary text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
            <p className="text-xs text-muted">
              {t(lang, 'form.create_proposal.submit_hint')}{' '}
              <code className="text-lime-primary">
                hackathons/{selectedHackathon}/submissions/{teamSlug}/project.yml
              </code>
            </p>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-lg border border-secondary-bg text-muted text-sm hover:text-white hover:border-light-gray transition-colors">
              {t(lang, 'form.create_proposal.back')}
            </button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !selectedHackathon}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {t(lang, 'form.create_proposal.next')}
            </button>
          ) : (
            <button type="button" onClick={handleSubmit}
              disabled={!isLoggedIn || !name || !repo || !selectedHackathon}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {t(lang, 'form.create_proposal.submit_pr')} {'\u2192'}
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}

export default CreateProposalForm;
```

**Step 2: Verify the component compiles**

Run: `cd site && pnpm run dev`
Visit: `http://localhost:4321/create-proposal`
Expected: Full form renders. Step through all 5 steps. Preview shows YAML.

**Step 3: Commit**

```bash
git add site/src/components/forms/CreateProposalForm.tsx
git commit -m "feat(site): add CreateProposalForm multi-step component"
```

---

## Task 4: Fix the Astro page glob import

**Files:**
- Modify: `site/src/pages/create-proposal.astro`

**Step 1: Verify and fix the glob import**

The `globSync` import may not work directly from `node:fs`. Check and fix:

```astro
---
export const prerender = false;
import BaseLayout from '../layouts/BaseLayout.astro';
import CreateProposalForm from '../components/forms/CreateProposalForm';
import { getLangFromUrl } from '../lib/i18n';
import type { Lang } from '../lib/i18n';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const lang: Lang = getLangFromUrl(Astro.url);

interface TrackInfo {
  name: string;
  name_zh?: string;
  slug: string;
}

interface HackathonInfo {
  slug: string;
  name: string;
  name_zh?: string;
  tracks: TrackInfo[];
}

// Read hackathon directories
const hackathonsDir = path.resolve('hackathons');
const hackathons: HackathonInfo[] = [];

if (fs.existsSync(hackathonsDir)) {
  const dirs = fs.readdirSync(hackathonsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const dir of dirs) {
    const ymlPath = path.join(hackathonsDir, dir.name, 'hackathon.yml');
    if (!fs.existsSync(ymlPath)) continue;
    try {
      const raw = fs.readFileSync(ymlPath, 'utf8');
      const data = yaml.load(raw) as { hackathon?: { slug?: string; name?: string; name_zh?: string; tracks?: TrackInfo[] } };
      if (data?.hackathon?.slug && data?.hackathon?.name) {
        hackathons.push({
          slug: data.hackathon.slug,
          name: data.hackathon.name,
          name_zh: data.hackathon.name_zh,
          tracks: (data.hackathon.tracks || []).map(t => ({
            name: t.name,
            name_zh: t.name_zh,
            slug: t.slug,
          })),
        });
      }
    } catch { /* skip invalid */ }
  }
}
---

<BaseLayout title="Create Proposal" description="Submit a project proposal to a hackathon" lang={lang}>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 class="text-3xl font-heading font-bold text-white mb-8">
      {lang === 'zh' ? '提交项目提案' : 'Submit Project Proposal'}
    </h1>
    <CreateProposalForm client:load hackathons={hackathons} lang={lang} />
  </div>
</BaseLayout>
```

**Step 2: Run dev server and verify**

Run: `cd site && pnpm run dev`
Visit: `http://localhost:4321/create-proposal`
Expected: Page shows hackathon list in Step 0. All 3 hackathons from `hackathons/` appear.

**Step 3: Commit**

```bash
git add site/src/pages/create-proposal.astro
git commit -m "fix(site): use readdirSync for hackathon loading in create-proposal"
```

---

## Task 5: End-to-end verification

**Step 1: Full dev server test**

Run: `cd site && pnpm run dev`

1. Visit `http://localhost:4321/create-proposal`
2. Select a hackathon (e.g., "Dishui Lake AI+OPC")
3. Fill in project name: "Test Project", tagline: "A test", select a track, add tech stack tags
4. Add team member: github "testuser", role "Lead Developer"
5. Add repo URL: "https://github.com/test/test"
6. Preview: verify YAML looks correct per schema `synnovator_submission: "2.0"`
7. Verify file path shows: `hackathons/dishuihu-ai-opc-global-challenge-2026/submissions/team-testuser-test-project/project.yml`

**Step 2: Verify NavBar dropdown works**

1. Click the "+Create" / "+创建" button in navbar
2. Click "Create Proposal" / "创建提案"
3. Verify it navigates to `/create-proposal` without 404

**Step 3: Build test**

Run: `cd site && pnpm run build`
Expected: Build succeeds without errors.

**Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat(site): complete create-proposal page with multi-step form"
```

---

## Summary of files

| Action | File |
|--------|------|
| Modify | `site/src/i18n/en.yml` — add `create_proposal:` i18n block |
| Modify | `site/src/i18n/zh.yml` — add `create_proposal:` i18n block |
| Create | `site/src/pages/create-proposal.astro` — SSR page |
| Create | `site/src/components/forms/CreateProposalForm.tsx` — React form |
| Existing | `site/src/components/NavBar.astro` — already links to `/create-proposal` (no change needed) |
