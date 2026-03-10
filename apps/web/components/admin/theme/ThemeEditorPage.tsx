'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import { TOKEN_NAMES, type TokenName } from '@synnovator/shared/schemas/theme';
import type { ThemeConfig, HackathonTheme } from '@synnovator/shared/schemas/theme';
import { ThemeSelector } from './ThemeSelector';
import { TokenGroup, TOKEN_GROUPS } from './TokenGroup';
import { PreviewPanel } from './PreviewPanel';
import { ContrastChecker } from './ContrastChecker';
import { PublishButton } from './PublishButton';

export type ThemeMode = 'light' | 'dark';

export interface TokenEntry {
  name: TokenName;
  value: string;
  inherited: boolean;
}

export function ThemeEditorPage() {
  const searchParams = useSearchParams();
  const lang = getLangFromSearchParams(searchParams);

  const [target, setTarget] = useState('global');
  const [mode, setMode] = useState<ThemeMode>('light');
  const [themeData, setThemeData] = useState<ThemeConfig | null>(null);
  const [overrides, setOverrides] = useState<HackathonTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const injectedPropsRef = useRef<string[]>([]);

  // Fetch theme data when target changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/theme?target=${encodeURIComponent(target)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (target === 'global') {
          setThemeData(data as ThemeConfig);
          setOverrides(null);
        } else {
          setThemeData(data.global as ThemeConfig);
          setOverrides(data.overrides as HackathonTheme);
        }
      })
      .catch((err) => {
        console.error('Failed to load theme:', err);
        setError(err instanceof Error ? err.message : 'Failed to load theme');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [target]);

  // Apply CSS variable preview
  const applyPreview = useCallback(
    (tokenList: TokenEntry[]) => {
      const style = document.documentElement.style;
      // Clear previously injected properties
      for (const prop of injectedPropsRef.current) {
        style.removeProperty(prop);
      }
      const injected: string[] = [];
      for (const token of tokenList) {
        const prop = `--${token.name}`;
        style.setProperty(prop, token.value);
        injected.push(prop);
      }
      injectedPropsRef.current = injected;
    },
    [],
  );

  // Cleanup injected styles on unmount
  useEffect(() => {
    return () => {
      const style = document.documentElement.style;
      for (const prop of injectedPropsRef.current) {
        style.removeProperty(prop);
      }
    };
  }, []);

  // Build token list from current state
  const tokens: TokenEntry[] = useMemo(() => {
    if (!themeData) return [];
    const modeData = themeData[mode];
    if (!modeData) return [];

    if (target === 'global') {
      return TOKEN_NAMES.map((name) => ({
        name,
        value: modeData[name] ?? '',
        inherited: false,
      }));
    }

    // Hackathon target: overrides take priority, rest inherited
    const modeOverrides = overrides?.[mode] ?? {};
    return TOKEN_NAMES.map((name) => {
      const overrideVal = (modeOverrides as Record<string, string | undefined>)[name];
      return {
        name,
        value: overrideVal ?? modeData[name] ?? '',
        inherited: !overrideVal,
      };
    });
  }, [themeData, overrides, target, mode]);

  // Derive lookup maps for TokenGroup
  const valuesMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const tok of tokens) m[tok.name] = tok.value;
    return m;
  }, [tokens]);

  const inheritedMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    for (const tok of tokens) m[tok.name] = tok.inherited;
    return m;
  }, [tokens]);

  // Apply preview whenever tokens change
  useEffect(() => {
    if (tokens.length > 0) {
      applyPreview(tokens);
    }
  }, [tokens, applyPreview]);

  // Handle token value change
  const handleTokenChange = useCallback(
    (name: string, value: string) => {
      if (target === 'global') {
        setThemeData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [mode]: {
              ...prev[mode],
              [name]: value,
            },
          };
        });
      } else {
        setOverrides((prev) => {
          const current = prev ?? {};
          const currentMode = (current[mode] ?? {}) as Record<string, string | undefined>;
          return {
            ...current,
            [mode]: {
              ...currentMode,
              [name]: value,
            },
          } as HackathonTheme;
        });
      }
    },
    [target, mode],
  );

  // Handle promoting an inherited token to an override
  const handleOverride = useCallback(
    (name: string) => {
      if (target === 'global') return; // global tokens are never inherited
      // Copy the current (global) value into overrides
      const currentValue = valuesMap[name];
      if (!currentValue) return;
      setOverrides((prev) => {
        const current = prev ?? {};
        const currentMode = (current[mode] ?? {}) as Record<string, string | undefined>;
        return {
          ...current,
          [mode]: {
            ...currentMode,
            [name]: currentValue,
          },
        } as HackathonTheme;
      });
    },
    [target, mode, valuesMap],
  );

  // Handle resetting a hackathon override back to inherited
  const handleReset = useCallback(
    (name: string) => {
      if (target === 'global') return;
      setOverrides((prev) => {
        if (!prev) return prev;
        const currentMode = { ...((prev[mode] ?? {}) as Record<string, string | undefined>) };
        delete currentMode[name];
        return {
          ...prev,
          [mode]: currentMode,
        } as HackathonTheme;
      });
    },
    [target, mode],
  );

  // Build publish data maps (both light and dark modes)
  const publishLight = useMemo(() => {
    if (!themeData) return {};
    if (target === 'global') {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.light?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    // Hackathon: only send overrides
    const ov = overrides?.light ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, target]);

  const publishDark = useMemo(() => {
    if (!themeData) return {};
    if (target === 'global') {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.dark?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    // Hackathon: only send overrides
    const ov = overrides?.dark ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, target]);

  // Toggle light/dark mode
  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 pb-4 border-b border-border mb-4">
        <h1 className="text-xl font-heading text-foreground">
          {t(lang, 'admin.theme')}
        </h1>
        <ThemeSelector value={target} onChange={setTarget} lang={lang} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={toggleMode}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          {mode === 'light' ? 'Light' : 'Dark'}
        </button>
        <PublishButton
          target={target}
          light={publishLight}
          dark={publishDark}
          fonts={themeData?.fonts as Record<string, string> | undefined}
          radius={themeData?.radius}
          lang={lang}
        />
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: editor panel */}
          <div className="w-full lg:w-80 shrink-0 overflow-y-auto pr-2">
            {TOKEN_GROUPS.map((group) => (
              <TokenGroup
                key={group.label}
                group={group}
                values={valuesMap}
                inherited={inheritedMap}
                onChange={handleTokenChange}
                onOverride={handleOverride}
                onReset={handleReset}
              />
            ))}
            <ContrastChecker tokens={valuesMap} />
          </div>
          {/* Right: preview panel */}
          <div className="flex-1 overflow-y-auto border border-border rounded-lg p-4 bg-background">
            <PreviewPanel />
          </div>
        </div>
      )}
    </div>
  );
}
