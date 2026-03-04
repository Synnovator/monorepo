import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import type { Track, TeamInfo } from './form-utils';

interface AppealFormProps {
  hackathonSlug: string;
  tracks: Track[];
  teams: TeamInfo[];
  lang: 'zh' | 'en';
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

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

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
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('提起申诉', 'Submit Appeal')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm">{t('请先登录', 'Please sign in first')}</p>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Team select */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('团队', 'Team')}</label>
          <select value={teamName} onChange={e => setTeamName(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择团队', 'Select team')}</option>
            {myTeams.map(team => (
              <option key={team.name} value={team.name}>{team.name}</option>
            ))}
          </select>
        </div>

        {/* Track (auto-filled) */}
        {trackSlug && (
          <div>
            <label className="block text-sm text-muted mb-2">{t('赛道', 'Track')}</label>
            <input type="text" value={tracks.find(tr => tr.slug === trackSlug)?.name ?? trackSlug} readOnly
              className="w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed" />
          </div>
        )}

        {/* Expected result */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('期望结果', 'Expected Result')}</label>
          <select value={expectedResult} onChange={e => setExpectedResult(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择期望结果', 'Select expected result')}</option>
            {EXPECTED_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Appeal type */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('申诉类型', 'Appeal Type')}</label>
          <select value={appealType} onChange={e => setAppealType(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('选择类型', 'Select type')}</option>
            {APPEAL_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('详细描述', 'Description')} *</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t('请详细描述申诉原因...', 'Please describe your appeal in detail...')}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-32 focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Evidence */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('支持证据', 'Supporting Evidence')}</label>
          <textarea value={evidence} onChange={e => setEvidence(e.target.value)}
            placeholder={t('链接、截图等...', 'Links, screenshots, etc...')}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-20 focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Acknowledgment */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5 accent-lime-primary" />
          <span className="text-sm text-light-gray">{t('我理解主办方的最终决定具有约束力', "I understand that the organizer's final decision is binding")}</span>
        </label>

        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-secondary-bg text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-secondary-bg/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t('前往 GitHub 提交申诉', 'Submit Appeal on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default AppealForm;
