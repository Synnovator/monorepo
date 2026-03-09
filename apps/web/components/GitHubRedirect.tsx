import { buildIssueUrl } from '@/lib/github-url';
import { ExternalLinkIcon } from './icons';

interface GitHubRedirectProps {
  action: 'register' | 'submit' | 'appeal' | 'create-profile' | 'edit-file';
  hackathonSlug?: string;
  label: string;
  className?: string;
}

export function GitHubRedirect({ action, hackathonSlug, label, className = '' }: GitHubRedirectProps) {
  let url = '#';
  let isExternal = true;

  switch (action) {
    case 'register':
      url = buildIssueUrl({
        template: 'register.yml',
        title: `[Register] --- — ${hackathonSlug}`,
        labels: ['registration', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'submit':
      url = `/create-proposal${hackathonSlug ? `?hackathon=${hackathonSlug}` : ''}`;
      isExternal = false;
      break;
    case 'appeal':
      url = buildIssueUrl({
        template: 'appeal.yml',
        title: `[Appeal] --- — ${hackathonSlug}`,
        labels: ['appeal', `hackathon:${hackathonSlug}`],
      });
      break;
    case 'create-profile':
      url = '/create-profile';
      isExternal = false;
      break;
    case 'edit-file':
      url = '#';
      break;
  }

  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}>
        {label}
        <ExternalLinkIcon size={12} />
      </a>
    );
  }

  return (
    <a href={url}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}>
      {label}
    </a>
  );
}
