import { listHackathons } from '@/app/_generated/data';
import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { CreateProposalForm } from '@/components/forms/CreateProposalForm';

export const dynamic = 'force-static';

export default async function CreateProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  const allHackathons = listHackathons();
  const hackathons = allHackathons.map(e => ({
    slug: e.hackathon.slug,
    name: e.hackathon.name,
    name_zh: e.hackathon.name_zh,
    tracks: (e.hackathon.tracks || []).map(t => ({
      name: t.name,
      name_zh: t.name_zh,
      slug: t.slug,
    })),
  }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-heading font-bold text-white mb-8">
        {lang === 'zh' ? '提交项目提案' : 'Submit Project Proposal'}
      </h1>
      <CreateProposalForm hackathons={hackathons} lang={lang} />
    </div>
  );
}
