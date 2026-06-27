import 'dotenv/config';
import { getDb, runSql, closeDb } from './db';

async function seed() {
  const db = await getDb();

  runSql(db, `INSERT INTO repos (github_id, owner, name, full_name, webhook_secret, enabled) VALUES (101, 'acme-corp', 'frontend', 'acme-corp/frontend', 'whsec_abc123', 1)`);
  runSql(db, `INSERT INTO repos (github_id, owner, name, full_name, webhook_secret, enabled) VALUES (102, 'acme-corp', 'api-server', 'acme-corp/api-server', 'whsec_def456', 1)`);
  runSql(db, `INSERT INTO repos (github_id, owner, name, full_name, webhook_secret, enabled) VALUES (103, 'acme-corp', 'mobile-app', 'acme-corp/mobile-app', 'whsec_ghi789', 1)`);

  const reviews = [
    { repo: 1, pr: 247, title: 'feat: add user authentication with JWT', author: 'sarah', score: 72, issues: 5, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 72/100\n**Verdict:** REQUEST_CHANGES\n\n### Key Findings\n- 🔒 Hardcoded JWT secret in `auth.ts:42`\n- 🐛 Missing null check on user input\n- 📐 Inconsistent error handling pattern\n\n### What\'s Good\n- Clean TypeScript types\n- Good test coverage for login flow\n\n### What Needs Work\n- Move secrets to environment variables\n- Add input validation middleware' },
    { repo: 2, pr: 183, title: 'fix: resolve N+1 query in user listing', author: 'alex', score: 95, issues: 1, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 95/100\n**Verdict:** APPROVE\n\n### Key Findings\n- ✅ Excellent query optimization\n\n### What\'s Good\n- Proper use of eager loading\n- Clean migration' },
    { repo: 1, pr: 246, title: 'refactor: extract shared components', author: 'mehmet', score: 88, issues: 2, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 88/100\n**Verdict:** APPROVE\n\n### Key Findings\n- Minor style inconsistencies\n- Missing prop types on Button component' },
    { repo: 3, pr: 91, title: 'feat: push notification service', author: 'julia', score: 61, issues: 8, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 61/100\n**Verdict:** REQUEST_CHANGES\n\n### Key Findings\n- 🔒 API key exposed in config\n- 🐛 Unhandled promise rejection\n- 🧪 No tests for notification service\n- 📐 Magic numbers in retry logic' },
    { repo: 2, pr: 182, title: 'chore: upgrade dependencies', author: 'dependabot', score: 100, issues: 0, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 100/100\n**Verdict:** APPROVE\n\n✅ No issues found. Clean PR!' },
    { repo: 1, pr: 245, title: 'feat: dark mode toggle', author: 'sarah', score: 82, issues: 3, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 82/100\n**Verdict:** COMMENT\n\n### Key Findings\n- Missing prefers-color-scheme media query\n- Hardcoded color values instead of CSS variables' },
    { repo: 2, pr: 181, title: 'feat: rate limiting middleware', author: 'alex', score: 91, issues: 1, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 91/100\n**Verdict:** APPROVE\n\n### Key Findings\n- Consider using sliding window instead of fixed window' },
    { repo: 3, pr: 90, title: 'fix: crash on Android back button', author: 'julia', score: 78, issues: 4, status: 'completed', summary: '## 🦅 Hawk Review Summary\n\n**Score:** 78/100\n**Verdict:** COMMENT\n\n### Key Findings\n- Edge case not handled on Android 14\n- Missing cleanup in useEffect' },
  ];

  const comments = [
    { reviewId: 1, file: 'src/auth/jwt.ts', line: 42, severity: 'error', category: 'security', message: 'Hardcoded JWT secret detected. Use process.env.JWT_SECRET instead.', suggestion: "const secret = process.env.JWT_SECRET;\nif (!secret) throw new Error('JWT_SECRET not set');" },
    { reviewId: 1, file: 'src/auth/jwt.ts', line: 78, severity: 'warning', category: 'bug', message: 'Missing null check on decoded token payload.' },
    { reviewId: 1, file: 'src/middleware/auth.ts', line: 15, severity: 'info', category: 'style', message: 'Consider using a consistent error response format across all middleware.' },
    { reviewId: 1, file: 'src/routes/user.ts', line: 23, severity: 'warning', category: 'bug', message: 'Unhandled case where user is null after database query.' },
    { reviewId: 1, file: 'src/types/auth.ts', line: 8, severity: 'suggestion', category: 'style', message: 'Consider using a discriminated union for auth result types.' },
    { reviewId: 4, file: 'src/services/notification.ts', line: 12, severity: 'error', category: 'security', message: 'API key is hardcoded in config object. Move to environment variable.' },
    { reviewId: 4, file: 'src/services/notification.ts', line: 45, severity: 'error', category: 'bug', message: 'Uncaught promise rejection will crash the app in production.' },
    { reviewId: 4, file: 'src/services/notification.ts', line: 67, severity: 'warning', category: 'performance', message: 'Sending notifications sequentially. Use Promise.all for parallel delivery.' },
  ];

  for (const r of reviews) {
    runSql(db, `INSERT INTO reviews (repo_id, pr_number, pr_title, pr_author, score, issues_found, status, summary, llm_provider, llm_model, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'openai', 'gpt-4o', CURRENT_TIMESTAMP)`, [r.repo, r.pr, r.title, r.author, r.score, r.issues, r.status, r.summary]);
  }

  for (const c of comments) {
    runSql(db, `INSERT INTO comments (review_id, file_path, line_number, severity, category, message, suggestion) VALUES (?, ?, ?, ?, ?, ?, ?)`, [c.reviewId, c.file, c.line, c.severity, c.category, c.message, c.suggestion || null]);
  }

  console.log('Seeded successfully');
  closeDb();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
