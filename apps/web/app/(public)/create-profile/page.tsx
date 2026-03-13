import { getLangFromSearchParams } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { ProfileCreateForm } from '@/components/forms/ProfileCreateForm';
import { ClosePageButton } from '@/components/ClosePageButton';

export default async function CreateProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang: Lang = getLangFromSearchParams(new URLSearchParams(sp as Record<string, string>));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Create Your Profile</h1>
        <ClosePageButton />
      </div>
      <ProfileCreateForm lang={lang} />
    </div>
  );
}
