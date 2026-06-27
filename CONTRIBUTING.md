# Contributing to Hawk

Thank you for your interest in contributing to Hawk! Every contribution matters, whether it's a bug report, a feature request, documentation, or code.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

Be respectful. Be constructive. We're all here to build something useful.

---

## How to Contribute

There are many ways to contribute:

- **Report bugs** — Open an issue with reproduction steps
- **Suggest features** — Open an issue with the `enhancement` label
- **Improve docs** — Fix typos, add examples, translate
- **Write code** — Fix bugs, implement features, add tests
- **Review PRs** — Test changes, leave feedback

---

## Development Setup

### Prerequisites

- Node.js >= 20
- npm >= 10

### Setup

```bash
# Clone
git clone https://github.com/your-org/hawk.git
cd hawk

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start development (all packages)
npm run dev

# Type check
./node_modules/.bin/turbo run typecheck

# Build
./node_modules/.bin/turbo run build
```

### Running Individual Packages

```bash
# Core only
cd packages/core && npm run dev

# API only
cd packages/api && npm run dev

# Web dashboard only
cd packages/web && npm run dev
```

---

## Project Structure

```
packages/
├── core/       # Diff parser, LLM providers, review engine
├── api/        # Express API, SQLite, GitHub webhooks
├── web/        # Next.js 15 dashboard
└── action/     # GitHub Action (CI-only)
```

### `@hawk/core`
The shared engine. Contains:
- `diff-parser.ts` — Parses git diffs into structured data
- `llm/index.ts` — Multi-provider LLM client (OpenAI, Anthropic, DeepSeek, Ollama)
- `review-engine.ts` — Orchestrates the review process
- `types.ts` — Shared TypeScript types

### `@hawk/api`
The backend API. Contains:
- `db/index.ts` — SQLite database with sql.js
- `routes/` — Express routes (webhooks, reviews, repos)
- `services/` — Business logic (GitHub API, review orchestration)

### `@hawk/web`
The frontend dashboard. Built with Next.js 15 and Tailwind CSS.
- `app/` — Next.js App Router pages
- `components/` — Reusable UI components
- `lib/` — Utility functions

### `@hawk/action`
The GitHub Action wrapper. Bundled with `@vercel/ncc` for zero-dependency execution in CI.

---

## Coding Standards

- **TypeScript** — Strict mode, no `any` unless unavoidable
- **No comments** — Code should be self-documenting
- **No mocks/stubs** — Real implementations only
- **ESLint** — Follow the existing code style
- **Formatting** — Consistent with existing code

### Naming Conventions

- Files: `kebab-case.ts`
- Types/Interfaces: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
type(scope): description

feat(api): add repository config endpoint
fix(core): handle empty diff in parser
docs(readme): add Chinese translation
chore(deps): update dependencies
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting (no code change)
- `refactor` — Code change that neither fixes nor adds
- `test` — Adding tests
- `chore` — Maintenance

---

## Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`
3. **Make your changes**
4. **Run typecheck**: `./node_modules/.bin/turbo run typecheck`
5. **Run build**: `./node_modules/.bin/turbo run build`
6. **Push** your branch
7. **Open a PR** against `main`

### PR Guidelines

- Keep PRs small and focused
- One feature/fix per PR
- Include a clear description
- Reference related issues
- Add screenshots for UI changes

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment (OS, Node version, etc.)
5. Logs or screenshots if applicable

---

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md). Include:

1. Problem description
2. Proposed solution
3. Alternatives considered
4. Use case

---

## Questions?

Open a [Discussion](https://github.com/your-org/hawk/discussions) or join our community.

---

Thank you for contributing to Hawk!
