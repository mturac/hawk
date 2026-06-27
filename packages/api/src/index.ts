import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb, closeDb } from './db';
import { authMiddleware } from './middleware/auth';
import webhookRoutes from './routes/webhooks';
import reviewRoutes from './routes/reviews';
import repoRoutes from './routes/repos';

const app = express();
const PORT = parseInt(process.env.HAWK_PORT || '4000', 10);

app.use(cors({ origin: process.env.HAWK_WEB_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

app.use('/api/webhooks', webhookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/repos', repoRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    await getDb();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

function shutdown(signal: string, exitCode = 0) {
  console.log(`Shutting down (${signal})...`);
  closeDb();
  process.exit(exitCode);
}

async function start() {
  await getDb();
  const server = app.listen(PORT, () => {
    console.log(`🦁 Hawk API running on http://localhost:${PORT}`);
  });

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown('unhandledRejection', 1);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  shutdown('startup', 1);
});

export default app;
