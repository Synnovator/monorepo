'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { Track, TeamInfo } from './form-utils';

interface AppealFormProps {
  hackathonSlug: string;
  tracks: Track[];
  teams: TeamInfo[];
  lang: Lang;
}

const EXPECTED_RESULTS = ['Re-scoring', 'Ranking adjustment', 'Rule clarification', 'Other'];
const APPEAL_TYPES = ['Scoring dispute', 'Rule interpretation', 'Technical issue during submission', 'Other'];

export function AppealForm({ hackathonSlug, tracks, teams, lang }: AppealFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [appealType, setAppealType] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  // Filter teams to show only the ones the logged-in user belongs to
  const myTeams = useMemo(() => {
    if (!user) return teams;
    return teams.filter(team => team.members.includes(user.login));
  }, [user, teams]);

  const selectedTeam = myTeams.find(team => team.name === teamName);
  const trackSlug = selectedTeam?.track ?? '';

  const canSubmit = isLoggedIn && teamName && expectedResult && appealType && description && acknowledged;

  function handleSubmit() {
    if (!user || !canSubmit) return;
    const url = buildIssueUrl({
      template: 'appeal.yml',
      title: `[Appeal] ${teamName} — ${hackathonSlug}${trackSlug ? `/${trackSlug}` : ''}`,
      labels: ['appeal', `hackathon:${hackathonSlug}`],
      fields: {
        hackathon: hackathonSlug,
        team: teamName,
        track: trackSlug,
        expected_result: expectedResult,
        appeal_type: appealType,
        description,
        evidence,
      },
    });
    openGitHubUrl(url);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-6">
        {t(lang, 'form.appeal.title')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm">{t(lang, 'form.appeal.sign_in_first')}</p>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Team select */}
        <div>
          <label htmlFor="appeal-team" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.team')}</label>
          <select id="appeal-team" value={teamName} onChange={e => setTeamName(e.target.value)}
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none">
            <option value="">{t(lang, 'form.appeal.select_team')}</option>
            {myTeams.map(team => (
              <option key={team.name} value={team.name}>{team.name}</option>
            ))}
          </select>
        </div>

        {/* Track (auto-filled) */}
        {trackSlug && (
          <div>
            <label htmlFor="appeal-track" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.track')}</label>
            <input id="appeal-track" type="text" value={tracks.find(tr => tr.slug === trackSlug)?.name ?? trackSlug} readOnly
              className="w-full bg-muted border border-border rounded-md px-3 py-2 text-muted-foreground text-sm cursor-not-allowed" />
          </div>
        )}

        {/* Expected result */}
        <div>
          <label htmlFor="appeal-result" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.expected_result')}</label>
          <select id="appeal-result" value={expectedResult} onChange={e => setExpectedResult(e.target.value)}
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none">
            <option value="">{t(lang, 'form.appeal.select_result')}</option>
            {EXPECTED_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Appeal type */}
        <div>
          <label htmlFor="appeal-type" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.appeal_type')}</label>
          <select id="appeal-type" value={appealType} onChange={e => setAppealType(e.target.value)}
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none">
            <option value="">{t(lang, 'form.appeal.select_type')}</option>
            {APPEAL_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="appeal-desc" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.description')} *</label>
          <textarea id="appeal-desc" value={description} onChange={e => setDescription(e.target.value)}
            aria-required="true"
            placeholder={t(lang, 'form.appeal.description_placeholder')}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-32 focus:border-ring focus:outline-none" />
        </div>

        {/* Evidence */}
        <div>
          <label htmlFor="appeal-evidence" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.appeal.evidence')}</label>
          <textarea id="appeal-evidence" value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder={t(lang, 'form.appeal.evidence_placeholder')}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-20 focus:border-ring focus:outline-none" />
        </div>

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5 accent-primary" />
          <span className="text-sm text-foreground">{t(lang, 'form.appeal.binding_decision')}</span>
        </label>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-muted text-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t(lang, 'form.appeal.submit_appeal')} →
        </button>
      </fieldset>
    </div>
  );
}

export default AppealForm;
