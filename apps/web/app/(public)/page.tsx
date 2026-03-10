import { listHackathons } from '@/app/_generated/data';
import { getLangFromSearchParams, t } from '@synnovator/shared/i18n';
import { HackathonFilter } from '@/components/HackathonFilter';
import { SketchArrow } from '@/components/sketch';

export const dynamic = 'force-static';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const params = await searchParams;
  const lang = getLangFromSearchParams(new URLSearchParams(params as Record<string, string>));
  const hackathons = listHackathons();

  // Sort by registration start date descending
  const sorted = [...hackathons].sort((a, b) => {
    const aStart = a.hackathon.timeline?.registration?.start || '';
    const bStart = b.hackathon.timeline?.registration?.start || '';
    return bStart.localeCompare(aStart);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <div className="relative inline-block">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            {t(lang, 'home.title')}
          </h1>
          <SketchArrow className="absolute -right-16 top-1/2 -translate-y-1/2 hidden md:block" delay={300} />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t(lang, 'home.subtitle')}
        </p>
      </div>
      <HackathonFilter hackathons={sorted} lang={lang} />
    </div>
  );
}
