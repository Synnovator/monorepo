'use client';

import { useState, useMemo } from 'react';
import { buildIssueUrl, openGitHubUrl } from '@/lib/github-url';
import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';

interface Criterion { name: string; name_zh?: string; weight: number; description?: string; score_range?: number[]; }
interface ScoreCardProps { hackathonSlug: string; trackSlug: string; criteria: Criterion[]; lang: Lang; }

export function ScoreCard({ hackathonSlug, trackSlug, criteria, lang }: ScoreCardProps) {
  const [team, setTeam] = useState('');
  const [scores, setScores] = useState<number[]>(criteria.map(c => Math.round(((c.score_range?.[0] ?? 0) + (c.score_range?.[1] ?? 100)) / 2)));
  const [comments, setComments] = useState<string[]>(criteria.map(() => ''));
  const [overall, setOverall] = useState('');
  const [conflict, setConflict] = useState(false);

  const weightedTotal = useMemo(() => scores.reduce((sum, score, i) => sum + score * criteria[i].weight, 0), [scores, criteria]);

  function updateScore(idx: number, value: number) { setScores(prev => { const next = [...prev]; next[idx] = value; return next; }); }
  function updateComment(idx: number, value: string) { setComments(prev => { const next = [...prev]; next[idx] = value; return next; }); }

  function handleSubmit() {
    const teamName = team || 'team-name';
    const yamlLines = ['scores:'];
    criteria.forEach((c, i) => {
      yamlLines.push(`  - criterion: "${c.name}"`);
      yamlLines.push(`    score: ${scores[i]}`);
      yamlLines.push(`    comment: "${comments[i].replace(/"/g, '\\"')}"`);
    });
    yamlLines.push('', 'overall_comment: |', `  ${overall.replace(/\n/g, '\n  ')}`, '', 'conflict_declaration: true');
    const body = '```yaml\n' + yamlLines.join('\n') + '\n```';
    openGitHubUrl(buildIssueUrl({ title: `[Score] ${teamName} — ${hackathonSlug} / ${trackSlug}`, labels: ['judge-score', `hackathon:${hackathonSlug}`], body }));
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-heading font-bold text-foreground mb-6">{t(lang, 'score.title')}</h3>
      <div className="mb-6">
        <label htmlFor="score-team" className="block text-sm text-muted-foreground mb-2">{t(lang, 'score.team_name')}</label>
        <input id="score-team" type="text" value={team} onChange={e => setTeam(e.target.value)} placeholder="team-alpha" className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none" />
      </div>
      <div className="space-y-6">
        {criteria.map((c, idx) => {
          const min = c.score_range?.[0] ?? 0;
          const max = c.score_range?.[1] ?? 100;
          return (
            <div key={idx} className="border-b border-border pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-foreground text-sm font-medium">{lang === 'zh' && c.name_zh ? c.name_zh : c.name}</span>
                <span className="text-xs text-muted-foreground">{t(lang, 'score.weight')}: {(c.weight * 100).toFixed(0)}%</span>
              </div>
              {c.description && <p className="text-xs text-muted-foreground mb-3">{c.description}</p>}
              <div className="flex items-center gap-4 mb-3">
                <input type="range" min={min} max={max} value={scores[idx]} onChange={e => updateScore(idx, Number(e.target.value))} aria-label={lang === 'zh' && c.name_zh ? c.name_zh : c.name} className="flex-1 accent-primary" />
                <input type="number" min={min} max={max} value={scores[idx]} onChange={e => updateScore(idx, Number(e.target.value))} aria-label={`${lang === 'zh' && c.name_zh ? c.name_zh : c.name} score`} className="w-16 bg-background border border-border rounded-md px-2 py-1 text-foreground text-sm text-center" />
              </div>
              <textarea value={comments[idx]} onChange={e => updateComment(idx, e.target.value)} aria-label={`${lang === 'zh' && c.name_zh ? c.name_zh : c.name} comment`} placeholder={t(lang, 'form.score_card.comment_optional')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-16 focus:border-ring focus:outline-none" />
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <label htmlFor="score-overall" className="block text-sm text-muted-foreground mb-2">{t(lang, 'score.overall')}</label>
        <textarea id="score-overall" value={overall} onChange={e => setOverall(e.target.value)} placeholder={t(lang, 'form.score_card.overall_placeholder')} className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm resize-none h-24 focus:border-ring focus:outline-none" />
      </div>
      <div className="mt-6 p-4 rounded-lg border border-border bg-background">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={conflict} onChange={e => setConflict(e.target.checked)} className="mt-0.5 accent-primary" />
          <span className="text-sm text-foreground">{t(lang, 'conflict.checkbox')}</span>
        </label>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div>
          <span className="text-muted-foreground text-sm">{t(lang, 'score.total')}: </span>
          <span className="text-primary font-code text-lg font-medium">{weightedTotal.toFixed(1)}</span>
        </div>
        <button onClick={handleSubmit} disabled={!conflict} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {t(lang, 'score.submit')}
        </button>
      </div>
    </div>
  );
}
