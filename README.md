<p align="center">
  <img src="https://img.shields.io/badge/🦅-HAWK-orange?style=for-the-badge" alt="Hawk" />
</p>

<h1 align="center">Hawk</h1>

<p align="center">
  <strong>Open-Source AI Code Reviewer</strong>
</p>

<p align="center">
  Free, self-hostable alternative to CodeRabbit. GitHub Action + Web Dashboard.
</p>

<p align="center">
  <a href="https://github.com/your-org/hawk/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/your-org/hawk/stargazers"><img src="https://img.shields.io/github/stars/your-org/hawk.svg" alt="Stars"></a>
  <a href="https://github.com/your-org/hawk/issues"><img src="https://img.shields.io/github/issues/your-org/hawk.svg" alt="Issues"></a>
  <a href="https://github.com/your-org/hawk/pulls"><img src="https://img.shields.io/github/issues-pr/your-org/hawk.svg" alt="Pull Requests"></a>
  <a href="https://github.com/your-org/hawk/network/members"><img src="https://img.shields.io/github/forks/your-org/hawk.svg" alt="Forks"></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-comparison">Comparison</a> •
  <a href="#-contributing">Contributing</a>
</p>

<p align="center">
  <a href="README.tr.md">🇹🇷 Türkçe</a> •
  <a href="README.fr.md">🇫🇷 Français</a> •
  <a href="README.cn.md">🇨🇳 中文</a>
</p>

---

## The Problem

Every developer uses AI to write code in 2026. The result:

- PRs exploded from 200 to 2000+ lines
- Human reviewers can't keep up
- AI-generated code has 12-40% security vulnerabilities (Forrester)
- CodeRabbit costs **$24/mo** and is closed source
- PR-Agent (open-source) was **acquired by OpenAI** (March 2026)

**There is no quality, free, self-hostable AI code review tool.**

## The Solution

Hawk reviews every PR like a senior engineer — for free, self-hosted, with your code never leaving your servers.

```yaml
# .github/workflows/hawk.yml — that's it.
name: Hawk Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/hawk@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
```

**One GitHub Action. Every PR reviewed by AI. 2 minutes.**

---

## Features

<table>
  <tr>
    <td width="50%">
      <h3>🔒 Security Scanning</h3>
      <p>XSS, injection, SSRF, hardcoded secrets, path traversal, unsafe deserialization</p>
    </td>
    <td width="50%">
      <h3>🐛 Bug Detection</h3>
      <p>Null dereferences, race conditions, off-by-one errors, unhandled edge cases</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📐 Code Quality</h3>
      <p>Style violations, code duplication, magic numbers, dead code detection</p>
    </td>
    <td width="50%">
      <h3>🧪 Test Coverage</h3>
      <p>Missing test cases, brittle assertions, untested edge cases</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🤖 Multi-LLM</h3>
      <p>OpenAI, Anthropic, DeepSeek, Ollama (local/offline)</p>
    </td>
    <td width="50%">
      <h3>📊 Web Dashboard</h3>
      <p>Review history, analytics, repository management, settings</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>⚡ GitHub Action</h3>
      <p>1-minute setup. Runs on every PR. Inline comments on specific lines.</p>
    </td>
    <td width="50%">
      <h3>🔐 Privacy First</h3>
      <p>Self-host. Your code never leaves your servers. Ollama for full offline.</p>
    </td>
  </tr>
</table>

---

## Screenshots

### Dashboard

<p align="center">
  <img src="screenshots/dashboard.png" alt="Hawk Dashboard" width="800" />
</p>

<p align="center"><em>Overview: total reviews, average score, issues found, success rate, recent reviews, top repositories</em></p>

### Reviews

<p align="center">
  <img src="screenshots/reviews.png" alt="Hawk Reviews" width="800" />
</p>

<p align="center"><em>Review history with scores, status badges, and issue counts</em></p>

### Review Detail

<p align="center">
  <img src="screenshots/review-detail.png" alt="Review Detail" width="800" />
</p>

<p align="center"><em>PR score, inline issues by file, severity badges, code suggestions</em></p>

### Repository Management

<p align="center">
  <img src="screenshots/repos.png" alt="Repositories" width="800" />
</p>

<p align="center"><em>Add repos, toggle reviews, configure per-repo LLM settings, webhook setup</em></p>

### Settings

<p align="center">
  <img src="screenshots/settings.png" alt="Settings" width="800" />
</p>

<p align="center"><em>Configure LLM provider, model, review mode, and custom instructions</em></p>

---

## Quick Start

### One-Click Deploy

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https://github.com/mturac/hawk">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" height="32" />
  </a>
  <a href="https://railway.app/new/template?template=https://github.com/mturac/hawk">
    <img src="https://railway.app/button.svg" alt="Deploy on Railway" height="32" />
  </a>
  <a href="https://render.com/deploy?repo=https://github.com/mturac/hawk">
    <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="32" />
  </a>
</p>

### Option A: GitHub Action Only (CI)

```yaml
# .github/workflows/hawk.yml
name: Hawk Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-org/hawk@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
          # provider: openai | anthropic | deepseek | ollama
          # model: gpt-4o
          # review-mode: quick | standard | thorough
```

### Option B: Full Platform (Dashboard + API)

```bash
git clone https://github.com/your-org/hawk.git
cd hawk
cp .env.example .env
# Edit .env with your API keys
npm install
npm run dev
```

Dashboard: **http://localhost:3000**
API: **http://localhost:4000**

### Option C: Docker

```bash
cp .env.example .env
# Edit .env
docker-compose up -d
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub PR Event                       │
└──────────────────────────┬──────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
   ┌──────────────┐               ┌────────────────┐
   │ GitHub Action │               │  Webhook/API   │
   │  (CI-only)   │               │  (Full Stack)  │
   └──────┬───────┘               └───────┬────────┘
          │                               │
          └───────────────┬───────────────┘
                          ▼
              ┌───────────────────────┐
              │    @hawk/core         │
              │  ┌─────────────────┐  │
              │  │  Diff Parser    │  │
              │  │  git → struct   │  │
              │  └────────┬────────┘  │
              │           ▼           │
              │  ┌─────────────────┐  │
              │  │  Review Engine  │  │
              │  │  Security/Style │  │
              │  │  Bug/Test/Perf  │  │
              │  └────────┬────────┘  │
              │           ▼           │
              │  ┌─────────────────┐  │
              │  │  LLM Providers  │  │
              │  │ OpenAI│Anthropic│  │
              │  │ DeepSeek│Ollama │  │
              │  └─────────────────┘  │
              └───────────────────────┘
                          │
           ┌──────────────┴──────────────┐
           ▼                             ▼
   ┌──────────────┐             ┌────────────────┐
   │ GitHub API   │             │   SQLite DB    │
   │ (comments)   │             │ (reviews/      │
   └──────────────┘             │  comments/     │
                                │  repos)        │
                                └───────┬────────┘
                                        ▼
                                ┌────────────────┐
                                │  Web Dashboard  │
                                │  Next.js 15     │
                                │  Tailwind CSS   │
                                └────────────────┘
```

### Packages

| Package | Description | Tech |
|---|---|---|
| `@hawk/core` | Diff parser, LLM providers, review engine | TypeScript |
| `@hawk/api` | Express API, SQLite, GitHub webhooks | Express, sql.js |
| `@hawk/web` | Dashboard UI | Next.js 15, Tailwind CSS |
| `@hawk/action` | GitHub Action for CI | @actions/core |

---

## Comparison

| | **Hawk** | CodeRabbit | PR-Agent (OpenAI) | Codium |
|---|---|---|---|---|
| **Price** | **Free** | $24+/mo | Free (OpenAI-owned) | $15+/mo |
| **Open Source** | ✅ MIT | ❌ | ✅ (OpenAI-controlled) | ❌ |
| **Self-host** | ✅ | ❌ | ✅ | ❌ |
| **Privacy** | ✅ Your code stays yours | ❌ 3rd party | ❌ Sent to OpenAI | ❌ |
| **Setup** | 1 minute | SaaS signup | Complex | SaaS signup |
| **Local LLM** | ✅ Ollama | ❌ | ❌ | ❌ |
| **Web Dashboard** | ✅ Full-featured | ✅ | ❌ | ✅ |
| **Inline Comments** | ✅ | ✅ | ✅ | ✅ |

---

## Configuration

### GitHub Action Inputs

| Input | Default | Description |
|---|---|---|
| `api-key` | — | LLM API key |
| `provider` | `openai` | `openai` \| `anthropic` \| `deepseek` \| `ollama` |
| `model` | `gpt-4o` | Model name |
| `ollama-url` | `http://localhost:11434` | Ollama server URL |
| `review-mode` | `standard` | `quick` \| `standard` \| `thorough` |
| `max-files` | `50` | Max files per PR |
| `exclude-patterns` | `*.lock,*.min.*,...` | Glob patterns to skip |
| `custom-instructions` | — | Extra reviewer instructions |

### Per-Repository Config

Each repository can have its own LLM provider, model, and review rules via the dashboard settings.

### Environment Variables

```bash
# LLM Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DEEPSEEK_API_KEY=sk-...

# GitHub
GITHUB_TOKEN=ghp_...
GITHUB_APP_TOKEN=ghp_...

# Hawk
HAWK_DEFAULT_PROVIDER=openai
HAWK_DEFAULT_MODEL=gpt-4o
HAWK_PORT=4000
HAWK_DB_PATH=./hawk.db
HAWK_OLLAMA_URL=http://localhost:11434
```

---

## Local LLM with Ollama

Hawk supports fully offline code review with Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a code model
ollama pull codellama

# Use in GitHub Action
- uses: your-org/hawk@v1
  with:
    provider: ollama
    model: codellama
    ollama-url: http://your-server:11434
```

**Your code never leaves your network.**

---

## Privacy & Security

- **Self-hosted by default** — your code stays on your infrastructure
- **No telemetry** — Hawk collects zero data
- **No external calls** — except to your chosen LLM provider
- **Ollama support** — fully offline, zero data leakage
- **SQLite** — your data lives in a single file you control
- **MIT License** — use it however you want

---

## Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
git clone https://github.com/your-org/hawk.git
cd hawk
npm install
npm run dev
```

### Roadmap

- [x] Custom review rules (`.hawk.yml` config)
- [x] PR auto-labeling based on review findings
- [x] Review history search
- [x] Per-file review score breakdown
- [x] Slack/Discord notifications
- [ ] GitHub App (install on org, no manual webhook setup)
- [ ] GitLab support
- [ ] Bitbucket support

---

## License

[MIT](LICENSE) — do whatever you want with it.

---

<p align="center">
  <strong>Built with 🦅 by developers, for developers.</strong>
</p>

<p align="center">
  <a href="https://github.com/your-org/hawk/stargazers">⭐ Star us on GitHub</a> •
  <a href="https://github.com/your-org/hawk/issues">🐛 Report a bug</a> •
  <a href="https://github.com/your-org/hawk/discussions">💬 Discussions</a>
</p>
