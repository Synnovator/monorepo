import type { Hackathon } from '../schemas/hackathon';
import type { Profile } from '../schemas/profile';
import type { SubmissionWithMeta } from './readers/submissions';
import type { Lang } from '../i18n';

/**
 * MDX 编译后的序列化格式。
 * 使用 @mdx-js/mdx compile() 的 outputFormat: 'function-body' 输出。
 * 可通过 @mdx-js/mdx 的 run() 执行为 React 组件。
 */
export type SerializedMDX = string;

// Re-export for convenience (canonical definition is in ./readers/submissions)
export type { SubmissionWithMeta };

/**
 * Unified data access interface.
 * Two implementations: StaticDataProvider (apps/web) and FsDataProvider (Node.js).
 */
export interface DataProvider {
  // YAML data
  listHackathons(): Hackathon[];
  getHackathon(slug: string): Hackathon | null;
  listProfiles(): Profile[];
  getProfile(github: string): Profile | null;
  getProfileByFilestem(filestem: string): Profile | null;
  listSubmissions(): SubmissionWithMeta[];
  getResults(hackathonSlug: string): unknown[];

  // MDX content
  getHackathonMdx(slug: string, lang: Lang): SerializedMDX | null;
  getTrackMdx(hackathonSlug: string, trackSlug: string, lang: Lang): SerializedMDX | null;
  getStageMdx(hackathonSlug: string, stageKey: string, lang: Lang): SerializedMDX | null;
  getSubmissionMdx(hackathonSlug: string, teamSlug: string, lang: Lang): SerializedMDX | null;
  getProfileMdx(filestem: string, lang: Lang): SerializedMDX | null;
}
