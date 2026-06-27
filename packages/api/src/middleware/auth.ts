import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authToken = process.env.HAWK_AUTH_TOKEN;

  if (!authToken) {
    if (req.path === '/api/health') {
      return next();
    }
    console.error('[AUTH] HAWK_AUTH_TOKEN not set — access denied');
    return res.status(500).json({ error: 'Server misconfiguration: HAWK_AUTH_TOKEN not set' });
  }

  if (req.path === '/api/health') {
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