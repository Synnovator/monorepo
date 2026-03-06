import { buildIssueUrl, buildPRUrl } from '@/lib/github-url';

interface GitHubRedirectProps {
  action: 'register' | 'submit' | 'appeal' | 'create-profile' | 'edit-file';
  hackathonSlug?: string;
  label: string;
  className?: string;
}

export function GitHubRedirect({ action, hackathonSlug, label, className = '' }: GitHubRedirectProps) {
  let url = '#';

  switch (action) {
    case 'register':
      url = buildIssueUrl({
        template: 'register.yml',
        title: `[Register] --- — ${hackathonSlug}`,
        labels: ['registration', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'submit':
      url = buildPRUrl({
        filename: `hackathons/${hackathonSlug}/submissions/team-name/project.yml`,
        value: '',
        message: `[Submit] team-name — ${hackathonSlug}`,
      });
      break;
    case 'appeal':
      url = buildIssueUrl({
        template: 'appeal.yml',
        title: `[Appeal] --- — ${hackathonSlug}`,
        labels: ['appeal', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'create-profile':
      url = buildPRUrl({
        filename: 'profiles/username.yml',
        value: '',
        message: '[Profile] Create profile',
      });
      break;
    case 'edit-file':
      url = '#';
      break;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      {label}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
