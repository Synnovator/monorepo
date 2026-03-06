import { notFound } from 'next/navigation';
import { getProfile, listProfiles } from '@/app/_generated/data';
import { t, localize, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { SkillBadge } from '@/components/SkillBadge';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listProfiles().map(p => ({ id: p.hacker.github }));
}

export default async function HackerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const entry = getProfile(id);
  if (!entry) notFound();

  const h = entry.hacker;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-start gap-6 mb-10">
        <img
          src={h.avatar || `https://github.com/${h.github}.png`}
          alt={localize(lang, h.name, h.name_zh)}
          className="w-24 h-24 rounded-full bg-secondary-bg"
          loading="lazy"
        />
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">
            {localize(lang, h.name, h.name_zh)}
          </h1>
          <p className="text-muted text-sm mt-1">@{h.github}</p>
          {h.location && <p className="text-muted text-sm mt-1">{h.location}</p>}
          <p className="text-light-gray text-sm mt-3 max-w-xl">
            {localize(lang, h.bio, h.bio_zh)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main */}
        <div className="md:col-span-2 space-y-10">
          {h.skills && h.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.skills')}</h2>
              {h.skills.map((group: { category: string; items: string[] }, i: number) => (
                <div key={i} className="mb-4">
                  <h3 className="text-xs text-muted mb-2">{group.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((skill: string) => (
                      <SkillBadge key={skill} label={skill} />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {h.interests && h.interests.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.interests')}</h2>
              <div className="flex flex-wrap gap-2">
                {h.interests.map((interest: string) => (
                  <SkillBadge key={interest} label={interest} />
                ))}
              </div>
            </section>
          )}

          {h.experience?.projects && h.experience.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.projects')}</h2>
              <div className="space-y-3">
                {h.experience.projects.map((proj: { name: string; description?: string; url?: string }, i: number) => (
                  <div key={i} className="rounded-lg border border-secondary-bg bg-dark-bg p-4">
                    <p className="text-white text-sm font-medium">{proj.name}</p>
                    {proj.description && <p className="text-muted text-xs mt-1">{proj.description}</p>}
                    {proj.url && (
                      <a href={proj.url} target="_blank" className="text-lime-primary text-xs mt-2 inline-block hover:underline">
                        View project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {h.experience?.hackathons && h.experience.hackathons.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-white mb-4">{t(lang, 'profile.hackathons')}</h2>
              <div className="space-y-3">
                {h.experience.hackathons.map((hack: { name: string; result?: string }, i: number) => (
                  <div key={i} className="rounded-lg border border-secondary-bg bg-dark-bg p-4">
                    <p className="text-white text-sm font-medium">{hack.name}</p>
                    {hack.result && <p className="text-lime-primary text-xs mt-1">{hack.result}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          {h.looking_for && (
            <section>
              <h2 className="text-sm font-heading font-bold text-white mb-3">{t(lang, 'profile.looking_for')}</h2>
              <div className="rounded-lg border border-secondary-bg bg-dark-bg p-4 space-y-2">
                {h.looking_for.roles && (
                  <div>
                    <p className="text-xs text-muted">Seeking:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {h.looking_for.roles.map((r: string) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-cyan/10 text-cyan">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {h.looking_for.team_size && <p className="text-xs text-muted">Team size: {h.looking_for.team_size}</p>}
                {h.looking_for.collaboration_style && <p className="text-xs text-muted">Style: {h.looking_for.collaboration_style}</p>}
              </div>
            </section>
          )}

          {h.identity && (
            <section>
              <h2 className="text-sm font-heading font-bold text-white mb-3">Identity</h2>
              <div className="rounded-lg border border-secondary-bg bg-dark-bg p-4 space-y-1">
                {h.identity.type && <p className="text-xs text-light-gray capitalize">{h.identity.type}</p>}
                {h.identity.affiliation && <p className="text-xs text-muted">{h.identity.affiliation}</p>}
              </div>
            </section>
          )}

          {h.links && (
            <section>
              <h2 className="text-sm font-heading font-bold text-white mb-3">{t(lang, 'profile.links')}</h2>
              <div className="space-y-2">
                {h.links.twitter && <a href={h.links.twitter} target="_blank" className="block text-xs text-muted hover:text-white transition-colors">Twitter</a>}
                {h.links.linkedin && <a href={h.links.linkedin} target="_blank" className="block text-xs text-muted hover:text-white transition-colors">LinkedIn</a>}
                {h.links.website && <a href={h.links.website} target="_blank" className="block text-xs text-muted hover:text-white transition-colors">Website</a>}
              </div>
            </section>
          )}

          <a
            href={`https://github.com/synnovator/monorepo/edit/main/profiles/${id}.yml`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-lime-primary transition-colors"
          >
            {t(lang, 'profile.edit')}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </aside>
      </div>
    </div>
  );
}
