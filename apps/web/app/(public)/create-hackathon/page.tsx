import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { CreateHackathonForm } from '@/components/forms/CreateHackathonForm';

export default async function CreateHackathonPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-8">Create a Hackathon</h1>
      <CreateHackathonForm templates={{}} lang={lang} />
    </div>
  );
}
