import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import type { Track } from './form-utils';

interface TeamFormationFormProps {
  hackathonSlug: string;
  tracks: Track[];
  lang: 'zh' | 'en';
}

interface Member {
  github: string;
  role: string;
}

const PURPOSES = [
  { value: 'looking', zh: '寻找队友', en: 'Looking for teammates' },
  { value: 'formed', zh: '公布组队', en: 'Announcing formed team' },
];

export function TeamFormationForm({ hackathonSlug, tracks, lang }: TeamFormationFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [teamNameVal, setTeamNameVal] = useState('');
  const [track, setTrack] = useState('');
  const [purpose, setPurpose] = useState('');
  const [members, setMembers] = useState<Member[]>([{ github: '', role: '' }]);
  const [lookingFor, setLookingFor] = useState('');
  const [projectIdea, setProjectIdea] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;

  function addMember() {
    setMembers(prev => [...prev, { github: '', role: '' }]);
  }

  function removeMember(idx: number) {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  }

  function updateMember(idx: number, field: keyof Member, value: string) {
    setMembers(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  const validMembers = members.filter(m => m.github.trim());
  const canSubmit = isLoggedIn && teamNameVal && track && purpose && validMembers.length > 0;

  function handleSubmit() {
    if (!user || !canSubmit) return;
    const membersList = validMembers.map(m => `@${m.github}${m.role ? ` (${m.role})` : ''}`).join(', ');
    const url = buildIssueUrl({
      template: 'team-formation.yml',
      title: `[Team] ${teamNameVal} — ${hackathonSlug}`,
      labels: ['team-formation', `hackathon:${hackathonSlug}`],
      fields: {
        hackathon: hackathonSlug,
        team: teamNameVal,
        track,
        purpose: PURPOSES.find(p => p.value === purpose)?.en ?? purpose,
        members: membersList,
        looking_for: lookingFor,
        project_idea: projectIdea,
      },
    });
    openGitHubUrl(url);
  }

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      <h3 className="text-lg font-heading font-bold text-white mb-6">
        {t('组队 / 寻找队友', 'Team Formation')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm">{t('请先登录', 'Please sign in first')}</p>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Team name */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('队伍名称', 'Team Name')}</label>
          <input type="text" value={teamNameVal} onChange={e => setTeamNameVal(e.target.value)}
            placeholder="team-alpha"
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Track */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('赛道', 'Track')}</label>
          <select value={track} onChange={e => setTrack(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('请选择赛道', 'Select a track')}</option>
            {tracks.map(tr => (
              <option key={tr.slug} value={tr.slug}>
                {lang === 'zh' && tr.name_zh ? tr.name_zh : tr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('目的', 'Purpose')}</label>
          <select value={purpose} onChange={e => setPurpose(e.target.value)}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none">
            <option value="">{t('请选择', 'Select purpose')}</option>
            {PURPOSES.map(p => (
              <option key={p.value} value={p.value}>
                {lang === 'zh' ? p.zh : p.en}
              </option>
            ))}
          </select>
        </div>

        {/* Members */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('成员', 'Members')}</label>
          <div className="space-y-2">
            {members.map((m, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" value={m.github} onChange={e => updateMember(idx, 'github', e.target.value)}
                  placeholder="GitHub username"
                  className="flex-1 bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none" />
                <input type="text" value={m.role} onChange={e => updateMember(idx, 'role', e.target.value)}
                  placeholder={t('角色', 'Role')}
                  className="w-32 bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none" />
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(idx)}
                    className="px-2 text-muted hover:text-error transition-colors">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addMember}
            className="mt-2 text-sm text-lime-primary hover:text-lime-primary/80 transition-colors">
            + {t('添加成员', 'Add member')}
          </button>
        </div>

        {/* Looking for */}
        {purpose === 'looking' && (
          <div>
            <label className="block text-sm text-muted mb-2">{t('期望技能/角色', 'Looking for (skills/roles)')}</label>
            <textarea value={lookingFor} onChange={e => setLookingFor(e.target.value)}
              placeholder={t('例如：前端开发、ML 工程师...', 'e.g. Frontend developer, ML engineer...')}
              className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-20 focus:border-lime-primary focus:outline-none" />
          </div>
        )}

        {/* Project idea */}
        <div>
          <label className="block text-sm text-muted mb-2">{t('项目想法', 'Project Idea')} ({t('可选', 'optional')})</label>
          <textarea value={projectIdea} onChange={e => setProjectIdea(e.target.value)}
            placeholder={t('简要描述你的项目想法...', 'Briefly describe your project idea...')}
            className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm resize-none h-20 focus:border-lime-primary focus:outline-none" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-lime-primary text-near-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t('前往 GitHub 提交', 'Submit on GitHub')} →
        </button>
      </fieldset>
    </div>
  );
}

export default TeamFormationForm;
