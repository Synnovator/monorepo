import type { DataProvider, SerializedMDX } from './provider';
import type { Lang } from '../i18n';
import type { Hackathon } from '../schemas/hackathon';
import type { Profile } from '../schemas/profile';
import type { SubmissionWithMeta } from './readers/submissions';
import type { ResultWithMeta } from './readers/results';
import {
  listHackathons,
  listProfiles,
  listSubmissions,
  getResults,
} from './readers';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Filesystem-based data provider for local development and build scripts.
 *
 * WARNING: Uses `node:fs` directly — NOT compatible with Cloudflare Workers runtime.
 * Only use in Node.js environments (build scripts, local dev, tests).
 *
 * Because the underlying reader functions are async, this provider must be
 * initialised via `FsDataProvider.create(dataRoot)` which pre-loads all data.
 */
export class FsDataProvider implements DataProvider {
  private hackathons: Hackathon[] = [];
  private profiles: Profile[] = [];
  private submissions: SubmissionWithMeta[] = [];
  private resultsByHackathon: Map<string, ResultWithMeta[]> = new Map();

  private constructor(private dataRoot: string) {}

  /**
   * Create and initialise a FsDataProvider by reading all data from disk.
   */
  static async create(dataRoot: string): Promise<FsDataProvider> {
    const provider = new FsDataProvider(dataRoot);
    await provider.load();
    return provider;
  }

  private async load(): Promise<void> {
    this.hackathons = await listHackathons(this.dataRoot);
    this.profiles = await listProfiles(this.dataRoot);
    this.submissions = await listSubmissions(this.dataRoot);

    // Pre-load results for all hackathons
    for (const h of this.hackathons) {
      const slug = h.hackathon.slug;
      const results = await getResults(slug, this.dataRoot);
      if (results.length > 0) {
        this.resultsByHackathon.set(slug, results);
      }
    }
  }

  listHackathons(): Hackathon[] {
    return this.hackathons;
  }

  getHackathon(slug: string): Hackathon | null {
    return this.hackathons.find((h) => h.hackathon.slug === slug) ?? null;
  }

  listProfiles(): Profile[] {
    return this.profiles;
  }

  getProfile(github: string): Profile | null {
    return this.profiles.find((p) => p.hacker.github === github) ?? null;
  }

  getProfileByFilestem(filestem: string): Profile | null {
    return this.profiles.find((p) => p.hacker.github === filestem) ?? null;
  }

  listSubmissions(): SubmissionWithMeta[] {
    return this.submissions;
  }

  listPublicHackathons(): Hackathon[] {
    return this.hackathons.filter(h => h.hackathon.visibility !== 'private');
  }

  listPublicSubmissions(): SubmissionWithMeta[] {
    const privateHackathonSlugs = new Set(
      this.hackathons
        .filter(h => h.hackathon.visibility === 'private')
        .map(h => h.hackathon.slug),
    );
    return this.submissions.filter(
      s => s.project.visibility !== 'private' && !privateHackathonSlugs.has(s._hackathonSlug),
    );
  }

  getResults(hackathonSlug: string): ResultWithMeta[] {
    return this.resultsByHackathon.get(hackathonSlug) ?? [];
  }

  private tryReadMdx(filePath: string): SerializedMDX | null {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  getHackathonMdx(slug: string, lang: Lang): SerializedMDX | null {
    const suffix = lang === 'zh' ? '.zh' : '';
    return this.tryReadMdx(
      path.join(this.dataRoot, 'hackathons', slug, `description${suffix}.mdx`),
    );
  }

  getTrackMdx(
    hackathonSlug: string,
    trackSlug: string,
    lang: Lang,
  ): SerializedMDX | null {
    const suffix = lang === 'zh' ? '.zh' : '';
    return this.tryReadMdx(
      path.join(
        this.dataRoot,
        'hackathons',
        hackathonSlug,
        'tracks',
        `${trackSlug}${suffix}.mdx`,
      ),
    );
  }

  getStageMdx(
    hackathonSlug: string,
    stageKey: string,
    lang: Lang,
  ): SerializedMDX | null {
    const suffix = lang === 'zh' ? '.zh' : '';
    return this.tryReadMdx(
      path.join(
        this.dataRoot,
        'hackathons',
        hackathonSlug,
        'stages',
        `${stageKey}${suffix}.mdx`,
      ),
    );
  }

  getSubmissionMdx(
    hackathonSlug: string,
    teamSlug: string,
    lang: Lang,
  ): SerializedMDX | null {
    const suffix = lang === 'zh' ? '.zh' : '';
    return this.tryReadMdx(
      path.join(
        this.dataRoot,
        'hackathons',
        hackathonSlug,
        'submissions',
        teamSlug,
        `README${suffix}.mdx`,
      ),
    );
  }

  getProfileMdx(filestem: string, lang: Lang): SerializedMDX | null {
    const suffix = lang === 'zh' ? '.zh' : '';
    return this.tryReadMdx(
      path.join(this.dataRoot, 'profiles', filestem, `bio${suffix}.mdx`),
    );
  }
}
