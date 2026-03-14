# CLAUDE.md — pedromarco.es Project Context

## What is this?

Portfolio website for **Pedro Marco Hernández**, a painter from Villena (Alicante, Spain). Purely static site — no server, no CMS, no database in production. Everything compiles to HTML+CSS at build time.

## Tech Stack

- **Framework:** Astro (static site generator, 0 JS by default)
- **Styles:** Tailwind CSS (v4, mobile-first)
- **i18n:** Manual routing — `/es/` and `/en/` with shared JSON translations
- **"Database":** `obras.json` at project root — single source of truth for all artwork
- **Images:** `src/images/obras/` — Astro optimizes them at build time
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
│   │   └── obras/              ← Artwork images (Astro optimizes at build)
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
├── public/                     ← Static assets (logo, favicon)
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
  "destacada": true
}
```

- `id` is used as the URL slug: `/es/obra/{id}` and `/en/work/{id}`
- `imagen` references a file in `src/images/obras/`
- `categoria` is used for filtering in the gallery (lowercase, no accents)
- Bilingual fields (`titulo`, `tecnica`, `descripcion`) have `es` and `en` keys

## Build & Run

```bash
# Dev server with hot reload
npm run dev

# Build static site
npm run build

# Preview built site
npm run preview
```

Build output goes to `dist/` — this is what gets deployed.

## Design Principles

- **Mobile-first.** Every page must look great on phones. Design for 375px first, then scale up.
- **Masonry layout** on the gallery: CSS columns (2 mobile → 3 tablet → 4-5 desktop). Pure CSS, no JS libraries.
- **Minimal UI.** The art is the protagonist. White backgrounds, thin borders, lots of whitespace.
- **Performance.** Zero JS by default (Astro). Images optimized at build. Target <1s load time.
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
- Deploy target: Cloudflare Pages (or GitHub Pages)
