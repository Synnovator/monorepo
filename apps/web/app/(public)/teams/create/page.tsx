import { CreateTeamForm } from '@/components/forms/CreateTeamForm';
import { ClosePageButton } from '@/components/ClosePageButton';
import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

export const metadata = { title: 'Create Team — Synnovator' };

export default async function CreateTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  return (
    <main className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="flex justify-end mb-4">
        <ClosePageButton />
      </div>
      <CreateTeamForm lang={lang} />
    </main>
  );
}
