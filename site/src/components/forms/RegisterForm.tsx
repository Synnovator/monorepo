import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl, GITHUB_ORG, GITHUB_REPO } from '@/lib/github-url';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n';
import type { Track } from './form-utils';

interface RegisterFormProps {
  hackathonSlug: string;
  hackathonName: string;
  tracks: Track[];
  ndaRequired: boolean;
  lang: Lang;
}

function escapeYamlValue(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

const ROLES = [
  { value: 'participant', zh: '个人参赛', en: 'Participant (Solo)' },
  { value: 'team-lead', zh: '队长', en: 'Team Lead' },
  { value: 'team-member', zh: '队员', en: 'Team Member' },
];

export function RegisterForm({ hackathonSlug, hackathonName, tracks, ndaRequired, lang }: RegisterFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [track, setTrack] = useState('');
  const [role, setRole] = useState('');
  const [teamName, setTeamName] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isSolo = role === 'participant';
  const canSubmit = isLoggedIn && track && role && termsAgreed && profileConfirmed && (isSolo || teamName);

  async function handleSubmit() {
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      // Check profile exists
      const res = await fetch(`/api/check-profile?username=${encodeURIComponent(user.login)}`);
      const profileCheck = await res.json();

      if (!profileCheck.exists || !profileCheck.slug) {
        setError(t(lang, 'form.register.create_profile_first'));
        setSubmitting(false);
        return;
      }

      // Fetch current profile content
      const profilePath = `profiles/${profileCheck.slug}.yml`;
      const ghRes = await fetch(
        `https://api.github.com/repos/${GITHUB_ORG}/${GITHUB_REPO}/contents/${profilePath}`,
        { headers: { Accept: 'application/vnd.github.v3.raw' } }
      );

      if (!ghRes.ok) {
        if (ghRes.status === 404) {
          throw new Error(t(lang, 'form.register.profile_not_found'));
        }
        throw new Error(t(lang, 'form.register.github_api_failed'));
      }

      let profileContent = await ghRes.text();

      // Escape user-controlled values
      const safeSlug = escapeYamlValue(hackathonSlug);
      const safeTrack = escapeYamlValue(track);
      const safeRole = escapeYamlValue(role);
      const safeTeam = teamName ? escapeYamlValue(teamName) : '';

      // Check for duplicate registration
      if (profileContent.includes(`hackathon: "${safeSlug}"`) &&
          profileContent.includes('registrations:')) {
        setError(t(lang, 'form.register.already_registered'));
        setSubmitting(false);
        return;
      }

      // Build registration entry
      const regLines = [
        `    - hackathon: "${safeSlug}"`,
        `      track: "${safeTrack}"`,
        `      role: "${safeRole}"`,
        ...(isSolo ? [] : [`      team: "${safeTeam}"`]),
        `      registered_at: "${new Date().toISOString()}"`,
      ];

      // Check if registrations section already exists
      if (profileContent.includes('registrations:')) {
        profileContent = profileContent.replace(
          /registrations:[ \t]*\n/,
          `registrations:\n${regLines.join('\n')}\n`
        );
      } else {
        profileContent = profileContent.trimEnd() + '\n\n  registrations:\n' + regLines.join('\n') + '\n';
      }

      const url = buildPRUrl({
        filename: profilePath,
        value: profileContent,
        message: `feat(profiles): ${user.login} registers for ${hackathonSlug}`,
      });
      openGitHubUrl(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t(lang, 'form.register.operation_failed');
      setError(msg);
    }
    setSubmitting(false);
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t(lang, 'form.register.title')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">{t(lang, 'form.register.sign_in_first')}</p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'form.register.sign_in_github')}
          </a>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
          {error.includes('Profile') && (
            <a href="/create-profile" className="ml-2 text-lime-primary hover:underline">
              {t(lang, 'form.register.create_profile')}
            </a>
          )}
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        <div>
          <label className="block text-sm text-muted mb-2">{t(lang, 'form.register.hackathon')}</label>
          <input type="text" value={hackathonName} readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">GitHub Username</label>
          <input type="text" value={loading ? '...' : (user?.login ?? '')} readOnly
            className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">{t(lang, 'form.register.track')}</label>
          <select value={track} onChange={e => setTrack(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t(lang, 'form.register.select_track')}</option>
            {tracks.map(tr => (
              <option key={tr.slug} value={tr.slug}>
                {lang === 'zh' && tr.name_zh ? tr.name_zh : tr.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-muted mb-2">{t(lang, 'form.register.role')}</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t(lang, 'form.register.select_role')}</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>
                {lang === 'zh' ? r.zh : r.en}
              </option>
            ))}
          </select>
        </div>

        {role && !isSolo && (
          <div>
            <label className="block text-sm text-muted mb-2">{t(lang, 'form.register.team_name')}</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="team-alpha"
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none" />
          </div>
        )}

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAgreed} onChange={e => setTermsAgreed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t(lang, 'form.register.terms_agree')}</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={profileConfirmed} onChange={e => setProfileConfirmed(e.target.checked)} className="mt-0.5 accent-lime-primary" />
            <span className="text-sm text-light-gray">{t(lang, 'form.register.profile_up_to_date')}</span>
          </label>
        </div>

        {ndaRequired && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-sm">
            {t(lang, 'form.register.nda_required_hint')}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="w-full bg-lime-primary text-near-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting
            ? t(lang, 'form.register.processing')
            : t(lang, 'form.register.submit_pr')} →
        </button>
      </fieldset>
    </div>
  );
}

export default RegisterForm;
