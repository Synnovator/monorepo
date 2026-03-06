import { listSubmissions, listHackathons } from '@/app/_generated/data';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ProposalsViewToggle } from '@/components/ProposalsViewToggle';

export const dynamic = 'force-static';

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const allSubmissions = listSubmissions();
  const allHackathons = listHackathons();

  // Build hackathon name lookup
  const hackathonMap = new Map<string, { name: string; name_zh?: string; slug: string }>();
  for (const h of allHackathons) {
    hackathonMap.set(h.hackathon.slug, {
      name: h.hackathon.name,
      name_zh: h.hackathon.name_zh,
      slug: h.hackathon.slug,
    });
  }

  // Enrich submissions
  const submissions = allSubmissions.map(sub => ({
    ...sub,
    hackathonName: hackathonMap.get(sub._hackathonSlug)?.name || sub._hackathonSlug,
    hackathonNameZh: hackathonMap.get(sub._hackathonSlug)?.name_zh,
    likes: sub.project.likes || 0,
  }));

  // Sort by likes descending for hot view
  const hotSorted = [...submissions].sort((a, b) => b.likes - a.likes);

  // Group by hackathon for activity view
  const grouped: Record<string, typeof submissions> = {};
  for (const sub of submissions) {
    const key = sub._hackathonSlug;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(sub);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
          {t(lang, 'proposals.title')}
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          {t(lang, 'proposals.subtitle')}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-muted text-lg">{t(lang, 'proposals.empty')}</p>
        </div>
      ) : (
        <ProposalsViewToggle
          hotSorted={hotSorted}
          grouped={grouped}
          hackathonMap={Object.fromEntries(hackathonMap)}
          lang={lang}
          hotLabel={t(lang, 'proposals.sort_hot')}
          activityLabel={t(lang, 'proposals.sort_activity')}
        />
      )}
    </div>
  );
}
