import * as core from '@actions/core';
import * as github from '@actions/github';
import { parseDiff, reviewPR, ReviewConfig, PRContext } from '@hawk/core';
import { execSync } from 'child_process';

async function run() {
  try {
    const apiKey = core.getInput('api-key');
    const provider = core.getInput('provider') || 'openai';
    const model = core.getInput('model');
    const ollamaUrl = core.getInput('ollama-url') || 'http://localhost:11434';
    const reviewMode = core.getInput('review-mode') || 'standard';
    const maxFiles = parseInt(core.getInput('max-files') || '50', 10);
    const excludePatterns = core.getInput('exclude-patterns')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    const customInstructions = core.getInput('custom-instructions');
    const token = core.getInput('github-token');

    const { context } = github;

    if (!context.payload.pull_request) {
      core.info('Not a pull request event, skipping.');
      return;
    }

    const pr = context.payload.pull_request;
    const octokit = github.getOctokit(token);

    core.info(`🦅 Hawk reviewing PR #${pr.number}: ${pr.title}`);

    const diff = execSync(
      `git diff origin/${pr.base.ref}...origin/${pr.head.ref}`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
    );

    const files = parseDiff(diff);

    const config: ReviewConfig = {
      provider: provider as ReviewConfig['provider'],
      apiKey: apiKey || getEnvApiKey(provider),
      model: model || getDefaultModel(provider),
      ollamaUrl,
      reviewMode: reviewMode as ReviewConfig['reviewMode'],
      maxFiles,
      excludePatterns,
      customInstructions: customInstructions || undefined,
    };

    const prContext: PRContext = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      prNumber: pr.number,
      title: pr.title,
      description: pr.body || '',
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      files,
    };

    core.info(`Reviewing ${files.length} files with ${config.provider}/${config.model}...`);

    const result = await reviewPR(prContext, config);

    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: pr.number,
      body: result.summary,
    });

    core.setOutput('review-summary', result.summary);
    core.setOutput('issues-found', result.issuesFound.toString());

    core.info(`🦅 Hawk review complete! Score: ${result.score}/100, Issues: ${result.issuesFound}`);

    if (result.issuesFound > 0) {
      core.warning(`Found ${result.issuesFound} issues in PR #${pr.number}`);
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

function getEnvApiKey(provider: string): string {
  const keys: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
  };
  return process.env[keys[provider] || 'OPENAI_API_KEY'] || '';
}

function getDefaultModel(provider: string): string {
  const models: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    deepseek: 'deepseek-chat',
    ollama: 'codellama',
  };
  return models[provider] || 'gpt-4o';
}

run();
