const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';
const BASE_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

export interface IssueUrlParams {
  template?: string;
  title: string;
  labels?: string[];
  body?: string;
  fields?: Record<string, string>;
}

export function buildIssueUrl(params: IssueUrlParams): string {
  const url = new URL(`${BASE_URL}/issues/new`);
  if (params.template) url.searchParams.set('template', params.template);
  url.searchParams.set('title', params.title);
  if (params.labels?.length) url.searchParams.set('labels', params.labels.join(','));
  if (params.body) url.searchParams.set('body', params.body);
  if (params.fields) {
    for (const [key, value] of Object.entries(params.fields)) {
      if (value) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export interface PRUrlParams {
  title: string;
  branch: string;
  files: { path: string; content: string }[];
}

/**
 * Build a GitHub URL for creating a new file via the web editor.
 * Uses the format: github.com/{owner}/{repo}/new/{default-branch}?filename={path}&value={content}&message={commit-message}
 * Note: GitHub web editor only supports single-file creation. For the first file in the files array.
 */
export function buildPRUrl(params: PRUrlParams): string {
  const file = params.files[0];
  if (!file) return `${BASE_URL}`;
  const url = new URL(`${BASE_URL}/new/main`);
  url.searchParams.set('filename', file.path);
  url.searchParams.set('value', file.content);
  url.searchParams.set('message', params.title);
  return url.toString();
}

export function openGitHubUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { GITHUB_ORG, GITHUB_REPO, BASE_URL };
