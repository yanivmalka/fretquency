# Tech Stack & Build

## Stack

- **Language**: TypeScript (~6.0), targeting ES2023
- **UI Framework**: React 19 (functional components, hooks only — no class components)
- **Bundler**: Vite 8 with `@vitejs/plugin-react`
- **PWA**: `vite-plugin-pwa` (Workbox service worker, auto-update)
- **Mobile**: Capacitor 8 (Android target, `webDir: dist`)
- **Linting**: ESLint 10 with `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- **Deployment**: GitHub Pages via GitHub Actions (push to `main` triggers build + deploy)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then bundle with Vite |
| `npm run lint` | Run ESLint on the project |
| `npm run preview` | Preview production build locally |

There is no test framework configured in this project.

## Build Notes

- Vite config injects `__COMMIT_HASH__` and `__COMMIT_DATE__` as compile-time constants (via `git rev-parse` / `git log`)
- Base path is `/fretquency/` for GitHub Pages hosting
- The PWA manifest uses `standalone` display mode with portrait orientation
- TypeScript is configured with `noEmit`, bundler module resolution, and strict unused-variable checks

## Deployment

- Production deploys automatically on push to `main` via `.github/workflows/deploy.yml`
- Builds on Node 20, outputs to `dist/`, deployed as GitHub Pages artifact
