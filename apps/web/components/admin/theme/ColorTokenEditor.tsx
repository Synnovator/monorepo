'use client';

import { useState, useMemo } from 'react';
import { parseOklch, formatOklch, oklchToHex } from '@/lib/oklch';
import type { OklchColor } from '@/lib/oklch';

interface ColorTokenEditorProps {
  name: string;
  value: string;
  inherited: boolean;
  onChange: (name: string, value: string) => void;
  onOverride: (name: string) => void;
  onReset: (name: string) => void;
}

export function ColorTokenEditor({
  name,
  value,
  inherited,
  onChange,
  onOverride,
  onReset,
}: ColorTokenEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(() => parseOklch(value), [value]);
  const hexValue = useMemo(() => oklchToHex(value), [value]);

  const handleClick = () => {
    if (inherited) {
      onOverride(name);
      return;
    }
    setExpanded((prev) => !prev);
  };

  const handleSliderChange = (
    channel: keyof OklchColor,
    rawValue: number,
  ) => {
    if (!parsed) return;
    const updated: OklchColor = { ...parsed, [channel]: rawValue };
    onChange(name, formatOklch(updated));
  };

  return (
    <div
      className={`rounded-md border border-border ${inherited ? 'opacity-60' : ''}`}
    >
      {/* Header row */}
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors rounded-md"
      >
        {/* Color swatch */}
        <div
          className="w-6 h-6 rounded border border-border shrink-0"
          style={{ backgroundColor: value }}
        />
        {/* Token name */}
        <span className="text-sm font-mono text-foreground flex-1 truncate">
          {name}
        </span>
        {/* Hex preview */}
        <span className="text-xs text-muted-foreground font-mono">
          {hexValue}
        </span>
        {/* Expand indicator */}
        {!inherited && (
          <svg
            className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Expanded sliders */}
      {expanded && parsed && !inherited && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* OKLCH text display */}
          <p className="text-xs text-muted-foreground font-mono truncate">
            {value}
          </p>

          {/* Lightness */}
          <SliderRow
            label="L"
            value={parsed.l}
            min={0}
            max={1}
            step={0.005}
            onChange={(v) => handleSliderChange('l', v)}
          />

          {/* Chroma */}
          <SliderRow
            label="C"
            value={parsed.c}
            min={0}
            max={0.4}
            step={0.005}
            onChange={(v) => handleSliderChange('c', v)}
          />

          {/* Hue */}
          <SliderRow
            label="H"
            value={parsed.h}
            min={0}
            max={360}
            step={1}
            onChange={(v) => handleSliderChange('h', v)}
          />

          {/* Reset button for hackathon overrides */}
          <button
            type="button"
            onClick={() => onReset(name)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset to inherited
          </button>
        </div>
      )}
    </div>
  );
}

// --- Internal slider component ---

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 text-xs text-muted-foreground font-mono shrink-0">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1.5 accent-primary cursor-pointer"
      />
      <span className="w-12 text-xs text-muted-foreground font-mono text-right tabular-nums">
        {formatDisplay(value, step)}
      </span>
    </div>
  );
}

function formatDisplay(value: number, step: number): string {
  if (step >= 1) return String(Math.round(value));
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return value.toFixed(decimals);
}
