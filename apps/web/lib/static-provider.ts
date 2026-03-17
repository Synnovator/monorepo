import type { DataProvider, SerializedMDX } from '@synnovator/shared/data';
import type { Lang } from '@synnovator/shared/i18n';
import {
  listHackathons,
  getHackathon,
  listProfiles,
  getProfile,
  listSubmissions,
  getResults,
  listPublicHackathons,
  listPublicSubmissions,
} from '@/app/_generated/data';

/**
 * Static data provider for Cloudflare Workers runtime.
 *
 * Wraps the pre-generated JSON accessors (built by generate-static-data.mjs)
 * and adds MDX content getters. MDX data is loaded from static-mdx/ files
 * that are also generated at build time.
 */
export class StaticDataProvider implements DataProvider {
  listHackathons() {
    return listHackathons();
  }

  getHackathon(slug: string) {
    return getHackathon(slug);
  }

  listProfiles() {
    return listProfiles();
  }

  getProfile(github: string) {
    return getProfile(github);
  }

  getProfileByFilestem(filestem: string) {
    return (
      listProfiles().find((p) => {
        // Match by filestem - profiles are stored as {filestem}.yml
        const github = p.hacker?.github;
        return github === filestem || filestem.includes(github || '');
      }) ?? null
    );
  }

  listSubmissions() {
    return listSubmissions();
  }

  listPublicHackathons() {
    return listPublicHackathons();
  }

  listPublicSubmissions() {
    return listPublicSubmissions();
  }

  getResults(hackathonSlug: string) {
    return getResults(hackathonSlug);
  }

  // MDX getters - these try to import from the generated static-mdx files.
  // At build time, these are available. At runtime in CF Workers, they're bundled.
  // Dynamic imports won't work in CF Workers, so for now these return null.
  // They will be populated when the MDX manifest approach is implemented.
  getHackathonMdx(_slug: string, _lang: Lang): SerializedMDX | null {
    return null;
  }

  getTrackMdx(
    _hackathonSlug: string,
    _trackSlug: string,
    _lang: Lang,
  ): SerializedMDX | null {
    return null;
  }

  getStageMdx(
    _hackathonSlug: string,
    _stageKey: string,
    _lang: Lang,
  ): SerializedMDX | null {
    return null;
  }

  getSubmissionMdx(
    _hackathonSlug: string,
    _teamSlug: string,
    _lang: Lang,
  ): SerializedMDX | null {
    return null;
  }

  getProfileMdx(_filestem: string, _lang: Lang): SerializedMDX | null {
    return null;
  }
}
