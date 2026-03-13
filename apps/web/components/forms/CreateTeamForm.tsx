'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { Card } from '@synnovator/ui';

interface CreateTeamFormProps {
  lang: Lang;
}

const HACKER_ROLES = [
  { value: 'developer', zh: '开发者', en: 'Developer' },
  { value: 'product', zh: '产品', en: 'Product' },
  { value: 'designer', zh: '设计师', en: 'Designer' },
  { value: 'marketing', zh: '市场', en: 'Marketing' },
  { value: 'researcher', zh: '研究员', en: 'Researcher' },
];

export function CreateTeamForm({ lang }: CreateTeamFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [teamNameZh, setTeamNameZh] = useState('');
  const [lookingForRoles, setLookingForRoles] = useState<string[]>([]);
  const [lookingForDesc, setLookingForDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const teamSlug = teamName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const canSubmit = isLoggedIn && teamName && teamSlug;

  function toggleRole(role: string) {
    setLookingForRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  }

  function handleSubmit() {
    if (!user || !canSubmit || submitting) return;
    setSubmitting(true);

    const today = new Date().toISOString().split('T')[0];

    let yamlContent = `synnovator_team: "1.0"\n`;
    yamlContent += `name: "${teamName}"\n`;
    if (teamNameZh) yamlContent += `name_zh: "${teamNameZh}"\n`;
    yamlContent += `status: recruiting\n`;
    yamlContent += `leader: "${user.login}"\n`;
    yamlContent += `members: []\n`;
    if (lookingForRoles.length > 0 || lookingForDesc) {
      yamlContent += `looking_for:\n`;
      if (lookingForRoles.length > 0) {
        yamlContent += `  roles:\n`;
        for (const role of lookingForRoles) {
          yamlContent += `    - ${role}\n`;
        }
      }
      if (lookingForDesc) {
        yamlContent += `  description: "${lookingForDesc}"\n`;
      }
    }
    yamlContent += `created_at: "${today}"\n`;

    const url = buildPRUrl({
      title: `[Team] Create ${teamName}`,
      branch: `data/team-${teamSlug}`,
      files: [
        { path: `teams/${teamSlug}/team.yml`, content: yamlContent },
      ],
    });
    openGitHubUrl(url);
    setSubmitting(false);
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-6">
        {t(lang, 'team.create_title')}
      </h3>

      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">{t(lang, 'form.team.sign_in_first')}</p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            {t(lang, 'form.register.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        <div>
          <label htmlFor="team-name" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.name')}
          </label>
          <input
            id="team-name" type="text" value={teamName}
            onChange={e => setTeamName(e.target.value)}
            placeholder="Team Awesome"
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none"
          />
          {teamSlug && (
            <p className="text-xs text-muted-foreground mt-1">Slug: {teamSlug}</p>
          )}
        </div>

        <div>
          <label htmlFor="team-name-zh" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.name_zh')} <span className="text-muted-foreground/60">({t(lang, 'form.team.optional')})</span>
          </label>
          <input
            id="team-name-zh" type="text" value={teamNameZh}
            onChange={e => setTeamNameZh(e.target.value)}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none"
          />
        </div>

        <div>
          <p className="block text-sm text-muted-foreground mb-2">{t(lang, 'team.looking_for_roles')}</p>
          <div className="flex flex-wrap gap-2">
            {HACKER_ROLES.map(role => (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  lookingForRoles.includes(role.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {lang === 'zh' ? role.zh : role.en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="looking-for-desc" className="block text-sm text-muted-foreground mb-2">
            {t(lang, 'team.looking_for_description')} <span className="text-muted-foreground/60">({t(lang, 'form.team.optional')})</span>
          </label>
          <textarea
            id="looking-for-desc" value={lookingForDesc}
            onChange={e => setLookingForDesc(e.target.value)}
            rows={3}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none resize-y"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t(lang, 'team.create_submit')} →
        </button>
      </fieldset>
    </Card>
  );
}
