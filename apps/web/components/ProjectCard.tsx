import Link from 'next/link';
import { localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card, Avatar, AvatarImage, AvatarFallback } from '@synnovator/ui';
import { HeartIcon } from './icons';
import { getTeam } from '@/app/_generated/data';

interface ProjectCardProps {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team_ref: string;
    tech_stack?: string[];
    likes?: number;
  };
  hackathonSlug: string;
  teamSlug: string;
  lang: Lang;
}

export function ProjectCard({ project, hackathonSlug, teamSlug, lang }: ProjectCardProps) {
  const detailUrl = `/projects/${hackathonSlug}/${teamSlug}`;

  // Look up team members from team_ref
  const teamData = getTeam(project.team_ref);
  const members = teamData
    ? [{ github: teamData.leader, role: 'leader' }, ...teamData.members]
    : [];

  return (
    <Card className="hover:border-primary/30 transition-colors group">
      <Link href={detailUrl} className="block p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-foreground font-medium text-sm group-hover:text-primary transition-colors">
            {localize(lang, project.name, project.name_zh)}
          </h4>
          {project.tagline && (
            <p className="text-muted-foreground text-xs mt-1">{localize(lang, project.tagline, project.tagline_zh)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(project.likes != null && project.likes > 0) && (
            <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive whitespace-nowrap flex items-center gap-1">
              <HeartIcon size={12} aria-hidden="true" />
              {project.likes}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
            {project.track}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {members.map(member => (
          <span key={member.github} className="flex items-center gap-1 text-xs text-muted-foreground">
            <Avatar className="h-4 w-4">
              <AvatarImage src={`https://github.com/${member.github}.png?size=20`} alt={member.github} />
              <AvatarFallback className="text-[8px]">{member.github[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            {member.github}
          </span>
        ))}
      </div>

      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.map(tech => (
            <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info">
              {tech}
            </span>
          ))}
        </div>
      )}
      </Link>
    </Card>
  );
}
