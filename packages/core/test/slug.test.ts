import { describe, expect, it } from 'vitest';
import { parseArxivId, slugifyTitle, toSlug } from '../src/domain/slug.js';

describe('slugifyTitle', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyTitle('Attention Is All You Need')).toBe('attention-is-all-you-need');
  });

  it('folds accents to ASCII', () => {
    expect(slugifyTitle('Schrödinger and Poincaré')).toBe('schrodinger-and-poincare');
  });

  it('collapses the hard wrapping arXiv puts in titles', () => {
    expect(slugifyTitle('Shape-biased Texture\n  Agnostic Representations')).toBe(
      'shape-biased-texture-agnostic-representations',
    );
  });

  it('never emits a double hyphen, which the separator relies on', () => {
    expect(slugifyTitle('Quantum -- Gravity: A Review!!')).not.toContain('--');
  });

  it('truncates at a word boundary', () => {
    const slug = slugifyTitle('a'.repeat(40) + ' ' + 'b'.repeat(60));

    expect(slug).toBe('a'.repeat(40));
  });
});

describe('toSlug and parseArxivId', () => {
  it('round-trips a modern identifier', () => {
    const slug = toSlug('Attention Is All You Need', '1706.03762');

    expect(parseArxivId(slug)).toBe('1706.03762');
  });

  it('puts the readable title first', () => {
    expect(toSlug('Attention Is All You Need', '1706.03762')).toBe('attention-is-all-you-need--1706.03762');
  });

  it('round-trips a legacy identifier containing a slash', () => {
    const slug = toSlug('The Veldkamp Space of Two-Qubits', 'math.AG/0703012');

    expect(parseArxivId(slug)).toBe('math.AG/0703012');
  });

  it('round-trips a legacy identifier whose archive contains a hyphen', () => {
    const slug = toSlug('Prompt Diphoton Production', 'hep-ph/9901001');

    expect(parseArxivId(slug)).toBe('hep-ph/9901001');
  });

  it('distinguishes two papers that share a title', () => {
    const first = toSlug('On Convergence', '2401.00001');
    const second = toSlug('On Convergence', '2402.00002');

    expect(first).not.toBe(second);
  });

  it('falls back to the bare identifier when a title slugifies to nothing', () => {
    expect(toSlug('!!! ???', '2401.00001')).toBe('2401.00001');
  });

  it('recovers the identifier from a title-less slug', () => {
    expect(parseArxivId('2401.00001')).toBe('2401.00001');
  });
});
