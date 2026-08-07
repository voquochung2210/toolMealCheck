# AGENTS.md

Electron + React (Vite) desktop app: automatic THACO meal planner checker, plus a drink-order feature backed by Supabase. Full-stack app; there is no backend server code in this repo beyond Electron's main process. No test, lint, or typecheck tooling exists — write carefully and verify manually.

## Commands
- `npm run dev` — starts Vite (`http://localhost:5173`, strict port) then launches Electron once Vite is up. Must be run from repo root.
- `npm run build:react` — Vite build only, outputs to `dist-react/` (gitignored).
- `npm run build` — `vite build && electron-builder`; produces the NSIS installer in `dist/` (gitignored). Requires a real network + the `.env` where packaged.
- `npm start` — runs Electron only (loads existing `dist-react/index.html`). Debug independent of Vite.
- Version bumps go in `package.json`; electron-builder artifacts are named `ThacoFood-Setup-<version>.exe`, uploaded to GitHub Releases (`voquochung2210/toolMealCheck`) for auto-updater.

## Architecture (two disjoint data paths — know which you're editing)
- **Meal check**: Electron main process (`electron/main.js`) handles THACO API login, scheduling, tray, and notifications. UI is just a renderer; all meal/token auth goes through IPC.
- **Order/water tracking**: purely renderer-side `@supabase/supabase-js` (see `src/services/orderService.js`, `src/lib/supabaseClient.js`). No Electron involvement. `orders` / `order_items` tables live in Supabase.

## Gotchas
- **Files**: Vite build output `dist-react/` and builder output `dist/` are gitignored — never commit generated `dist-react/` js/css copies.
- **Sensitive/generated**: `config.json`, `token.json`, `.env`, `supabase/` are gitignored. `supabase/create_order.sql` (the `create_order` RPC) is NOT committed; it must be applied once in Supabase SQL editor. `orderService.createOrder` falls back to legacy JS logic if the RPC is missing.
- **Env vars**: Same secrets exist twice with/without `VITE_` prefix (e.g. `THACO_API_KEY` vs `VITE_THACO_API_KEY`). Electron uses the non-prefixed ones (via `dotenv.config()` in `main.js`/`thacoApi.js`); the renderer only sees `VITE_` ones (they're inlined at Vite build). Keep both in sync when editing `.env`.
- **TLS**: `main.js` sets `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` globally after startup, and accepts cert errors for `*.thaco.com.vn` / `*.thacochulai.vn` hosts.
- **Preload**: the wired-up preload is `electron/preload.cjs` (CommonJS, passed to `BrowserWindow`). `electron/preload.js` is an ESM stub missing the order/auth handlers — edit `preload.cjs`, not `.js`. `window.electronAPI` is exposed by `preload.cjs`.
- **Auth**: THACO credentials are stored encrypted via Electron `safeStorage` into the userData `token.json`; the token auto-refreshes using stored credentials. Passwords are never kept in `config.json`.
- **Icons/static**: `dist-react/icon.png|.ico` are copied from `public/` by the build; Electron reads icons from `dist-react/` at runtime. `public/locked_order.png` is also copied.
- **Code style**: no comment policy is enforced; existing comments and string literals are in Vietnamese — preserve that in the files you touch. UI components use `lucide-react` icons and a reusable `ui/` component set (`src/components/ui/`).
- App is single-instance (`requestSingleInstanceLock`); second launches just refocus the existing window.