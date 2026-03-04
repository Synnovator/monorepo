import { useState, useCallback } from 'react';

interface Stage {
  key: string;
  label: string;
  labelZh: string;
  start: string;
  end: string;
  removable: boolean;
  color: string;
}

interface TimelineEditorProps {
  lang: 'zh' | 'en';
  value: Stage[];
  onChange: (stages: Stage[]) => void;
}

const DEFAULT_STAGES: Stage[] = [
  { key: 'draft', label: 'Draft', labelZh: '草案', start: '', end: '', removable: true, color: 'bg-muted/20 text-muted border-muted/30' },
  { key: 'registration', label: 'Registration', labelZh: '报名', start: '', end: '', removable: false, color: 'bg-lime-primary/20 text-lime-primary border-lime-primary/30' },
  { key: 'development', label: 'Development', labelZh: '开发', start: '', end: '', removable: true, color: 'bg-cyan/20 text-cyan border-cyan/30' },
  { key: 'submission', label: 'Submission', labelZh: '提交', start: '', end: '', removable: true, color: 'bg-orange/20 text-orange border-orange/30' },
  { key: 'judging', label: 'Judging', labelZh: '评审', start: '', end: '', removable: true, color: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' },
  { key: 'announcement', label: 'Announcement', labelZh: '公告', start: '', end: '', removable: true, color: 'bg-pink/20 text-pink border-pink/30' },
  { key: 'award', label: 'Award', labelZh: '颁奖', start: '', end: '', removable: true, color: 'bg-mint/20 text-mint border-mint/30' },
];

const PRESETS = [
  { label: '4w', labelZh: '4周', days: 28, splits: [0, 0.14, 0.14, 0.43, 0.14, 0.07, 0.07] },
  { label: '8w', labelZh: '8周', days: 56, splits: [0, 0.11, 0.11, 0.43, 0.14, 0.11, 0.11] },
  { label: '12w', labelZh: '12周', days: 84, splits: [0.05, 0.10, 0.10, 0.40, 0.14, 0.10, 0.10] },
];

const CUSTOM_STAGE_COLORS = [
  'bg-violet/20 text-violet border-violet/30',
  'bg-amber/20 text-amber border-amber/30',
  'bg-teal/20 text-teal border-teal/30',
];

export function TimelineEditor({ lang, value, onChange }: TimelineEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [customStageName, setCustomStageName] = useState('');

  const t = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const stages = value.length > 0 ? value : DEFAULT_STAGES;

  const updateStage = useCallback((idx: number, field: 'start' | 'end', val: string) => {
    const next = [...stages];
    next[idx] = { ...next[idx], [field]: val ? val + (val.includes('Z') ? '' : 'Z') : '' };
    // Auto-snap: when end is set, set next stage's start if empty
    if (field === 'end' && val && idx < next.length - 1 && !next[idx + 1].start) {
      next[idx + 1] = { ...next[idx + 1], start: next[idx].end };
    }
    onChange(next);
  }, [stages, onChange]);

  const removeStage = useCallback((idx: number) => {
    onChange(stages.filter((_, i) => i !== idx));
  }, [stages, onChange]);

  const addStage = useCallback(() => {
    if (!customStageName.trim()) return;
    const key = customStageName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const colorIdx = (stages.length - DEFAULT_STAGES.length) % CUSTOM_STAGE_COLORS.length;
    const newStage: Stage = {
      key,
      label: customStageName,
      labelZh: customStageName,
      start: '',
      end: '',
      removable: true,
      color: CUSTOM_STAGE_COLORS[colorIdx] || 'bg-muted/20 text-muted border-muted/30',
    };
    onChange([...stages, newStage]);
    setCustomStageName('');
  }, [stages, customStageName, onChange]);

  const applyPreset = useCallback((presetIdx: number) => {
    const preset = PRESETS[presetIdx];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const next = stages.map((stage, idx) => {
      if (idx >= preset.splits.length) return stage;
      const daysBefore = preset.splits.slice(0, idx).reduce((a, b) => a + b, 0) * preset.days;
      const daysThis = preset.splits[idx] * preset.days;
      const start = new Date(startDate.getTime() + daysBefore * 86400000);
      const end = new Date(start.getTime() + daysThis * 86400000 - 1000);
      return {
        ...stage,
        start: start.toISOString().slice(0, 16) + 'Z',
        end: end.toISOString().slice(0, 16) + 'Z',
      };
    });
    onChange(next);
  }, [stages, onChange]);

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted">{t('快捷设置:', 'Presets:')}</span>
        {PRESETS.map((p, idx) => (
          <button key={idx} type="button" onClick={() => applyPreset(idx)}
            className="text-xs px-3 py-1 rounded-full border border-secondary-bg text-muted hover:border-lime-primary hover:text-lime-primary transition-colors">
            {lang === 'zh' ? p.labelZh : p.label}
          </button>
        ))}
      </div>

      {/* Visual timeline bar */}
      <div className="relative flex items-center gap-1 overflow-x-auto pb-2">
        {stages.map((stage, idx) => (
          <div key={stage.key} className="flex items-center">
            <button
              type="button"
              onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
              className={`relative px-3 py-2 rounded-lg border text-xs font-medium transition-all min-w-[80px] text-center ${stage.color} ${
                editingIdx === idx ? 'ring-2 ring-lime-primary' : ''
              }`}
            >
              <div>{lang === 'zh' ? stage.labelZh : stage.label}</div>
              {stage.start && (
                <div className="text-[10px] opacity-70 mt-0.5">
                  {new Date(stage.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              )}
              {stage.removable && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeStage(idx); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-error/80 text-white text-[10px] flex items-center justify-center hover:bg-error"
                >
                  ×
                </button>
              )}
            </button>
            {idx < stages.length - 1 && (
              <div className="w-4 h-px bg-secondary-bg mx-0.5" />
            )}
          </div>
        ))}
      </div>

      {/* Date editor for selected stage */}
      {editingIdx !== null && editingIdx < stages.length && (
        <div className="p-4 rounded-lg border border-secondary-bg bg-surface/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white font-medium">
              {lang === 'zh' ? stages[editingIdx].labelZh : stages[editingIdx].label}
            </span>
            <button type="button" onClick={() => setEditingIdx(null)} className="text-xs text-muted hover:text-white">
              {t('关闭', 'Close')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">{t('开始', 'Start')}</label>
              <input
                type="datetime-local"
                value={stages[editingIdx].start.replace('Z', '')}
                onChange={e => updateStage(editingIdx, 'start', e.target.value)}
                className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">{t('结束', 'End')}</label>
              <input
                type="datetime-local"
                value={stages[editingIdx].end.replace('Z', '')}
                onChange={e => updateStage(editingIdx, 'end', e.target.value)}
                className="w-full bg-surface border border-secondary-bg rounded-md px-3 py-2 text-white text-sm focus:border-lime-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add custom stage */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={customStageName}
          onChange={e => setCustomStageName(e.target.value)}
          placeholder={t('自定义阶段名称', 'Custom stage name')}
          className="flex-1 bg-surface border border-secondary-bg rounded-md px-3 py-1.5 text-white text-sm focus:border-lime-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={addStage}
          disabled={!customStageName.trim()}
          className="text-sm text-lime-primary hover:text-lime-primary/80 transition-colors disabled:opacity-50"
        >
          + {t('添加阶段', 'Add stage')}
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_STAGES };
export type { Stage };
export default TimelineEditor;
