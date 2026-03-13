'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { PencilIcon } from '@/components/icons';

interface EditHackathonButtonProps {
  slug: string;
  organizers: string[];
}

export function EditHackathonButton({ slug, organizers }: EditHackathonButtonProps) {
  const { user, loading } = useAuth();

  if (loading || !user || !organizers.includes(user.login)) {
    return null;
  }

  return (
    <Link
      href={`/edit/hackathon/${slug}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
    >
      Edit
      <PencilIcon size={12} aria-hidden="true" />
    </Link>
  );
}
