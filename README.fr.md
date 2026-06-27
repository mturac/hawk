<p align="center">
  <img src="https://img.shields.io/badge/🦅-HAWK-orange?style=for-the-badge" alt="Hawk" />
</p>

<h1 align="center">Hawk</h1>

<p align="center">
  <strong>Revu de Code IA Open Source</strong>
</p>

<p align="center">
  Alternative gratuite et auto-hébergeable à CodeRabbit. GitHub Action + Tableau de bord Web.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Licence"></a>
  <a href="https://github.com/mturac/hawk/stargazers"><img src="https://img.shields.io/github/stars/mturac/hawk.svg" alt="Étoiles"></a>
  <a href="https://github.com/mturac/hawk/issues"><img src="https://img.shields.io/github/issues/mturac/hawk.svg" alt="Issues"></a>
</p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> •
  <a href="README.tr.md">🇹🇷 Türkçe</a> •
  <a href="README.cn.md">🇨🇳 中文</a>
</p>

---

## Le Problème

En 2026, chaque développeur utilise l'IA pour écrire du code. Le résultat :

- Les PRs sont passées de 200 à 2000+ lignes
- Les reviewers humains ne suivent plus
- Le code généré par l'IA contient 12-40% de vulnérabilités (Forrester)
- CodeRabbit coûte **24$/mois** et est propriétaire
- PR-Agent (open-source) a été **acquis par OpenAI** (mars 2026)

**Il n'existe aucun outil de revue de code IA gratuit et auto-hébergeable.**

## La Solution

Hawk examine chaque PR comme un ingénieur senior — gratuitement, auto-hébergé, sans que votre code ne quitte vos serveurs.

```yaml
# .github/workflows/hawk.yml — c'est tout.
name: Hawk Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mturac/hawk@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
```

**Une seule GitHub Action. Chaque PR examinée par l'IA. 2 minutes.**

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🔒 **Analyse de Sécurité** | XSS, injection, SSRF, secrets en dur, path traversal |
| 🐛 **Détection de Bugs** | Null dereference, race condition, off-by-one, cas limites |
| 📐 **Qualité de Code** | Violations de style, duplication, magic numbers, code mort |
| 🧪 **Couverture de Tests** | Tests manquants, assertions fragiles, cas non testés |
| 🤖 **Multi-LLM** | OpenAI, Anthropic, DeepSeek, Ollama (local/hors-ligne) |
| 📊 **Tableau de Bord** | Historique, analytics, gestion des dépôts, paramètres |
| ⚡ **GitHub Action** | Installation en 1 minute. Fonctionne sur chaque PR. Commentaires inline. |
| 🔐 **Confidentialité** | Auto-hébergé. Votre code ne quitte jamais vos serveurs. |

---

## Captures d'Écran

### Tableau de Bord

<p align="center">
  <img src="screenshots/dashboard.png" alt="Hawk Tableau de Bord" width="800" />
</p>

<p align="center"><em>Vue d'ensemble : total des revues, score moyen, problèmes trouvés, taux de succès, revues récentes</em></p>

### Revues

<p align="center">
  <img src="screenshots/reviews.png" alt="Hawk Revues" width="800" />
</p>

<p align="center"><em>Historique des revues avec scores, badges de statut et nombre de problèmes</em></p>

### Détail d'une Revue

<p align="center">
  <img src="screenshots/review-detail.png" alt="Détail Revue" width="800" />
</p>

<p align="center"><em>Score PR, problèmes inline par fichier, badges de sévérité, suggestions de code</em></p>

### Gestion des Dépôts

<p align="center">
  <img src="screenshots/repos.png" alt="Dépôts" width="800" />
</p>

<p align="center"><em>Ajouter des dépôts, activer/désactiver les revues, configurer les LLM par dépôt</em></p>

### Paramètres

<p align="center">
  <img src="screenshots/settings.png" alt="Paramètres" width="800" />
</p>

<p align="center"><em>Configurer le fournisseur LLM, le modèle, le mode de revue et les instructions personnalisées</em></p>

---

## Démarrage Rapide

### Option A : GitHub Action Uniquement (CI)

```yaml
# .github/workflows/hawk.yml
name: Hawk Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mturac/hawk@v1
        with:
          api-key: ${{ secrets.OPENAI_API_KEY }}
```

### Option B : Plateforme Complète (Dashboard + API)

```bash
git clone https://github.com/mturac/hawk.git
cd hawk
cp .env.example .env
# Éditez .env avec vos clés API
npm install
npm run dev
```

Dashboard : **http://localhost:3000**
API : **http://localhost:4000**

### Option C : Docker

```bash
cp .env.example .env
docker-compose up -d
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Événement GitHub PR                    │
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
              │  │  Analyseur Diff │  │
              │  │  git → struct   │  │
              │  └────────┬────────┘  │
              │           ▼           │
              │  ┌─────────────────┐  │
              │  │ Moteur de Revue │  │
              │  │Sécurité/Style  │  │
              │  │Bug/Test/Perf   │  │
              │  └────────┬────────┘  │
              │           ▼           │
              │  ┌─────────────────┐  │
              │  │Fournisseurs LLM│  │
              │  │OpenAI│Anthropic│  │
              │  │DeepSeek│Ollama │  │
              │  └─────────────────┘  │
              └───────────────────────┘
```

### Paquets

| Paquet | Description | Tech |
|---|---|---|
| `@hawk/core` | Analyseur diff, fournisseurs LLM, moteur de revue | TypeScript |
| `@hawk/api` | API Express, SQLite, webhooks GitHub | Express, sql.js |
| `@hawk/web` | Interface tableau de bord | Next.js 15, Tailwind CSS |
| `@hawk/action` | GitHub Action pour CI | @actions/core |

---

## Comparaison

| | **Hawk** | CodeRabbit | PR-Agent (OpenAI) | Codium |
|---|---|---|---|---|
| **Prix** | **Gratuit** | 24$+/mois | Gratuit (OpenAI) | 15$+/mois |
| **Open Source** | ✅ MIT | ❌ | ✅ (Contrôlé par OpenAI) | ❌ |
| **Auto-hébergé** | ✅ | ❌ | ✅ | ❌ |
| **Confidentialité** | ✅ Votre code reste chez vous | ❌ Partagé | ❌ Envoyé à OpenAI | ❌ |
| **Installation** | 1 minute | Inscription SaaS | Complexe | Inscription SaaS |
| **LLM Local** | ✅ Ollama | ❌ | ❌ | ❌ |

---

## LLM Local avec Ollama

Hawk supporte la revue de code entièrement hors ligne avec Ollama :

```bash
# Installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Télécharger un modèle de code
ollama pull codellama

# Utiliser dans GitHub Action
- uses: mturac/hawk@v1
  with:
    provider: ollama
    model: codellama
    ollama-url: http://your-server:11434
```

**Votre code ne quitte jamais votre réseau.**

---

## Contribuer

Nous adorons les contributions ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les directives.

---

## Licence

[MIT](LICENSE) — faites-en ce que vous voulez.

---

<p align="center">
  <strong>🦅 Construit par des développeurs, pour des développeurs.</strong>
</p>
