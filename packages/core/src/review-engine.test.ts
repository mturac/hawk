import { describe, it, expect } from 'vitest';
import { reviewPR, calculateScore, calculateFileScores, parseReviewComments, isValidComment } from './review-engine';
import type { ReviewComment, DiffFile, ReviewConfig, PRContext } from './types';

function makeComment(overrides: Partial<ReviewComment> = {}): ReviewComment {
  return {
    file: 'src/index.ts',
    line: 10,
    severity: 'warning',
    category: 'style',
    message: 'Some issue',
    ...overrides,
  };
}

function makeFile(overrides: Partial<DiffFile> = {}): DiffFile {
  return {
    path: 'src/index.ts',
    status: 'modified',
    additions: 10,
    deletions: 2,
    patch: '@@ -1,5 +1,10 @@',
    hunks: [],
    ...overrides,
  };
}

function makeConfig(overrides: Partial<ReviewConfig> = {}): ReviewConfig {
  return {
    provider: 'openai',
    model: 'gpt-4o',
    reviewMode: 'standard',
    maxFiles: 50,
    excludePatterns: [],
    ...overrides,
  };
}

function makeContext(overrides: Partial<PRContext> = {}): PRContext {
  return {
    owner: 'test',
    repo: 'test',
    prNumber: 1,
    title: 'Test PR',
    description: '',
    baseBranch: 'main',
    headBranch: 'feature',
    files: [],
    ...overrides,
  };
}

describe('calculateScore', () => {
  it('returns 100 for no comments', () => {
    expect(calculateScore([])).toBe(100);
  });

  it('deducts 15 per error', () => {
    const comments = [
      makeComment({ severity: 'error', category: 'security' }),
      makeComment({ severity: 'error', category: 'security' }),
    ];
    expect(calculateScore(comments)).toBe(70);
  });

  it('deducts 8 per warning', () => {
    const comments = [
      makeComment({ severity: 'warning' }),
      makeComment({ severity: 'warning' }),
    ];
    expect(calculateScore(comments)).toBe(84);
  });

  it('deducts 3 per info', () => {
    const comments = [
      makeComment({ severity: 'info' }),
      makeComment({ severity: 'info' }),
      makeComment({ severity: 'info' }),
    ];
    expect(calculateScore(comments)).toBe(91);
  });

  it('deducts 1 per suggestion', () => {
    const comments = [
      makeComment({ severity: 'suggestion' }),
    ];
    expect(calculateScore(comments)).toBe(99);
  });

  it('does not go below 0', () => {
    const comments = Array.from({ length: 10 }, () => makeComment({ severity: 'error', category: 'security' }));
    expect(calculateScore(comments)).toBe(0);
  });

  it('handles mixed severities', () => {
    const comments = [
      makeComment({ severity: 'error', category: 'bug' }),
      makeComment({ severity: 'warning' }),
      makeComment({ severity: 'info' }),
      makeComment({ severity: 'suggestion' }),
    ];
    expect(calculateScore(comments)).toBe(73);
  });
});

describe('calculateFileScores', () => {
  it('returns empty array for empty comments and files', () => {
    expect(calculateFileScores([], [])).toEqual([]);
  });

  it('returns scores only for reviewed files', () => {
    const reviewedFile = makeFile({ path: 'src/app.ts' });
    const excludedFile = makeFile({ path: 'src/ignored.ts' });
    const comments = [
      makeComment({ file: 'src/app.ts', severity: 'error', category: 'bug' }),
    ];
    const result = calculateFileScores(comments, [reviewedFile, excludedFile]);
    expect(result).toHaveLength(2);
    expect(result.find((f) => f.file === 'src/app.ts')?.score).toBe(85);
    expect(result.find((f) => f.file === 'src/ignored.ts')?.score).toBe(100);
  });

  it('counts severity distribution per file', () => {
    const files = [makeFile({ path: 'src/app.ts' })];
    const comments = [
      makeComment({ file: 'src/app.ts', severity: 'error', category: 'bug' }),
      makeComment({ file: 'src/app.ts', severity: 'warning' }),
      makeComment({ file: 'src/app.ts', severity: 'info' }),
    ];
    const result = calculateFileScores(comments, files);
    expect(result).toHaveLength(1);
    expect(result[0].issues).toBe(3);
    expect(result[0].severity).toEqual({ error: 1, warning: 1, info: 1 });
  });
});

describe('isValidComment', () => {
  it('accepts a valid comment object', () => {
    const raw = { file: 'a.ts', line: 5, severity: 'error', category: 'security', message: 'bad' };
    expect(isValidComment(raw)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isValidComment(null)).toBe(false);
    expect(isValidComment('string')).toBe(false);
    expect(isValidComment(42)).toBe(false);
  });

  it('rejects missing file', () => {
    expect(isValidComment({ line: 5, severity: 'error', category: 'security', message: 'bad' })).toBe(false);
  });

  it('rejects non-numeric line', () => {
    expect(isValidComment({ file: 'a.ts', line: '5', severity: 'error', category: 'security', message: 'bad' })).toBe(false);
  });

  it('rejects invalid severity', () => {
    expect(isValidComment({ file: 'a.ts', line: 5, severity: 'critical', category: 'security', message: 'bad' })).toBe(false);
  });

  it('rejects invalid category', () => {
    expect(isValidComment({ file: 'a.ts', line: 5, severity: 'error', category: 'refactor', message: 'bad' })).toBe(false);
  });

  it('rejects missing message', () => {
    expect(isValidComment({ file: 'a.ts', line: 5, severity: 'error', category: 'security' })).toBe(false);
  });
});

describe('parseReviewComments', () => {
  it('parses a valid JSON array from LLM response', () => {
    const raw = '[{"file":"a.ts","line":1,"severity":"error","category":"security","message":"Bad"}]';
    const result = parseReviewComments(raw);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('a.ts');
  });

  it('filters out invalid items from mixed array', () => {
    const raw = JSON.stringify([
      { file: 'a.ts', line: 1, severity: 'error', category: 'security', message: 'ok' },
      { file: 'b.ts', line: 2, severity: 'INVALID', category: 'security', message: 'bad' },
    ]);
    expect(parseReviewComments(raw)).toHaveLength(1);
  });

  it('returns empty for non-array JSON', () => {
    expect(parseReviewComments('{"not":"an array"}')).toEqual([]);
  });

  it('returns empty for invalid JSON', () => {
    expect(parseReviewComments('not json at all')).toEqual([]);
  });

  it('returns empty for empty array', () => {
    expect(parseReviewComments('[]')).toEqual([]);
  });

  it('extracts JSON array from markdown-wrapped response', () => {
    const raw = 'Here are the issues:\n```json\n[{"file":"a.ts","line":1,"severity":"error","category":"bug","message":"Fix it"}]\n```';
    const result = parseReviewComments(raw);
    expect(result).toHaveLength(1);
    expect(result[0].message).toBe('Fix it');
  });
});