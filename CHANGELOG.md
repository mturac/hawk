# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-27

### Added

- Core review engine with multi-LLM support (OpenAI, Anthropic, DeepSeek, Ollama)
- Git diff parser with structured output
- Security scanning (XSS, injection, SSRF, secrets, path traversal)
- Bug detection (null dereferences, race conditions, off-by-one)
- Code quality analysis (style, duplication, magic numbers)
- Test coverage analysis
- PR summary generation with score (0-100)
- GitHub Action for CI/CD integration
- Express API server with SQLite storage
- GitHub webhook handling for automatic PR reviews
- Next.js 15 web dashboard with:
  - Overview page with stats
  - Review history with pagination
  - Review detail view with inline issues
  - Repository management
  - Settings page with LLM configuration
- Multi-language documentation (English, Turkish, French, Chinese)
- Docker Compose for self-hosting
- MIT License

### Security

- Self-hosted by default — code never leaves your infrastructure
- No telemetry or external calls except to your chosen LLM provider
- Ollama support for fully offline operation
