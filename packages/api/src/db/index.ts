import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.HAWK_DB_PATH || path.join(process.cwd(), 'hawk.db');

let db: Database | null = null;
let saveTimer: ReturnType<typeof setInterval> | null = null;

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  initSchema(db);

  saveTimer = setInterval(saveDb, 5000);

  return db;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id INTEGER UNIQUE NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      access_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_id INTEGER UNIQUE NOT NULL,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      webhook_secret TEXT,
      enabled INTEGER DEFAULT 1,
      config_json TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER REFERENCES repos(id) ON DELETE CASCADE,
      pr_number INTEGER NOT NULL,
      pr_title TEXT,
      pr_url TEXT,
      pr_author TEXT,
      score INTEGER,
      issues_found INTEGER DEFAULT 0,
      summary TEXT,
      status TEXT DEFAULT 'pending',
      llm_provider TEXT,
      llm_model TEXT,
      tokens_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      line_number INTEGER,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      suggestion TEXT,
      github_comment_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_reviews_repo ON reviews(repo_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_reviews_pr ON reviews(repo_id, pr_number)');
  db.run('CREATE INDEX IF NOT EXISTS idx_comments_review ON comments(review_id)');
  db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_repos_full_name ON repos(full_name)');
}

export function closeDb() {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

export function queryAll(db: Database, sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as any[]);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function queryOne(db: Database, sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return queryAll(db, sql, params)[0];
}

export function runSql(db: Database, sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
  db.run(sql, params as any[]);
  const lastId = queryOne(db, 'SELECT last_insert_rowid() as id') as any;
  const changes = queryOne(db, 'SELECT changes() as c') as any;
  return {
    lastInsertRowid: lastId?.id ?? 0,
    changes: changes?.c ?? 0,
  };
}
