import { truncateDiff } from './diff-parser';
import { callLLM } from './llm/index';
import { ReviewConfig, ReviewResult, ReviewComment, PRContext, DiffFile, FileScore } from './types';

const SYSTEM_PROMPT = `You are Hawk, an expert code reviewer. You review pull requests like a senior engineer: precise, actionable, and constructive.

For each file, analyze:
1. SECURITY: injection, XSS, SSRF, hardcoded secrets, unsafe deserialization, path traversal
2. BUGS: null dereferences, race conditions, off-by-one, type errors, unhandled edge cases
3. PERFORMANCE: N+1 queries, unnecessary re-renders, memory leaks, O(n²) loops
4. STYLE: naming conventions, code duplication, magic numbers, dead code
5. TESTS: missing test cases, brittle assertions, untested edge cases

Response format (strict JSON array):
[
  {
    "file": "path/to/file.ts",
    "line": 42,
    "severity": "error|warning|info|suggestion",
    "category": "security|bug|style|performance|test|documentation",
    "message": "Clear description of the issue",
    "suggestion": "Optional fix suggestion with code"
  }
]

Rules:
- Only report REAL issues, not nitpicks
- Every issue must reference a specific line number
- If no issues found, return empty array []
- Be concise: 1-2 sentences per issue
- Prioritize security and bugs over style`;

const SUMMARY_PROMPT = `Based on the review comments above, generate a PR review summary in this format:

## 🦅 Hawk Review Summary

**Score:** X/100
**Verdict:** APPROVE | REQUEST_CHANGES | COMMENT

### Key Findings
- Finding 1
- Finding 2

### What's Good
- Positive aspect

### What Needs Work
- Area for improvement

Be constructive, not destructive. Celebrate good code.`;

export async function reviewPR(
  context: PRContext,
  config: ReviewConfig
): Promise<ReviewResult> {
  const filesToReview = filterFiles(context.files, config);

  if (filesToReview.length === 0) {
    return {
      summary: '🦅 No reviewable files found in this PR.',
      comments: [],
      score: 100,
      issuesFound: 0,
    };
  }

  const allComments: ReviewComment[] = [];
  const fileBatches = chunk(filesToReview, 5);

  for (const batch of fileBatches) {
    const batchComments = await reviewBatch(batch, config, context);
    allComments.push(...batchComments);
  }

  const summary = await generateSummary(allComments, context, config);

  return {
    summary,
    comments: allComments,
    score: calculateScore(allComments),
    issuesFound: allComments.length,
    prDescription: await generatePRDescription(context, config),
    fileScores: calculateFileScores(allComments, context.files),
  };
}

async function reviewBatch(
  files: DiffFile[],
  config: ReviewConfig,
  context: PRContext
): Promise<ReviewComment[]> {
  const diffs = files
    .map((f) => {
      const truncated = truncateDiff(f);
      return `### ${f.path} (${f.status})\n\`\`\`diff\n${truncated}\n\`\`\``;
    })
    .join('\n\n');

  const userPrompt = `Review this PR: "${context.title}"
${context.description ? `\nPR Description: ${context.description}\n` : ''}
${config.customInstructions ? `\nAdditional instructions: ${config.customInstructions}\n` : ''}
Files to review:
${diffs}`;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];

  try {
    const response = await callLLM(messages, config);
    return parseReviewComments(response.content);
  } catch (error) {
    console.error('LLM review failed:', error);
    return [];
  }
}

function parseReviewComments(raw: string): ReviewComment[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidComment).map((c: any) => ({
      file: c.file,
      line: c.line,
      severity: c.severity,
      category: c.category,
      message: c.message,
      suggestion: c.suggestion,
    }));
  } catch {
    return [];
  }
}

function isValidComment(c: any): boolean {
  return (
    typeof c === 'object' &&
    typeof c.file === 'string' &&
    typeof c.line === 'number' &&
    ['error', 'warning', 'info', 'suggestion'].includes(c.severity) &&
    ['security', 'bug', 'style', 'performance', 'test', 'documentation'].includes(c.category) &&
    typeof c.message === 'string'
  );
}

async function generateSummary(
  comments: ReviewComment[],
  context: PRContext,
  config: ReviewConfig
): Promise<string> {
  if (comments.length === 0) {
    return `## 🦅 Hawk Review Summary\n\n**Score:** 100/100\n**Verdict:** APPROVE\n\n✅ No issues found. Clean PR!`;
  }

  const commentSummary = comments
    .map((c) => `- [${c.severity}] ${c.file}:${c.line} — ${c.message}`)
    .join('\n');

  const messages = [
    { role: 'system' as const, content: 'You are a code review summarizer.' },
    { role: 'user' as const, content: `${SUMMARY_PROMPT}\n\nPR: "${context.title}"\n\nReview comments:\n${commentSummary}` },
  ];

  try {
    const response = await callLLM(messages, config);
    return response.content;
  } catch {
    return `## 🦅 Hawk Review Summary\n\n**Issues Found:** ${comments.length}\n\n${commentSummary}`;
  }
}

async function generatePRDescription(
  context: PRContext,
  config: ReviewConfig
): Promise<string | undefined> {
  if (context.description && context.description.trim().length > 50) {
    return undefined;
  }

  const filesSummary = context.files
    .map((f) => `- ${f.status}: ${f.path} (+${f.additions} -${f.deletions})`)
    .join('\n');

  const messages = [
    { role: 'system' as const, content: 'Generate a concise PR description based on the file changes. 3-5 sentences max.' },
    { role: 'user' as const, content: `Title: ${context.title}\n\nFiles:\n${filesSummary}` },
  ];

  try {
    const response = await callLLM(messages, { ...config, reviewMode: 'quick' });
    return response.content;
  } catch {
    return undefined;
  }
}

function filterFiles(files: DiffFile[], config: ReviewConfig): DiffFile[] {
  return files
    .filter((f) => f.status !== 'deleted')
    .filter((f) => {
      if (config.reviewMode === 'quick' && f.additions + f.deletions > 500) return false;
      return true;
    })
    .slice(0, config.maxFiles);
}

function calculateScore(comments: ReviewComment[]): number {
  if (comments.length === 0) return 100;

  const weights: Record<string, number> = {
    error: 15,
    warning: 8,
    info: 3,
    suggestion: 1,
  };

  const totalDeductions = comments.reduce(
    (sum, c) => sum + (weights[c.severity] ?? 5),
    0
  );

  return Math.max(0, 100 - totalDeductions);
}

function calculateFileScores(comments: ReviewComment[], files: DiffFile[]): FileScore[] {
  const fileMap = new Map<string, ReviewComment[]>();

  for (const file of files) {
    fileMap.set(file.path, []);
  }

  for (const comment of comments) {
    const existing = fileMap.get(comment.file) || [];
    existing.push(comment);
    fileMap.set(comment.file, existing);
  }

  const weights: Record<string, number> = {
    error: 15,
    warning: 8,
    info: 3,
    suggestion: 1,
  };

  return Array.from(fileMap.entries()).map(([file, fileComments]) => {
    const severity: Record<string, number> = {};
    for (const c of fileComments) {
      severity[c.severity] = (severity[c.severity] || 0) + 1;
    }

    const deductions = fileComments.reduce((sum, c) => sum + (weights[c.severity] ?? 5), 0);
    const score = Math.max(0, 100 - deductions);

    return { file, score, issues: fileComments.length, severity };
  });
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
