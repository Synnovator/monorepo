import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listSubmissions, listProfiles, getHackathon } from '@/app/_generated/data';
import { t, localize, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listSubmissions().map(s => ({ hackathon: s._hackathonSlug, team: s._teamSlug }));
}

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ hackathon: string; team: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { hackathon, team } = await params;
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const allSubmissions = listSubmissions();
  const entry = allSubmissions.find(s => s._hackathonSlug === hackathon && s._teamSlug === team);
  if (!entry) notFound();

  const project = entry.project;

  // Get hackathon name for breadcrumb
  const hackathonEntry = getHackathon(hackathon);
  const hackathonName = hackathonEntry
    ? localize(lang, hackathonEntry.hackathon.name, hackathonEntry.hackathon.name_zh)
    : hackathon;

  // Track name lookup
  const trackName = hackathonEntry?.hackathon.tracks?.find((tr: { slug: string }) => tr.slug === project.track);

  // Build github → profile slug map for member links
  const profiles = listProfiles();
  const githubToProfile = new Map<string, string>();
  for (const p of profiles) {
    if (p.hacker.github) {
      githubToProfile.set(p.hacker.github, p.hacker.github);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/hackathons/${hackathon}#submissions`} className="text-sm text-muted hover:text-white mb-6 inline-block">
        ← {hackathonName}
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">
            {localize(lang, project.name, project.name_zh)}
          </h1>
          {project.tagline && (
            <p className="text-lg text-muted">{localize(lang, project.tagline, project.tagline_zh)}</p>
          )}
        </div>
        {trackName && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-secondary-bg text-muted whitespace-nowrap">
            {localize(lang, trackName.name, trackName.name_zh)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {project.description ? (
            <div className="prose prose-invert prose-sm max-w-none text-light-gray">
              <p>{localize(lang, project.description, project.description_zh)}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
              <p className="text-muted">{t(lang, 'project.no_readme')}</p>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <section>
            <h3 className="text-sm font-medium text-muted mb-3">{t(lang, 'project.team_members')}</h3>
            <div className="space-y-2">
              {project.team.map((member: { github: string; role?: string }) => {
                const profileId = githubToProfile.get(member.github);
                const inner = (
                  <>
                    <img
                      src={`https://github.com/${member.github}.png?size=40`}
                      alt={member.github}
                      className="w-8 h-8 rounded-full"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-white text-sm">{member.github}</p>
                      {member.role && <p className="text-muted text-xs">{member.role}</p>}
                    </div>
                  </>
                );
                return profileId ? (
                  <Link key={member.github} href={`/hackers/${profileId}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-bg/50 transition-colors">
                    {inner}
                  </Link>
                ) : (
                  <span key={member.github} className="flex items-center gap-3 p-2 rounded-lg text-muted/70">
                    {inner}
                  </span>
                );
              })}
            </div>
          </section>

          {project.tech_stack && project.tech_stack.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-muted mb-3">{t(lang, 'project.tech_stack')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tech_stack.map((tech: string) => (
                  <span key={tech} className="text-xs px-2 py-1 rounded-full bg-neon-blue/10 text-neon-blue">{tech}</span>
                ))}
              </div>
            </section>
          )}

          {project.deliverables && (
            <section>
              <h3 className="text-sm font-medium text-muted mb-3">{t(lang, 'project.deliverables')}</h3>
              <div className="space-y-2">
                {project.deliverables.repo && (
                  <a href={project.deliverables.repo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-lime-primary/30 transition-colors text-sm text-white">
                    <span className="text-lime-primary">→</span> {t(lang, 'project.view_repo')}
                  </a>
                )}
                {project.deliverables.demo && (
                  <a href={project.deliverables.demo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-neon-blue/30 transition-colors text-sm text-white">
                    <span className="text-neon-blue">→</span> Demo
                  </a>
                )}
                {project.deliverables.video && (
                  <a href={project.deliverables.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-secondary-bg hover:border-pink/30 transition-colors text-sm text-white">
                    <span className="text-pink">→</span> Video
                  </a>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
