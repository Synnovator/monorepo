import type { createGitHubClient } from './github-client';

export interface PendingReview {
  id: number;
  title: string;
  submitter: string;
  createdAt: string;
  labels: string[];
  url: string;
  type: 'hackathon' | 'profile' | 'submission' | 'unknown';
}

function parsePRType(labels: string[]): PendingReview['type'] {
  if (labels.includes('hackathon')) return 'hackathon';
  if (labels.includes('profile')) return 'profile';
  if (labels.includes('submission')) return 'submission';
  return 'unknown';
}

export async function listPendingReviews(
  client: ReturnType<typeof createGitHubClient>,
  owner: string,
  repo: string,
  type?: 'hackathon' | 'profile' | 'submission',
): Promise<PendingReview[]> {
  const labels = ['pending-review'];
  if (type) labels.push(type);

  const prs = await client.listOpenPRs(owner, repo, labels);

  return prs.map(pr => ({
    id: pr.number,
    title: pr.title,
    submitter: pr.user?.login ?? 'unknown',
    createdAt: pr.created_at,
    labels: pr.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')),
    url: pr.html_url,
    type: parsePRType(
      pr.labels.map(l => (typeof l === 'string' ? l : l.name ?? '')),
    ),
  }));
}
