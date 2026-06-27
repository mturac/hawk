export interface DiffFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  startLine: number;
  endLine: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
}

export interface ReviewComment {
  file: string;
  line: number;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  category: 'security' | 'bug' | 'style' | 'performance' | 'test' | 'documentation';
  message: string;
  suggestion?: string;
}

export interface ReviewResult {
  summary: string;
  comments: ReviewComment[];
  score: number;
  issuesFound: number;
  prDescription?: string;
  fileScores?: FileScore[];
}

export interface FileScore {
  file: string;
  score: number;
  issues: number;
  severity: Record<string, number>;
}

export interface ReviewConfig {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'ollama';
  apiKey?: string;
  model: string;
  ollamaUrl?: string;
  reviewMode: 'quick' | 'standard' | 'thorough';
  maxFiles: number;
  excludePatterns: string[];
  customInstructions?: string;
}

export interface PRContext {
  owner: string;
  repo: string;
  prNumber: number;
  title: string;
  description: string;
  baseBranch: string;
  headBranch: string;
  files: DiffFile[];
}

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'ollama';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}
