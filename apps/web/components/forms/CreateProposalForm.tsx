'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { formatYaml } from './form-utils';

interface TrackInfo {
  name: string;
  name_zh?: string;
  slug: string;
}

interface HackathonInfo {
  slug: string;
  name: string;
  name_zh?: string;
  tracks: TrackInfo[];
}

interface CreateProposalFormProps {
  hackathons: HackathonInfo[];
  lang: Lang;
}

interface TeamMember {
  github: string;
  role: string;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const STEP_LABELS_ZH = ['选择活动', '项目信息', '团队', '提交物', '预览'];
const STEP_LABELS_EN = ['Hackathon', 'Project', 'Team', 'Deliverables', 'Preview'];
const TOTAL_STEPS = 5;

export function CreateProposalForm({ hackathons, lang }: CreateProposalFormProps) {
  const { loading, isLoggedIn } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0: Select hackathon
  const [selectedHackathon, setSelectedHackathon] = useState('');

  // Step 1: Project info
  const [name, setName] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [tagline, setTagline] = useState('');
  const [taglineZh, setTaglineZh] = useState('');
  const [track, setTrack] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  // Step 2: Team
  const [members, setMembers] = useState<TeamMember[]>([{ github: '', role: 'Lead Developer' }]);

  // Step 3: Deliverables
  const [repo, setRepo] = useState('');
  const [video, setVideo] = useState('');
  const [demo, setDemo] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionZh, setDescriptionZh] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const currentHackathon = hackathons.find(h => h.slug === selectedHackathon);
  const stepLabels = lang === 'zh' ? STEP_LABELS_ZH : STEP_LABELS_EN;

  function handleTechKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = techInput.trim();
      if (val && !techStack.includes(val)) {
        setTechStack(prev => [...prev, val]);
      }
      setTechInput('');
    }
  }
  function removeTech(idx: number) {
    setTechStack(prev => prev.filter((_, i) => i !== idx));
  }

  function addMember() {
    setMembers(prev => [...prev, { github: '', role: '' }]);
  }
  function removeMember(idx: number) {
    setMembers(prev => prev.filter((_, i) => i !== idx));
  }
  function updateMember(idx: number, field: keyof TeamMember, value: string) {
    setMembers(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], [field]: value };
      return n;
    });
  }

  function isStepValid(s: number): boolean {
    switch (s) {
      case 0: return selectedHackathon !== '';
      case 1: return name.trim() !== '' && tagline.trim() !== '' && track !== '' && techStack.length > 0;
      case 2: return members.some(m => m.github.trim() !== '');
      case 3: return repo.trim() !== '';
      case 4: return true; // preview
      default: return true;
    }
  }

  const teamSlug = useMemo(() => {
    const firstGithub = members[0]?.github?.trim() || 'team';
    const projectSlug = toSlug(name) || 'project';
    return `team-${firstGithub}-${projectSlug}`;
  }, [members, name]);

  const yamlContent = useMemo(() => {
    const teamArr = members.filter(m => m.github).map(m => ({
      github: m.github.trim(),
      role: m.role.trim() || 'Developer',
    }));

    const deliverables: Record<string, unknown> = {
      repo: repo || undefined,
    };
    if (video) deliverables.video = video;
    if (demo) deliverables.demo = demo;

    const data: Record<string, unknown> = {
      synnovator_submission: '2.0',
      project: {
        name: name || undefined,
        name_zh: nameZh || undefined,
        tagline: tagline || undefined,
        tagline_zh: taglineZh || undefined,
        track: track || undefined,
        team: teamArr.length > 0 ? teamArr : undefined,
        deliverables: Object.keys(deliverables).some(k => deliverables[k]) ? deliverables : undefined,
        tech_stack: techStack.length > 0 ? techStack : undefined,
        description: description || undefined,
        description_zh: descriptionZh || undefined,
      },
    };
    return formatYaml(data);
  }, [name, nameZh, tagline, taglineZh, track, members, repo, video, demo, techStack, description, descriptionZh]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'proposal',
          filename: `hackathons/${selectedHackathon}/submissions/${teamSlug}/project.yml`,
          content: yamlContent,
          slug: teamSlug,
        }),
      });
      const text = await res.text();
      let data: { pr_url?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200) || `Server error (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || `Server error (${res.status})`);
      window.open(data.pr_url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : t(lang, 'form.common.submit_error'));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const labelClass = 'block text-sm text-muted mb-2';
  const selectClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const btnRemove = 'px-2 text-muted hover:text-error transition-colors';
  const btnAdd = 'text-sm text-lime-primary hover:text-lime-primary/80 transition-colors';

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      {/* Step indicators */}
      <div aria-label="Progress" className="flex items-center justify-between mb-8 overflow-x-auto">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center" aria-current={idx === step ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx === step ? 'bg-lime-primary text-near-black'
                  : idx < step ? (isStepValid(idx) ? 'bg-lime-primary/30 text-lime-primary' : 'bg-warning/30 text-warning') : 'bg-secondary-bg text-muted'
              }`}>
                {idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
              </div>
              <span className={`mt-1 text-xs whitespace-nowrap ${idx === step ? 'text-lime-primary' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {idx < TOTAL_STEPS - 1 && (
              <div className={`hidden sm:block w-6 h-px mx-0.5 mt-[-1rem] ${idx < step ? 'bg-lime-primary/30' : 'bg-secondary-bg'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">
            {t(lang, 'form.create_proposal.sign_in_first')}
          </p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'form.create_proposal.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Step 0: Select Hackathon */}
        {step === 0 && (
          <>
            <p className="text-sm text-muted mb-4">
              {t(lang, 'form.create_proposal.select_hackathon')}
            </p>
            {hackathons.length === 0 ? (
              <p className="text-muted text-sm">{t(lang, 'form.create_proposal.no_hackathons')}</p>
            ) : (
              <div className="grid gap-3">
                {hackathons.map(h => (
                  <button
                    key={h.slug}
                    type="button"
                    onClick={() => { setSelectedHackathon(h.slug); setTrack(''); }}
                    className={`text-left p-4 rounded-lg border transition-colors ${
                      selectedHackathon === h.slug
                        ? 'border-lime-primary bg-lime-primary/10'
                        : 'border-secondary-bg hover:border-light-gray'
                    }`}
                  >
                    <div className={`font-medium ${selectedHackathon === h.slug ? 'text-lime-primary' : 'text-white'}`}>
                      {lang === 'zh' ? (h.name_zh || h.name) : h.name}
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {h.tracks.length} {lang === 'zh' ? '个赛道' : 'track(s)'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Step 1: Project Info */}
        {step === 1 && (
          <>
            <div>
              <label htmlFor="prop-name" className={labelClass}>{t(lang, 'form.create_proposal.project_name_en')}</label>
              <input id="prop-name" type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="AgentFlow" aria-required="true" aria-invalid={!!submitError} className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-name-zh" className={labelClass}>{t(lang, 'form.create_proposal.project_name_zh')}</label>
              <input id="prop-name-zh" type="text" value={nameZh} onChange={e => setNameZh(e.target.value)}
                placeholder="智能体工作流" className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-tagline" className={labelClass}>{t(lang, 'form.create_proposal.tagline_en')}</label>
              <input id="prop-tagline" type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="Visual workflow builder for AI agents" aria-required="true" className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-tagline-zh" className={labelClass}>{t(lang, 'form.create_proposal.tagline_zh')}</label>
              <input id="prop-tagline-zh" type="text" value={taglineZh} onChange={e => setTaglineZh(e.target.value)}
                placeholder="可视化 AI 智能体工作流构建器" className={inputClass} />
            </div>
            {currentHackathon && currentHackathon.tracks.length > 0 && (
              <div>
                <label htmlFor="prop-track" className={labelClass}>{t(lang, 'form.create_proposal.track')}</label>
                <select id="prop-track" value={track} onChange={e => setTrack(e.target.value)} aria-required="true" className={selectClass}>
                  <option value="">{t(lang, 'form.create_proposal.select_track')}</option>
                  {currentHackathon.tracks.map(tr => (
                    <option key={tr.slug} value={tr.slug}>
                      {lang === 'zh' ? (tr.name_zh || tr.name) : tr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.tech_stack')}</label>
              <p className="text-xs text-muted mb-2">{t(lang, 'form.create_proposal.tech_stack_hint')}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {techStack.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-lime-primary/15 text-lime-primary text-xs">
                    {tag}
                    <button type="button" onClick={() => removeTech(idx)} className="hover:text-white">{'\u2715'}</button>
                  </span>
                ))}
              </div>
              <input type="text" value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={handleTechKeyDown}
                placeholder={t(lang, 'form.create_proposal.tech_stack_placeholder')} className={inputClass} />
            </div>
          </>
        )}

        {/* Step 2: Team */}
        {step === 2 && (
          <>
            <p className="text-sm text-muted">{t(lang, 'form.create_proposal.team_hint')}</p>
            <div className="space-y-4">
              {members.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" value={m.github} onChange={e => updateMember(idx, 'github', e.target.value)}
                      placeholder={t(lang, 'form.create_proposal.github_username')} className={inputClass} />
                    <input type="text" value={m.role} onChange={e => updateMember(idx, 'role', e.target.value)}
                      placeholder={t(lang, 'form.create_proposal.role_placeholder')} className={inputClass} />
                  </div>
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(idx)} className={btnRemove}>{'\u2715'}</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addMember} className={btnAdd}>
              + {t(lang, 'form.create_proposal.add_member')}
            </button>
          </>
        )}

        {/* Step 3: Deliverables */}
        {step === 3 && (
          <>
            <div>
              <label htmlFor="prop-repo" className={labelClass}>{t(lang, 'form.create_proposal.repo_url')}</label>
              <input id="prop-repo" type="url" value={repo} onChange={e => setRepo(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.repo_placeholder')} aria-required="true" className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-video" className={labelClass}>{t(lang, 'form.create_proposal.video_url')}</label>
              <input id="prop-video" type="url" value={video} onChange={e => setVideo(e.target.value)}
                placeholder="https://youtube.com/watch?v=..." className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-demo" className={labelClass}>{t(lang, 'form.create_proposal.demo_url')}</label>
              <input id="prop-demo" type="url" value={demo} onChange={e => setDemo(e.target.value)}
                placeholder="https://your-demo.vercel.app" className={inputClass} />
            </div>
            <div>
              <label htmlFor="prop-desc" className={labelClass}>{t(lang, 'form.create_proposal.description_en')}</label>
              <textarea id="prop-desc" value={description} onChange={e => setDescription(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.description_placeholder')}
                className={`${inputClass} resize-none h-24`} />
            </div>
            <div>
              <label htmlFor="prop-desc-zh" className={labelClass}>{t(lang, 'form.create_proposal.description_zh')}</label>
              <textarea id="prop-desc-zh" value={descriptionZh} onChange={e => setDescriptionZh(e.target.value)}
                placeholder={t(lang, 'form.create_proposal.description_placeholder')}
                className={`${inputClass} resize-none h-24`} />
            </div>
          </>
        )}

        {/* Step 4: Preview & Submit */}
        {step === 4 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_proposal.preview_yaml')}</label>
              <pre className="w-full bg-surface border border-secondary-bg rounded-md px-4 py-3 text-lime-primary text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
            <p className="text-xs text-muted">
              {t(lang, 'form.create_proposal.submit_hint')}{' '}
              <code className="text-lime-primary">
                hackathons/{selectedHackathon}/submissions/{teamSlug}/project.yml
              </code>
            </p>
          </>
        )}

        {/* Validation hint */}
        {!isStepValid(step) && step < TOTAL_STEPS - 1 && (
          <p className="text-xs text-warning">
            {t(lang, 'form.create_proposal.complete_required')}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-lg border border-secondary-bg text-muted text-sm hover:text-white hover:border-light-gray transition-colors">
              {t(lang, 'form.create_proposal.back')}
            </button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid(step)}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {t(lang, 'form.create_proposal.next')}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-3">
              <button type="button" onClick={handleSubmit}
                disabled={!isLoggedIn || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(3) || submitting}
                aria-describedby={submitError ? 'proposal-submit-error' : undefined}
                className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? t(lang, 'form.common.submitting') : t(lang, 'form.create_proposal.submit_pr')} {'\u2192'}
              </button>
              {submitError && (
                <div id="proposal-submit-error" role="alert" className="w-full rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium mb-1">{t(lang, 'form.common.submit_error')}</p>
                      <p className="text-xs text-error/80 break-all">{submitError}</p>
                    </div>
                    <button type="button" onClick={() => setSubmitError('')}
                      className="shrink-0 text-error/60 hover:text-error transition-colors text-lg leading-none">&times;</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}

export default CreateProposalForm;
