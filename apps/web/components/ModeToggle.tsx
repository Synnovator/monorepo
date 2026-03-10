'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="min-h-11 min-w-11" />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className="cursor-pointer py-2 px-2 min-h-11 min-w-11 text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center justify-center"
      aria-label={resolvedTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {resolvedTheme === 'light' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
