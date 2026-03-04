const GITHUB_ORG = 'Synnovator';
const GITHUB_REPO = 'monorepo';
const BASE_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

export interface IssueUrlParams {
  template?: string;
  title: string;
  labels?: string[];
  body?: string;
  /** Field IDs from issue template YAML to pre-fill via query params */
  fields?: Record<string, string>;
}

export interface PRUrlParams {
  filename: string;
  value: string;
  branch?: string;
  message?: string;
}

/**
 * Build a GitHub "new issue" URL with pre-filled fields.
 * GitHub Issue template forms support query param pre-fill:
 * ?template=register.yml&title=xxx&labels=yyy&field_id=value
 */
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

/**
 * Build a GitHub "create file" URL (for PR-based creation).
 * NOTE: GitHub's /new/ endpoint shows a warning when the file already exists.
 * For NDA/registration flows that edit existing profiles, consider adding
 * a /edit/ URL builder or server-side PR creation via GitHub API.
 */
export function buildPRUrl(params: PRUrlParams): string {
  const branch = params.branch || 'main';
  const url = new URL(`${BASE_URL}/new/${branch}`);
  url.searchParams.set('filename', params.filename);
  url.searchParams.set('value', params.value);
  if (params.message) url.searchParams.set('message', params.message);
  return url.toString();
}

/**
 * Open a GitHub URL in a new tab.
 */
export function openGitHubUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export { GITHUB_ORG, GITHUB_REPO, BASE_URL };
