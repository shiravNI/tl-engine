# TL Engine — Personal Mode (v1 prototype)

A clickable prototype of Natural Intelligence's internal thought-leadership
dashboard, Personal mode only. Built with React 18 + Vite + TypeScript,
Tailwind CSS v4, Radix UI primitives, TanStack Query, Recharts, Tiptap, and
dnd-kit. All data is local, in-memory, mocked fixtures — there is no real
backend, database, or external API.

See `.claude/plans/fancy-doodling-widget.md` (or wherever this plan is
kept) for the full implementation plan this was built from.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run test     # run the Vitest unit tests
```

## Before this goes anywhere near production

This build has **no real authentication and no real backend** — flagging
explicitly, per the implementation plan's own verification checklist:

- **Auth**: the login screen (`/login`) is UI-only. There is no Okta OIDC
  integration, no session, no token handling of any kind. Every route
  assumes an already-signed-in mock user (`src/data/fixtures/users.ts`).
  Real auth (Okta OIDC, NI's standard) must be wired in before any
  non-local deployment.
- **Data**: everything under `src/data/fixtures/` is static mock data held
  in React state (`src/state/*.tsx`). Nothing persists across a page
  reload, and there is no LinkedIn integration, no real analytics ingest,
  and no server of any kind. The `src/data/services/*.ts` layer is the
  intended seam for swapping in real API calls later without touching
  components.
- **Input validation**: because there is no server, no user input in this
  build ever leaves the browser or touches a real datastore. Once a real
  backend is introduced, server-side input validation must be (re-)applied
  at that boundary — nothing here should be assumed to already validate
  safely for a networked environment.
