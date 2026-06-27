import { Router, Request, Response } from 'express';
import { getDb, queryOne } from '../db';
import { GitHubService } from '../services/github';
import { ReviewService } from '../services/review';

const router = Router();

router.post('/github', async (req: Request, res: Response) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;

    if (!event) {
      return res.status(400).json({ error: 'Missing x-github-event header' });
    }

    if (event === 'ping') {
      return res.json({ message: 'pong' });
    }

    if (event !== 'pull_request') {
      return res.json({ message: `Ignored event: ${event}` });
    }

    const payload = req.body;
    const action = payload.action;

    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return res.json({ message: `Ignored PR action: ${action}` });
    }

    const pr = payload.pull_request;
    const repoFullName = payload.repository.full_name;

    const db = await getDb();
    const repo = queryOne(db, 'SELECT * FROM repos WHERE full_name = ?', [repoFullName]) as any;

    if (!repo) {
      return res.json({ message: `Repo ${repoFullName} not registered` });
    }

    if (!repo.enabled) {
      return res.json({ message: `Repo ${repoFullName} is disabled` });
    }

    if (repo.webhook_secret && signature) {
      const github = new GitHubService(process.env.GITHUB_APP_TOKEN || '');
      const rawBody = JSON.stringify(req.body);
      const valid = await github.verifyWebhookSignature(rawBody, signature, repo.webhook_secret);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const githubToken = process.env.GITHUB_APP_TOKEN || process.env.GITHUB_TOKEN || '';
    const reviewService = new ReviewService(githubToken);

    const reviewResult = await reviewService.processReview({
      repoId: repo.id as number,
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      prNumber: pr.number,
      prTitle: pr.title,
      prUrl: pr.html_url,
      prAuthor: pr.user.login,
      prDescription: pr.body || '',
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      headSha: pr.head.sha,
    });

    return res.json({
      message: 'Review completed',
      reviewId: reviewResult.issuesFound,
      score: reviewResult.score,
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
