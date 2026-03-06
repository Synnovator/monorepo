import Link from 'next/link';
import { localize, t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface JudgeCardProps {
  judge: {
    github: string;
    name: string;
    name_zh?: string;
    title?: string;
    affiliation?: string;
    expertise?: string;
    conflict_declaration?: string;
  };
  lang: Lang;
  profileSlug?: string;
}

export function JudgeCard({ judge, lang, profileSlug }: JudgeCardProps) {
  const profileUrl = profileSlug ? `/hackers/${profileSlug}` : undefined;
  const displayName = localize(lang, judge.name, judge.name_zh);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border border-secondary-bg bg-dark-bg">
      {profileUrl ? (
        <Link href={profileUrl} className="shrink-0 group">
          <img
            src={`https://github.com/${judge.github}.png`}
            alt={displayName}
            className="w-12 h-12 rounded-full bg-secondary-bg ring-2 ring-transparent group-hover:ring-lime-primary transition-all"
            loading="lazy"
          />
        </Link>
      ) : (
        <img
          src={`https://github.com/${judge.github}.png`}
          alt={displayName}
          className="w-12 h-12 rounded-full bg-secondary-bg shrink-0"
          loading="lazy"
        />
      )}
      <div>
        {profileUrl ? (
          <Link href={profileUrl} className="text-white font-medium text-sm hover:text-lime-primary transition-colors">
            {displayName}
          </Link>
        ) : (
          <p className="text-white font-medium text-sm">{displayName}</p>
        )}
        {judge.title && <p className="text-muted text-xs">{judge.title}</p>}
        {judge.affiliation && <p className="text-muted text-xs">{judge.affiliation}</p>}
        {judge.expertise && <p className="text-cyan text-xs mt-1">{judge.expertise}</p>}
        {judge.conflict_declaration && (
          <a
            href={judge.conflict_declaration}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-lime-primary hover:underline"
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            {t(lang, 'conflict.confirmed')}
          </a>
        )}
      </div>
    </div>
  );
}
