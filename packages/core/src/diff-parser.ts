import { DiffFile, DiffHunk } from './types';

export function parseDiff(rawDiff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const block of fileBlocks) {
    const file = parseFileBlock(block);
    if (file) {
      files.push(file);
    }
  }

  return files;
}

function parseFileBlock(block: string): DiffFile | null {
  const lines = block.split('\n');

  let path = '';
  let status: DiffFile['status'] = 'modified';
  let additions = 0;
  let deletions = 0;
  const hunks: DiffHunk[] = [];
  let patch = '';

  const firstLine = lines[0] ?? '';
  const bMatch = firstLine.match(/b\/(.+)$/);
  if (bMatch) {
    path = bMatch[1] ?? '';
  }

  if (block.includes('new file mode')) {
    status = 'added';
  } else if (block.includes('deleted file mode')) {
    status = 'deleted';
  } else if (block.includes('rename from')) {
    status = 'renamed';
  }

  let currentHunk: DiffHunk | null = null;
  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
      if (hunkMatch) {
        oldLine = parseInt(hunkMatch[1] ?? '1', 10);
        newLine = parseInt(hunkMatch[3] ?? '1', 10);

        currentHunk = {
          header: line,
          startLine: newLine,
          endLine: newLine,
          changes: [],
        };
        hunks.push(currentHunk);
      }
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++;
      currentHunk.changes.push({
        type: 'add',
        content: line.slice(1),
        lineNumber: newLine,
      });
      newLine++;
      currentHunk.endLine = newLine;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++;
      currentHunk.changes.push({
        type: 'remove',
        content: line.slice(1),
        oldLineNumber: oldLine,
      });
      oldLine++;
    } else if (line.startsWith(' ')) {
      currentHunk.changes.push({
        type: 'context',
        content: line.slice(1),
        lineNumber: newLine,
        oldLineNumber: oldLine,
      });
      oldLine++;
      newLine++;
      currentHunk.endLine = newLine;
    }
  }

  patch = lines
    .filter((l) => l.startsWith('+') || l.startsWith('-') || l.startsWith('@@'))
    .join('\n');

  if (!path) return null;

  return { path, status, additions, deletions, patch, hunks };
}

export function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1] ?? '' : '';
}

export function isTestFile(path: string): boolean {
  const testPatterns = [
    /\.test\.[jt]sx?$/,
    /\.spec\.[jt]sx?$/,
    /__tests__\//,
    /test\//,
    /tests\//,
  ];
  return testPatterns.some((p) => p.test(path));
}

export function truncateDiff(file: DiffFile, maxLines: number = 300): string {
  const lines = file.patch.split('\n');
  if (lines.length <= maxLines) {
    return file.patch;
  }
  const half = Math.floor(maxLines / 2);
  const head = lines.slice(0, half);
  const tail = lines.slice(-half);
  return [...head, `\n... (${lines.length - maxLines} lines truncated) ...\n`, ...tail].join('\n');
}
