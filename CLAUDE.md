# CLAUDE.md — pedromarco.es Project Context

## What is this?

Portfolio website for **Pedro Marco Hernández**, a painter from Villena (Alicante, Spain). Purely static site — no server, no CMS, no database in production. Everything compiles to HTML+CSS at build time.

## Tech Stack

- **Framework:** Astro (static site generator, 0 JS by default)
- **Styles:** Tailwind CSS (v4, mobile-first)
- **Language:** Spanish only (`/es/`). UI strings in `src/i18n/es.json`, artwork text in `obras.json` as plain strings.
- **"Database":** `obras.json` at project root — single source of truth for all artwork
- **Images:** `public/obras/` (full-size originals) + `public/obras/thumbs/` (400px thumbnails for gallery)
- **Deploy:** Static output to `dist/`, hosted on Cloudflare Pages

## Project Structure

```
pedromarco.es/
├── obras.json                  ← THE artwork database (edit this to add/modify works)
├── src/
│   ├── layouts/
│   │   └── Base.astro          ← Shared layout: nav, footer, meta
│   ├── i18n/
│   │   ├── es.json             ← Spanish UI strings
│   │   └── utils.ts            ← t() helper for UI strings
│   ├── images/
│   │   └── obras/              ← (legacy, use public/obras/ instead)
│   ├── pages/
│   │   ├── index.astro         ← Redirect / → /es/
│   │   └── es/
│   │       ├── index.astro     ← Masonry gallery
│   │       ├── obra/[id].astro ← Artwork detail page
│   │       ├── sobre.astro     ← About the artist
│   │       └── contacto.astro  ← Contact
│   └── styles/
│       └── global.css          ← Tailwind import
├── public/
│   ├── logo.png                ← Site logo (signature), displayed in nav header
│   ├── obras/                  ← Full-size artwork images (detail pages)
│   │   └── thumbs/             ← 400px-wide thumbnails (masonry gallery)
│   ├── favicon.png             ← Source favicon (512px, transparent bg)
│   ├── favicon.ico             ← 32x32 for legacy browsers
│   ├── favicon-192.png         ← 192px for Android/PWA
│   ├── favicon-512.png         ← Original 512px source
│   └── apple-touch-icon.png    ← 180px for iOS
├── scripts/
│   ├── generate-thumbs.sh      ← Regenerate thumbnails after adding new images
│   ├── admin.mjs               ← Local admin server (Node.js, zero deps)
│   └── admin.html              ← Admin panel UI (single-page, inline CSS/JS)
├── resources/                  ← Private assets (PSDs, etc.) — not published
├── astro.config.mjs
└── package.json
```

## obras.json Schema

```json
{
  "id": "slug-identifier",
  "titulo": "Título de la obra",
  "año": 2024,
  "tecnica": "Óleo sobre lienzo",
  "descripcion": "Descripción de la obra...",
  "dimensiones": "100x80 cm",
  "imagen": "filename.jpg",
  "en_venta": true,
  "precio": null,
  "categoria": "paisaje",
  "destacada": true,
  "propietario": "Nombre del propietario"
}
```

- `id` is used as the URL slug: `/es/obra/{id}`
- `imagen` references a file in `public/obras/` (full) and `public/obras/thumbs/` (thumbnail)
- `categoria` is used for filtering in the gallery
- All text fields (`titulo`, `tecnica`, `descripcion`, `propietario`) are plain strings (Spanish)
- "No definido" is used as placeholder for fields not yet filled in

## Build & Run

```bash
# Dev server with hot reload
npm run dev

# Build static site
npm run build

# Preview built site
npm run preview

# Local admin panel (edit obras.json via browser)
npm run admin    # → http://localhost:4000

# Build + deploy to Cloudflare Pages
npm run deploy
```

Build output goes to `dist/` — this is what gets deployed.

### Adding New Artwork Images

1. Place the original image in `public/obras/`
2. Run `./scripts/generate-thumbs.sh` — generates 400px thumbnails AND auto-registers new entries in `obras.json`
3. Edit the entry via admin panel (`npm run admin`) or manually in `obras.json`

Gallery pages use `/obras/thumbs/` for fast loading; detail pages use `/obras/` for full resolution.

### Admin Panel

Local-only tool at `http://localhost:4000` for managing `obras.json`. Zero dependencies — pure Node.js (`node:http`). Features:
- List all obras with thumbnail previews
- Edit all fields (title, technique, description, year, dimensions, category, price, etc.)
- Image selector from available files in `public/obras/thumbs/`
- Create and delete obras
- "Generar thumbs" button to run generate-thumbs.sh from the browser
- Writes directly to `obras.json`

**Not deployed** — stays local. The scripts/ folder is not part of the Astro build.

## Design Principles

- **Mobile-first.** Every page must look great on phones. Design for 375px first, then scale up.
- **Masonry layout** on the gallery: CSS columns (2 mobile → 3 tablet → 4-5 desktop). Pure CSS, no JS libraries.
- **Minimal UI.** The art is the protagonist. White backgrounds, thin borders, lots of whitespace.
- **Performance.** Zero JS by default (Astro). Two-tier images: 400px thumbs for gallery, originals for detail. Target <1s load time.
- **Spanish only.** All pages under `/es/`. UI strings in `src/i18n/es.json`. Use `t('key.path')` for UI strings, `obra.titulo` for artwork text.

## URL Structure

- `/` → redirects to `/es/`
- `/es/` — Masonry gallery
- `/es/obra/[id]` — Artwork detail page
- `/es/sobre` — About the artist
- `/es/contacto` — Contact

## Git Discipline

1. **Stay in scope:** Only touch the files specified in the task
2. **Build before committing:** `npm run build` must succeed
3. **Commit with descriptive message:** `feat:`, `fix:`, `style:` prefixes
4. **One task = one commit**

## Contact Form

The contact form (`/es/contacto`) runs entirely on our own infrastructure — no third-party form services.

**Stack:**
- **Frontend:** HTML form → `POST /api/contact`
- **Backend:** Cloudflare Pages Function (`functions/api/contact.js`)
- **Email delivery:** Resend API (free tier, 3000 emails/month)
- **From address:** `web@pedromarco.es`
- **To:** `pedromarco@pedromarco.es`
- **Reply-To:** Set to the sender's email address

**Features:**
- File attachments (photos of artworks) ✅
- Honeypot anti-spam field (`botcheck`) ✅
- HTML-formatted email with all form fields
- Redirect to `/es/gracias` on success

**Environment variables (Cloudflare Pages):**
- `RESEND_API_KEY` — Resend sending-only API key (configured as secret)

**DNS records for email (Cloudflare DNS):**
- TXT `resend._domainkey` → DKIM public key
- MX `send` → `feedback-smtp.eu-west-1.amazonses.com` (priority 10)
- TXT `send` → `v=spf1 include:amazonses.com ~all`
- TXT `_dmarc` → `v=DMARC1; p=none;`

**Resend account:** carlos@telemaco.es — Dashboard at resend.com
**Resend domain ID:** `54557898-ae8b-4117-90c5-999e4f1849a1`

**History:** Tried FormSubmit (unreliable) → Web3Forms (no uploads on free tier) → Resend + Pages Function (current, works perfectly).

## Domain & Hosting

- **Domain:** pedromarco.es
- **DNS:** Cloudflare (zone ID: `f4da79e2ff418f19fda3d4f0eb886e9d`)
- **Hosting:** Cloudflare Pages (project: `pedromarco-es`)
- **Live at:** https://pedromarco.es / https://pedromarco-es.pages.dev
- **Deploy:** `npm run deploy` or manual `wrangler pages deploy dist --project-name pedromarco-es`
- **Cloudflare API token:** `~/.clawdbot/credentials/cloudflare/api_token` (Pages + DNS permissions)
