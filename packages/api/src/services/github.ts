export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(method: string, url: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub API ${res.status}: ${text}`);
    }
    return res;
  }

  async getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3.diff',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    return res.text();
  }

  async getPRInfo(owner: string, repo: string, prNumber: number) {
    const res = await this.request('GET', `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
    return res.json();
  }

  async postReviewComment(owner: string, repo: string, prNumber: number, body: string) {
    const res = await this.request('POST', `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`, { body });
    return res.json();
  }

  async postInlineComment(owner: string, repo: string, prNumber: number, commitSha: string, filePath: string, line: number, body: string) {
    try {
      const res = await this.request('POST', `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`, {
        body,
        commit_id: commitSha,
        path: filePath,
        line,
      });
      return res.json();
    } catch (error: any) {
      if (error.message?.includes('422')) {
        return this.postReviewComment(owner, repo, prNumber, `**${filePath}:${line}**\n\n${body}`);
      }
      throw error;
    }
  }

  async postReview(owner: string, repo: string, prNumber: number, commitSha: string, summary: string, comments: Array<{ file: string; line: number; message: string; suggestion?: string }>) {
    const inlineComments = comments
      .filter((c) => c.line > 0)
      .slice(0, 50)
      .map((c) => ({
        path: c.file,
        line: c.line,
        body: c.suggestion
          ? `${c.message}\n\n**Suggestion:**\n\`\`\`\n${c.suggestion}\n\`\`\``
          : c.message,
      }));

    if (inlineComments.length > 0) {
      try {
        await this.request('POST', `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
          commit_id: commitSha,
          event: 'COMMENT',
          body: summary,
          comments: inlineComments,
        });
        return;
      } catch {
        // Fallback to single comment
      }
    }

    await this.postReviewComment(owner, repo, prNumber, summary);
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const crypto = await import('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expected = `sha256=${hmac.digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  async addLabels(owner: string, repo: string, prNumber: number, labels: string[]) {
    try {
      await this.request('POST', `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels`, { labels });
    } catch (error: any) {
      console.error('Failed to add labels:', error.message);
    }
  }

  async removeLabels(owner: string, repo: string, prNumber: number, labels: string[]) {
    try {
      for (const label of labels) {
        await this.request('DELETE', `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/labels/${encodeURIComponent(label)}`);
      }
    } catch (error: any) {
      console.error('Failed to remove labels:', error.message);
    }
  }

  async ensureLabelsExist(owner: string, repo: string, labels: Array<{ name: string; color: string; description: string }>) {
    try {
      const existingRes = await this.request('GET', `https://api.github.com/repos/${owner}/${repo}/labels?per_page=100`);
      const existing = await existingRes.json() as Array<{ name: string }>;
      const existingNames = new Set(existing.map((l) => l.name));

      for (const label of labels) {
        if (!existingNames.has(label.name)) {
          await this.request('POST', `https://api.github.com/repos/${owner}/${repo}/labels`, label);
        }
      }
    } catch (error: any) {
      console.error('Failed to ensure labels:', error.message);
    }
  }
}
