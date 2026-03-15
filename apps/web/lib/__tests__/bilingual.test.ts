import { describe, it, expect } from 'vitest';
import { resolveBilingual } from '../bilingual';

describe('resolveBilingual', () => {
  const content = { en: 'Hello', zh: '你好' };

  it('returns zh as primary when lang is zh', () => {
    const result = resolveBilingual(content, 'zh');
    expect(result).toEqual({ primary: '你好', alt: 'Hello' });
  });

  it('returns en as primary when lang is en', () => {
    const result = resolveBilingual(content, 'en');
    expect(result).toEqual({ primary: 'Hello', alt: '你好' });
  });

  it('handles empty strings', () => {
    const empty = { en: '', zh: '' };
    const result = resolveBilingual(empty, 'zh');
    expect(result).toEqual({ primary: '', alt: '' });
  });
});
