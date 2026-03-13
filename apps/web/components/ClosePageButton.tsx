'use client';

import { useRouter } from 'next/navigation';

export function ClosePageButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Close"
      className="flex items-center justify-center w-10 h-10 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
      </svg>
    </button>
  );
}
