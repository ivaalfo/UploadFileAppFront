# Copilot / AI agent instructions for this repository

Purpose: Give AI coding agents the minimal, precise context they need to be productive in this repo.

- Project layout: two main packages at the repo root:
  - `fileTransferFront` — Angular 8 application (primary web app).
  - `fileTransfer` — shared/library package consumed by the app.

- Key commands (run from `fileTransferFront`):
  - Install: `npm ci` (preferred for CI/reproducible installs).
  - Dev server: `npm start` -> runs `ng serve -c dev` (see [fileTransferFront/package.json](fileTransferFront/package.json#L1-L120)).
  - Build (production): `npm run build` -> `ng build --prod --base-href /fileTransfer/`.
  - Mock API server: `npm run mock-server` (nodemon mockserver/server.js).
  - Configure dist for envs: `npm run config:dev` and `npm run config:local` (see `deploy/` scripts).
  - Tests: `npm test` (unit), `npm run e2e` (end-to-end).
  - Lint: `npm run lint` (TSLint).

- Architecture & conventions (what to know):
  - Modular Angular app: feature modules live under `src/app/modules/*`. Modules are generally lazy-loaded; inspect routing files under `modules/*/*.routing.ts` to find lazy routes.
  - `CoreModule`: contains singleton services, guards and interceptors. It uses a guard `module-loaded-once.guard.ts` to prevent multiple imports — prefer adding shared singletons here (see [fileTransferFront/README.md](fileTransferFront/README.md#L1-L120)).
  - `SharedModule`: UI controls, pipes and generic components can be imported into feature modules without importing app-specific modules.
  - Shared library workflow: local development uses `npm link` as described in [fileTransfer/README.md](fileTransfer/README.md#L1-L140). Typical steps:
    1. Build/watch the library.
    2. `npm link` the built package and `npm link <pkg>` into `fileTransferFront` for live development.

- Config & environment notes:
  - App reads `src/config.js` at runtime; `deploy/config.dev.js` and `deploy/config.local.js` are utilities to post-process the built `dist/` output.
  - Angular environment files live in `src/environments/` (dev, prod, etc.) — choose them via `ng build -c <config>`.

- Tests and local production preview:
  - To preview built app with mocked API: run `npm run mock-server`, then `npm run build` and serve `dist/` with a static server (e.g. `http-server dist/ -p 4200 -o fileTransfer`).

- Common patterns and where to look for examples:
  - Authentication & guards: `src/app/core/guards` (look for `auth.guard.ts`).
  - HTTP interceptors (auth headers, error handling): `src/app/core/interceptors`.
  - Feature page example: `src/app/modules/pedidosValidador/pages/pedidosValidador/pedidos.validador.component.ts` (component + template + styles are colocated).
  - Styles: `src/styles/base` for variables/mixins and `src/styles/global` for global rules.

- Dependency & toolchain notes:
  - Angular CLI v8 and TypeScript ~3.5 are used. Prefer Node/npm versions compatible with Angular 8; CI uses `npm ci` for deterministic installs.
  - The repo uses `tslint` (not ESLint) and `karma` + `jasmine` for unit tests.

- When modifying code, check these places before changing behavior:
  - Global interceptors in `src/app/core/interceptors` (can alter API requests globally).
  - Centralized services in `src/app/core/services` (singletons used across features).
  - Route definitions in `src/app/app-routing.module.ts` and feature `*.routing.ts` files for lazy-loading impact.

- Quick pointers for AI code edits (doable, discoverable tasks):
  - Fix a UI bug: inspect the component, its template and its SCSS in the same folder under `modules/*/pages`.
  - Add a dependency: update `fileTransferFront/package.json` and prefer adding to `dependencies` or `devDependencies` matching the project's existing pattern.
  - Update build output config: modify `package.json` scripts or `deploy/config.*.js` to change the `dist/` post-processing.

If something in these instructions is unclear or you want examples expanded (for example: a short walkthrough of the lazy-loading routes or the mockserver API shape), tell me which area and I will extend the document.
