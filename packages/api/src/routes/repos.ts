import { Router, Request, Response } from 'express';
import { getDb, queryAll, queryOne, runSql } from '../db';
import crypto from 'crypto';

function toParam(v: unknown): string | number | null {
  if (Array.isArray(v)) return v[0] ?? null;
  if (v === undefined || v === null) return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return v as string | number | null;
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const repos = queryAll(db, `
      SELECT r.*,
        (SELECT COUNT(*) FROM reviews WHERE repo_id = r.id) as review_count,
        (SELECT ROUND(AVG(score), 1) FROM reviews WHERE repo_id = r.id AND status = 'completed') as avg_score
      FROM repos r
      ORDER BY r.created_at DESC
    `);

    return res.json({ repos });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { full_name, github_id, owner, name } = req.body;

    if (!full_name || !owner || !name) {
      return res.status(400).json({ error: 'full_name, owner, and name are required' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM repos WHERE full_name = ?', [toParam(full_name)]);
    if (existing) {
      return res.status(409).json({ error: 'Repository already registered' });
    }

    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const result = runSql(db, `
      INSERT INTO repos (github_id, owner, name, full_name, webhook_secret)
      VALUES (?, ?, ?, ?, ?)
    `, [toParam(github_id) ?? 0, toParam(owner), toParam(name), toParam(full_name), toParam(webhookSecret)]);

    const repo = queryOne(db, 'SELECT * FROM repos WHERE id = ?', [result.lastInsertRowid]);

    return res.status(201).json({
      repo,
      webhook_secret: webhookSecret,
      webhook_url: `${process.env.HAWK_BASE_URL || ''}/api/webhooks/github`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { enabled, config } = req.body;

    const repo = queryOne(db, 'SELECT * FROM repos WHERE id = ?', [toParam(req.params.id)]);
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    if (enabled !== undefined) {
      runSql(db, 'UPDATE repos SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [enabled ? 1 : 0, toParam(req.params.id)]);
    }

    if (config) {
      runSql(db, 'UPDATE repos SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [JSON.stringify(config), toParam(req.params.id)]);
    }

    const updated = queryOne(db, 'SELECT * FROM repos WHERE id = ?', [toParam(req.params.id)]);
    return res.json({ repo: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const result = runSql(db, 'DELETE FROM repos WHERE id = ?', [toParam(req.params.id)]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    return res.json({ message: 'Repository deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;