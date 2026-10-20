import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/** 模組邊界（見 CLAUDE.md）：違反就失敗。 */

const SRC = join(__dirname);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f) ? [p] : [];
  });
}

function imports(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

const all = files(SRC).map((f) => ({ path: relative(SRC, f).replace(/\\/g, '/'), deps: imports(f) }));

describe('module boundaries', () => {
  it('theory/, sequence/, practice/ do not import React or Tone.js', () => {
    const bad = all
      .filter((f) => /^(theory|sequence|practice)\//.test(f.path))
      .filter((f) => f.deps.some((d) => d === 'react' || d.startsWith('react-') || d === 'tone' || d === 'zustand'));
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it('only playback/ imports Tone.js', () => {
    const bad = all.filter((f) => !f.path.startsWith('playback/') && f.deps.includes('tone'));
    expect(bad.map((f) => f.path)).toEqual([]);
  });

  it('only storage/ touches IndexedDB', () => {
    const bad = all
      .filter((f) => !f.path.startsWith('storage/'))
      .filter((f) => f.deps.includes('idb') || /\bindexedDB\b/.test(readFileSync(join(SRC, f.path), 'utf8')));
    expect(bad.map((f) => f.path)).toEqual([]);
  });
});
