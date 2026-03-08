import fs from 'node:fs/promises';
import path from 'node:path';
import { ResultSchema, type Result } from '../../schemas/result';

export interface ResultWithMeta extends Result {
  /** The hackathon directory name (slug) this result belongs to */
  _hackathonSlug: string;
  /** The result file name (without extension) */
  _fileName: string;
}

/**
 * Get results for a specific hackathon.
 * Results are stored as JSON files in hackathons/<slug>/results/*.json
 */
export async function getResults(
  hackathonSlug: string,
  dataRoot: string,
): Promise<ResultWithMeta[]> {
  const resultsDir = path.join(dataRoot, 'hackathons', hackathonSlug, 'results');
  const results: ResultWithMeta[] = [];

  try {
    const entries = await fs.readdir(resultsDir);
    const jsonFiles = entries.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(resultsDir, file), 'utf-8');
        const data = JSON.parse(content);
        const parsed = ResultSchema.parse(data);
        results.push({
          ...parsed,
          _hackathonSlug: hackathonSlug,
          _fileName: file.replace(/\.json$/, ''),
        });
      } catch {
        // Skip invalid result files
      }
    }
  } catch {
    // No results directory for this hackathon
  }

  return results;
}
