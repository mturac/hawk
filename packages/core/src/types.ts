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

export interface RawReviewComment {
  file?: unknown;
  line?: unknown;
  severity?: unknown;
  category?: unknown;
  message?: unknown;
  suggestion?: unknown;
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

export interface RepoConfig {
  provider?: LLMProvider;
  model?: string;
  ollamaUrl?: string;
  reviewMode?: 'quick' | 'standard' | 'thorough';
  maxFiles?: number;
  excludePatterns?: string[];
  customInstructions?: string;
  labels?: {
    enabled?: boolean;
    prefix?: string;
    severityLabels?: Record<string, string>;
    categoryLabels?: Record<string, string>;
  };
  notifications?: {
    slack?: { webhookUrl?: string; channel?: string; onFailure?: boolean; onSuccess?: boolean; minScore?: number };
    discord?: { webhookUrl?: string; onFailure?: boolean; onSuccess?: boolean; minScore?: number };
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ReviewRow {
  id: number;
  repo_id: number;
  pr_number: number;
  pr_title: string | null;
  pr_url: string | null;
  pr_author: string | null;
  score: number | null;
  issues_found: number | null;
  summary: string | null;
  status: string | null;
  llm_provider: string | null;
  llm_model: string | null;
  created_at: string | null;
  completed_at: string | null;
  repo_name?: string | null;
}

export interface CommentRow {
  id: number;
  review_id: number;
  file_path: string;
  line_number: number | null;
  severity: string;
  category: string;
  message: string;
  suggestion: string | null;
  created_at: string | null;
}

export interface RepoRow {
  id: number;
  github_id: number;
  owner: string;
  name: string;
  full_name: string;
  enabled: number;
  config_json: string | null;
  created_at: string | null;
  updated_at: string | null;
  review_count?: number;
  avg_score?: number | null;
}

export interface ReviewListResponse {
  reviews: ReviewRow[];
  pagination: PaginationInfo;
}

export interface ReviewDetailResponse {
  review: ReviewRow;
  comments: CommentRow[];
  fileScores: Record<string, { issues: number; severity: Record<string, number> }>;
}

export interface ReviewsStatsResponse {
  stats: {
    total_reviews: number;
    completed: number;
    failed: number;
    avg_score: number | null;
    total_issues: number | null;
  };
  recentReviews: ReviewRow[];
  topRepos: RepoRow[];
}

export interface RepoListResponse {
  repos: RepoRow[];
}

export interface RepoCreateResponse {
  repo: RepoRow;
  webhook_secret: string;
  webhook_url: string;
}

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
