import { Router, Request, Response } from 'express';
import { getDb, queryAll, queryOne } from '../db';
import { SqlParam } from '../db';

function toParam(v: unknown): SqlParam {
  if (Array.isArray(v)) return v[0] ?? null;
  if (v === undefined || v === null) return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return v as string | number | null;
}

function toStr(v: unknown): string {
  return String(toParam(v) ?? '');
}

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const page = parseInt(toStr(req.query.page)) || 1;
    const limit = Math.min(parseInt(toStr(req.query.limit)) || 20, 100);
    const offset = (page - 1) * limit;
    const repoId = toParam(req.query.repo_id);
    const search = toParam(req.query.search);
    const status = toParam(req.query.status);
    const minScore = toParam(req.query.min_score);
    const maxScore = toParam(req.query.max_score);

    let query = `
      SELECT r.*, rp.full_name as repo_name
      FROM reviews r
      LEFT JOIN repos rp ON r.repo_id = rp.id
    `;
    const params: SqlParam[] = [];
    const conditions: string[] = [];

    if (repoId) {
      conditions.push('r.repo_id = ?');
      params.push(repoId);
    }

    if (search) {
      conditions.push('(r.pr_title LIKE ? OR r.pr_author LIKE ? OR rp.full_name LIKE ?)');
      const searchTerm = `%${toStr(search)}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (minScore) {
      conditions.push('r.score >= ?');
      params.push(parseInt(toStr(minScore), 10));
    }

    if (maxScore) {
      conditions.push('r.score <= ?');
      params.push(parseInt(toStr(maxScore), 10));
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';

    const countParams: SqlParam[] = [...params];
    countParams.push(limit, offset);
    const reviews = queryAll(db, query, countParams);

    let countSql = 'SELECT COUNT(*) as total FROM reviews r LEFT JOIN repos rp ON r.repo_id = rp.id';
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
    }
    const countRow = queryOne(db, countSql, params) as { total: number } | undefined;
    const total = countRow?.total ?? 0;

    return res.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    const stats = queryOne(db, `
      SELECT
        COUNT(*) as total_reviews,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        ROUND(AVG(CASE WHEN status = 'completed' THEN score END), 1) as avg_score,
        SUM(issues_found) as total_issues
      FROM reviews
    `);

    const recentReviews = queryAll(db, `
      SELECT r.id, r.pr_title, r.pr_url, r.score, r.issues_found, r.status, r.created_at,
             rp.full_name as repo_name
      FROM reviews r
      LEFT JOIN repos rp ON r.repo_id = rp.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    const topRepos = queryAll(db, `
      SELECT rp.full_name, COUNT(r.id) as review_count, ROUND(AVG(r.score), 1) as avg_score
      FROM repos rp
      LEFT JOIN reviews r ON rp.id = r.repo_id AND r.status = 'completed'
      GROUP BY rp.id
      ORDER BY review_count DESC
      LIMIT 5
    `);

    return res.json({ stats, recentReviews, topRepos });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const id = toParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid review ID' });
    
    const review = queryOne(db, `
      SELECT r.*, rp.full_name as repo_name
      FROM reviews r
      LEFT JOIN repos rp ON r.repo_id = rp.id
      WHERE r.id = ?
    `, [id]) as any;

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const comments = queryAll(db,
      'SELECT * FROM comments WHERE review_id = ? ORDER BY severity DESC, file_path, line_number',
      [id]
    );

    const fileScores: Record<string, { issues: number; severity: Record<string, number> }> = {};
    for (const comment of comments) {
      const c = comment as any;
      if (!fileScores[c.file_path]) {
        fileScores[c.file_path] = { issues: 0, severity: {} };
      }
      fileScores[c.file_path].issues++;
      fileScores[c.file_path].severity[c.severity] = (fileScores[c.file_path].severity[c.severity] || 0) + 1;
    }

    return res.json({ review, comments, fileScores });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;