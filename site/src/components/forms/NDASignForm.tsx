import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';

interface NDASignFormProps {
  hackathonSlug: string;
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: 'zh' | 'en';
}

export function NDASignForm({ hackathonSlug, ndaDocumentUrl, ndaSummary, lang }: NDASignFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [checks, setChecks] = useState([false, false, false]);

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const allChecked = checks.every(Boolean);

  function toggleCheck(idx: number) {
    setChecks(prev => { const next = [...prev]; next[idx] = !next[idx]; return next; });
  }

  function handleSubmit() {
    if (!user || !allChecked) return;
    const url = buildIssueUrl({
      template: 'nda-sign.yml',
      title: `[NDA] ${user.login} — ${hackathonSlug}`,
      labels: ['nda-sign'],
      fields: {
        hackathon: hackathonSlug,
        github: user.login,
      },
    });
    openGitHubUrl(url);
  }

  const checkboxLabels = [
    t('我已阅读并同意 NDA 条款', 'I have read and agree to the NDA terms'),
    t('我了解保密和数据处理要求', 'I understand the confidentiality and data handling requirements'),
    t('我知晓违反可能导致取消资格和法律后果', 'I acknowledge violations may result in disqualification and legal action'),
  ];

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-6 space-y-4">
      <p className="text-sm text-warning font-medium">
        {t('此活动要求签署保密协议 (NDA)', 'This hackathon requires NDA signing')}
      </p>

      {ndaSummary && (
        <div>
          <p className="text-xs text-muted mb-1">{t('NDA 摘要', 'NDA Summary')}</p>
          <p className="text-sm text-light-gray">{ndaSummary}</p>
        </div>
      )}

      {ndaDocumentUrl && (
        <a
          href={ndaDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-bg text-white text-sm hover:bg-secondary-bg/80 transition-colors"
        >
          {t('下载 NDA 文档', 'Download NDA Document')}
        </a>
      )}

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="p-3 rounded-lg bg-secondary-bg text-muted text-sm">
          {t('请先登录后再签署 NDA', 'Please sign in to sign the NDA')}
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-3">
        <p className="text-xs text-muted">{t('签署人', 'Signer')}: {loading ? '...' : (user?.login ?? '—')}</p>

        {checkboxLabels.map((label, idx) => (
          <label key={idx} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[idx]}
              onChange={() => toggleCheck(idx)}
              className="mt-0.5 accent-lime-primary"
            />
            <span className="text-sm text-light-gray">{label}</span>
          </label>
        ))}

        <button
          onClick={handleSubmit}
          disabled={!allChecked}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('前往 GitHub 签署 NDA', 'Sign NDA on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default NDASignForm;
