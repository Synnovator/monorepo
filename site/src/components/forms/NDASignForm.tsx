import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl, GITHUB_ORG, GITHUB_REPO } from '@/lib/github-url';

interface NDASignFormProps {
  hackathonSlug: string;
  ndaDocumentUrl?: string;
  ndaSummary?: string;
  lang: 'zh' | 'en';
}

function escapeYamlValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

export function NDASignForm({ hackathonSlug, ndaDocumentUrl, ndaSummary, lang }: NDASignFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [checks, setChecks] = useState([false, false, false]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const allChecked = checks.every(Boolean);

  function toggleCheck(idx: number) {
    setChecks(prev => { const next = [...prev]; next[idx] = !next[idx]; return next; });
  }

  async function handleSubmit() {
    if (!user || !allChecked || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // Check profile exists
      const res = await fetch(`/api/check-profile?username=${encodeURIComponent(user.login)}`);
      const profileCheck = await res.json();

      if (!profileCheck.exists || !profileCheck.slug) {
        setError(t(
          '请先创建 Profile，然后再签署 NDA',
          'Please create your profile first before signing NDA'
        ));
        setSubmitting(false);
        return;
      }

      // Fetch current profile content from GitHub API (public raw)
      const profilePath = `profiles/${profileCheck.slug}.yml`;
      const ghRes = await fetch(
        `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${profilePath}`,
        { headers: { Accept: 'application/vnd.github.v3.raw' } }
      );

      if (!ghRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      let profileContent = await ghRes.text();

      // Check for duplicate NDA signing
      const safeSlug = escapeYamlValue(hackathonSlug);
      if (profileContent.includes(`hackathon: "${safeSlug}"`) &&
          profileContent.includes('nda_signed:')) {
        setError(t(
          `您已签署过 ${hackathonSlug} 的 NDA`,
          `You have already signed the NDA for ${hackathonSlug}`
        ));
        setSubmitting(false);
        return;
      }

      // Append nda_signed entry
      const timestamp = new Date().toISOString();
      const ndaEntry = [
        '',
        '  nda_signed:',
        `    - hackathon: "${safeSlug}"`,
        `      signed_at: "${timestamp}"`,
      ].join('\n');

      // Check if nda_signed section already exists in the profile
      if (profileContent.includes('nda_signed:')) {
        // Append to existing nda_signed array
        const insertEntry = [
          `    - hackathon: "${safeSlug}"`,
          `      signed_at: "${timestamp}"`,
        ].join('\n');
        profileContent = profileContent.replace(
          /nda_signed:[ \t]*\n/,
          `nda_signed:\n${insertEntry}\n`
        );
      } else {
        // Add nda_signed section at the end
        profileContent = profileContent.trimEnd() + '\n' + ndaEntry + '\n';
      }

      const url = buildPRUrl({
        filename: profilePath,
        value: profileContent,
        message: `feat(profiles): ${user.login} signs NDA for ${hackathonSlug}`,
      });
      openGitHubUrl(url);
    } catch {
      setError(t('操作失败，请重试', 'Operation failed, please try again'));
    }
    setSubmitting(false);
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

      {!loading && !isLoggedIn && (
        <div className="p-3 rounded-lg bg-secondary-bg text-muted text-sm">
          {t('请先登录后再签署 NDA', 'Please sign in to sign the NDA')}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
          {error.includes('Profile') && (
            <a href="/create-profile" className="ml-2 text-lime-primary hover:underline">
              {t('创建 Profile', 'Create Profile')}
            </a>
          )}
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
          disabled={!allChecked || submitting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary/20 text-lime-primary text-sm hover:bg-lime-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? t('处理中...', 'Processing...')
            : t('签署 NDA 并创建 PR', 'Sign NDA & Create PR')} →
        </button>
      </fieldset>
    </div>
  );
}

export default NDASignForm;
