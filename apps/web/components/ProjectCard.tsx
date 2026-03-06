import Link from 'next/link';
import { localize } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface ProjectCardProps {
  project: {
    name: string;
    name_zh?: string;
    tagline?: string;
    tagline_zh?: string;
    track: string;
    team: Array<{ github: string; role?: string }>;
    tech_stack?: string[];
    likes?: number;
  };
  hackathonSlug: string;
  teamSlug: string;
  lang: Lang;
}

export function ProjectCard({ project, hackathonSlug, teamSlug, lang }: ProjectCardProps) {
  const detailUrl = `/projects/${hackathonSlug}/${teamSlug}`;

  return (
    <Link href={detailUrl} className="block rounded-lg border border-secondary-bg bg-dark-bg p-5 hover:border-lime-primary/30 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-white font-medium text-sm group-hover:text-lime-primary transition-colors">
            {localize(lang, project.name, project.name_zh)}
          </h4>
          {project.tagline && (
            <p className="text-muted text-xs mt-1">{localize(lang, project.tagline, project.tagline_zh)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(project.likes != null && project.likes > 0) && (
            <span className="text-xs px-2 py-1 rounded-full bg-pink/10 text-pink whitespace-nowrap flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/></svg>
              {project.likes}
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
            {project.track}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {project.team.map(member => (
          <span key={member.github} className="flex items-center gap-1 text-xs text-muted">
            <img
              src={`https://github.com/${member.github}.png?size=20`}
              alt={member.github}
              className="w-4 h-4 rounded-full"
              loading="lazy"
            />
            {member.github}
          </span>
        ))}
      </div>

      {project.tech_stack && project.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.map(tech => (
            <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-neon-blue/10 text-neon-blue">
              {tech}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
