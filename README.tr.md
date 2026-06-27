<p align="center">
  <img src="https://img.shields.io/badge/🦅-HAWK-orange?style=for-the-badge" alt="Hawk" />
</p>

<h1 align="center">Hawk</h1>

<p align="center">
  <strong>Açık Kaynaklı AI Kod İnceleyici</strong>
</p>

<p align="center">
  CodeRabbit'ın ücretsiz, self-host alternatifi. GitHub Action + Web Dashboard.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Lisans"></a>
  <a href="https://github.com/your-org/hawk/stargazers"><img src="https://img.shields.io/github/stars/your-org/hawk.svg" alt="Yıldız"></a>
  <a href="https://github.com/your-org/hawk/issues"><img src="https://img.shields.io/github/issues/your-org/hawk.svg" alt="Issue"></a>
</p>

<p align="center">
  <a href="README.md">🇬🇧 English</a> •
  <a href="README.fr.md">🇫🇷 Français</a> •
  <a href="README.cn.md">🇨🇳 中文</a>
</p>

---

## Problem

2026'da her developer AI ile kod yazıyor. Sonuç:

- PR'lar 200 satırdan 2000+ satıra fırladı
- İnsan reviewer'lar yetişemiyor
- AI-generated kodda güvenlik açıkları %12-40 (Forrester)
- CodeRabbit **$24/ay** ve kapalı kaynak
- PR-Agent (open-source) → **OpenAI satın aldı** (Mart 2026)

**Kaliteli, ücretsiz, self-hostable AI code review tool'u yok.**

## Çözüm

Hawk her PR'ı kıdemli bir mühendis gibi inceler — ücretsiz, self-hosted, kodunuz sunucunuzdan çıkmaz.

```yaml
# .github/workflows/hawk.yml — bu kadar.
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

**Bir GitHub Action. Her PR AI ile incelenir. 2 dakika.**

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| 🔒 **Güvenlik Tarama** | XSS, injection, SSRF, hardcoded secrets, path traversal |
| 🐛 **Bug Tespiti** | Null dereference, race condition, off-by-one, edge case |
| 📐 **Kod Kalitesi** | Style ihlali, duplication, magic number, dead code |
| 🧪 **Test Coverage** | Eksik test case, kırılgan assertion, test edilmemiş edge case |
| 🤖 **Multi-LLM** | OpenAI, Anthropic, DeepSeek, Ollama (local/offline) |
| 📊 **Web Dashboard** | Review geçmişi, analytics, repo yönetimi, ayarlar |
| ⚡ **GitHub Action** | 1 dakika kurulum. Her PR'da çalışır. Satır satır yorum. |
| 🔐 **Privacy First** | Self-host. Kodunuz sunucunuzu terk etmez. Ollama ile tam offline. |

---

## Ekran Görüntüleri

### Dashboard

<p align="center">
  <img src="screenshots/dashboard.png" alt="Hawk Dashboard" width="800" />
</p>

<p align="center"><em>Genel bakış: toplam review, ortalama puan, bulunan issue'lar, başarı oranı, son review'lar, en iyi repolar</em></p>

### Review'lar

<p align="center">
  <img src="screenshots/reviews.png" alt="Hawk Review'lar" width="800" />
</p>

<p align="center"><em>Review geçmişi: puanlar, durum badge'leri, issue sayıları</em></p>

### Review Detayı

<p align="center">
  <img src="screenshots/review-detail.png" alt="Review Detayı" width="800" />
</p>

<p align="center"><em>PR puanı, dosya bazlı inline issue'lar, severity badge'leri, kod önerileri</em></p>

### Repo Yönetimi

<p align="center">
  <img src="screenshots/repos.png" alt="Repo Yönetimi" width="800" />
</p>

<p align="center"><em>Repo ekle, review'ları aç/kapat, repo bazlı LLM ayarları, webhook kurulumu</em></p>

### Ayarlar

<p align="center">
  <img src="screenshots/settings.png" alt="Ayarlar" width="800" />
</p>

<p align="center"><em>LLM sağlayıcı, model, review modu ve özel talimat yapılandırması</em></p>

---

## Hızlı Başlangıç

### Seçenek A: Sadece GitHub Action (CI)

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
```

### Seçenek B: Tam Platform (Dashboard + API)

```bash
git clone https://github.com/your-org/hawk.git
cd hawk
cp .env.example .env
# .env dosyasını API key'lerinizle düzenleyin
npm install
npm run dev
```

Dashboard: **http://localhost:3000**
API: **http://localhost:4000**

### Seçenek C: Docker

```bash
cp .env.example .env
docker-compose up -d
```

---

## Mimari

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
```

### Paketler

| Paket | Açıklama | Tech |
|---|---|---|
| `@hawk/core` | Diff parser, LLM sağlayıcıları, review motoru | TypeScript |
| `@hawk/api` | Express API, SQLite, GitHub webhook | Express, sql.js |
| `@hawk/web` | Dashboard UI | Next.js 15, Tailwind CSS |
| `@hawk/action` | CI için GitHub Action | @actions/core |

---

## Karşılaştırma

| | **Hawk** | CodeRabbit | PR-Agent (OpenAI) | Codium |
|---|---|---|---|---|
| **Fiyat** | **Ücretsiz** | $24+/ay | Ücretsiz (OpenAI) | $15+/ay |
| **Açık Kaynak** | ✅ MIT | ❌ | ✅ (OpenAI kontrolü) | ❌ |
| **Self-host** | ✅ | ❌ | ✅ | ❌ |
| **Gizlilik** | ✅ Kodunuz sizde kalır | ❌ 3. parti | ❌ OpenAI'a gider | ❌ |
| **Kurulum** | 1 dakika | SaaS kayıt | Karmaşık | SaaS kayıt |
| **Local LLM** | ✅ Ollama | ❌ | ❌ | ❌ |
| **Web Dashboard** | ✅ Full-featured | ✅ | ❌ | ✅ |
| **Inline Yorum** | ✅ | ✅ | ✅ | ✅ |

---

## Yerel LLM ile Ollama

Hawk Ollama ile tamamen offline kod incelemesi destekler:

```bash
# Ollama kur
curl -fsSL https://ollama.ai/install.sh | sh

# Bir kod modeli çek
ollama pull codellama

# GitHub Action'da kullan
- uses: your-org/hawk@v1
  with:
    provider: ollama
    model: codellama
    ollama-url: http://your-server:11434
```

**Kodunuz ağınızı terk etmez.**

---

## Katkıda Bulunma

Katkıları seviyoruz! Detaylar için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasına bakın.

---

## Lisans

[MIT](LICENSE) — istediğiniz gibi kullanın.

---

<p align="center">
  <strong>🦅 Developerlar tarafından, developerlar için yapıldı.</strong>
</p>
