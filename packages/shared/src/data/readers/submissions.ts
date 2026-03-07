import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { SubmissionSchema, type Submission } from '../../schemas/submission';

export interface SubmissionWithMeta extends Submission {
  /** The hackathon directory name (slug) this submission belongs to */
  _hackathonSlug: string;
  /** The team/submission directory name */
  _teamSlug: string;
}

/**
 * List all submissions across all hackathons.
 */
export async function listSubmissions(dataRoot: string): Promise<SubmissionWithMeta[]> {
  const hackathonsDir = path.join(dataRoot, 'hackathons');
  const hackathonEntries = await fs.readdir(hackathonsDir, { withFileTypes: true });
  const hackathonDirs = hackathonEntries.filter(e => e.isDirectory());

  const results: SubmissionWithMeta[] = [];

  for (const hackathonDir of hackathonDirs) {
    const submissionsDir = path.join(hackathonsDir, hackathonDir.name, 'submissions');
    try {
      const teamEntries = await fs.readdir(submissionsDir, { withFileTypes: true });
      const teamDirs = teamEntries.filter(e => e.isDirectory());

      for (const teamDir of teamDirs) {
        const filePath = path.join(submissionsDir, teamDir.name, 'project.yml');
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = yaml.load(content);
          const parsed = SubmissionSchema.parse(data);
          results.push({
            ...parsed,
            _hackathonSlug: hackathonDir.name,
            _teamSlug: teamDir.name,
          });
        } catch {
          // Skip invalid submissions
        }
      }
    } catch {
      // No submissions directory for this hackathon
    }
  }

  return results;
}

/**
 * List submissions for a specific hackathon by its directory slug.
 */
export async function getSubmissionsByHackathon(
  hackathonSlug: string,
  dataRoot: string,
): Promise<SubmissionWithMeta[]> {
  const all = await listSubmissions(dataRoot);
  return all.filter(s => s._hackathonSlug === hackathonSlug);
}
