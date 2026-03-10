'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { formatYaml } from './form-utils';

interface ProfileCreateFormProps {
  lang: Lang;
}

interface SkillCategory {
  category: string;
  items: string;
}

const IDENTITY_TYPES = [
  { value: 'student', zh: '学生', en: 'Student' },
  { value: 'professional', zh: '职业人士', en: 'Professional' },
  { value: 'academic', zh: '学术研究者', en: 'Academic' },
];

const DEGREES = [
  { value: 'bachelor', zh: '本科', en: 'Bachelor' },
  { value: 'master', zh: '硕士', en: 'Master' },
  { value: 'phd', zh: '博士', en: 'PhD' },
];

const STEP_LABELS_ZH = ['基本信息', '身份', '技能', '更多', '预览'];
const STEP_LABELS_EN = ['Basic Info', 'Identity', 'Skills', 'More', 'Preview'];
const TOTAL_STEPS = 5;

export function ProfileCreateForm({ lang }: ProfileCreateFormProps) {
  const { user, loading, isLoggedIn } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0: Basic Info
  const [name, setName] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState('');

  // Step 1: Identity
  const [identityType, setIdentityType] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [degree, setDegree] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');

  // Step 2: Skills
  const [skills, setSkills] = useState<SkillCategory[]>([{ category: '', items: '' }]);

  // Step 3: More
  const [interests, setInterests] = useState('');
  const [lookingForRoles, setLookingForRoles] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [collaborationStyle, setCollaborationStyle] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const stepLabels = lang === 'zh' ? STEP_LABELS_ZH : STEP_LABELS_EN;

  // Skills helpers
  function addSkill() {
    setSkills(prev => [...prev, { category: '', items: '' }]);
  }

  function removeSkill(idx: number) {
    setSkills(prev => prev.filter((_, i) => i !== idx));
  }

  function updateSkill(idx: number, field: keyof SkillCategory, value: string) {
    setSkills(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  // Step validation
  function isStepValid(s: number): boolean {
    switch (s) {
      case 0: return name.trim() !== '';
      case 1: return true; // identity is optional
      case 2: return true; // skills are optional
      case 3: return true; // more is optional
      case 4: return true; // preview
      default: return true;
    }
  }

  // Generate YAML
  const yamlContent = useMemo(() => {
    const profile: Record<string, unknown> = {
      synnovator_profile: '2.0',
      hacker: {
        github: user?.login ?? '',
        name: name || undefined,
        name_zh: nameZh || undefined,
        bio: bio || undefined,
        location: location || undefined,
        languages: languages ? languages.split(',').map(l => l.trim()).filter(Boolean) : undefined,
        identity: identityType ? {
          type: identityType,
          affiliation: affiliation || undefined,
          ...(identityType === 'student' ? {
            degree: degree || undefined,
            major: major || undefined,
            graduation_year: gradYear ? parseInt(gradYear) : undefined,
          } : {}),
        } : undefined,
        skills: skills.filter(s => s.category && s.items).length > 0
          ? skills.filter(s => s.category && s.items).map(s => ({
              category: s.category,
              items: s.items.split(',').map(i => i.trim()).filter(Boolean),
            }))
          : undefined,
        interests: interests ? interests.split(',').map(i => i.trim()).filter(Boolean) : undefined,
        looking_for: (lookingForRoles || teamSize || collaborationStyle) ? {
          roles: lookingForRoles ? lookingForRoles.split(',').map(r => r.trim()).filter(Boolean) : undefined,
          team_size: teamSize || undefined,
          collaboration_style: collaborationStyle || undefined,
        } : undefined,
        links: (twitter || linkedin || website) ? {
          twitter: twitter || undefined,
          linkedin: linkedin || undefined,
          website: website || undefined,
        } : undefined,
      },
    };
    return formatYaml(profile);
  }, [user, name, nameZh, bio, location, languages, identityType, affiliation, degree, major, gradYear, skills, interests, lookingForRoles, teamSize, collaborationStyle, twitter, linkedin, website]);

  function generateUUID8(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleSubmit() {
    if (!user) return;
    const uuid = generateUUID8();
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          filename: `profiles/${user.login}-${uuid}.yml`,
          content: yamlContent,
          slug: user.login,
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

  // Shared CSS classes
  const inputClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const readOnlyClass = 'w-full bg-surface/50 border border-secondary-bg rounded-md px-3 py-2 text-muted text-sm cursor-not-allowed';
  const labelClass = 'block text-sm text-muted mb-2';
  const selectClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      {/* Step indicators */}
      <div aria-label="Progress" className="flex items-center justify-between mb-8">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center" aria-current={idx === step ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  idx === step
                    ? 'bg-lime-primary text-near-black'
                    : idx < step
                      ? (isStepValid(idx) ? 'bg-lime-primary/30 text-lime-primary' : 'bg-warning/30 text-warning')
                      : 'bg-secondary-bg text-muted'
                }`}
              >
                {idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
              </div>
              <span className={`mt-1 text-xs whitespace-nowrap ${
                idx === step ? 'text-lime-primary' : 'text-muted'
              }`}>
                {label}
              </span>
            </div>
            {idx < TOTAL_STEPS - 1 && (
              <div className={`hidden sm:block w-8 h-px mx-1 mt-[-1rem] ${
                idx < step ? 'bg-lime-primary/30' : 'bg-secondary-bg'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">
            {t(lang, 'form.profile.sign_in_first')}
          </p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t(lang, 'form.profile.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <>
            <div>
              <label htmlFor="prof-github" className={labelClass}>GitHub Username</label>
              <input
                id="prof-github"
                type="text"
                value={loading ? '...' : (user?.login ?? '')}
                readOnly
                className={readOnlyClass}
              />
            </div>
            <div>
              <label htmlFor="prof-name" className={labelClass}>{t(lang, 'form.profile.display_name_en')}</label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                aria-required="true"
                aria-invalid={!!submitError}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-name-zh" className={labelClass}>{t(lang, 'form.profile.display_name_zh')} ({t(lang, 'form.profile.optional')})</label>
              <input
                id="prof-name-zh"
                type="text"
                value={nameZh}
                onChange={e => setNameZh(e.target.value)}
                placeholder={t(lang, 'form.profile.name_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-bio" className={labelClass}>{t(lang, 'form.profile.bio')}</label>
              <textarea
                id="prof-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t(lang, 'form.profile.bio_placeholder')}
                className={`${inputClass} resize-none h-20`}
              />
            </div>
            <div>
              <label htmlFor="prof-location" className={labelClass}>{t(lang, 'form.profile.location')}</label>
              <input
                id="prof-location"
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={t(lang, 'form.profile.location_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-languages" className={labelClass}>{t(lang, 'form.profile.languages')} ({t(lang, 'form.profile.languages_placeholder')})</label>
              <input
                id="prof-languages"
                type="text"
                value={languages}
                onChange={e => setLanguages(e.target.value)}
                placeholder="zh, en"
                className={inputClass}
              />
            </div>
          </>
        )}

        {/* Step 1: Identity */}
        {step === 1 && (
          <>
            <div>
              <label htmlFor="prof-identity" className={labelClass}>{t(lang, 'form.profile.identity_type')}</label>
              <select
                id="prof-identity"
                value={identityType}
                onChange={e => setIdentityType(e.target.value)}
                className={selectClass}
              >
                <option value="">{t(lang, 'form.profile.select_type')}</option>
                {IDENTITY_TYPES.map(it => (
                  <option key={it.value} value={it.value}>
                    {lang === 'zh' ? it.zh : it.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prof-affiliation" className={labelClass}>{t(lang, 'form.profile.affiliation')}</label>
              <input
                id="prof-affiliation"
                type="text"
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
                placeholder={t(lang, 'form.profile.affiliation_placeholder')}
                className={inputClass}
              />
            </div>
            {identityType === 'student' && (
              <>
                <div>
                  <label htmlFor="prof-degree" className={labelClass}>{t(lang, 'form.profile.degree')}</label>
                  <select
                    id="prof-degree"
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{t(lang, 'form.profile.select_degree')}</option>
                    {DEGREES.map(d => (
                      <option key={d.value} value={d.value}>
                        {lang === 'zh' ? d.zh : d.en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prof-major" className={labelClass}>{t(lang, 'form.profile.major')}</label>
                  <input
                    id="prof-major"
                    type="text"
                    value={major}
                    onChange={e => setMajor(e.target.value)}
                    placeholder={t(lang, 'form.profile.major_placeholder')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="prof-grad-year" className={labelClass}>{t(lang, 'form.profile.graduation_year')}</label>
                  <input
                    id="prof-grad-year"
                    type="number"
                    value={gradYear}
                    onChange={e => setGradYear(e.target.value)}
                    placeholder="2026"
                    className={inputClass}
                  />
                </div>
              </>
            )}
          </>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <>
            <p className="text-sm text-muted">
              {t(lang, 'form.profile.skills_hint')}
            </p>
            <div className="space-y-3">
              {skills.map((s, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={s.category}
                      onChange={e => updateSkill(idx, 'category', e.target.value)}
                      placeholder={t(lang, 'form.profile.category_placeholder')}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={s.items}
                      onChange={e => updateSkill(idx, 'items', e.target.value)}
                      placeholder={t(lang, 'form.profile.skills_placeholder')}
                      className={inputClass}
                    />
                  </div>
                  {skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkill(idx)}
                      className="mt-2 px-2 text-muted hover:text-error transition-colors"
                    >
                      {'\u2715'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSkill}
              className="text-sm text-lime-primary hover:text-lime-primary/80 transition-colors"
            >
              + {t(lang, 'form.profile.add_skill_category')}
            </button>
          </>
        )}

        {/* Step 3: More */}
        {step === 3 && (
          <>
            <div>
              <label htmlFor="prof-interests" className={labelClass}>{t(lang, 'form.profile.interests')} ({t(lang, 'form.profile.languages_placeholder')})</label>
              <input
                id="prof-interests"
                type="text"
                value={interests}
                onChange={e => setInterests(e.target.value)}
                placeholder={t(lang, 'form.profile.interests_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-roles" className={labelClass}>{t(lang, 'form.profile.looking_for_roles')} ({t(lang, 'form.profile.languages_placeholder')})</label>
              <input
                id="prof-roles"
                type="text"
                value={lookingForRoles}
                onChange={e => setLookingForRoles(e.target.value)}
                placeholder={t(lang, 'form.profile.roles_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-team-size" className={labelClass}>{t(lang, 'form.profile.team_size')}</label>
              <input
                id="prof-team-size"
                type="text"
                value={teamSize}
                onChange={e => setTeamSize(e.target.value)}
                placeholder={t(lang, 'form.profile.team_size_placeholder')}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="prof-collab" className={labelClass}>{t(lang, 'form.profile.collaboration_style')}</label>
              <input
                id="prof-collab"
                type="text"
                value={collaborationStyle}
                onChange={e => setCollaborationStyle(e.target.value)}
                placeholder={t(lang, 'form.profile.collaboration_placeholder')}
                className={inputClass}
              />
            </div>

            <div className="border-t border-secondary-bg pt-4 mt-4">
              <p className="text-sm text-muted mb-4">{t(lang, 'form.profile.social_links')}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="prof-twitter" className={labelClass}>Twitter</label>
                  <input
                    id="prof-twitter"
                    type="text"
                    value={twitter}
                    onChange={e => setTwitter(e.target.value)}
                    placeholder="@username"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="prof-linkedin" className={labelClass}>LinkedIn</label>
                  <input
                    id="prof-linkedin"
                    type="text"
                    value={linkedin}
                    onChange={e => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="prof-website" className={labelClass}>{t(lang, 'form.profile.website')}</label>
                  <input
                    id="prof-website"
                    type="text"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 4: Preview & Submit */}
        {step === 4 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.profile.preview_yaml')}</label>
              <pre className="w-full bg-surface border border-secondary-bg rounded-md px-4 py-3 text-lime-primary text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
            <p className="text-xs text-muted">
              {lang === 'zh'
                ? '点击提交后将在 GitHub 上创建 PR，文件路径为 '
                : 'Clicking submit will create a PR on GitHub with file path '}
              <code className="text-lime-primary">profiles/{user?.login ?? '{username}'}-{'<uuid>'}.yml</code>
            </p>
          </>
        )}

        {/* Validation hint */}
        {!isStepValid(step) && step < TOTAL_STEPS - 1 && (
          <p className="text-xs text-warning">
            {t(lang, 'form.profile.complete_required')}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-lg border border-secondary-bg text-muted text-sm hover:text-white hover:border-light-gray transition-colors"
            >
              {t(lang, 'form.profile.back')}
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid(step)}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t(lang, 'form.profile.next')}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isLoggedIn || !isStepValid(0) || submitting}
                aria-describedby={submitError ? 'profile-submit-error' : undefined}
                className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t(lang, 'form.common.submitting') : t(lang, 'form.profile.submit_pr')} {'\u2192'}
              </button>
              {submitError && (
                <div id="profile-submit-error" role="alert" className="w-full rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
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

export default ProfileCreateForm;
