export interface Track {
  slug: string;
  name: string;
  name_zh?: string;
}

export interface Criterion {
  name: string;
  name_zh?: string;
  weight: number;
  description?: string;
  score_range?: number[];
}

export interface TeamInfo {
  name: string;
  track: string;
  members: string[];
}

/**
 * Generate a URL-safe slug from a name, with username and random fallbacks.
 * Handles pure-CJK names that would otherwise produce an empty string.
 */
export function toSlug(username: string, name: string): string {
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (nameSlug) return nameSlug;
  if (username) return username;
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatYaml(obj: Record<string, unknown>, indent = 0): string {
  const pad = '  '.repeat(indent);
  const lines: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string') {
      if (value.includes('\n')) {
        lines.push(`${pad}${key}: |`);
        for (const line of value.split('\n')) {
          lines.push(`${pad}  ${line}`);
        }
      } else {
        lines.push(`${pad}${key}: "${value.replace(/"/g, '\\"')}"`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${pad}${key}: ${value}`);
    } else if (Array.isArray(value)) {
      lines.push(`${pad}${key}:`);
      for (const item of value) {
        if (typeof item === 'string') {
          lines.push(`${pad}  - "${item}"`);
        } else if (typeof item === 'object' && item !== null) {
          const itemLines = formatYaml(item as Record<string, unknown>, indent + 2).split('\n');
          if (itemLines.length > 0) {
            lines.push(`${pad}  - ${itemLines[0].trimStart()}`);
            for (const il of itemLines.slice(1)) {
              lines.push(`${pad}    ${il.trimStart()}`);
            }
          }
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${pad}${key}:`);
      lines.push(formatYaml(value as Record<string, unknown>, indent + 1));
    }
  }
  return lines.join('\n');
}

export function validateRequired(fields: Record<string, unknown>): string[] {
  return Object.entries(fields)
    .filter(([, value]) => {
      if (value === undefined || value === null || value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      return false;
    })
    .map(([key]) => key);
}

export function localize(lang: 'zh' | 'en', en?: string, zh?: string): string {
  if (lang === 'zh') return zh || en || '';
  return en || zh || '';
}
