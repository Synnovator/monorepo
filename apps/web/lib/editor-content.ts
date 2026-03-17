// apps/web/lib/editor-content.ts

import { getHackathon, listSubmissions } from '@/app/_generated/data';
import editorMdxData from '@/app/_generated/editor-mdx.json';
import type { BilingualContent } from './bilingual';

// Re-export for convenience (server-side callers can import from either)
export type { BilingualContent } from './bilingual';
export { resolveBilingual } from './bilingual';

// Cast JSON import to typed record
const editorMdx = editorMdxData as Record<string, string>;

// ---------------------------------------------------------------------------
// MDX source loader — fail-fast on missing files
// ---------------------------------------------------------------------------

/**
 * Load raw MDX source from pre-generated editor-mdx.json.
 * Throws if the key is missing — MDX files must exist.
 */
function loadMdx(key: string): string {
  const content = editorMdx[key];
  if (content === undefined) {
    throw new Error(
      `Missing MDX: "${key}". ` +
      `Ensure the .mdx file exists and run \`pnpm --filter @synnovator/web prebuild\` to regenerate.`,
    );
  }
  return content;
}

/** Load bilingual MDX pair. Both en and zh must exist. */
function loadBilingualMdx(keyBase: string): BilingualContent {
  return {
    en: loadMdx(keyBase),
    zh: loadMdx(`${keyBase}.zh`),
  };
}

// ---------------------------------------------------------------------------
// Hackathon editor data
// ---------------------------------------------------------------------------

export interface HackathonEditorData {
  slug: string;
  name: BilingualContent;
  description: BilingualContent;
  tracks: Array<{
    slug: string;
    name: BilingualContent;
    description: BilingualContent;
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

// ---------------------------------------------------------------------------
// Proposal editor data
// ---------------------------------------------------------------------------

export interface ProposalEditorData {
  hackathonSlug: string;
  teamSlug: string;
  projectName: BilingualContent;
  hackathonName: BilingualContent;
  trackName: BilingualContent;
  description: BilingualContent;
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

  // Load hackathon name and track name for PR metadata
  const hackathonEntry = getHackathon(hackathonSlug);
  const h = hackathonEntry?.hackathon;
  const trackSlug = entry.project.track;
  const track = h?.tracks?.find((t) => t.slug === trackSlug);

  return {
    hackathonSlug,
    teamSlug,
    projectName: {
      en: entry.project.name,
      zh: entry.project.name_zh ?? entry.project.name,
    },
    hackathonName: {
      en: h?.name ?? hackathonSlug,
      zh: h?.name_zh ?? h?.name ?? hackathonSlug,
    },
    trackName: {
      en: track?.name ?? trackSlug ?? '',
      zh: track?.name_zh ?? track?.name ?? trackSlug ?? '',
    },
    description: loadBilingualMdx(`submission:${hackathonSlug}:${teamSlug}`),
  };
}
