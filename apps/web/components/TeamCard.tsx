import Link from 'next/link';
import { Badge } from '@synnovator/ui';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface TeamCardProps {
  slug: string;
  name: string;
  nameZh?: string;
  status: string;
  leader: string;
  memberCount: number;
  lookingFor?: { roles?: string[]; description?: string };
  lang: Lang;
}

const STATUS_COLORS: Record<string, string> = {
  recruiting: 'bg-green-500/10 text-green-600 border-green-500/30',
  formed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  disbanded: 'bg-muted text-muted-foreground border-border',
};

export function TeamCard({
  slug, name, nameZh, status, leader, memberCount, lookingFor, lang,
}: TeamCardProps) {
  const displayName = lang === 'zh' && nameZh ? nameZh : name;
  const totalMembers = memberCount + 1;

  return (
    <Link href={`/teams/${slug}`}>
      <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          <Badge className={`text-xs border ${STATUS_COLORS[status] ?? ''}`}>
            {t(lang, `team.status_${status}`)}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {t(lang, 'team.leader')}: <span className="text-foreground">@{leader}</span>
          {' · '}
          {totalMembers} {t(lang, 'team.members_count')}
        </p>

        {status === 'recruiting' && lookingFor?.roles && lookingFor.roles.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lookingFor.roles.map(role => (
              <span key={role} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {role}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
