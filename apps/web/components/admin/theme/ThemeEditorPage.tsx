'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { t, getLangFromSearchParams } from '@synnovator/shared/i18n';
import { TOKEN_NAMES, type TokenName } from '@synnovator/shared/schemas/theme';
import type { ThemeConfig, HackathonTheme, PlatformThemeMeta } from '@synnovator/shared/schemas/theme';
import { Button } from '@synnovator/ui';
import { Input } from '@synnovator/ui';
import { Label } from '@synnovator/ui';
import { ScrollArea } from '@synnovator/ui';
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

  // --- State ---
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [themes, setThemes] = useState<PlatformThemeMeta[]>([]);
  const [mode, setMode] = useState<ThemeMode>('light');
  const [themeData, setThemeData] = useState<ThemeConfig | null>(null);
  const [overrides, setOverrides] = useState<HackathonTheme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [themeNameZh, setThemeNameZh] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const injectedPropsRef = useRef<string[]>([]);
  const originalDarkRef = useRef<boolean | null>(null);

  // Create theme flow
  const skipNextFetchRef = useRef(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameZh, setNewNameZh] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Activate flow
  const [activating, setActivating] = useState(false);
  const [activatePrUrl, setActivatePrUrl] = useState<string | null>(null);

  // --- Fetch theme list on mount ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/theme?action=list')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { themes: PlatformThemeMeta[]; activeTheme: string }) => {
        setThemes(data.themes);
        // Auto-select the active theme
        const active = data.themes.find((t) => t.active);
        if (active) {
          setSelectedTheme(active.id);
        } else if (data.themes.length > 0) {
          setSelectedTheme(data.themes[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to load theme list:', err);
        setError(err instanceof Error ? err.message : 'Failed to load themes');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // --- Fetch theme data when selection changes ---
  useEffect(() => {
    if (!selectedTheme) return;
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    setLoading(true);
    setError(null);
    setActivatePrUrl(null);

    const url = selectedVariant
      ? `/api/admin/theme?theme=${encodeURIComponent(selectedTheme)}&hackathon=${encodeURIComponent(selectedVariant)}`
      : `/api/admin/theme?theme=${encodeURIComponent(selectedTheme)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (selectedVariant) {
          // Variant response: { base, overrides }
          const baseTheme = data.base as ThemeConfig & { name?: string; name_zh?: string; description?: string };
          setThemeData({
            light: baseTheme.light,
            dark: baseTheme.dark,
            fonts: baseTheme.fonts,
            radius: baseTheme.radius,
          });
          setOverrides(data.overrides as HackathonTheme);
          setThemeName(baseTheme.name ?? selectedTheme);
          setThemeNameZh(baseTheme.name_zh ?? '');
          setThemeDescription(baseTheme.description ?? '');
        } else {
          // Platform theme response (full theme data with metadata)
          const fullData = data as ThemeConfig & { name?: string; name_zh?: string; description?: string };
          setThemeData({
            light: fullData.light,
            dark: fullData.dark,
            fonts: fullData.fonts,
            radius: fullData.radius,
          });
          setOverrides(null);
          setThemeName(fullData.name ?? selectedTheme);
          setThemeNameZh(fullData.name_zh ?? '');
          setThemeDescription(fullData.description ?? '');
        }
      })
      .catch((err) => {
        console.error('Failed to load theme:', err);
        setError(err instanceof Error ? err.message : 'Failed to load theme');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedTheme, selectedVariant]);

  // --- Apply CSS variable preview to document root for full-page preview ---
  const applyPreview = useCallback(
    (tokenList: TokenEntry[]) => {
      const style = document.documentElement.style;
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

  // Sync initial mode with document dark state; restore on unmount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    originalDarkRef.current = isDark;
    setMode(isDark ? 'dark' : 'light');
    return () => {
      // Restore original dark mode class
      if (originalDarkRef.current !== null) {
        document.documentElement.classList.toggle('dark', originalDarkRef.current);
      }
      // Clean up injected CSS vars
      for (const prop of injectedPropsRef.current) {
        document.documentElement.style.removeProperty(prop);
      }
    };
  }, []);

  // --- Build token list from current state ---
  const tokens: TokenEntry[] = useMemo(() => {
    if (!themeData) return [];
    const modeData = themeData[mode];
    if (!modeData) return [];

    if (!selectedVariant) {
      return TOKEN_NAMES.map((name) => ({
        name,
        value: modeData[name] ?? '',
        inherited: false,
      }));
    }

    // Hackathon variant: overrides take priority, rest inherited
    const modeOverrides = overrides?.[mode] ?? {};
    return TOKEN_NAMES.map((name) => {
      const overrideVal = (modeOverrides as Record<string, string | undefined>)[name];
      return {
        name,
        value: overrideVal ?? modeData[name] ?? '',
        inherited: !overrideVal,
      };
    });
  }, [themeData, overrides, selectedVariant, mode]);

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

  // --- Handle token value change ---
  const handleTokenChange = useCallback(
    (name: string, value: string) => {
      if (!selectedVariant) {
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
    [selectedVariant, mode],
  );

  // Handle promoting an inherited token to an override
  const handleOverride = useCallback(
    (name: string) => {
      if (!selectedVariant) return;
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
    [selectedVariant, mode, valuesMap],
  );

  // Handle resetting a hackathon override back to inherited
  const handleReset = useCallback(
    (name: string) => {
      if (!selectedVariant) return;
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
    [selectedVariant, mode],
  );

  // --- Build publish data maps (both light and dark modes) ---
  const publishLight = useMemo(() => {
    if (!themeData) return {};
    if (!selectedVariant) {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.light?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    // Hackathon variant: only send overrides
    const ov = overrides?.light ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, selectedVariant]);

  const publishDark = useMemo(() => {
    if (!themeData) return {};
    if (!selectedVariant) {
      const m: Record<string, string> = {};
      for (const name of TOKEN_NAMES) {
        const v = themeData.dark?.[name];
        if (v) m[name] = v;
      }
      return m;
    }
    // Hackathon variant: only send overrides
    const ov = overrides?.dark ?? {};
    const m: Record<string, string> = {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) m[k] = v;
    }
    return m;
  }, [themeData, overrides, selectedVariant]);

  // --- Toggle light/dark mode (preview only, doesn't touch site dark mode) ---
  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  // --- Activate handler ---
  const isActiveTheme = useMemo(() => {
    const current = themes.find((th) => th.active);
    return current?.id === selectedTheme;
  }, [themes, selectedTheme]);

  const handleActivate = async () => {
    if (!selectedTheme) return;
    const current = themes.find((th) => th.active);
    if (current?.id === selectedTheme) return;

    setActivating(true);
    setActivatePrUrl(null);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activate', themeName: selectedTheme }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { url: string; number: number };
      setActivatePrUrl(data.url);
    } catch (err) {
      console.error('Failed to create activate PR:', err);
    } finally {
      setActivating(false);
    }
  };

  // --- Create theme handler ---
  const handleCreate = () => {
    if (!newName.trim()) return;
    const slug = newName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug) return;

    // Optimistically add to list and select
    const newMeta: PlatformThemeMeta = {
      id: slug,
      name: newName.trim(),
      name_zh: newNameZh.trim() || undefined,
      active: false,
    };
    setThemes((prev) => [...prev, newMeta]);

    // Seed the new theme with a copy of the current theme data
    // so the user starts from a known-good base instead of fetching a 404
    // The useEffect on selectedTheme will skip the fetch since themeData is already set
    setThemeDescription(newDescription.trim());
    setThemeName(newName.trim());
    setThemeNameZh(newNameZh.trim());
    setOverrides(null);
    // themeData stays as-is (cloned from whatever theme was being viewed)
    skipNextFetchRef.current = true;

    setSelectedTheme(slug);
    setSelectedVariant(null);
    setShowCreate(false);
    setNewName('');
    setNewNameZh('');
    setNewDescription('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-border mb-4">
        <h1 className="text-xl font-heading text-foreground">
          {t(lang, 'admin.theme')}
        </h1>
        <ThemeSelector
          themes={themes}
          selectedTheme={selectedTheme}
          selectedVariant={selectedVariant}
          onThemeChange={(id) => {
            setSelectedTheme(id);
            setSelectedVariant(null);
          }}
          onVariantChange={setSelectedVariant}
          onCreate={() => setShowCreate(!showCreate)}
          lang={lang}
        />
        <div className="flex-1" />

        {/* Activate button (only for platform themes, not variants) */}
        {selectedTheme && !selectedVariant && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleActivate}
              disabled={isActiveTheme || activating}
            >
              {isActiveTheme
                ? t(lang, 'admin.theme_active')
                : activating
                  ? t(lang, 'admin.theme_activating')
                  : t(lang, 'admin.theme_activate')}
            </Button>
            {activatePrUrl && (
              <a
                href={activatePrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:text-primary/80"
              >
                {t(lang, 'admin.theme_activate_success')}
              </a>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={toggleMode}
          className="px-3 py-1.5 text-sm rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          {mode === 'light' ? t(lang, 'admin.theme_mode_light') : t(lang, 'admin.theme_mode_dark')}
        </button>
        <PublishButton
          type={selectedVariant ? 'hackathon-variant' : 'platform'}
          themeName={selectedTheme}
          hackathonSlug={selectedVariant ?? undefined}
          name={themeName || undefined}
          nameZh={themeNameZh || undefined}
          description={themeDescription || undefined}
          light={publishLight}
          dark={publishDark}
          fonts={themeData?.fonts as Record<string, string> | undefined}
          radius={themeData?.radius}
          lang={lang}
        />
      </div>

      {/* Create theme form (inline) */}
      {showCreate && (
        <div className="flex items-end gap-3 pb-4 border-b border-border mb-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">{t(lang, 'admin.theme_name')} *</Label>
            <Input
              id="create-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. midnight-blue"
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name-zh">{t(lang, 'admin.theme_name_zh')}</Label>
            <Input
              id="create-name-zh"
              value={newNameZh}
              onChange={(e) => setNewNameZh(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-desc">{t(lang, 'admin.theme_description')}</Label>
            <Input
              id="create-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-64"
            />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
            {t(lang, 'admin.theme_create_title')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCreate(false);
              setNewName('');
              setNewNameZh('');
              setNewDescription('');
            }}
          >
            {t(lang, 'admin.theme_cancel')}
          </Button>
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-muted-foreground">{t(lang, 'admin.theme_loading')}</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          {/* Left: editor panel */}
          <ScrollArea className="w-full lg:w-80 shrink-0 pr-2">
            {TOKEN_GROUPS.map((group) => {
              const labelKey = `admin.theme_group_${group.label.toLowerCase()}`;
              return (
                <TokenGroup
                  key={group.label}
                  group={group}
                  label={t(lang, labelKey)}
                  values={valuesMap}
                  inherited={inheritedMap}
                  isVariant={!!selectedVariant}
                  lang={lang}
                  onChange={handleTokenChange}
                  onOverride={handleOverride}
                  onReset={handleReset}
                />
              );
            })}
            <ContrastChecker tokens={valuesMap} lang={lang} />
          </ScrollArea>
          {/* Right: preview panel */}
          <ScrollArea className="flex-1 border border-border rounded-lg p-4 bg-background">
            <PreviewPanel hackathonSlug={selectedVariant} lang={lang} />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
