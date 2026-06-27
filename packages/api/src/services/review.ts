import { reviewPR, parseDiff, PRContext, ReviewConfig, ReviewResult } from '@hawk/core';
import { getDb, queryOne, runSql } from '../db';
import { GitHubService } from './github';

interface ReviewRequest {
  repoId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  prAuthor: string;
  prDescription: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
}

export class ReviewService {
  private github: GitHubService;

  constructor(githubToken: string) {
    this.github = new GitHubService(githubToken);
  }

  async processReview(request: ReviewRequest): Promise<ReviewResult> {
    const db = await getDb();

    const insertResult = runSql(db, `
      INSERT INTO reviews (repo_id, pr_number, pr_title, pr_url, pr_author, status)
      VALUES (?, ?, ?, ?, ?, 'processing')
    `, [request.repoId, request.prNumber, request.prTitle, request.prUrl, request.prAuthor]);

    const reviewId = insertResult.lastInsertRowid;

    try {
      const rawDiff = await this.github.getPRDiff(request.owner, request.repo, request.prNumber);
      const files = parseDiff(rawDiff);

      const repoRow = queryOne(db, 'SELECT config_json FROM repos WHERE id = ?', [request.repoId]) as any;
      const repoConfig = repoRow?.config_json ? JSON.parse(repoRow.config_json) : {};

      const config: ReviewConfig = {
        provider: repoConfig.provider || process.env.HAWK_DEFAULT_PROVIDER || 'openai',
        apiKey: this.getApiKey(repoConfig.provider || 'openai'),
        model: repoConfig.model || process.env.HAWK_DEFAULT_MODEL || 'gpt-4o',
        ollamaUrl: repoConfig.ollamaUrl || process.env.HAWK_OLLAMA_URL,
        reviewMode: repoConfig.reviewMode || 'standard',
        maxFiles: repoConfig.maxFiles || 50,
        excludePatterns: repoConfig.excludePatterns || [],
        customInstructions: repoConfig.customInstructions,
      };

      const context: PRContext = {
        owner: request.owner,
        repo: request.repo,
        prNumber: request.prNumber,
        title: request.prTitle,
        description: request.prDescription,
        baseBranch: request.baseBranch,
        headBranch: request.headBranch,
        files,
      };

      const result = await reviewPR(context, config);

      runSql(db, `
        UPDATE reviews
        SET status = 'completed', score = ?, issues_found = ?, summary = ?,
            llm_provider = ?, llm_model = ?, completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [result.score, result.issuesFound, result.summary, config.provider, config.model, reviewId]);

      for (const comment of result.comments) {
        runSql(db, `
          INSERT INTO comments (review_id, file_path, line_number, severity, category, message, suggestion)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [reviewId, comment.file, comment.line, comment.severity, comment.category, comment.message, comment.suggestion || null]);
      }

      await this.github.postReview(
        request.owner,
        request.repo,
        request.prNumber,
        request.headSha,
        result.summary,
        result.comments.map((c) => ({
          file: c.file,
          line: c.line,
          message: `[${c.severity.toUpperCase()}] ${c.message}`,
          suggestion: c.suggestion,
        }))
      );

      return result;
    } catch (error) {
      runSql(db, 'UPDATE reviews SET status = ? WHERE id = ?', ['failed', reviewId]);
      throw error;
    }
  }

  private getApiKey(provider: string): string {
    const envKeys: Record<string, string> = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      ollama: '',
    };
    const envKey = envKeys[provider] || 'OPENAI_API_KEY';
    return process.env[envKey] || '';
  }
}
