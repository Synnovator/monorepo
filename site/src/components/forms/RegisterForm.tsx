import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import type { Track } from './form-utils';

interface RegisterFormProps {
  hackathonSlug: string;
  hackathonName: string;
  tracks: Track[];
  ndaRequired: boolean;
  lang: 'zh' | 'en';
}

const ROLES = [
  { value: 'Participant (Solo)', zh: '个人参赛', en: 'Participant (Solo)' },
  { value: 'Team Lead', zh: '队长', en: 'Team Lead' },
  { value: 'Team Member', zh: '队员', en: 'Team Member' },
];

export function RegisterForm({ hackathonSlug, hackathonName, tracks, ndaRequired, lang }: RegisterFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [track, setTrack] = useState('');
  const [role, setRole] = useState('');
  const [teamName, setTeamName] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const isSolo = role === 'Participant (Solo)';
  const canSubmit = isLoggedIn && track && role && termsAgreed && profileConfirmed && (!isSolo ? teamName : true);

  function handleSubmit() {
    if (!user || !canSubmit) return;
    const url = buildIssueUrl({
      template: 'register.yml',
      title: `[Register] ${user.login} — ${hackathonSlug}`,
      labels: ['registration', `hackathon:${hackathonSlug}`],
      fields: {
        hackathon: hackathonSlug,
        github: user.login,
        track,
        role,
        team: isSolo ? '' : teamName,
      },
    });
    openGitHubUrl(url);
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('活动报名', 'Register for Hackathon')}
      </h3>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">{t('请先登录 GitHub', 'Please sign in with GitHub first')}</p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t('登录 GitHub', 'Sign in with GitHub')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Hackathon (read-only) */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('活动', 'Hackathon')}</label>
          <input
            type="text"
            value={hackathonName}
            readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed"
          />
        </div>

        {/* GitHub username (auto-filled) */}
        <div>
          <label className="block text-sm text-muted mb-2">GitHub Username</label>
          <input
            type="text"
            value={loading ? '...' : (user?.login ?? '')}
            readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed"
          />
        </div>

        {/* Track select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('赛道', 'Track')}</label>
          <select
            value={track}
            onChange={e => setTrack(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
          >
            <option value="">{t('请选择赛道', 'Select a track')}</option>
            {tracks.map(tr => (
              <option key={tr.slug} value={tr.slug}>
                {lang === 'zh' && tr.name_zh ? tr.name_zh : tr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('角色', 'Role')}</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
          >
            <option value="">{t('请选择角色', 'Select a role')}</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {lang === 'zh' ? r.zh : r.en}
              </option>
            ))}
          </select>
        </div>

        {/* Team name (conditional) */}
        {role && !isSolo && (
          <div>
            <label className="block text-sm text-muted mb-2">{t('队伍名称', 'Team Name')}</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="team-alpha"
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
            />
          </div>
        )}

        {/* Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t('已阅读比赛规则并同意条款', 'I have read the rules and agree to the terms')}</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={profileConfirmed} onChange={e => setProfileConfirmed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t('Profile 已创建且信息最新', 'My profile is created and up to date')}</span>
          </label>
        </div>

        {/* NDA warning */}
        {ndaRequired && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
            {t('此活动需要签署 NDA，请在报名前完成签署', 'This hackathon requires NDA signing. Please sign before registering.')}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-lime-primary text-near-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('前往 GitHub 提交报名', 'Submit Registration on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default RegisterForm;
