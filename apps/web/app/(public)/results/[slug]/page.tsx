import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getHackathon, getResults } from '@synnovator/shared/data';
import { t, localize, getCurrentStage, getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import path from 'node:path';

const DATA_ROOT = path.resolve(process.cwd(), '../..');

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const entry = await getHackathon(slug, DATA_ROOT);
  if (!entry) notFound();

  const h = entry.hackathon;
  const stage = h.timeline ? getCurrentStage(h.timeline) : 'draft';
  const showResults = ['announcement', 'award', 'ended'].includes(stage);

  const trackResults = showResults ? await getResults(slug, DATA_ROOT) : [];

  const trackNameMap: Record<string, { name: string; name_zh?: string }> = {};
  for (const track of (h.tracks || [])) {
    trackNameMap[track.slug] = { name: track.name, name_zh: track.name_zh };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/hackathons/${h.slug}`} className="text-sm text-muted hover:text-white mb-6 inline-block">
        ← {localize(lang, h.name, h.name_zh)}
      </Link>

      <h1 className="text-3xl font-heading font-bold text-white mb-8">
        {t(lang, 'result.title')}
      </h1>

      {!showResults ? (
        <div className="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
          <p className="text-muted text-lg">{t(lang, 'result.pending')}</p>
        </div>
      ) : !trackResults || trackResults.length === 0 ? (
        <div className="rounded-lg border border-secondary-bg bg-dark-bg p-12 text-center">
          <p className="text-muted text-lg">{t(lang, 'result.no_results')}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {trackResults.map((tr: any) => {
            const trackInfo = trackNameMap[tr.track];
            return (
              <section key={tr.track}>
                <h2 className="text-xl font-heading font-bold text-white mb-4">
                  {trackInfo ? localize(lang, trackInfo.name, trackInfo.name_zh) : tr.track}
                </h2>
                {tr.data?.calculated_at && (
                  <div className="text-xs text-muted mb-4">
                    {t(lang, 'result.calculated')}: {new Date(tr.data.calculated_at).toLocaleString()} ·
                    {tr.data.total_judges} {t(lang, 'result.judges_count')} ·
                    {tr.data.total_teams} {t(lang, 'result.teams_count')}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-secondary-bg text-muted">
                        <th className="text-left py-3 px-2">{t(lang, 'result.rank')}</th>
                        <th className="text-left py-3 px-2">{t(lang, 'result.team')}</th>
                        <th className="text-right py-3 px-2">{t(lang, 'result.final_score')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tr.data?.rankings?.map((r: any) => (
                        <tr key={r.rank} className="border-b border-secondary-bg/50 hover:bg-secondary-bg/20">
                          <td className="py-3 px-2">
                            <span className={`font-code font-bold ${r.rank <= 3 ? 'text-lime-primary' : 'text-white'}`}>
                              #{r.rank}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-white font-medium">{r.team}</td>
                          <td className="py-3 px-2 text-right font-code text-lime-primary font-bold">
                            {r.final_score?.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
