# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Documentation First

**Before generating any code**, always read the relevant files in the `/docs` directory. These docs define design decisions, data models, UI conventions, and feature specs for this project. Code that contradicts the docs is incorrect — the docs are the source of truth.

Key docs to consult:
- `docs/ui.md` — component library and styling conventions
- `docs/data-fetching.md` — **mandatory** rules for data fetching, database queries, and user data isolation
- `docs/auth.md` — **mandatory** Clerk authentication standards, the two-ID pattern, and session access rules
- `docs/data-mutations.md` — **mandatory** rules for Server Actions, Zod validation, and `/data` mutation helpers
- `docs/server-components.md` — **mandatory** Server Component conventions: async params, auth order, `notFound()`
- `docs/routing.md` — **mandatory** route structure, `/dashboard` prefix convention, and two-layer middleware + page-level protection

## Commands

```bash
npm run dev      # Start dev server at localhost:3000 (Turbopack)
npm run build    # Production build
npm run lint     # ESLint (config in eslint.config.mjs)
```

No test runner is configured yet.

## Architecture

**liftdiary** is a workout tracking app built on Next.js 16 App Router with React 19 and Tailwind CSS v4.

The entry point for all pages is `app/` using the App Router file-system conventions:
- `app/layout.tsx` — root layout; sets Geist Sans + Geist Mono via CSS variables, applies base body classes
- `app/page.tsx` — homepage (`/`)
- `app/globals.css` — global styles and Tailwind imports

### Key configuration details
- **Path alias**: `@/*` maps to the repo root (e.g., `@/app/...`, `@/components/...`)
- **TypeScript**: strict mode enabled; `moduleResolution: "bundler"` (Next.js bundler resolution)
- **Tailwind v4**: configured via PostCSS (`postcss.config.mjs`), not a `tailwind.config.js` file
- **Fonts**: Geist font loaded server-side via `next/font/google`; exposed as CSS vars `--font-geist-sans` and `--font-geist-mono`
