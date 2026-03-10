'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { t } from '@synnovator/shared/i18n';
import type { Lang } from '@synnovator/shared/i18n';
import { formatYaml } from './form-utils';
import { TimelineEditor, DEFAULT_STAGES, type Stage } from './TimelineEditor';

interface CreateHackathonFormProps {
  templates: Record<string, unknown>;
  lang: Lang;
}

interface Organizer {
  name: string;
  name_zh: string;
  role: string;
}

interface Criterion {
  name: string;
  weight: string;
}

interface TrackData {
  name: string;
  name_zh: string;
  slug: string;
  rewards: string;
  criteria: Criterion[];
}

type HackathonType = 'community' | 'enterprise' | 'youth-league' | '';

const TYPE_OPTIONS = [
  { value: 'community', zh: '社区 Hackathon', en: 'Community Hackathon', desc_zh: '开放参与，面向所有开发者', desc_en: 'Open participation for all developers' },
  { value: 'enterprise', zh: '企业 Hackathon', en: 'Enterprise Hackathon', desc_zh: '企业级赛事，可包含 NDA 要求', desc_en: 'Enterprise events with optional NDA requirements' },
  { value: 'youth-league', zh: '青年联赛', en: 'Youth League', desc_zh: '面向青年开发者的竞赛', desc_en: 'Competition for young developers' },
];

const STEP_LABELS_ZH = ['类型', '基本信息', '组织者', '时间线', '赛道', '法律', '设置', '预览'];
const STEP_LABELS_EN = ['Type', 'Basic Info', 'Organizers', 'Timeline', 'Tracks', 'Legal', 'Settings', 'Preview'];
const TOTAL_STEPS = 8;

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Shared CSS classes — hoisted outside components to avoid re-creation
const inputClass = 'w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none';
const selectClass = 'w-full bg-background border border-border rounded-md px-3 py-2 text-foreground text-sm focus:border-ring focus:outline-none';
const btnRemove = 'px-2 text-muted-foreground hover:text-destructive transition-colors';
const btnAdd = 'text-sm text-primary hover:text-primary/80 transition-colors';

/* ------------------------------------------------------------------ */
/*  Memoized sub-components for expensive list sections               */
/* ------------------------------------------------------------------ */

interface OrganizerListProps {
  organizers: Organizer[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onUpdate: (idx: number, field: keyof Organizer, value: string) => void;
  lang: Lang;
}

const OrganizerList = memo(function OrganizerList({ organizers, onAdd, onRemove, onUpdate, lang }: OrganizerListProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{t(lang, 'form.create_hackathon.add_organizers')}</p>
      <div className="space-y-4">
        {organizers.map((org, idx) => (
          <div key={idx} className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
              <input type="text" value={org.name} onChange={e => onUpdate(idx, 'name', e.target.value)}
                placeholder={t(lang, 'form.create_hackathon.org_name_en')} className={inputClass} />
              <input type="text" value={org.name_zh} onChange={e => onUpdate(idx, 'name_zh', e.target.value)}
                placeholder={t(lang, 'form.create_hackathon.org_name_zh')} className={inputClass} />
              <select value={org.role} onChange={e => onUpdate(idx, 'role', e.target.value)} className={selectClass}>
                <option value="organizer">{t(lang, 'form.create_hackathon.organizer')}</option>
                <option value="co-organizer">{t(lang, 'form.create_hackathon.co_organizer')}</option>
                <option value="sponsor">{t(lang, 'form.create_hackathon.sponsor')}</option>
              </select>
            </div>
            {organizers.length > 1 && (
              <button type="button" onClick={() => onRemove(idx)} className={btnRemove}>{'\u2715'}</button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={onAdd} className={btnAdd}>
        + {t(lang, 'form.create_hackathon.add_organizer')}
      </button>
    </>
  );
});

interface TrackEditorProps {
  tracks: TrackData[];
  onAddTrack: () => void;
  onRemoveTrack: (idx: number) => void;
  onUpdateTrack: (idx: number, field: keyof TrackData, value: unknown) => void;
  onAddCriterion: (tIdx: number) => void;
  onRemoveCriterion: (tIdx: number, cIdx: number) => void;
  onUpdateCriterion: (tIdx: number, cIdx: number, field: keyof Criterion, value: string) => void;
  lang: Lang;
}

const TrackEditor = memo(function TrackEditor({
  tracks, onAddTrack, onRemoveTrack, onUpdateTrack,
  onAddCriterion, onRemoveCriterion, onUpdateCriterion, lang,
}: TrackEditorProps) {
  return (
    <>
      <p className="text-sm text-muted-foreground">{t(lang, 'form.create_hackathon.add_tracks')}</p>
      <div className="space-y-6">
        {tracks.map((tr, tIdx) => {
          const weightSum = tr.criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
          const weightOk = Math.abs(weightSum - 1.0) < 0.01;
          return (
            <div key={tIdx} className="p-4 rounded-lg border border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground font-medium">{t(lang, 'form.create_hackathon.track_n')} {tIdx + 1}</span>
                {tracks.length > 1 && (
                  <button type="button" onClick={() => onRemoveTrack(tIdx)} className={btnRemove}>{'\u2715'}</button>
                )}
              </div>
              <input type="text" value={tr.name}
                onChange={e => { onUpdateTrack(tIdx, 'name', e.target.value); if (!tr.slug) onUpdateTrack(tIdx, 'slug', toSlug(e.target.value)); }}
                placeholder={t(lang, 'form.create_hackathon.track_name_en')} className={inputClass} />
              <input type="text" value={tr.name_zh} onChange={e => onUpdateTrack(tIdx, 'name_zh', e.target.value)}
                placeholder={t(lang, 'form.create_hackathon.track_name_zh')} className={inputClass} />
              <input type="text" value={tr.slug} onChange={e => onUpdateTrack(tIdx, 'slug', e.target.value)}
                placeholder={toSlug(tr.name) || 'track-slug'} className={inputClass} />

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t(lang, 'form.create_hackathon.rewards_hint')}
                </label>
                <textarea value={tr.rewards} onChange={e => onUpdateTrack(tIdx, 'rewards', e.target.value)}
                  placeholder={'1st: $1,000\n2nd: $500\n3rd: $250'}
                  className={`${inputClass} resize-none h-20`} />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs text-muted-foreground">{t(lang, 'form.create_hackathon.judging_criteria')}</label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${weightOk ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'}`}>
                    {t(lang, 'form.create_hackathon.weight_total')}: {weightSum.toFixed(2)} {weightOk ? '\u2713' : t(lang, 'form.create_hackathon.should_be_one')}
                  </span>
                </div>

                {/* Criteria cards */}
                <div className="space-y-3">
                  {tr.criteria.map((c, cIdx) => (
                    <div key={cIdx} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {t(lang, 'form.create_hackathon.criterion_n')} {cIdx + 1}
                        </span>
                        {tr.criteria.length > 1 && (
                          <button type="button" onClick={() => onRemoveCriterion(tIdx, cIdx)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                            {t(lang, 'form.create_hackathon.remove')}
                          </button>
                        )}
                      </div>
                      <input type="text" value={c.name}
                        onChange={e => onUpdateCriterion(tIdx, cIdx, 'name', e.target.value)}
                        placeholder={t(lang, 'form.create_hackathon.criterion_placeholder')}
                        className={inputClass} />
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">{t(lang, 'form.create_hackathon.weight')}:</label>
                        <input type="range" min="0" max="1" step="0.05"
                          value={c.weight}
                          onChange={e => onUpdateCriterion(tIdx, cIdx, 'weight', e.target.value)}
                          className="flex-1 accent-primary" />
                        <input type="number" step="0.05" min="0" max="1"
                          value={c.weight}
                          onChange={e => onUpdateCriterion(tIdx, cIdx, 'weight', e.target.value)}
                          className={`${inputClass} w-20 text-center`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weight distribution bar */}
                {tr.criteria.length > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
                    {tr.criteria.map((c, cIdx) => {
                      const w = parseFloat(c.weight) || 0;
                      const colors = ['bg-primary', 'bg-cyan', 'bg-orange', 'bg-neon-blue', 'bg-pink', 'bg-mint'];
                      return w > 0 ? (
                        <div key={cIdx} className={`${colors[cIdx % colors.length]} transition-all`}
                          style={{ width: `${w * 100}%` }} />
                      ) : null;
                    })}
                  </div>
                )}

                <button type="button" onClick={() => onAddCriterion(tIdx)} className={`${btnAdd} mt-3`}>
                  + {t(lang, 'form.create_hackathon.add_criterion')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onAddTrack} className={btnAdd}>
        + {t(lang, 'form.create_hackathon.add_track')}
      </button>
    </>
  );
});

export function CreateHackathonForm({ lang }: CreateHackathonFormProps) {
  const { loading, isLoggedIn } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0: Type
  const [hackathonType, setHackathonType] = useState<HackathonType>('');

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [nameZh, setNameZh] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [tagline, setTagline] = useState('');
  const [taglineZh, setTaglineZh] = useState('');

  // Step 2: Organizers
  const [organizers, setOrganizers] = useState<Organizer[]>([{ name: '', name_zh: '', role: 'organizer' }]);

  // Step 3: Timeline
  const [timelineStages, setTimelineStages] = useState<Stage[]>(DEFAULT_STAGES);

  // Step 4: Tracks
  const [tracks, setTracks] = useState<TrackData[]>([{
    name: '', name_zh: '', slug: '', rewards: '1st: $1,000', criteria: [{ name: 'Innovation', weight: '0.3' }],
  }]);

  // Step 5: Legal
  const [license, setLicense] = useState('Apache-2.0');
  const [ipOwnership, setIpOwnership] = useState('participant');
  const [ndaRequired, setNdaRequired] = useState(false);
  const [ndaDocUrl, setNdaDocUrl] = useState('');
  const [ndaSummary, setNdaSummary] = useState('');

  // Step 6: Settings
  const [langOptions, setLangOptions] = useState<string[]>(['zh', 'en']);
  const [publicVote, setPublicVote] = useState('reactions');
  const [eligibilityOpen, setEligibilityOpen] = useState('all');
  const [teamMin, setTeamMin] = useState('1');
  const [teamMax, setTeamMax] = useState('5');
  const [allowSolo, setAllowSolo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const stepLabels = lang === 'zh' ? STEP_LABELS_ZH : STEP_LABELS_EN;

  // Auto-slug from name
  function handleNameChange(val: string) {
    setName(val);
    if (!slugManual) setSlug(toSlug(val));
  }

  // Organizer helpers — wrapped in useCallback for memoized sub-component
  const addOrganizer = useCallback(() => {
    setOrganizers(prev => [...prev, { name: '', name_zh: '', role: 'organizer' }]);
  }, []);
  const removeOrganizer = useCallback((idx: number) => {
    setOrganizers(prev => prev.filter((_, i) => i !== idx));
  }, []);
  const updateOrganizer = useCallback((idx: number, field: keyof Organizer, value: string) => {
    setOrganizers(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });
  }, []);

  // Track helpers — wrapped in useCallback for memoized sub-component
  const addTrack = useCallback(() => {
    setTracks(prev => [...prev, { name: '', name_zh: '', slug: '', rewards: '', criteria: [{ name: '', weight: '0.3' }] }]);
  }, []);
  const removeTrack = useCallback((idx: number) => {
    setTracks(prev => prev.filter((_, i) => i !== idx));
  }, []);
  const updateTrack = useCallback((idx: number, field: keyof TrackData, value: unknown) => {
    setTracks(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value } as TrackData; return n; });
  }, []);
  const addCriterion = useCallback((tIdx: number) => {
    setTracks(prev => {
      const n = [...prev];
      n[tIdx] = { ...n[tIdx], criteria: [...n[tIdx].criteria, { name: '', weight: '0.1' }] };
      return n;
    });
  }, []);
  const removeCriterion = useCallback((tIdx: number, cIdx: number) => {
    setTracks(prev => {
      const n = [...prev];
      n[tIdx] = { ...n[tIdx], criteria: n[tIdx].criteria.filter((_, i) => i !== cIdx) };
      return n;
    });
  }, []);
  const updateCriterion = useCallback((tIdx: number, cIdx: number, field: keyof Criterion, value: string) => {
    setTracks(prev => {
      const n = [...prev];
      const criteria = [...n[tIdx].criteria];
      criteria[cIdx] = { ...criteria[cIdx], [field]: value };
      n[tIdx] = { ...n[tIdx], criteria };
      return n;
    });
  }, []);

  // Language toggle
  function toggleLang(l: string) {
    setLangOptions(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  // Step validation — returns true if all required fields for the step are filled
  function isStepValid(s: number): boolean {
    switch (s) {
      case 0: return hackathonType !== '';
      case 1: return name.trim() !== '';
      case 2: return organizers.some(o => o.name.trim() !== '');
      case 3: {
        // Must match CI validation: registration start+end required, active stages need description
        const reg = timelineStages.find(st => st.key === 'registration');
        if (!reg || !reg.start || !reg.end) return false;
        for (const st of timelineStages) {
          if (st.start && !st.description) return false;
        }
        return true;
      }
      case 4: return tracks.some(tr => tr.name.trim() !== '');
      case 5: return true; // legal has defaults
      case 6: return true; // settings have defaults
      case 7: return true; // preview
      default: return true;
    }
  }

  // Build YAML
  const yamlContent = useMemo(() => {
    const timelineObj: Record<string, unknown> = {};
    for (const stage of timelineStages) {
      if (stage.start || stage.end) {
        timelineObj[stage.key] = {
          start: stage.start || undefined,
          end: stage.end || undefined,
          description: stage.description || undefined,
          description_zh: stage.descriptionZh || undefined,
        };
      }
    }

    const tracksArr = tracks.filter(tr => tr.name).map(tr => {
      const rewardLines = tr.rewards.split('\n').filter(Boolean);
      const rewards = rewardLines.map(line => {
        const [rank, ...rest] = line.split(':');
        return { type: 'prize', rank: rank.trim(), amount: rest.join(':').trim() };
      });
      const criteria = tr.criteria.filter(c => c.name).map(c => ({
        name: c.name,
        weight: parseFloat(c.weight) || 0,
        score_range: [0, 100],
      }));
      return {
        name: tr.name,
        name_zh: tr.name_zh || undefined,
        slug: tr.slug || toSlug(tr.name),
        rewards: rewards.length > 0 ? rewards : undefined,
        judging: criteria.length > 0 ? { mode: 'weighted', criteria } : undefined,
      };
    });

    const legalObj: Record<string, unknown> = {
      license: license || undefined,
      ip_ownership: ipOwnership || undefined,
    };
    if (hackathonType === 'enterprise' && ndaRequired) {
      legalObj.nda = {
        required: true,
        document_url: ndaDocUrl || undefined,
        summary: ndaSummary || undefined,
      };
    }

    const data: Record<string, unknown> = {
      synnovator_version: '2.0',
      hackathon: {
        name: name || undefined,
        name_zh: nameZh || undefined,
        slug: slug || undefined,
        tagline: tagline || undefined,
        tagline_zh: taglineZh || undefined,
        type: hackathonType || undefined,
        organizers: organizers.filter(o => o.name).map(o => ({
          name: o.name,
          name_zh: o.name_zh || undefined,
          role: o.role || 'organizer',
        })),
        eligibility: {
          open_to: eligibilityOpen,
          team_size: { min: parseInt(teamMin) || 1, max: parseInt(teamMax) || 5 },
          allow_solo: allowSolo,
        },
        legal: legalObj,
        timeline: Object.keys(timelineObj).length > 0 ? timelineObj : undefined,
        tracks: tracksArr.length > 0 ? tracksArr : undefined,
        settings: {
          language: langOptions,
          public_vote: publicVote,
        },
      },
    };
    return formatYaml(data);
  }, [name, nameZh, slug, tagline, taglineZh, hackathonType, organizers, timelineStages, tracks, license, ipOwnership, ndaRequired, ndaDocUrl, ndaSummary, langOptions, publicVote, eligibilityOpen, teamMin, teamMax, allowSolo]);

  async function handleSubmit() {
    const finalSlug = slug || toSlug(name);
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hackathon',
          filename: `hackathons/${finalSlug}/hackathon.yml`,
          content: yamlContent,
          slug: finalSlug,
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

  const labelClass = 'block text-sm text-muted-foreground mb-2';

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {/* Step indicators */}
      <div aria-label="Progress" className="flex items-center justify-between mb-8 overflow-x-auto">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center" aria-current={idx === step ? 'step' : undefined}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx === step ? 'bg-primary text-primary-foreground'
                  : idx < step ? (isStepValid(idx) ? 'bg-primary/30 text-primary' : 'bg-warning/30 text-warning') : 'bg-muted text-muted-foreground'
              }`}>
                {idx < step ? (isStepValid(idx) ? '\u2713' : '!') : idx + 1}
              </div>
              <span className={`mt-1 text-xs whitespace-nowrap hidden sm:block ${idx === step ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {idx < TOTAL_STEPS - 1 && (
              <div className={`hidden sm:block w-6 h-px mx-0.5 mt-[-1rem] ${idx < step ? 'bg-primary/30' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Login prompt */}
      {!loading && !isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <p className="text-warning text-sm mb-3">
            {t(lang, 'form.create_hackathon.sign_in_first')}
          </p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            {t(lang, 'form.create_hackathon.sign_in_github')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Step 0: Type Selection */}
        {step === 0 && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {t(lang, 'form.create_hackathon.choose_type')}
            </p>
            <div className="grid gap-3">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHackathonType(opt.value as HackathonType)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    hackathonType === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-foreground'
                  }`}
                >
                  <div className={`font-medium ${hackathonType === opt.value ? 'text-primary' : 'text-foreground'}`}>
                    {lang === 'zh' ? opt.zh : opt.en}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lang === 'zh' ? opt.desc_zh : opt.desc_en}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <div>
              <label htmlFor="hack-name" className={labelClass}>{t(lang, 'form.create_hackathon.name_en')}</label>
              <input id="hack-name" type="text" value={name} onChange={e => handleNameChange(e.target.value)}
                placeholder="Community Hackathon 2026" aria-required="true" aria-invalid={!!submitError} className={inputClass} />
            </div>
            <div>
              <label htmlFor="hack-name-zh" className={labelClass}>{t(lang, 'form.create_hackathon.name_zh')}</label>
              <input id="hack-name-zh" type="text" value={nameZh} onChange={e => setNameZh(e.target.value)}
                placeholder="2026 社区 Hackathon" className={inputClass} />
            </div>
            <div>
              <label htmlFor="hack-slug" className={labelClass}>Slug</label>
              <input id="hack-slug" type="text" value={slug}
                onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder={toSlug(name) || 'community-hackathon-2026'}
                className={inputClass} />
              <p className="text-xs text-muted-foreground mt-1">
                {t(lang, 'form.create_hackathon.slug_hint')}
              </p>
            </div>
            <div>
              <label htmlFor="hack-tagline" className={labelClass}>{t(lang, 'form.create_hackathon.tagline_en')}</label>
              <input id="hack-tagline" type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="Build something amazing with AI" className={inputClass} />
            </div>
            <div>
              <label htmlFor="hack-tagline-zh" className={labelClass}>{t(lang, 'form.create_hackathon.tagline_zh')}</label>
              <input id="hack-tagline-zh" type="text" value={taglineZh} onChange={e => setTaglineZh(e.target.value)}
                placeholder={t(lang, 'form.create_hackathon.tagline_placeholder_zh')} className={inputClass} />
            </div>
          </>
        )}

        {/* Step 2: Organizers */}
        {step === 2 && (
          <OrganizerList
            organizers={organizers}
            onAdd={addOrganizer}
            onRemove={removeOrganizer}
            onUpdate={updateOrganizer}
            lang={lang}
          />
        )}

        {/* Step 3: Timeline */}
        {step === 3 && (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              {t(lang, 'form.create_hackathon.timeline_hint')}
            </p>
            <TimelineEditor
              lang={lang}
              value={timelineStages}
              onChange={setTimelineStages}
            />
          </>
        )}

        {/* Step 4: Tracks */}
        {step === 4 && (
          <TrackEditor
            tracks={tracks}
            onAddTrack={addTrack}
            onRemoveTrack={removeTrack}
            onUpdateTrack={updateTrack}
            onAddCriterion={addCriterion}
            onRemoveCriterion={removeCriterion}
            onUpdateCriterion={updateCriterion}
            lang={lang}
          />
        )}

        {/* Step 5: Legal */}
        {step === 5 && (
          <>
            <div>
              <label htmlFor="hack-license" className={labelClass}>{t(lang, 'form.create_hackathon.license')}</label>
              <select id="hack-license" value={license} onChange={e => setLicense(e.target.value)} className={selectClass}>
                <option value="Apache-2.0">Apache-2.0</option>
                <option value="MIT">MIT</option>
                <option value="GPL-3.0">GPL-3.0</option>
                <option value="BSD-3-Clause">BSD-3-Clause</option>
              </select>
            </div>
            <div>
              <label htmlFor="hack-ip" className={labelClass}>{t(lang, 'form.create_hackathon.ip_ownership')}</label>
              <select id="hack-ip" value={ipOwnership} onChange={e => setIpOwnership(e.target.value)} className={selectClass}>
                <option value="participant">{t(lang, 'form.create_hackathon.participant')}</option>
                <option value="organizer">{t(lang, 'form.create_hackathon.organizer')}</option>
                <option value="shared">{t(lang, 'form.create_hackathon.shared')}</option>
              </select>
            </div>
            {hackathonType === 'enterprise' && (
              <div className="border-t border-border pt-4 mt-4 space-y-4">
                <p className="text-sm text-foreground font-medium">NDA {t(lang, 'form.create_hackathon.nda_config')}</p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={ndaRequired} onChange={e => setNdaRequired(e.target.checked)}
                    className="rounded border-border bg-background" />
                  {t(lang, 'form.create_hackathon.require_nda')}
                </label>
                {ndaRequired && (
                  <>
                    <div>
                      <label className={labelClass}>{t(lang, 'form.create_hackathon.nda_doc_url')}</label>
                      <input type="url" value={ndaDocUrl} onChange={e => setNdaDocUrl(e.target.value)}
                        placeholder="https://..." className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t(lang, 'form.create_hackathon.nda_summary')}</label>
                      <textarea value={ndaSummary} onChange={e => setNdaSummary(e.target.value)}
                        placeholder={t(lang, 'form.create_hackathon.nda_summary_placeholder')}
                        className={`${inputClass} resize-none h-20`} />
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 6: Settings */}
        {step === 6 && (
          <>
            <div>
              <label htmlFor="hack-eligibility" className={labelClass}>{t(lang, 'form.create_hackathon.eligibility')}</label>
              <select id="hack-eligibility" value={eligibilityOpen} onChange={e => setEligibilityOpen(e.target.value)} className={selectClass}>
                <option value="all">{t(lang, 'form.create_hackathon.all')}</option>
                <option value="invite-only">{t(lang, 'form.create_hackathon.invite_only')}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="hack-min-team" className={labelClass}>{t(lang, 'form.create_hackathon.min_team_size')}</label>
                <input id="hack-min-team" type="number" min="1" value={teamMin} onChange={e => setTeamMin(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="hack-max-team" className={labelClass}>{t(lang, 'form.create_hackathon.max_team_size')}</label>
                <input id="hack-max-team" type="number" min="1" value={teamMax} onChange={e => setTeamMax(e.target.value)} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={allowSolo} onChange={e => setAllowSolo(e.target.checked)}
                className="rounded border-border bg-background" />
              {t(lang, 'form.create_hackathon.allow_solo')}
            </label>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_hackathon.languages')}</label>
              <div className="flex gap-3">
                {['zh', 'en'].map(l => (
                  <label key={l} className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={langOptions.includes(l)} onChange={() => toggleLang(l)}
                      className="rounded border-border bg-background" />
                    {l === 'zh' ? t(lang, 'form.create_hackathon.chinese') : t(lang, 'form.create_hackathon.english')}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="hack-voting" className={labelClass}>{t(lang, 'form.create_hackathon.public_voting')}</label>
              <select id="hack-voting" value={publicVote} onChange={e => setPublicVote(e.target.value)} className={selectClass}>
                <option value="reactions">Reactions</option>
                <option value="none">{t(lang, 'form.create_hackathon.none')}</option>
              </select>
            </div>
          </>
        )}

        {/* Step 7: Preview & Submit */}
        {step === 7 && (
          <>
            <div>
              <label className={labelClass}>{t(lang, 'form.create_hackathon.preview_yaml')}</label>
              <pre className="w-full bg-background border border-border rounded-md px-4 py-3 text-primary text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(lang, 'form.create_hackathon.submit_hint')}{' '}
              <code className="text-primary">hackathons/{slug || toSlug(name) || '{slug}'}/hackathon.yml</code>
            </p>
          </>
        )}

        {/* Validation hint */}
        {!isStepValid(step) && step < TOTAL_STEPS - 1 && (
          <p className="text-xs text-warning">
            {t(lang, 'form.create_hackathon.complete_required')}
          </p>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground transition-colors">
              {t(lang, 'form.create_hackathon.back')}
            </button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              disabled={!isStepValid(step)}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {t(lang, 'form.create_hackathon.next')}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-3">
              <button type="button" onClick={handleSubmit}
                disabled={!isLoggedIn || !isStepValid(0) || !isStepValid(1) || !isStepValid(2) || !isStepValid(4) || submitting}
                aria-describedby={submitError ? 'hackathon-submit-error' : undefined}
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? t(lang, 'form.common.submitting') : t(lang, 'form.create_hackathon.submit_pr')} {'\u2192'}
              </button>
              {submitError && (
                <div id="hackathon-submit-error" role="alert" className="w-full rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium mb-1">{t(lang, 'form.common.submit_error')}</p>
                      <p className="text-xs text-destructive/80 break-all">{submitError}</p>
                    </div>
                    <button type="button" onClick={() => setSubmitError('')}
                      className="shrink-0 text-destructive/60 hover:text-destructive transition-colors text-lg leading-none">&times;</button>
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

export default CreateHackathonForm;
