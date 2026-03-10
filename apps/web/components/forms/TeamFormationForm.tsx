'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import type { Track } from './form-utils';

interface TeamFormationFormProps {
  hackathonSlug: string;
  tracks: Track[];
  lang: Lang;
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
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-6">
        {t(lang, 'form.team.title')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm">{t(lang, 'form.team.sign_in_first')}</p>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Team name */}
        <div>
          <label htmlFor="team-name" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.team_name')}</label>
          <input id="team-name" type="text" value={teamNameVal} onChange={e => setTeamNameVal(e.target.value)}
            placeholder="team-alpha"
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none" />
        </div>

        {/* Track */}
        <div>
          <label htmlFor="team-track" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.track')}</label>
          <select id="team-track" value={track} onChange={e => setTrack(e.target.value)}
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none">
            <option value="">{t(lang, 'form.team.select_track')}</option>
            {tracks.map(tr => (
              <option key={tr.slug} value={tr.slug}>
                {lang === 'zh' && tr.name_zh ? tr.name_zh : tr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label htmlFor="team-purpose" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.purpose')}</label>
          <select id="team-purpose" value={purpose} onChange={e => setPurpose(e.target.value)}
            aria-required="true"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none">
            <option value="">{t(lang, 'form.team.select_purpose')}</option>
            {PURPOSES.map(p => (
              <option key={p.value} value={p.value}>
                {lang === 'zh' ? p.zh : p.en}
              </option>
            ))}
          </select>
        </div>

        {/* Members */}
        <div>
          <label className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.members')}</label>
          <div className="space-y-2">
            {members.map((m, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" value={m.github} onChange={e => updateMember(idx, 'github', e.target.value)}
                  placeholder="GitHub username"
                  className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none" />
                <input type="text" value={m.role} onChange={e => updateMember(idx, 'role', e.target.value)}
                  placeholder={t(lang, 'form.team.role')}
                  className="w-32 bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none" />
                {members.length > 1 && (
                  <button type="button" onClick={() => removeMember(idx)}
                    className="px-2 text-muted-foreground hover:text-destructive transition-colors">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addMember}
            className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors">
            + {t(lang, 'form.team.add_member')}
          </button>
        </div>

        {/* Looking for */}
        {purpose === 'looking' && (
          <div>
            <label htmlFor="team-looking-for" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.looking_for')}</label>
            <textarea id="team-looking-for" value={lookingFor} onChange={e => setLookingFor(e.target.value)}
              placeholder={t(lang, 'form.team.looking_for_placeholder')}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-20 focus:border-ring focus:outline-none" />
          </div>
        )}

        {/* Project idea */}
        <div>
          <label htmlFor="team-project-idea" className="block text-sm text-muted-foreground mb-2">{t(lang, 'form.team.project_idea')} ({t(lang, 'form.team.optional')})</label>
          <textarea id="team-project-idea" value={projectIdea} onChange={e => setProjectIdea(e.target.value)}
            placeholder={t(lang, 'form.team.project_idea_placeholder')}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-20 focus:border-ring focus:outline-none" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t(lang, 'form.team.submit_github')} →
        </button>
      </fieldset>
    </div>
  );
}

export default TeamFormationForm;
