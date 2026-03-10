import { notFound } from 'next/navigation';
import { getProfile, listProfiles } from '@/app/_generated/data';
import { t, localize, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { SkillBadge } from '@/components/SkillBadge';
import { SparklesIcon } from '@/components/icons';
import { EditProfileButton } from '@/components/EditProfileButton';

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
          className="w-24 h-24 rounded-full bg-muted"
          loading="lazy"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
            {localize(lang, h.name, h.name_zh)}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">@{h.github}</p>
          {h.location && <p className="text-muted-foreground text-sm mt-1">{h.location}</p>}
          <p className="text-foreground text-sm mt-3 max-w-xl">
            {localize(lang, h.bio, h.bio_zh)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main */}
        <div className="md:col-span-2 space-y-10">
          {h.skills && h.skills.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <SparklesIcon size={20} className="shrink-0" aria-hidden="true" />
                {t(lang, 'profile.skills')}
              </h2>
              {h.skills.map((group: { category: string; items: string[] }, i: number) => (
                <div key={i} className="mb-4">
                  <h3 className="text-xs text-muted-foreground mb-2">{group.category}</h3>
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
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'profile.interests')}</h2>
              <div className="flex flex-wrap gap-2">
                {h.interests.map((interest: string) => (
                  <SkillBadge key={interest} label={interest} />
                ))}
              </div>
            </section>
          )}

          {h.experience?.projects && h.experience.projects.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'profile.projects')}</h2>
              <div className="space-y-3">
                {h.experience.projects.map((proj: { name: string; description?: string; url?: string }, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-foreground text-sm font-medium">{proj.name}</p>
                    {proj.description && <p className="text-muted-foreground text-xs mt-1">{proj.description}</p>}
                    {proj.url && (
                      <a href={proj.url} target="_blank" className="text-primary text-xs mt-2 inline-block hover:underline">
                        {t(lang, 'profile.view_project')}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {h.experience?.hackathons && h.experience.hackathons.length > 0 && (
            <section>
              <h2 className="text-lg font-heading font-bold text-foreground mb-4">{t(lang, 'profile.hackathons')}</h2>
              <div className="space-y-3">
                {h.experience.hackathons.map((hack: { name: string; result?: string }, i: number) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-foreground text-sm font-medium">{hack.name}</p>
                    {hack.result && <p className="text-primary text-xs mt-1">{hack.result}</p>}
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
              <h2 className="text-sm font-heading font-bold text-foreground mb-3">{t(lang, 'profile.looking_for')}</h2>
              <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                {h.looking_for.roles && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t(lang, 'profile.seeking')}:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {h.looking_for.roles.map((r: string) => (
                        <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
                {h.looking_for.team_size && <p className="text-xs text-muted-foreground">{t(lang, 'profile.team_size')}: {h.looking_for.team_size}</p>}
                {h.looking_for.collaboration_style && <p className="text-xs text-muted-foreground">{t(lang, 'profile.collab_style')}: {h.looking_for.collaboration_style}</p>}
              </div>
            </section>
          )}

          {h.identity && (
            <section>
              <h2 className="text-sm font-heading font-bold text-foreground mb-3">{t(lang, 'profile.identity')}</h2>
              <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                {h.identity.type && <p className="text-xs text-foreground capitalize">{h.identity.type}</p>}
                {h.identity.affiliation && <p className="text-xs text-muted-foreground">{h.identity.affiliation}</p>}
              </div>
            </section>
          )}

          {h.links && (
            <section>
              <h2 className="text-sm font-heading font-bold text-foreground mb-3">{t(lang, 'profile.links')}</h2>
              <div className="space-y-2">
                {h.links.twitter && <a href={h.links.twitter} target="_blank" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter</a>}
                {h.links.linkedin && <a href={h.links.linkedin} target="_blank" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">LinkedIn</a>}
                {h.links.website && <a href={h.links.website} target="_blank" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Website</a>}
              </div>
            </section>
          )}

          <EditProfileButton profileUsername={h.github} lang={lang} />
        </aside>
      </div>
    </div>
  );
}
