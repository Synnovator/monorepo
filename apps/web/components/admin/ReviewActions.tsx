'use client';

import { useState } from 'react';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface ReviewActionsProps {
  prNumber: number;
  lang: Lang;
}

export function ReviewActions({ prNumber, lang }: ReviewActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleAction(action: 'approve' | 'reject' | 'request_changes') {
    let comment: string | undefined;

    if (action === 'reject') {
      comment = window.prompt(t(lang, 'admin.reject_reason')) ?? undefined;
      if (comment === undefined) return;
    } else if (action === 'request_changes') {
      comment = window.prompt(t(lang, 'admin.review_comment')) ?? undefined;
      if (comment === undefined) return;
    } else {
      if (!window.confirm(t(lang, 'admin.confirm_approve'))) return;
    }

    setLoading(action);
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber, action, comment }),
      });
      if (res.ok) setDone(true);
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return <span className="text-primary text-xs">✓</span>;
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => handleAction('approve')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
      >
        {loading === 'approve' ? '...' : t(lang, 'admin.approve')}
      </button>
      <button
        type="button"
        onClick={() => handleAction('request_changes')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs rounded-md bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loading === 'request_changes' ? '...' : t(lang, 'admin.request_changes')}
      </button>
      <button
        type="button"
        onClick={() => handleAction('reject')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50"
      >
        {loading === 'reject' ? '...' : t(lang, 'admin.reject')}
      </button>
    </div>
  );
}
