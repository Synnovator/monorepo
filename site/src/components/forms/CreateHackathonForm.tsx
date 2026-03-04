import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { buildPRUrl, openGitHubUrl } from '@/lib/github-url';
import { formatYaml } from './form-utils';
import { TimelineEditor, DEFAULT_STAGES, type Stage } from './TimelineEditor';

interface CreateHackathonFormProps {
  templates: Record<string, unknown>;
  lang: 'zh' | 'en';
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

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const stepLabels = lang === 'zh' ? STEP_LABELS_ZH : STEP_LABELS_EN;

  // Auto-slug from name
  function handleNameChange(val: string) {
    setName(val);
    if (!slugManual) setSlug(toSlug(val));
  }

  // Organizer helpers
  function addOrganizer() {
    setOrganizers(prev => [...prev, { name: '', name_zh: '', role: 'organizer' }]);
  }
  function removeOrganizer(idx: number) {
    setOrganizers(prev => prev.filter((_, i) => i !== idx));
  }
  function updateOrganizer(idx: number, field: keyof Organizer, value: string) {
    setOrganizers(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });
  }

  // Track helpers
  function addTrack() {
    setTracks(prev => [...prev, { name: '', name_zh: '', slug: '', rewards: '', criteria: [{ name: '', weight: '0.3' }] }]);
  }
  function removeTrack(idx: number) {
    setTracks(prev => prev.filter((_, i) => i !== idx));
  }
  function updateTrack(idx: number, field: keyof TrackData, value: unknown) {
    setTracks(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value } as TrackData; return n; });
  }
  function addCriterion(tIdx: number) {
    setTracks(prev => {
      const n = [...prev];
      n[tIdx] = { ...n[tIdx], criteria: [...n[tIdx].criteria, { name: '', weight: '0.1' }] };
      return n;
    });
  }
  function removeCriterion(tIdx: number, cIdx: number) {
    setTracks(prev => {
      const n = [...prev];
      n[tIdx] = { ...n[tIdx], criteria: n[tIdx].criteria.filter((_, i) => i !== cIdx) };
      return n;
    });
  }
  function updateCriterion(tIdx: number, cIdx: number, field: keyof Criterion, value: string) {
    setTracks(prev => {
      const n = [...prev];
      const criteria = [...n[tIdx].criteria];
      criteria[cIdx] = { ...criteria[cIdx], [field]: value };
      n[tIdx] = { ...n[tIdx], criteria };
      return n;
    });
  }

  // Language toggle
  function toggleLang(l: string) {
    setLangOptions(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  // Build YAML
  const yamlContent = useMemo(() => {
    const timelineObj: Record<string, unknown> = {};
    for (const stage of timelineStages) {
      if (stage.start || stage.end) {
        timelineObj[stage.key] = { start: stage.start || undefined, end: stage.end || undefined };
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

  function handleSubmit() {
    const finalSlug = slug || toSlug(name);
    const url = buildPRUrl({
      filename: `hackathons/${finalSlug}/hackathon.yml`,
      value: yamlContent,
      message: `feat(hackathons): create ${finalSlug}`,
    });
    openGitHubUrl(url);
  }

  // Shared CSS classes
  const inputClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const labelClass = 'block text-sm text-muted mb-2';
  const selectClass = 'w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none';
  const btnRemove = 'px-2 text-muted hover:text-error transition-colors';
  const btnAdd = 'text-sm text-lime-primary hover:text-lime-primary/80 transition-colors';

  return (
    <div className="rounded-lg border border-secondary-bg bg-dark-bg p-6">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx === step ? 'bg-lime-primary text-near-black'
                  : idx < step ? 'bg-lime-primary/30 text-lime-primary' : 'bg-secondary-bg text-muted'
              }`}>
                {idx < step ? '\u2713' : idx + 1}
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
            {t('请先登录 GitHub', 'Please sign in with GitHub first')}
          </p>
          <a
            href={`/api/auth/login?returnTo=${typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname) : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors"
          >
            {t('登录 GitHub', 'Sign in with GitHub')}
          </a>
        </div>
      )}

      <fieldset disabled={!isLoggedIn || loading} className="space-y-5">
        {/* Step 0: Type Selection */}
        {step === 0 && (
          <>
            <p className="text-sm text-muted mb-4">
              {t('选择 Hackathon 类型', 'Choose a hackathon type')}
            </p>
            <div className="grid gap-3">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHackathonType(opt.value as HackathonType)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    hackathonType === opt.value
                      ? 'border-lime-primary bg-lime-primary/10'
                      : 'border-secondary-bg hover:border-light-gray'
                  }`}
                >
                  <div className={`font-medium ${hackathonType === opt.value ? 'text-lime-primary' : 'text-white'}`}>
                    {lang === 'zh' ? opt.zh : opt.en}
                  </div>
                  <div className="text-xs text-muted mt-1">
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
              <label className={labelClass}>{t('Hackathon 名称 (英文) *', 'Hackathon Name (English) *')}</label>
              <input type="text" value={name} onChange={e => handleNameChange(e.target.value)}
                placeholder="Community Hackathon 2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('Hackathon 名称 (中文)', 'Hackathon Name (Chinese)')}</label>
              <input type="text" value={nameZh} onChange={e => setNameZh(e.target.value)}
                placeholder="2026 社区 Hackathon" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Slug</label>
              <input type="text" value={slug}
                onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                placeholder={toSlug(name) || 'community-hackathon-2026'}
                className={inputClass} />
              <p className="text-xs text-muted mt-1">
                {t('自动根据名称生成，也可手动修改', 'Auto-generated from name, or edit manually')}
              </p>
            </div>
            <div>
              <label className={labelClass}>{t('标语 (英文)', 'Tagline (English)')}</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="Build something amazing with AI" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('标语 (中文)', 'Tagline (Chinese)')}</label>
              <input type="text" value={taglineZh} onChange={e => setTaglineZh(e.target.value)}
                placeholder={t('用 AI 构建令人惊叹的应用', '')} className={inputClass} />
            </div>
          </>
        )}

        {/* Step 2: Organizers */}
        {step === 2 && (
          <>
            <p className="text-sm text-muted">{t('添加组织者信息', 'Add organizer information')}</p>
            <div className="space-y-4">
              {organizers.map((org, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input type="text" value={org.name} onChange={e => updateOrganizer(idx, 'name', e.target.value)}
                      placeholder={t('组织名称 (英文)', 'Organization Name')} className={inputClass} />
                    <input type="text" value={org.name_zh} onChange={e => updateOrganizer(idx, 'name_zh', e.target.value)}
                      placeholder={t('组织名称 (中文)', 'Organization Name (Chinese)')} className={inputClass} />
                    <select value={org.role} onChange={e => updateOrganizer(idx, 'role', e.target.value)} className={selectClass}>
                      <option value="organizer">{t('主办方', 'Organizer')}</option>
                      <option value="co-organizer">{t('联合主办', 'Co-organizer')}</option>
                      <option value="sponsor">{t('赞助商', 'Sponsor')}</option>
                    </select>
                  </div>
                  {organizers.length > 1 && (
                    <button type="button" onClick={() => removeOrganizer(idx)} className={btnRemove}>{'\u2715'}</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addOrganizer} className={btnAdd}>
              + {t('添加组织者', 'Add organizer')}
            </button>
          </>
        )}

        {/* Step 3: Timeline */}
        {step === 3 && (
          <>
            <p className="text-sm text-muted mb-2">
              {t('点击阶段块设置日期，可以添加或删除阶段', 'Click stage blocks to set dates. Add or remove stages as needed.')}
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
          <>
            <p className="text-sm text-muted">{t('添加比赛赛道', 'Add competition tracks')}</p>
            <div className="space-y-6">
              {tracks.map((tr, tIdx) => {
                const weightSum = tr.criteria.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
                const weightOk = Math.abs(weightSum - 1.0) < 0.01;
                return (
                  <div key={tIdx} className="p-4 rounded-lg border border-secondary-bg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white font-medium">{t('赛道', 'Track')} {tIdx + 1}</span>
                      {tracks.length > 1 && (
                        <button type="button" onClick={() => removeTrack(tIdx)} className={btnRemove}>{'\u2715'}</button>
                      )}
                    </div>
                    <input type="text" value={tr.name}
                      onChange={e => { updateTrack(tIdx, 'name', e.target.value); if (!tr.slug) updateTrack(tIdx, 'slug', toSlug(e.target.value)); }}
                      placeholder={t('赛道名称 (英文)', 'Track Name')} className={inputClass} />
                    <input type="text" value={tr.name_zh} onChange={e => updateTrack(tIdx, 'name_zh', e.target.value)}
                      placeholder={t('赛道名称 (中文)', 'Track Name (Chinese)')} className={inputClass} />
                    <input type="text" value={tr.slug} onChange={e => updateTrack(tIdx, 'slug', e.target.value)}
                      placeholder={toSlug(tr.name) || 'track-slug'} className={inputClass} />

                    <div>
                      <label className="block text-xs text-muted mb-1">
                        {t('奖励（每行一条，格式：名次: 金额）', 'Rewards (one per line, format: rank: amount)')}
                      </label>
                      <textarea value={tr.rewards} onChange={e => updateTrack(tIdx, 'rewards', e.target.value)}
                        placeholder={'1st: $1,000\n2nd: $500\n3rd: $250'}
                        className={`${inputClass} resize-none h-20`} />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs text-muted">{t('评审标准', 'Judging Criteria')}</label>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${weightOk ? 'bg-lime-primary/20 text-lime-primary' : 'bg-warning/20 text-warning'}`}>
                          {t('权重总和', 'Weight total')}: {weightSum.toFixed(2)} {weightOk ? '\u2713' : t('(应为 1.0)', '(should be 1.0)')}
                        </span>
                      </div>

                      {/* Criteria cards */}
                      <div className="space-y-3">
                        {tr.criteria.map((c, cIdx) => (
                          <div key={cIdx} className="p-3 rounded-lg border border-secondary-bg bg-surface/30 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted">
                                {t('标准', 'Criterion')} {cIdx + 1}
                              </span>
                              {tr.criteria.length > 1 && (
                                <button type="button" onClick={() => removeCriterion(tIdx, cIdx)}
                                  className="text-xs text-muted hover:text-error transition-colors">
                                  {t('删除', 'Remove')}
                                </button>
                              )}
                            </div>
                            <input type="text" value={c.name}
                              onChange={e => updateCriterion(tIdx, cIdx, 'name', e.target.value)}
                              placeholder={t('标准名称（如"创新性"）', 'Criterion name (e.g. "Innovation")')}
                              className={inputClass} />
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-muted whitespace-nowrap">{t('权重', 'Weight')}:</label>
                              <input type="range" min="0" max="1" step="0.05"
                                value={c.weight}
                                onChange={e => updateCriterion(tIdx, cIdx, 'weight', e.target.value)}
                                className="flex-1 accent-lime-primary" />
                              <input type="number" step="0.05" min="0" max="1"
                                value={c.weight}
                                onChange={e => updateCriterion(tIdx, cIdx, 'weight', e.target.value)}
                                className={`${inputClass} w-20 text-center`} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Weight distribution bar */}
                      {tr.criteria.length > 0 && (
                        <div className="mt-3 h-2 rounded-full bg-secondary-bg overflow-hidden flex">
                          {tr.criteria.map((c, cIdx) => {
                            const w = parseFloat(c.weight) || 0;
                            const colors = ['bg-lime-primary', 'bg-cyan', 'bg-orange', 'bg-neon-blue', 'bg-pink', 'bg-mint'];
                            return w > 0 ? (
                              <div key={cIdx} className={`${colors[cIdx % colors.length]} transition-all`}
                                style={{ width: `${w * 100}%` }} />
                            ) : null;
                          })}
                        </div>
                      )}

                      <button type="button" onClick={() => addCriterion(tIdx)} className={`${btnAdd} mt-3`}>
                        + {t('添加标准', 'Add criterion')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={addTrack} className={btnAdd}>
              + {t('添加赛道', 'Add track')}
            </button>
          </>
        )}

        {/* Step 5: Legal */}
        {step === 5 && (
          <>
            <div>
              <label className={labelClass}>{t('开源协议', 'License')}</label>
              <select value={license} onChange={e => setLicense(e.target.value)} className={selectClass}>
                <option value="Apache-2.0">Apache-2.0</option>
                <option value="MIT">MIT</option>
                <option value="GPL-3.0">GPL-3.0</option>
                <option value="BSD-3-Clause">BSD-3-Clause</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('知识产权归属', 'IP Ownership')}</label>
              <select value={ipOwnership} onChange={e => setIpOwnership(e.target.value)} className={selectClass}>
                <option value="participant">{t('参赛者', 'Participant')}</option>
                <option value="organizer">{t('主办方', 'Organizer')}</option>
                <option value="shared">{t('共有', 'Shared')}</option>
              </select>
            </div>
            {hackathonType === 'enterprise' && (
              <div className="border-t border-secondary-bg pt-4 mt-4 space-y-4">
                <p className="text-sm text-white font-medium">NDA {t('配置', 'Configuration')}</p>
                <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                  <input type="checkbox" checked={ndaRequired} onChange={e => setNdaRequired(e.target.checked)}
                    className="rounded border-secondary-bg bg-surface" />
                  {t('要求签署 NDA', 'Require NDA')}
                </label>
                {ndaRequired && (
                  <>
                    <div>
                      <label className={labelClass}>{t('NDA 文档 URL', 'NDA Document URL')}</label>
                      <input type="url" value={ndaDocUrl} onChange={e => setNdaDocUrl(e.target.value)}
                        placeholder="https://..." className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('NDA 摘要', 'NDA Summary')}</label>
                      <textarea value={ndaSummary} onChange={e => setNdaSummary(e.target.value)}
                        placeholder={t('NDA 关键条款概述...', 'Summary of key NDA terms...')}
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
              <label className={labelClass}>{t('参赛资格', 'Eligibility')}</label>
              <select value={eligibilityOpen} onChange={e => setEligibilityOpen(e.target.value)} className={selectClass}>
                <option value="all">{t('所有人', 'All')}</option>
                <option value="invite-only">{t('仅邀请', 'Invite Only')}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('最小团队人数', 'Min Team Size')}</label>
                <input type="number" min="1" value={teamMin} onChange={e => setTeamMin(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('最大团队人数', 'Max Team Size')}</label>
                <input type="number" min="1" value={teamMax} onChange={e => setTeamMax(e.target.value)} className={inputClass} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input type="checkbox" checked={allowSolo} onChange={e => setAllowSolo(e.target.checked)}
                className="rounded border-secondary-bg bg-surface" />
              {t('允许个人参赛', 'Allow solo participation')}
            </label>
            <div>
              <label className={labelClass}>{t('语言', 'Languages')}</label>
              <div className="flex gap-3">
                {['zh', 'en'].map(l => (
                  <label key={l} className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                    <input type="checkbox" checked={langOptions.includes(l)} onChange={() => toggleLang(l)}
                      className="rounded border-secondary-bg bg-surface" />
                    {l === 'zh' ? t('中文', 'Chinese') : t('英文', 'English')}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t('公开投票方式', 'Public Voting')}</label>
              <select value={publicVote} onChange={e => setPublicVote(e.target.value)} className={selectClass}>
                <option value="reactions">Reactions</option>
                <option value="none">{t('无', 'None')}</option>
              </select>
            </div>
          </>
        )}

        {/* Step 7: Preview & Submit */}
        {step === 7 && (
          <>
            <div>
              <label className={labelClass}>{t('预览 YAML', 'Preview YAML')}</label>
              <pre className="w-full bg-surface border border-secondary-bg rounded-md px-4 py-3 text-lime-primary text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {yamlContent}
              </pre>
            </div>
            <p className="text-xs text-muted">
              {t(
                '点击提交后将在 GitHub 上创建 PR，文件路径为 ',
                'Clicking submit will create a PR on GitHub with file path '
              )}
              <code className="text-lime-primary">hackathons/{slug || toSlug(name) || '{slug}'}/hackathon.yml</code>
            </p>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-lg border border-secondary-bg text-muted text-sm hover:text-white hover:border-light-gray transition-colors">
              {t('上一步', 'Back')}
            </button>
          ) : <div />}

          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors">
              {t('下一步', 'Next')}
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={!isLoggedIn || (!slug && !name)}
              className="px-6 py-2 rounded-lg bg-lime-primary text-near-black text-sm font-medium hover:bg-lime-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {t('前往 GitHub 提交 PR', 'Submit PR on GitHub')} {'\u2192'}
            </button>
          )}
        </div>
      </fieldset>
    </div>
  );
}

export default CreateHackathonForm;
