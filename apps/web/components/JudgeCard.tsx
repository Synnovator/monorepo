import Link from 'next/link';
import { localize, t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';
import { ShieldCheckIcon } from './icons';

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
    <Card className="flex items-start gap-4 p-4">
      {profileUrl ? (
        <Link href={profileUrl} className="shrink-0 group">
          <img
            src={`https://github.com/${judge.github}.png`}
            alt={displayName}
            className="w-12 h-12 rounded-full bg-muted ring-2 ring-transparent group-hover:ring-primary transition-all"
            loading="lazy"
          />
        </Link>
      ) : (
        <img
          src={`https://github.com/${judge.github}.png`}
          alt={displayName}
          className="w-12 h-12 rounded-full bg-muted shrink-0"
          loading="lazy"
        />
      )}
      <div>
        {profileUrl ? (
          <Link href={profileUrl} className="text-foreground font-medium text-sm hover:text-primary transition-colors">
            {displayName}
          </Link>
        ) : (
          <p className="text-foreground font-medium text-sm">{displayName}</p>
        )}
        {judge.title && <p className="text-muted-foreground text-xs">{judge.title}</p>}
        {judge.affiliation && <p className="text-muted-foreground text-xs">{judge.affiliation}</p>}
        {judge.expertise && <p className="text-info text-xs mt-1">{judge.expertise}</p>}
        {judge.conflict_declaration && (
          <a
            href={judge.conflict_declaration}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
          >
            <ShieldCheckIcon size={14} className="shrink-0" aria-hidden="true" />
            {t(lang, 'conflict.confirmed')}
          </a>
        )}
      </div>
    </Card>
  );
}
