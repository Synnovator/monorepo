import { listHackathons } from '@synnovator/shared/data';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { HackathonFilter } from '@/components/HackathonFilter';
import path from 'node:path';

const DATA_ROOT = path.resolve(process.cwd(), '../..');

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = getLangFromSearchParams(new URLSearchParams(params as Record<string, string>));
  const hackathons = await listHackathons(DATA_ROOT);

  // Sort by registration start date descending
  hackathons.sort((a, b) => {
    const aStart = a.hackathon.timeline?.registration?.start || '';
    const bStart = b.hackathon.timeline?.registration?.start || '';
    return bStart.localeCompare(aStart);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
          {t(lang, 'home.title')}
        </h1>
        <p className="text-lg text-muted max-w-2xl">
          {t(lang, 'home.subtitle')}
        </p>
      </div>
      <HackathonFilter hackathons={hackathons} lang={lang} />
    </div>
  );
}
