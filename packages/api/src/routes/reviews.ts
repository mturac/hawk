import { Router, Request, Response } from 'express';
import { getDb, queryAll, queryOne } from '../db';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const repoId = req.query.repo_id as string;

    let query = `
      SELECT r.*, rp.full_name as repo_name
      FROM reviews r
      LEFT JOIN repos rp ON r.repo_id = rp.id
    `;
    const params: unknown[] = [];

    if (repoId) {
      query += ' WHERE r.repo_id = ?';
      params.push(repoId);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const reviews = queryAll(db, query, params);

    const countSql = repoId
      ? 'SELECT COUNT(*) as total FROM reviews WHERE repo_id = ?'
      : 'SELECT COUNT(*) as total FROM reviews';
    const countParams = repoId ? [repoId] : [];
    const countRow = queryOne(db, countSql, countParams) as any;
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
    const review = queryOne(db, `
      SELECT r.*, rp.full_name as repo_name
      FROM reviews r
      LEFT JOIN repos rp ON r.repo_id = rp.id
      WHERE r.id = ?
    `, [req.params.id]) as any;

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const comments = queryAll(db,
      'SELECT * FROM comments WHERE review_id = ? ORDER BY severity DESC, file_path, line_number',
      [req.params.id]
    );

    return res.json({ review, comments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
