import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authToken = process.env.HAWK_AUTH_TOKEN;

  if (req.path === '/api/health') {
    return next();
  }

  if (!authToken) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (token !== authToken) {
    return res.status(401).json({ error: 'Invalid auth token' });
  }

  return next();
}