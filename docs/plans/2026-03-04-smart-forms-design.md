# Smart Forms System + shadcn/ui Migration Design

**Date**: 2026-03-04
**Status**: Approved

## Problem

Current UX requires users to manually fill in fields that the system already knows (hackathon slug, GitHub username, track options). GitHub Issue templates can't provide dynamic dropdowns populated from hackathon data. This creates friction in registration, NDA signing, appeals, team formation, profile creation, and hackathon creation flows.

Additionally, existing interactive components (ScoreCard, FAQAccordion, DatasetDownload, OAuthButton) use vanilla JS with manual DOM manipulation, which is inconsistent with the planned React + shadcn/ui component library.

## Solution

Build site-side smart forms using **React Islands + shadcn/ui** that:
1. Auto-fill known data (hackathon slug from page context, GitHub username from OAuth)
2. Provide dynamic dropdowns (tracks from hackathon.yml data)
3. Validate inputs client-side before redirect
4. Generate pre-filled GitHub Issue/PR URLs for one-click submission

Migrate existing interactive components to React + shadcn/ui for consistency.

## Architecture

### Component Organization

```
site/src/
├── components/
│   ├── ui/                        ← shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── textarea.tsx
│   │   ├── label.tsx
│   │   ├── slider.tsx
│   │   ├── accordion.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── dropdown-menu.tsx
│   │
│   ├── forms/                     ← Smart forms (React Islands)
│   │   ├── RegisterForm.tsx
│   │   ├── NDASignForm.tsx
│   │   ├── AppealForm.tsx
│   │   ├── TeamFormationForm.tsx
│   │   ├── ProfileCreateForm.tsx
│   │   ├── CreateHackathonForm.tsx
│   │   ├── CreateProposalForm.tsx    ← 提案创建表单，生成 GitHub Issue URL
│   │   ├── TimelineEditor.tsx        ← 时间线编辑器，用于 CreateHackathonForm 中的阶段日期选择
│   │   └── form-utils.ts
│   │
│   ├── ScoreCard.tsx              ← Migrated from .astro
│   ├── FAQAccordion.tsx           ← Migrated from .astro
│   ├── DatasetDownload.tsx        ← Migrated from .astro
│   ├── OAuthButton.tsx            ← Migrated from .astro
│   ├── HackathonTabs.tsx          ← 活动详情页 Tab 切换器（Details / Submissions / Leaderboard）
│   │
│   ├── HackathonCard.astro        ← Keep (no interaction)
│   ├── ProjectCard.astro          ← Keep (no interaction)
│   ├── TrackSection.astro         ← Keep (no interaction)
│   ├── Timeline.astro             ← Keep (no interaction)
│   ├── EventCalendar.astro        ← Keep (no interaction)
│   ├── JudgeCard.astro            ← Keep (no interaction)
│   ├── NavBar.astro               ← Keep (embeds OAuthButton as island)
│   └── Footer.astro               ← Keep
│
├── lib/
│   └── github-url.ts              ← GitHub Issue/PR URL builder
│
├── hooks/
│   └── useAuth.ts                 ← OAuth state hook
│
└── pages/
    ├── create-profile.astro       ← New page
    └── create-hackathon.astro     ← New page
```

### Migration Principle

- **Interactive components** → Migrate to React + shadcn/ui
- **Display-only components** → Keep as .astro (zero JS, best performance)
- All React components embedded via Astro `client:visible` or `client:load`

### Data Flow

```
[Astro page — build time]
  → Read hackathon.yml / profiles data
  → Pass as props to React Islands

[React Island — browser runtime]
  → Call /api/auth/me for login state
  → Render form UI with shadcn/ui
  → Client-side validation
  → Generate pre-filled GitHub URL
  → window.open() to submit
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@astrojs/react": "^4.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^3.x",
    "lucide-react": "^0.x"
  }
}
```

## Shared Infrastructure

### `lib/github-url.ts`

Centralized GitHub URL generation replacing scattered URL construction.

```typescript
const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';

interface IssueUrlParams {
  template: string;
  title: string;
  labels: string[];
  fields?: Record<string, string>;
}

interface PRUrlParams {
  filename: string;
  value: string;
  branch?: string;
  message?: string;
}

function buildIssueUrl(params: IssueUrlParams): string;
function buildPRUrl(params: PRUrlParams): string;
function openGitHubUrl(url: string): void;
```

### `hooks/useAuth.ts`

```typescript
interface AuthState {
  user: { login: string; avatar_url: string } | null;
  loading: boolean;
  isLoggedIn: boolean;
}

function useAuth(): AuthState;
// Calls /api/auth/me, caches result in component lifecycle
```

### `forms/form-utils.ts`

- `formatYaml(obj: Record<string, unknown>): string` — Object to YAML string
- `validateRequired(fields: Record<string, unknown>): string[]` — Returns missing field names
- Type definitions for Track, Hackathon, Criterion shared across forms

## Smart Forms Design

### 1. RegisterForm

**Location**: `hackathons/[slug].astro` — visible during registration stage
**Replaces**: Current GitHubRedirect `action="register"`

**Props** (injected from hackathon.yml at build time):
```typescript
interface RegisterFormProps {
  hackathonSlug: string;
  hackathonName: string;
  tracks: { slug: string; name: string; name_zh?: string }[];
  ndaRequired: boolean;
  lang: 'zh' | 'en';
}
```

**Behavior**:
- Auto-fill hackathon slug (read-only display)
- Auto-fill GitHub username from OAuth (/api/auth/me)
- Track: shadcn Select dropdown populated from hackathon.yml tracks
- Role: shadcn Select dropdown (Solo / Team Lead / Team Member)
- Team Name: conditionally shown (hidden when Solo selected)
- NDA warning: shown when ndaRequired=true, with link to NDA sign section
- Login prompt: shown when not authenticated, form disabled
- Submit: generates pre-filled GitHub Issue URL with template=register.yml

**Generated URL format**:
```
https://github.com/Synnovator/monorepo/issues/new
  ?template=register.yml
  &title=[Register] alice-dev — dishuihu-ai-opc-global-challenge-2026
  &labels=registration,hackathon:dishuihu-ai-opc-global-challenge-2026
  &hackathon=dishuihu-ai-opc-global-challenge-2026
  &github=alice-dev
  &track=ai-application
  &role=Participant (Solo)
```

### 2. NDASignForm

**Location**: `hackathons/[slug].astro` — NDA section (when nda.required=true)

**Props**:
```typescript
interface NDASignFormProps {
  hackathonSlug: string;
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: 'zh' | 'en';
}
```

**Behavior**:
- Auto-fill hackathon slug + GitHub username
- Display NDA document link (download) and summary text
- 3 required checkboxes (same as nda-sign.yml template)
- All checkboxes must be checked to enable submit
- Submit: generates pre-filled GitHub Issue URL with template=nda-sign.yml

### 3. AppealForm

**Location**: `hackathons/[slug].astro` — visible during announcement stage

**Props**:
```typescript
interface AppealFormProps {
  hackathonSlug: string;
  tracks: { slug: string; name: string }[];
  teams: { name: string; track: string; members: string[] }[];
  lang: 'zh' | 'en';
}
```

**Behavior**:
- Team name: Select dropdown filtered by logged-in user's teams
- Track: auto-filled based on selected team
- Expected result: Select dropdown (Re-scoring / Ranking adjustment / Rule clarification / Other)
- Appeal type: Select dropdown (Scoring dispute / Rule interpretation / Technical issue / Other)
- Description: Textarea (required)
- Supporting evidence: Textarea (optional)
- Acknowledgment checkbox (required)
- Submit: generates pre-filled GitHub Issue URL with template=appeal.yml

### 4. TeamFormationForm

**Location**: `hackathons/[slug].astro` — visible during registration/development stages

**Props**:
```typescript
interface TeamFormationFormProps {
  hackathonSlug: string;
  tracks: { slug: string; name: string }[];
  lang: 'zh' | 'en';
}
```

**Behavior**:
- Auto-fill hackathon slug
- Team name: text input
- Track: Select dropdown from hackathon.yml tracks
- Purpose: Select dropdown (Looking for teammates / Announcing formed team)
- Members: dynamic list (add/remove GitHub username + role pairs)
- Looking for: Textarea (skills/roles description)
- Project idea: Textarea (optional)
- Submit: generates pre-filled GitHub Issue URL with template=team-formation.yml

### 5. ProfileCreateForm

**Location**: New page `/create-profile`

**Props**:
```typescript
interface ProfileCreateFormProps {
  lang: 'zh' | 'en';
}
```

**Behavior**: Multi-step wizard
1. **Basic Info**: GitHub username (auto-filled from OAuth), display name, bio
2. **Identity**: type Select (student/professional/academic), conditional fields (affiliation, degree, major, graduation_year for students)
3. **Skills**: category + items (add/remove), common categories suggested
4. **More**: interests, looking_for, links (twitter, linkedin, website)
5. **Preview**: show generated YAML
6. **Submit**: generate GitHub PR URL to create `profiles/{username}.yml`

### 6. CreateHackathonForm

**Location**: New page `/create-hackathon`

**Props**:
```typescript
interface CreateHackathonFormProps {
  templates: Record<'community' | 'enterprise' | 'youth-league', HackathonYaml>;
  lang: 'zh' | 'en';
}
```

**Behavior**: Multi-step wizard (references synnovator-admin create-hackathon flow)
1. **Type Selection**: community / enterprise / youth-league → loads template defaults
2. **Basic Info**: name, name_zh, slug (auto-generated from name), tagline, description
3. **Organizers**: add/remove organizer entries (name, role, website)
4. **Timeline**: 7 stage date/time pickers (registration → award)
5. **Tracks**: add/remove tracks, each with name, slug, rewards, judging criteria (weights must sum to 1.0), deliverables
6. **Legal**: license, IP ownership, NDA config (enterprise: required fields)
7. **Settings**: language, ai_review toggle, multi_track toggle, public_vote
8. **Preview**: show generated hackathon.yml YAML
9. **Submit**: generate GitHub PR URL to create `hackathons/{slug}/hackathon.yml`

## Component Migration Details

### ScoreCard.astro → ScoreCard.tsx

- Replace `<script define:vars>` with React state and event handlers
- Replace manual DOM queries with React refs/state
- Replace slider/number sync with controlled components (shadcn Slider + Input)
- Replace YAML string concatenation with `formatYaml()` utility
- Replace `window.open()` URL construction with `buildIssueUrl()`
- Keep all existing functionality: weighted total calculation, conflict checkbox gate, per-criterion comments

### FAQAccordion.astro → FAQAccordion.tsx

- Replace native `<details>` elements with shadcn Accordion
- Props remain same: `faq: { q: string; q_en: string; a: string; a_en: string }[]`
- Bilingual display based on lang prop

### DatasetDownload.astro → DatasetDownload.tsx

- Replace inline `<script>` with React component
- Use `useAuth()` hook for auth state
- Use shadcn Button for download triggers
- Use shadcn Alert for NDA required error messages
- Keep /api/presign integration

### OAuthButton.astro → OAuthButton.tsx

- Replace inline `<script>` with React component + useAuth() hook
- Use shadcn DropdownMenu for user avatar menu
- Use shadcn Button for login/logout

## New Pages

### `/create-profile`

- BaseLayout with ProfileCreateForm as React Island (`client:load`)
- Accessible from: guides/hacker, NavBar user menu, homepage CTA

### `/create-hackathon`

- BaseLayout with CreateHackathonForm as React Island (`client:load`)
- Accessible from: guides/organizer, NavBar (if user is organizer)
- Templates loaded at build time from `docs/templates/*/hackathon.yml`

## Island Loading Strategy

| Component | Directive | Reason |
|-----------|-----------|--------|
| OAuthButton | `client:load` | Needed immediately in navbar |
| RegisterForm | `client:visible` | Below fold, load on scroll |
| NDASignForm | `client:visible` | Below fold |
| AppealForm | `client:visible` | Below fold |
| TeamFormationForm | `client:visible` | Below fold |
| ScoreCard | `client:visible` | Below fold |
| FAQAccordion | `client:visible` | Below fold |
| DatasetDownload | `client:visible` | Below fold |
| ProfileCreateForm | `client:load` | Page's main content |
| CreateHackathonForm | `client:load` | Page's main content |
| CreateProposalForm | `client:visible` | Below fold |
| TimelineEditor | `client:visible` | Embedded within CreateHackathonForm |
| HackathonTabs | `client:load` | Tab navigation needed immediately |

## Out of Scope

- validate-registration workflow (backend automation — separate task)
- AI Review workflow
- Public voting UI
- User dashboard (my registrations/submissions)
- Language switcher implementation
- These are tracked separately and not part of this design.
