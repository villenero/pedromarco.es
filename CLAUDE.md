# CLAUDE.md — pedromarco.es Project Context

## What is this?

Portfolio website for **Pedro Marco Hernández**, a painter from Villena (Alicante, Spain). Purely static site — no server, no CMS, no database in production. Everything compiles to HTML+CSS at build time.

## Tech Stack

- **Framework:** Astro (static site generator, 0 JS by default)
- **Styles:** Tailwind CSS (v4, mobile-first)
- **i18n:** Manual routing — `/es/` and `/en/` with shared JSON translations
- **"Database":** `obras.json` at project root — single source of truth for all artwork
- **Images:** `public/obras/` (full-size originals) + `public/obras/thumbs/` (400px thumbnails for gallery)
- **Deploy:** Static output to `dist/`, hosted on Cloudflare Pages

## Project Structure

```
pedromarco.es/
├── obras.json                  ← THE artwork database (edit this to add/modify works)
├── src/
│   ├── layouts/
│   │   └── Base.astro          ← Shared layout: nav, footer, meta, language switcher
│   ├── i18n/
│   │   ├── es.json             ← Spanish UI strings
│   │   ├── en.json             ← English UI strings
│   │   └── utils.ts            ← t() helper, lang detection, path helpers
│   ├── images/
│   │   └── obras/              ← (legacy, use public/obras/ instead)
│   ├── pages/
│   │   ├── index.astro         ← Redirect / → /es/
│   │   ├── es/
│   │   │   ├── index.astro     ← Masonry gallery (Spanish)
│   │   │   ├── obra/[id].astro ← Artwork detail page (Spanish)
│   │   │   ├── sobre.astro     ← About the artist
│   │   │   └── contacto.astro  ← Contact
│   │   └── en/
│   │       ├── index.astro     ← Masonry gallery (English)
│   │       ├── work/[id].astro ← Artwork detail page (English)
│   │       ├── about.astro     ← About the artist
│   │       └── contact.astro   ← Contact
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
  "titulo": { "es": "Título", "en": "Title" },
  "año": 2024,
  "tecnica": { "es": "Óleo sobre lienzo", "en": "Oil on canvas" },
  "descripcion": { "es": "...", "en": "..." },
  "dimensiones": "100x80 cm",
  "imagen": "filename.jpg",
  "en_venta": true,
  "precio": null,
  "categoria": "paisaje",
  "destacada": true,
  "propietario": "Nombre del propietario"
}
```

- `id` is used as the URL slug: `/es/obra/{id}` and `/en/work/{id}`
- `imagen` references a file in `public/obras/` (full) and `public/obras/thumbs/` (thumbnail)
- `categoria` is used for filtering in the gallery (lowercase, no accents)
- Bilingual fields (`titulo`, `tecnica`, `descripcion`) have `es` and `en` keys
- `propietario` is a plain string (not bilingual)
- Bilingual fallback: if a field is empty or "No definido" in the current language, the other language is shown

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
- Edit all fields (bilingual titles, technique, description, year, dimensions, category, price, etc.)
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
- **Bilingual.** Every page exists in `/es/` and `/en/`. UI strings in `src/i18n/*.json`, artwork text in `obras.json`.

## i18n Rules

- Spanish pages: `/es/`, `/es/obra/[id]`, `/es/sobre`, `/es/contacto`
- English pages: `/en/`, `/en/work/[id]`, `/en/about`, `/en/contact`
- Root `/` redirects to `/es/`
- Language switcher in nav links to the equivalent page in the other language
- Use `t(lang, 'key.path')` for UI strings
- Use `obra.titulo[lang]` for artwork-specific text

## Git Discipline

1. **Stay in scope:** Only touch the files specified in the task
2. **Build before committing:** `npm run build` must succeed
3. **Commit with descriptive message:** `feat:`, `fix:`, `style:` prefixes
4. **One task = one commit**

## Domain

- **pedromarco.es** (pending DNS setup)
- Live at: https://pedromarco-es.pages.dev
- Deploy target: Cloudflare Pages (`npm run deploy`)
