'use client';

import type { Lang } from '@synnovator/shared/i18n';
import { ColorTokenEditor } from './ColorTokenEditor';
import type { TokenName } from '@synnovator/shared/schemas/theme';

export interface TokenGroupDef {
  label: string;
  tokens: TokenName[];
}

export const TOKEN_GROUPS: TokenGroupDef[] = [
  {
    label: 'Surfaces',
    tokens: [
      'background',
      'foreground',
      'card',
      'card-foreground',
      'popover',
      'popover-foreground',
    ],
  },
  {
    label: 'Primary',
    tokens: ['primary', 'primary-foreground', 'secondary', 'secondary-foreground'],
  },
  {
    label: 'Muted',
    tokens: ['muted', 'muted-foreground', 'accent', 'accent-foreground'],
  },
  {
    label: 'Status',
    tokens: ['destructive', 'destructive-foreground'],
  },
  {
    label: 'Borders',
    tokens: ['border', 'input', 'ring'],
  },
  {
    label: 'Brand',
    tokens: [
      'brand',
      'brand-foreground',
      'highlight',
      'highlight-foreground',
      'info',
      'info-foreground',
    ],
  },
];

interface TokenGroupProps {
  group: TokenGroupDef;
  label: string;
  values: Record<string, string>;
  inherited: Record<string, boolean>;
  isVariant?: boolean;
  lang: Lang;
  onChange: (name: string, value: string) => void;
  onOverride: (name: string) => void;
  onReset: (name: string) => void;
}

export function TokenGroup({
  group,
  label,
  values,
  inherited,
  isVariant,
  lang,
  onChange,
  onOverride,
  onReset,
}: TokenGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {label}
      </h3>
      <div className="space-y-1">
        {group.tokens.map((tokenName) => (
          <ColorTokenEditor
            key={tokenName}
            name={tokenName}
            value={values[tokenName] ?? ''}
            inherited={inherited[tokenName] ?? false}
            isVariant={isVariant}
            lang={lang}
            onChange={onChange}
            onOverride={onOverride}
            onReset={onReset}
          />
        ))}
      </div>
    </div>
  );
}
