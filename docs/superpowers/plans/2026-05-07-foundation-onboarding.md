# Foundation & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a deployable, installable, offline-capable PWA where a kid completes a 60–90s onboarding (language → kid name → fumling visual → instrument → fumling name) and lands in a placeholder Fumling Hollow with their state persisted locally.

**Architecture:** A Vite + Svelte 5 + TypeScript single-page PWA. State lives in lightweight Svelte stores backed by a singleton Dexie (IndexedDB) row called `profile`. A hand-rolled in-memory router transitions between Splash → onboarding screens → Hub → Settings (no URL routing — kids don't see URLs). i18n via `svelte-i18n` with `nb` and `en` locale files; one active language at a time, switchable in Settings. Tone.js audio engine is initialized lazily on first user gesture (no audio actually played in Plan 1, but the engine is wired so Plans 2+ can drop in). Workbox (via `vite-plugin-pwa`) generates the service worker for install + offline.

**Tech Stack:**
- TypeScript 5
- Svelte 5 (with runes for component state; classic `svelte/store` writables for cross-component state, for vitest-friendliness)
- Vite 5
- `vite-plugin-pwa` (Workbox)
- `svelte-i18n` for localization
- Dexie 4 for IndexedDB
- Tone.js 14 (initialized only; no playback in this plan)
- Vitest + `@testing-library/svelte` + `jsdom` for unit/component tests
- Playwright for E2E (one happy-path onboarding test)

**What this plan does NOT include** (deferred to later plans):
- Composer, scrapbook, real notation rendering (Plan 2)
- The Fumling Hollow as an illustrated scene with idle behaviors, lands, encounter framework (Plan 3)
- Real fumling illustrations and animation sets (Plan 5)
- Voice acting integration (Plan 5)

**Intentional design choices** (do NOT add to this plan):
- **No Back affordance during onboarding.** The flow is 60–90s and forward-only. The route store's `back()` exists for Hub ↔ Settings, but no onboarding screen exposes a Back button. If a kid needs to redo their fumling, they reset from Settings.

The Fumling Hollow in this plan is a minimal placeholder: a centered scene background, the customized fumling silhouette, and the kid's name. The fumling silhouette is a CSS/SVG composition driven by the chosen color and features — good enough to feel like *theirs*, intentionally pre-illustration.

**Naming:** Norwegian locale code is `nb` (Bokmål). All Norwegian strings target Bokmål. Brand voice is playful, inviting, low-pressure — translations preserve the register.

---

## File Structure

Files created in this plan (with single-responsibility callouts):

```
fumletone/
├── package.json                           # deps + scripts
├── tsconfig.json
├── tsconfig.node.json                     # for vite/playwright config
├── vite.config.ts                         # vite + svelte + PWA plugin
├── vitest.config.ts                       # vitest with svelte plugin + jsdom
├── playwright.config.ts                   # E2E config
├── .gitignore
├── index.html                             # SPA shell
├── public/
│   ├── icons/
│   │   ├── icon-192.png                   # PWA icon (placeholder; Plan 5 replaces)
│   │   ├── icon-512.png
│   │   ├── icon-maskable-192.png
│   │   ├── icon-maskable-512.png
│   │   └── apple-touch-icon-180.png       # iOS home-screen icon
│   └── robots.txt                         # disallow all (no public release)
├── src/
│   ├── main.ts                            # mount App, init i18n, init db
│   ├── App.svelte                         # top-level: Router + boot guard
│   ├── app.css                            # design tokens (colors, spacing, type)
│   ├── vite-env.d.ts                      # ambient types for *.svelte + vite/client
│   ├── lib/
│   │   ├── i18n/
│   │   │   ├── index.ts                   # svelte-i18n init + helpers
│   │   │   ├── nb.json                    # Norwegian Bokmål strings
│   │   │   └── en.json                    # English strings
│   │   ├── db/
│   │   │   ├── schema.ts                  # KidProfile interface + enums
│   │   │   └── db.ts                      # Dexie class + getProfile/saveProfile
│   │   ├── audio/
│   │   │   └── engine.ts                  # Tone.js lazy init wrapper
│   │   ├── stores/
│   │   │   ├── profile.ts                 # writable<KidProfile> + persist on change
│   │   │   └── route.ts                   # writable<Route> + push/back helpers
│   │   ├── router/
│   │   │   └── Router.svelte              # switch on $route, render the right screen
│   │   └── components/
│   │       ├── FumlingAvatar.svelte       # SVG silhouette by color/features/instrument
│   │       ├── BigButton.svelte           # large-touch-target tappable button for kids
│   │       └── ScreenFrame.svelte         # centered safe-area frame for iPad
│   └── routes/
│       ├── Splash.svelte
│       ├── onboarding/
│       │   ├── PickLanguage.svelte
│       │   ├── PickKidName.svelte
│       │   ├── CustomizeFumling.svelte
│       │   ├── PickInstrument.svelte
│       │   └── NameFumling.svelte
│       ├── Hub.svelte                     # placeholder Fumling Hollow
│       └── Settings.svelte
└── tests/
    ├── setup.ts                           # vitest setup: fake-indexeddb
    ├── unit/
    │   ├── db.test.ts
    │   ├── i18n.test.ts
    │   ├── audio.test.ts
    │   └── stores/
    │       ├── profile.test.ts
    │       └── route.test.ts
    ├── component/
    │   ├── FumlingAvatar.test.ts
    │   ├── Settings.test.ts
    │   └── onboarding/
    │       ├── PickLanguage.test.ts
    │       ├── PickKidName.test.ts
    │       ├── CustomizeFumling.test.ts
    │       ├── PickInstrument.test.ts
    │       └── NameFumling.test.ts
    └── e2e/
        └── onboarding.spec.ts
```

---

## Canonical Types (referenced throughout)

These are defined in Task 4 (`src/lib/db/schema.ts`) and used by every later task. Reproduced here so cross-task references stay consistent:

```ts
export type Language = 'nb' | 'en';
export type Instrument = 'violin' | 'cello';
export type FumlingColor = 'sage' | 'rose' | 'sand' | 'sky';
export type FumlingFeature = 'hat' | 'stripedSock' | 'roundEyes' | 'longEars';

export interface KidProfile {
  id: 1;                         // Dexie singleton key
  kidName: string;               // '' means use localized default ('Venn' / 'Friend')
  language: Language;
  fumlingName: string;           // default 'Fumly'
  fumlingColor: FumlingColor;
  fumlingFeatures: FumlingFeature[]; // 0..2 entries
  instrument: Instrument;
  onboardingCompletedAt: Date | null; // null until kid lands in Hub
  createdAt: Date;
  updatedAt: Date;
}

export type Route =
  | { name: 'splash' }
  | { name: 'onboarding/pickLanguage' }
  | { name: 'onboarding/pickKidName' }
  | { name: 'onboarding/customizeFumling' }
  | { name: 'onboarding/pickInstrument' }
  | { name: 'onboarding/nameFumling' }
  | { name: 'hub' }
  | { name: 'settings' };
```

---

## Task 1: Initialize project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/App.svelte`, `src/app.css`, `src/vite-env.d.ts`, `.gitignore`

- [ ] **Step 1: Initialize `package.json`**

Create `/home/eivind/code/fumletone/package.json`:

```json
{
  "name": "fumletone",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --host",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "dexie": "^4.0.10",
    "svelte-i18n": "^4.0.1",
    "tone": "^14.9.17"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/svelte": "^5.2.4",
    "@testing-library/user-event": "^14.5.2",
    "@tsconfig/svelte": "^5.0.4",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "svelte": "^5.0.0",
    "svelte-check": "^4.0.0",
    "tslib": "^2.7.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.5",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /home/eivind/code/fumletone && npm install
```

Expected: `node_modules/` populated, `package-lock.json` written, no errors.

- [ ] **Step 3: Add `tsconfig.json`**

Create `/home/eivind/code/fumletone/tsconfig.json`:

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "checkJs": false,
    "isolatedModules": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "types": ["svelte", "vite/client"],
    "baseUrl": ".",
    "paths": {
      "$lib/*": ["src/lib/*"],
      "$routes/*": ["src/routes/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Add `tsconfig.node.json`**

Create `/home/eivind/code/fumletone/tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 5: Add `vite.config.ts`** (PWA plugin added in Task 3; this is the minimal version)

Create `/home/eivind/code/fumletone/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
      $routes: resolve(__dirname, 'src/routes'),
    },
  },
  server: { host: true, port: 5173 },
});
```

- [ ] **Step 6: Add `index.html`**

Create `/home/eivind/code/fumletone/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
    <title>Fumletone</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Add `src/main.ts`** (boot — i18n + db init wired in later tasks; for now just mount)

Create `/home/eivind/code/fumletone/src/main.ts`:

```ts
import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';

const app = mount(App, { target: document.getElementById('app')! });
export default app;
```

- [ ] **Step 8: Add `src/App.svelte`** (placeholder — Router introduced in Task 7)

Create `/home/eivind/code/fumletone/src/App.svelte`:

```svelte
<main>
  <h1>Fumletone</h1>
  <p>Booting…</p>
</main>

<style>
  main { padding: 2rem; font-family: system-ui, sans-serif; }
</style>
```

- [ ] **Step 9: Add `src/app.css`** (design tokens — extended in later tasks but defined here)

Create `/home/eivind/code/fumletone/src/app.css`:

```css
:root {
  /* Calm warm palette — refined in Plan 5 */
  --color-bg: #fdf6ec;
  --color-fg: #3a2e22;
  --color-accent: #a8593f;
  --color-sage: #9bbf95;
  --color-rose: #d29797;
  --color-sand: #d9c39a;
  --color-sky: #95b9c7;

  --radius-lg: 28px;
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 40px;

  --font-display: ui-rounded, "SF Pro Rounded", "Helvetica Neue", system-ui, sans-serif;

  /* iPad-friendly tap target floor */
  --tap-min: 64px;
}

* { box-sizing: border-box; }

html, body, #app {
  height: 100%;
  margin: 0;
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-display);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  overscroll-behavior: none;
}

button { font: inherit; }
```

- [ ] **Step 10: Add `src/vite-env.d.ts`** (ambient types — `svelte-check` needs an explicit `*.svelte` module declaration; the triple-slash references to the `svelte` package alone are not picked up under our `tsconfig` `types` setting)

Create `/home/eivind/code/fumletone/src/vite-env.d.ts`:

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component;
  export default component;
}
```

- [ ] **Step 11: Add `.gitignore`**

Create `/home/eivind/code/fumletone/.gitignore`:

```
node_modules
dist
.DS_Store
.vite
playwright-report
test-results
coverage
*.log
```

- [ ] **Step 12: Run dev server to verify boot**

```bash
cd /home/eivind/code/fumletone && timeout 8 npm run dev || true
```

Expected: Vite boots and prints `Local: http://localhost:5173/` within a few seconds. Timeout terminates it; that's fine.

- [ ] **Step 13: Run type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: PASS, 0 errors.

- [ ] **Step 14: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "scaffold: vite + svelte 5 + ts project"
```

---

## Task 2: Test infrastructure

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `playwright.config.ts`
- Modify: `package.json` (already has test scripts from Task 1; nothing to change)

- [ ] **Step 1: Add `vitest.config.ts`**

Create `/home/eivind/code/fumletone/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
      $routes: resolve(__dirname, 'src/routes'),
    },
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.ts'],
    globals: true,
  },
});
```

- [ ] **Step 2: Add `tests/setup.ts`**

Create `/home/eivind/code/fumletone/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step 3: Write a smoke test to verify the setup**

Create `/home/eivind/code/fumletone/tests/unit/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test infra', () => {
  it('runs and has indexedDB available', () => {
    expect(typeof indexedDB).toBe('object');
    expect(indexedDB).not.toBeNull();
  });
});
```

- [ ] **Step 4: Run vitest**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: 1 test passes ("test infra > runs and has indexedDB available").

- [ ] **Step 5: Add `playwright.config.ts`**

Create `/home/eivind/code/fumletone/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
```

- [ ] **Step 6: Install Playwright browsers**

The `iPad (gen 7)` device profile in Step 5 has `defaultBrowserType: 'webkit'`, so install webkit (not chromium):

```bash
cd /home/eivind/code/fumletone && npx playwright install webkit
```

Expected: Webkit binary downloads (one-time). On Linux you may also need the system libraries — `sudo npx playwright install-deps webkit` covers them (gtk-4, gstreamer*, flite*, etc.). Macs need no extra system deps.

- [ ] **Step 7: Verify Playwright runs (placeholder e2e file)**

Create `/home/eivind/code/fumletone/tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('app loads and shows the brand name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /fumletone/i })).toBeVisible();
});
```

```bash
cd /home/eivind/code/fumletone && npm run test:e2e
```

Expected: 1 test passes. (`webServer` in the config auto-starts vite.)

- [ ] **Step 8: Delete the smoke specs**

The smoke tests are no longer needed — they verified infra, not behavior. Real tests in later tasks.

```bash
cd /home/eivind/code/fumletone && rm tests/unit/smoke.test.ts tests/e2e/smoke.spec.ts
```

- [ ] **Step 9: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "test: add vitest + playwright config"
```

---

## Task 3: PWA configuration (Workbox + manifest + icons)

**Files:**
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-192.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon-180.png`, `public/robots.txt`
- Modify: `vite.config.ts`, `src/main.ts`

These icons are placeholders (a solid sage square with a small "F"). Plan 5 replaces them with real fumling artwork.

- [ ] **Step 1: Generate placeholder icon PNGs**

```bash
cd /home/eivind/code/fumletone && mkdir -p public/icons
```

Then create the 5 PNGs with ImageMagick:

```bash
cd /home/eivind/code/fumletone && \
  for size in 180 192 512; do \
    convert -size ${size}x${size} xc:'#9bbf95' \
      -gravity center -font Helvetica -pointsize $((size/3)) -fill '#3a2e22' \
      -annotate 0 'F' \
      public/icons/icon-${size}.png; \
  done && \
  cp public/icons/icon-180.png public/icons/apple-touch-icon-180.png && \
  cp public/icons/icon-192.png public/icons/icon-maskable-192.png && \
  cp public/icons/icon-512.png public/icons/icon-maskable-512.png && \
  rm public/icons/icon-180.png && \
  ls public/icons
```

Expected: directory contains `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`. If `convert` is missing, install ImageMagick (`sudo apt install imagemagick`) or have the engineer paste in equivalent placeholder PNGs by any means.

- [ ] **Step 2: Add `public/robots.txt`**

Create `/home/eivind/code/fumletone/public/robots.txt`:

```
User-agent: *
Disallow: /
```

- [ ] **Step 3: Wire `vite-plugin-pwa` into `vite.config.ts`**

Replace the contents of `/home/eivind/code/fumletone/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon-180.png', 'robots.txt'],
      manifest: {
        name: 'Fumletone',
        short_name: 'Fumletone',
        description: 'A music-theory companion for kids.',
        theme_color: '#9bbf95',
        background_color: '#fdf6ec',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      $lib: resolve(__dirname, 'src/lib'),
      $routes: resolve(__dirname, 'src/routes'),
    },
  },
  server: { host: true, port: 5173 },
});
```

- [ ] **Step 4: Register the service worker in `main.ts`**

Replace `/home/eivind/code/fumletone/src/main.ts`:

```ts
import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';

const app = mount(App, { target: document.getElementById('app')! });

registerSW({ immediate: true });

export default app;
```

- [ ] **Step 5: Add `vite-plugin-pwa/client` to `tsconfig.json` types**

Edit `/home/eivind/code/fumletone/tsconfig.json` — replace the `"types"` line:

```json
    "types": ["svelte", "vite/client", "vite-plugin-pwa/client"],
```

- [ ] **Step 6: Build to verify the manifest and SW are emitted**

```bash
cd /home/eivind/code/fumletone && npm run build
```

Expected: build completes with no errors. `dist/manifest.webmanifest` and `dist/sw.js` exist.

```bash
ls /home/eivind/code/fumletone/dist/manifest.webmanifest /home/eivind/code/fumletone/dist/sw.js
```

Expected: both files listed.

- [ ] **Step 7: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "pwa: workbox + manifest + placeholder icons"
```

---

## Task 4: Storage layer (Dexie schema + getProfile / saveProfile)

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/db.ts`
- Test: `tests/unit/db.test.ts`

- [ ] **Step 1: Define the schema types**

Create `/home/eivind/code/fumletone/src/lib/db/schema.ts`:

```ts
export type Language = 'nb' | 'en';
export type Instrument = 'violin' | 'cello';
export type FumlingColor = 'sage' | 'rose' | 'sand' | 'sky';
export type FumlingFeature = 'hat' | 'stripedSock' | 'roundEyes' | 'longEars';

export interface KidProfile {
  id: 1;
  kidName: string;
  language: Language;
  fumlingName: string;
  fumlingColor: FumlingColor;
  fumlingFeatures: FumlingFeature[];
  instrument: Instrument;
  onboardingCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PROFILE: KidProfile = {
  id: 1,
  kidName: '',
  language: 'nb',
  fumlingName: 'Fumly',
  fumlingColor: 'sage',
  fumlingFeatures: [],
  instrument: 'violin',
  onboardingCompletedAt: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};
```

- [ ] **Step 2: Write failing tests for the db wrapper**

Create `/home/eivind/code/fumletone/tests/unit/db.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getProfile, saveProfile, resetProfile, db } from '$lib/db/db';
import type { KidProfile } from '$lib/db/schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('profile storage', () => {
  it('returns null when no profile exists', async () => {
    const p = await getProfile();
    expect(p).toBeNull();
  });

  it('persists and reads back a profile', async () => {
    const partial = {
      kidName: 'Sara',
      language: 'nb',
      fumlingColor: 'rose',
      instrument: 'cello',
    } as Partial<KidProfile>;
    await saveProfile(partial);
    const got = await getProfile();
    expect(got).not.toBeNull();
    expect(got!.kidName).toBe('Sara');
    expect(got!.language).toBe('nb');
    expect(got!.fumlingColor).toBe('rose');
    expect(got!.instrument).toBe('cello');
    expect(got!.fumlingName).toBe('Fumly');
    expect(got!.createdAt).toBeInstanceOf(Date);
    expect(got!.updatedAt).toBeInstanceOf(Date);
  });

  it('preserves createdAt and bumps updatedAt on second save', async () => {
    await saveProfile({ kidName: 'Sara' });
    const first = await getProfile();
    await new Promise((r) => setTimeout(r, 5));
    await saveProfile({ fumlingName: 'Lull' });
    const second = await getProfile();
    expect(second!.createdAt.getTime()).toBe(first!.createdAt.getTime());
    expect(second!.updatedAt.getTime()).toBeGreaterThan(first!.updatedAt.getTime());
    expect(second!.kidName).toBe('Sara');
    expect(second!.fumlingName).toBe('Lull');
  });

  it('resetProfile wipes the row', async () => {
    await saveProfile({ kidName: 'Sara' });
    await resetProfile();
    expect(await getProfile()).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to confirm they fail**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: FAIL — module `$lib/db/db` does not exist.

- [ ] **Step 4: Implement `db.ts`**

Create `/home/eivind/code/fumletone/src/lib/db/db.ts`:

```ts
import Dexie, { type Table } from 'dexie';
import type { KidProfile } from './schema';
import { DEFAULT_PROFILE } from './schema';

class FumletoneDB extends Dexie {
  profile!: Table<KidProfile, number>;

  constructor() {
    super('fumletone');
    this.version(1).stores({
      profile: 'id',
    });
  }
}

export const db = new FumletoneDB();

export async function getProfile(): Promise<KidProfile | null> {
  const row = await db.profile.get(1);
  return row ?? null;
}

export async function saveProfile(patch: Partial<KidProfile>): Promise<KidProfile> {
  const now = new Date();
  const existing = await db.profile.get(1);
  const next: KidProfile = existing
    ? { ...existing, ...patch, id: 1, updatedAt: now }
    : { ...DEFAULT_PROFILE, ...patch, id: 1, createdAt: now, updatedAt: now };
  await db.profile.put(next);
  return next;
}

export async function resetProfile(): Promise<void> {
  await db.profile.clear();
}
```

- [ ] **Step 5: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: 4 tests pass.

- [ ] **Step 6: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "db: dexie schema + getProfile/saveProfile/resetProfile"
```

---

## Task 5: i18n infrastructure

**Files:**
- Create: `src/lib/i18n/index.ts`, `src/lib/i18n/nb.json`, `src/lib/i18n/en.json`
- Test: `tests/unit/i18n.test.ts`
- Modify: `src/main.ts`

This task ships every onboarding string in both languages so later screen tasks don't have to revisit i18n.

- [ ] **Step 1: Write the Norwegian (Bokmål) locale file**

Create `/home/eivind/code/fumletone/src/lib/i18n/nb.json`:

```json
{
  "app": {
    "title": "Fumletone",
    "kidNameDefault": "Fumle"
  },
  "splash": {
    "tap": "Trykk for å begynne"
  },
  "onboarding": {
    "pickLanguage": {
      "prompt": "Velg språk",
      "norwegian": "Norsk",
      "english": "English"
    },
    "pickKidName": {
      "prompt": "Hva heter du?",
      "placeholder": "Skriv inn navnet ditt",
      "skip": "Hopp over",
      "next": "Videre"
    },
    "customize": {
      "prompt": "Lag fumlingen din",
      "colorLabel": "Farge",
      "featuresLabel": "Småting",
      "next": "Videre",
      "color": {
        "sage": "Salviegrønn",
        "rose": "Roserød",
        "sand": "Sand",
        "sky": "Himmelblå"
      },
      "feature": {
        "hat": "Hatt",
        "stripedSock": "Stripete sokk",
        "roundEyes": "Runde øyne",
        "longEars": "Lange ører"
      }
    },
    "pickInstrument": {
      "prompt": "Skal fumlingen din lære fiolin eller cello?",
      "violin": "Fiolin",
      "cello": "Cello",
      "next": "Videre",
      "confirmHint": "Trykk en gang til for å velge"
    },
    "nameFumling": {
      "prompt": "Hva skal fumlingen din hete?",
      "placeholder": "Fumly",
      "next": "Videre"
    }
  },
  "hub": {
    "greetingNamed": "Hei, {name}!",
    "subtitle": "Velkommen til Fumlehulen."
  },
  "settings": {
    "title": "Innstillinger",
    "language": "Språk",
    "kidName": "Ditt navn",
    "fumling": "Fumlingen din",
    "fumlingName": "Navn",
    "fumlingColor": "Farge",
    "fumlingFeatures": "Småting",
    "instrument": "Instrument",
    "back": "Tilbake",
    "reset": "Start på nytt",
    "resetConfirm": "Hold inne for å nullstille"
  }
}
```

- [ ] **Step 2: Write the English locale file**

Create `/home/eivind/code/fumletone/src/lib/i18n/en.json`:

```json
{
  "app": {
    "title": "Fumletone",
    "kidNameDefault": "Fumle"
  },
  "splash": {
    "tap": "Tap to begin"
  },
  "onboarding": {
    "pickLanguage": {
      "prompt": "Pick a language",
      "norwegian": "Norsk",
      "english": "English"
    },
    "pickKidName": {
      "prompt": "What's your name?",
      "placeholder": "Type your name",
      "skip": "Skip",
      "next": "Next"
    },
    "customize": {
      "prompt": "Make your fumling",
      "colorLabel": "Colour",
      "featuresLabel": "Small things",
      "next": "Next",
      "color": {
        "sage": "Sage",
        "rose": "Rose",
        "sand": "Sand",
        "sky": "Sky"
      },
      "feature": {
        "hat": "Hat",
        "stripedSock": "Striped sock",
        "roundEyes": "Round eyes",
        "longEars": "Long ears"
      }
    },
    "pickInstrument": {
      "prompt": "Will your fumling learn the violin or the cello?",
      "violin": "Violin",
      "cello": "Cello",
      "next": "Next",
      "confirmHint": "Tap again to choose"
    },
    "nameFumling": {
      "prompt": "What's your fumling's name?",
      "placeholder": "Fumly",
      "next": "Next"
    }
  },
  "hub": {
    "greetingNamed": "Hi, {name}!",
    "subtitle": "Welcome to The Fumling Hollow."
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "kidName": "Your name",
    "fumling": "Your fumling",
    "fumlingName": "Name",
    "fumlingColor": "Colour",
    "fumlingFeatures": "Small things",
    "instrument": "Instrument",
    "back": "Back",
    "reset": "Start over",
    "resetConfirm": "Hold to reset"
  }
}
```

- [ ] **Step 3: Write failing test for the i18n init helper**

Create `/home/eivind/code/fumletone/tests/unit/i18n.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { tick } from 'svelte';
import { addMessages } from 'svelte-i18n';
import { _, locale, initI18n } from '$lib/i18n';

beforeEach(async () => {
  await initI18n('en');
});

describe('i18n', () => {
  it('exposes English by default', () => {
    expect(get(locale)).toBe('en');
    expect(get(_)('app.title')).toBe('Fumletone');
  });

  it('switches to Norwegian when locale changes', async () => {
    locale.set('nb');
    await tick();
    expect(get(_)('onboarding.pickLanguage.prompt')).toBe('Velg språk');
  });

  it('falls back to en for keys missing from nb', async () => {
    // simulate a key only present in en — nb should fall back to it
    addMessages('en', { _testOnlyEn: 'english only' });
    locale.set('nb');
    await tick();
    expect(get(_)('_testOnlyEn')).toBe('english only');
  });

  it('interpolates {name} placeholders', async () => {
    locale.set('en');
    await tick();
    expect(get(_)('hub.greetingNamed', { values: { name: 'Sara' } })).toBe('Hi, Sara!');
  });
});
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: FAIL — `$lib/i18n` does not exist.

- [ ] **Step 5: Implement the i18n module**

Create `/home/eivind/code/fumletone/src/lib/i18n/index.ts`:

```ts
import { addMessages, init, locale, _ } from 'svelte-i18n';
import nb from './nb.json';
import en from './en.json';
import type { Language } from '$lib/db/schema';

export { _, locale };

export async function initI18n(initial: Language): Promise<void> {
  addMessages('en', en);
  addMessages('nb', nb);
  await init({
    fallbackLocale: 'en',
    initialLocale: initial,
  });
}
```

- [ ] **Step 6: Run tests to confirm they pass**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: 4 tests pass (plus the 4 db tests from Task 4 = 8 total).

- [ ] **Step 7: Wire `initI18n` into `main.ts`**

For now `main.ts` only initializes i18n with the persisted language (or `nb` by default).
The profile store is populated by `App.svelte` in Task 7 — keeping the read in one place avoids a double-read of the same Dexie row.

Replace `/home/eivind/code/fumletone/src/main.ts`:

```ts
import './app.css';
import App from './App.svelte';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import { initI18n } from '$lib/i18n';
import { getProfile } from '$lib/db/db';

async function boot() {
  const initialProfile = await getProfile();
  await initI18n(initialProfile?.language ?? 'nb');
  const app = mount(App, { target: document.getElementById('app')! });
  registerSW({ immediate: true });
  return app;
}

void boot();
```

(Note: this `getProfile()` call is needed *before* mounting so i18n has the right locale on the very first paint. `App.svelte` then calls `loadProfile()` to populate the reactive store. That's two reads of the same row, ~1ms apart on IndexedDB — acceptable. The alternative — having `main.ts` populate the store directly — couples boot order to the store module and offers no real win here.)

- [ ] **Step 8: Type check + dev sanity**

```bash
cd /home/eivind/code/fumletone && npm run check && timeout 8 npm run dev || true
```

Expected: type check passes; dev server boots without errors.

- [ ] **Step 9: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "i18n: nb + en locale files and svelte-i18n init"
```

---

## Task 6: Audio engine init (Tone.js, lazy-unlocked)

**Files:**
- Create: `src/lib/audio/engine.ts`
- Test: `tests/unit/audio.test.ts`

No audio plays in Plan 1. The engine wrapper just exposes `unlock()` (called from a user gesture so Tone's audio context starts) and `isReady()`. Plans 2+ build on top.

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/unit/audio.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unlock, isReady, _resetForTests } from '$lib/audio/engine';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getContext: () => ({ state: 'running' }),
}));

beforeEach(() => {
  _resetForTests();
});

describe('audio engine', () => {
  it('is not ready before unlock', () => {
    expect(isReady()).toBe(false);
  });

  it('becomes ready after unlock', async () => {
    await unlock();
    expect(isReady()).toBe(true);
  });

  it('is idempotent across multiple unlock calls', async () => {
    await unlock();
    await unlock();
    expect(isReady()).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: FAIL — `$lib/audio/engine` does not exist.

- [ ] **Step 3: Implement the audio engine wrapper**

Create `/home/eivind/code/fumletone/src/lib/audio/engine.ts`:

```ts
import * as Tone from 'tone';

let started = false;

export async function unlock(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export function isReady(): boolean {
  return started;
}

export function _resetForTests(): void {
  started = false;
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test
```

Expected: 3 audio tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "audio: tone.js lazy-unlock wrapper"
```

---

## Task 7: Stores (profile + route) and Router

**Files:**
- Create: `src/lib/stores/profile.ts`, `src/lib/stores/route.ts`, `src/lib/router/Router.svelte`
- Test: `tests/unit/stores/profile.test.ts`, `tests/unit/stores/route.test.ts`
- Modify: `src/App.svelte`

- [ ] **Step 1: Write the failing route store test**

Create `/home/eivind/code/fumletone/tests/unit/stores/route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { route, navigate, back, _resetRouteForTests } from '$lib/stores/route';

beforeEach(() => {
  _resetRouteForTests();
});

describe('route store', () => {
  it('starts at splash', () => {
    expect(get(route)).toEqual({ name: 'splash' });
  });

  it('navigate pushes a new route', () => {
    navigate({ name: 'onboarding/pickLanguage' });
    expect(get(route).name).toBe('onboarding/pickLanguage');
  });

  it('back returns to the previous route', () => {
    navigate({ name: 'onboarding/pickLanguage' });
    navigate({ name: 'onboarding/pickKidName' });
    back();
    expect(get(route).name).toBe('onboarding/pickLanguage');
  });

  it('back is a no-op at the root', () => {
    back();
    back();
    expect(get(route).name).toBe('splash');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/route.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route store**

Create `/home/eivind/code/fumletone/src/lib/stores/route.ts`:

```ts
import { writable, get } from 'svelte/store';
import type { Route } from '$lib/db/schema';

const INITIAL: Route = { name: 'splash' };

const stack = writable<Route[]>([INITIAL]);

export const route = {
  subscribe: (run: (r: Route) => void) =>
    stack.subscribe((s) => run(s[s.length - 1])),
};

export function navigate(next: Route): void {
  stack.update((s) => [...s, next]);
}

export function back(): void {
  stack.update((s) => (s.length > 1 ? s.slice(0, -1) : s));
}

export function reset(to: Route = INITIAL): void {
  stack.set([to]);
}

export function _resetRouteForTests(): void {
  stack.set([INITIAL]);
}

export function _peekStackForTests(): Route[] {
  return get(stack);
}
```

The `Route` type was declared in this plan's Canonical Types block but is not yet added to `schema.ts`. Append it now:

Append to `/home/eivind/code/fumletone/src/lib/db/schema.ts`:

```ts

export type Route =
  | { name: 'splash' }
  | { name: 'onboarding/pickLanguage' }
  | { name: 'onboarding/pickKidName' }
  | { name: 'onboarding/customizeFumling' }
  | { name: 'onboarding/pickInstrument' }
  | { name: 'onboarding/nameFumling' }
  | { name: 'hub' }
  | { name: 'settings' };
```

- [ ] **Step 4: Run tests to confirm route store passes**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/route.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Write the failing profile store test**

Create `/home/eivind/code/fumletone/tests/unit/stores/profile.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { profile, loadProfile, updateProfile } from '$lib/stores/profile';
import { db, getProfile } from '$lib/db/db';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await loadProfile();
});

describe('profile store', () => {
  it('is null before any profile is saved', () => {
    expect(get(profile)).toBeNull();
  });

  it('updateProfile persists to db and updates the store', async () => {
    await updateProfile({ kidName: 'Sara', language: 'nb' });
    expect(get(profile)?.kidName).toBe('Sara');
    const dbRow = await getProfile();
    expect(dbRow?.kidName).toBe('Sara');
  });

  it('loadProfile reads existing db row into the store', async () => {
    await updateProfile({ kidName: 'Mia' });
    await loadProfile();
    expect(get(profile)?.kidName).toBe('Mia');
  });
});
```

- [ ] **Step 6: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/profile.test.ts
```

Expected: FAIL — `$lib/stores/profile` does not exist.

- [ ] **Step 7: Implement the profile store**

Create `/home/eivind/code/fumletone/src/lib/stores/profile.ts`:

```ts
import { writable, get } from 'svelte/store';
import type { KidProfile } from '$lib/db/schema';
import { getProfile, saveProfile, resetProfile } from '$lib/db/db';

export const profile = writable<KidProfile | null>(null);

export async function loadProfile(): Promise<void> {
  profile.set(await getProfile());
}

export async function updateProfile(patch: Partial<KidProfile>): Promise<void> {
  const next = await saveProfile(patch);
  profile.set(next);
}

export async function clearProfile(): Promise<void> {
  await resetProfile();
  profile.set(null);
}

export function getProfileSnapshot(): KidProfile | null {
  return get(profile);
}
```

- [ ] **Step 8: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/profile.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 9: Implement the Router component**

Create `/home/eivind/code/fumletone/src/lib/router/Router.svelte`:

```svelte
<script lang="ts">
  import { route } from '$lib/stores/route';
  import Splash from '$routes/Splash.svelte';
  import PickLanguage from '$routes/onboarding/PickLanguage.svelte';
  import PickKidName from '$routes/onboarding/PickKidName.svelte';
  import CustomizeFumling from '$routes/onboarding/CustomizeFumling.svelte';
  import PickInstrument from '$routes/onboarding/PickInstrument.svelte';
  import NameFumling from '$routes/onboarding/NameFumling.svelte';
  import Hub from '$routes/Hub.svelte';
  import Settings from '$routes/Settings.svelte';
</script>

{#if $route.name === 'splash'}
  <Splash />
{:else if $route.name === 'onboarding/pickLanguage'}
  <PickLanguage />
{:else if $route.name === 'onboarding/pickKidName'}
  <PickKidName />
{:else if $route.name === 'onboarding/customizeFumling'}
  <CustomizeFumling />
{:else if $route.name === 'onboarding/pickInstrument'}
  <PickInstrument />
{:else if $route.name === 'onboarding/nameFumling'}
  <NameFumling />
{:else if $route.name === 'hub'}
  <Hub />
{:else if $route.name === 'settings'}
  <Settings />
{/if}
```

- [ ] **Step 10: Create stub route components so the Router type-checks**

Each is a placeholder until its dedicated task fills it in. The placeholder has a clear marker so it's obvious if a real implementation didn't happen.

Create `/home/eivind/code/fumletone/src/routes/Splash.svelte`:

```svelte
<p data-testid="route-stub">Splash (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/onboarding/PickLanguage.svelte`:

```svelte
<p data-testid="route-stub">PickLanguage (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/onboarding/PickKidName.svelte`:

```svelte
<p data-testid="route-stub">PickKidName (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/onboarding/CustomizeFumling.svelte`:

```svelte
<p data-testid="route-stub">CustomizeFumling (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/onboarding/PickInstrument.svelte`:

```svelte
<p data-testid="route-stub">PickInstrument (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/onboarding/NameFumling.svelte`:

```svelte
<p data-testid="route-stub">NameFumling (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/Hub.svelte`:

```svelte
<p data-testid="route-stub">Hub (stub)</p>
```

Create `/home/eivind/code/fumletone/src/routes/Settings.svelte`:

```svelte
<p data-testid="route-stub">Settings (stub)</p>
```

- [ ] **Step 11: Wire Router into App.svelte and add a boot guard**

The boot guard decides where to start: if no profile exists, start at splash → onboarding; if onboarding is complete, jump straight to hub.

Replace `/home/eivind/code/fumletone/src/App.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Router from '$lib/router/Router.svelte';
  import { loadProfile, profile } from '$lib/stores/profile';
  import { reset } from '$lib/stores/route';

  let booted = $state(false);

  onMount(async () => {
    await loadProfile();
    if ($profile?.onboardingCompletedAt) {
      reset({ name: 'hub' });
    } else {
      reset({ name: 'splash' });
    }
    booted = true;
  });
</script>

{#if booted}
  <Router />
{/if}
```

(Note: `$state` and `$props` are Svelte 5 runes. `$profile` is the auto-subscription form for the writable store. Both work together — runes for component-local state, `$store` for store auto-subscription.)

- [ ] **Step 12: Type check + dev sanity**

```bash
cd /home/eivind/code/fumletone && npm run check && npm test
```

Expected: type check passes; all 18 tests pass (4 db + 4 i18n + 3 audio + 4 route + 3 profile).

```bash
cd /home/eivind/code/fumletone && timeout 8 npm run dev || true
```

Expected: dev server boots; visiting `/` would show "Splash (stub)".

- [ ] **Step 13: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "router: in-memory route store + Router + boot guard"
```

---

## Task 8: Shared components (FumlingAvatar, BigButton, ScreenFrame)

**Files:**
- Create: `src/lib/components/FumlingAvatar.svelte`, `src/lib/components/BigButton.svelte`, `src/lib/components/ScreenFrame.svelte`
- Test: `tests/component/FumlingAvatar.test.ts`

These three components are reused by every onboarding screen and the hub. Defining them now keeps the screen tasks simple.

- [ ] **Step 1: Write the failing FumlingAvatar test**

Create `/home/eivind/code/fumletone/tests/component/FumlingAvatar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';

describe('FumlingAvatar', () => {
  it('uses the requested color as a fill', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'rose', features: [], instrument: 'violin' },
    });
    const body = container.querySelector('[data-part="body"]');
    expect(body).not.toBeNull();
    expect(body!.getAttribute('fill')).toBe('var(--color-rose)');
  });

  it('renders a hat element when feature includes "hat"', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: ['hat'], instrument: 'violin' },
    });
    expect(container.querySelector('[data-part="hat"]')).not.toBeNull();
  });

  it('renders a violin when instrument is violin', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: [], instrument: 'violin' },
    });
    expect(container.querySelector('[data-part="violin"]')).not.toBeNull();
    expect(container.querySelector('[data-part="cello"]')).toBeNull();
  });

  it('renders a cello when instrument is cello', () => {
    const { container } = render(FumlingAvatar, {
      props: { color: 'sage', features: [], instrument: 'cello' },
    });
    expect(container.querySelector('[data-part="cello"]')).not.toBeNull();
    expect(container.querySelector('[data-part="violin"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/FumlingAvatar.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement FumlingAvatar**

Create `/home/eivind/code/fumletone/src/lib/components/FumlingAvatar.svelte`:

```svelte
<script lang="ts">
  import type { FumlingColor, FumlingFeature, Instrument } from '$lib/db/schema';

  let {
    color,
    features,
    instrument,
    size = 240,
  }: {
    color: FumlingColor;
    features: FumlingFeature[];
    instrument: Instrument;
    size?: number;
  } = $props();

  const fill = $derived(`var(--color-${color})`);
  const hasHat = $derived(features.includes('hat'));
  const hasStripedSock = $derived(features.includes('stripedSock'));
  const hasRoundEyes = $derived(features.includes('roundEyes'));
  const hasLongEars = $derived(features.includes('longEars'));
</script>

<svg viewBox="0 0 200 220" width={size} height={size} aria-hidden="true">
  {#if hasLongEars}
    <ellipse data-part="ears" cx="65" cy="40" rx="10" ry="28" fill={fill} />
    <ellipse cx="135" cy="40" rx="10" ry="28" fill={fill} />
  {/if}

  <!-- body -->
  <ellipse data-part="body" cx="100" cy="120" rx="70" ry="80" fill={fill} />

  <!-- eyes -->
  {#if hasRoundEyes}
    <circle data-part="eyes" cx="80" cy="100" r="8" fill="#3a2e22" />
    <circle cx="120" cy="100" r="8" fill="#3a2e22" />
  {:else}
    <ellipse data-part="eyes" cx="80" cy="100" rx="3" ry="6" fill="#3a2e22" />
    <ellipse cx="120" cy="100" rx="3" ry="6" fill="#3a2e22" />
  {/if}

  <!-- hat -->
  {#if hasHat}
    <path data-part="hat" d="M 60 60 Q 100 20 140 60 Z" fill="#a8593f" />
  {/if}

  <!-- striped sock -->
  {#if hasStripedSock}
    <g data-part="sock">
      <rect x="80" y="195" width="14" height="20" fill="#fdf6ec" />
      <rect x="80" y="200" width="14" height="3" fill="#a8593f" />
      <rect x="80" y="208" width="14" height="3" fill="#a8593f" />
    </g>
  {/if}

  <!-- instrument -->
  {#if instrument === 'violin'}
    <g data-part="violin">
      <ellipse cx="170" cy="110" rx="14" ry="22" fill="#7a4d2a" />
      <line x1="170" y1="88" x2="190" y2="60" stroke="#3a2e22" stroke-width="2" />
    </g>
  {:else}
    <g data-part="cello">
      <ellipse cx="170" cy="135" rx="20" ry="38" fill="#5a3818" />
      <line x1="170" y1="97" x2="170" y2="50" stroke="#3a2e22" stroke-width="3" />
    </g>
  {/if}
</svg>
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/FumlingAvatar.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Implement BigButton**

Create `/home/eivind/code/fumletone/src/lib/components/BigButton.svelte`:

```svelte
<script lang="ts">
  let {
    onclick,
    disabled = false,
    variant = 'primary',
    children,
  }: {
    onclick: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'ghost';
    children: () => unknown;
  } = $props();
</script>

<button class="big {variant}" {disabled} onclick={onclick}>
  {@render children()}
</button>

<style>
  .big {
    min-height: var(--tap-min);
    padding: 0 var(--space-4);
    border-radius: var(--radius-lg);
    border: none;
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 80ms ease;
  }
  .big:active { transform: scale(0.97); }
  .primary { background: var(--color-accent); color: var(--color-bg); }
  .ghost { background: transparent; color: var(--color-fg); }
  .big:disabled { opacity: 0.4; cursor: default; }
</style>
```

- [ ] **Step 6: Implement ScreenFrame**

Create `/home/eivind/code/fumletone/src/lib/components/ScreenFrame.svelte`:

```svelte
<script lang="ts">
  let { children }: { children: () => unknown } = $props();
</script>

<section class="frame">
  {@render children()}
</section>

<style>
  .frame {
    height: 100dvh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    padding: max(env(safe-area-inset-top), var(--space-3))
            max(env(safe-area-inset-right), var(--space-3))
            max(env(safe-area-inset-bottom), var(--space-3))
            max(env(safe-area-inset-left), var(--space-3));
    text-align: center;
  }
</style>
```

- [ ] **Step 7: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "components: FumlingAvatar + BigButton + ScreenFrame"
```

---

## Task 9: Splash screen

**Files:**
- Create/replace: `src/routes/Splash.svelte`
- Test: extend `tests/component/onboarding/...` later via E2E. (Splash is trivial — covered by E2E in Task 17.)

- [ ] **Step 1: Replace Splash.svelte**

Replace `/home/eivind/code/fumletone/src/routes/Splash.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { navigate } from '$lib/stores/route';
  import { unlock } from '$lib/audio/engine';

  async function begin() {
    await unlock();
    navigate({ name: 'onboarding/pickLanguage' });
  }
</script>

<ScreenFrame>
  <h1 class="brand">Fumletone</h1>
  <button class="tap" onclick={begin} aria-label="Start">
    <FumlingAvatar color="sage" features={['hat']} instrument="violin" size={280} />
  </button>
  <p class="tap-hint">
    <span>Trykk for å begynne</span>
    <span>·</span>
    <span>Tap to begin</span>
  </p>
</ScreenFrame>

<style>
  .brand {
    font-size: 3rem;
    margin: 0;
    letter-spacing: -0.02em;
    color: var(--color-fg);
  }
  .tap {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .tap-hint {
    display: flex;
    gap: var(--space-2);
    color: var(--color-fg);
    opacity: 0.7;
    margin: 0;
    font-size: 1.1rem;
  }
</style>
```

(Splash is intentionally bilingual — language not yet picked. Tapping the fumling unlocks the audio context, which must happen on a user gesture.)

- [ ] **Step 2: Verify dev server renders Splash**

```bash
cd /home/eivind/code/fumletone && timeout 6 npm run dev || true
```

Expected: server boots; manual check at http://localhost:5173 shows splash with the fumling and bilingual hint.

- [ ] **Step 3: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "splash: bilingual landing screen with fumling tap-to-begin"
```

---

## Task 10: Onboarding — Pick Language

**Files:**
- Replace: `src/routes/onboarding/PickLanguage.svelte`
- Test: `tests/component/onboarding/PickLanguage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/onboarding/PickLanguage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import PickLanguage from '$routes/onboarding/PickLanguage.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile } from '$lib/stores/profile';
import { route, _resetRouteForTests } from '$lib/stores/route';
import { initI18n } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
});

describe('PickLanguage screen', () => {
  it('shows both language options bilingually', () => {
    render(PickLanguage);
    expect(screen.getByRole('button', { name: 'Norsk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
  });

  it('saves nb to the profile and advances when Norwegian is picked', async () => {
    const user = userEvent.setup();
    render(PickLanguage);
    await user.click(screen.getByRole('button', { name: 'Norsk' }));
    expect(get(profile)?.language).toBe('nb');
    expect(get(route).name).toBe('onboarding/pickKidName');
  });

  it('saves en to the profile and advances when English is picked', async () => {
    const user = userEvent.setup();
    render(PickLanguage);
    await user.click(screen.getByRole('button', { name: 'English' }));
    expect(get(profile)?.language).toBe('en');
    expect(get(route).name).toBe('onboarding/pickKidName');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickLanguage.test.ts
```

Expected: tests fail (route doesn't advance — the stub never navigates).

- [ ] **Step 3: Implement PickLanguage**

Replace `/home/eivind/code/fumletone/src/routes/onboarding/PickLanguage.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import { updateProfile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
  import { locale } from '$lib/i18n';
  import type { Language } from '$lib/db/schema';

  async function pick(lang: Language) {
    await updateProfile({ language: lang });
    locale.set(lang);
    navigate({ name: 'onboarding/pickKidName' });
  }
</script>

<ScreenFrame>
  <h2 class="bilingual">
    <span>Velg språk</span>
    <span>·</span>
    <span>Pick a language</span>
  </h2>
  <div class="row">
    <BigButton onclick={() => pick('nb')}>{#snippet children()}Norsk{/snippet}</BigButton>
    <BigButton onclick={() => pick('en')}>{#snippet children()}English{/snippet}</BigButton>
  </div>
</ScreenFrame>

<style>
  .bilingual {
    display: flex;
    gap: var(--space-2);
    font-size: 1.6rem;
    font-weight: 500;
    margin: 0;
  }
  .row {
    display: flex;
    gap: var(--space-3);
  }
</style>
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickLanguage.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "onboarding: pick language screen"
```

---

## Task 11: Onboarding — Pick Kid Name

**Files:**
- Replace: `src/routes/onboarding/PickKidName.svelte`
- Test: `tests/component/onboarding/PickKidName.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/onboarding/PickKidName.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import PickKidName from '$routes/onboarding/PickKidName.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile, updateProfile } from '$lib/stores/profile';
import { route, _resetRouteForTests } from '$lib/stores/route';
import { initI18n } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await updateProfile({ language: 'en' });
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
});

describe('PickKidName screen', () => {
  it('skips with empty name and advances', async () => {
    const user = userEvent.setup();
    render(PickKidName);
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(get(profile)?.kidName).toBe('');
    expect(get(route).name).toBe('onboarding/customizeFumling');
  });

  it('saves typed name and advances', async () => {
    const user = userEvent.setup();
    render(PickKidName);
    await user.type(screen.getByPlaceholderText('Type your name'), 'Sara');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(get(profile)?.kidName).toBe('Sara');
    expect(get(route).name).toBe('onboarding/customizeFumling');
  });

  it('Next is disabled when input is empty', () => {
    render(PickKidName);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickKidName.test.ts
```

Expected: FAIL — stub doesn't have inputs.

- [ ] **Step 3: Implement PickKidName**

Replace `/home/eivind/code/fumletone/src/routes/onboarding/PickKidName.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import { updateProfile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
  import { _ } from '$lib/i18n';

  let typed = $state('');

  async function next() {
    await updateProfile({ kidName: typed.trim() });
    navigate({ name: 'onboarding/customizeFumling' });
  }

  async function skip() {
    await updateProfile({ kidName: '' });
    navigate({ name: 'onboarding/customizeFumling' });
  }
</script>

<ScreenFrame>
  <h2>{$_('onboarding.pickKidName.prompt')}</h2>
  <!-- svelte-ignore a11y_autofocus -->
  <input
    type="text"
    placeholder={$_('onboarding.pickKidName.placeholder')}
    bind:value={typed}
    autofocus
    maxlength="20"
  />
  <div class="row">
    <BigButton variant="ghost" onclick={skip}>
      {#snippet children()}{$_('onboarding.pickKidName.skip')}{/snippet}
    </BigButton>
    <BigButton onclick={next} disabled={typed.trim().length === 0}>
      {#snippet children()}{$_('onboarding.pickKidName.next')}{/snippet}
    </BigButton>
  </div>
</ScreenFrame>

<style>
  input {
    font-size: 1.6rem;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-fg);
    background: var(--color-bg);
    color: var(--color-fg);
    text-align: center;
    min-width: 320px;
  }
  .row { display: flex; gap: var(--space-3); }
  h2 { margin: 0; font-size: 1.6rem; }
</style>
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickKidName.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "onboarding: pick kid name screen"
```

---

## Task 12: Onboarding — Customize Fumling

**Files:**
- Replace: `src/routes/onboarding/CustomizeFumling.svelte`
- Test: `tests/component/onboarding/CustomizeFumling.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/onboarding/CustomizeFumling.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import CustomizeFumling from '$routes/onboarding/CustomizeFumling.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile, updateProfile } from '$lib/stores/profile';
import { route, _resetRouteForTests } from '$lib/stores/route';
import { initI18n } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await updateProfile({ language: 'en' });
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
});

describe('CustomizeFumling screen', () => {
  it('renders four colors and four features', () => {
    render(CustomizeFumling);
    expect(screen.getByRole('button', { name: 'Sage' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rose' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sand' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sky' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Striped sock' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Round eyes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Long ears' })).toBeInTheDocument();
  });

  it('picking a color updates the avatar and persists on Next', async () => {
    const user = userEvent.setup();
    render(CustomizeFumling);
    await user.click(screen.getByRole('button', { name: 'Rose' }));
    await user.click(screen.getByRole('button', { name: 'Hat' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(get(profile)?.fumlingColor).toBe('rose');
    expect(get(profile)?.fumlingFeatures).toEqual(['hat']);
    expect(get(route).name).toBe('onboarding/pickInstrument');
  });

  it('caps features at 2 (third pick is ignored)', async () => {
    const user = userEvent.setup();
    render(CustomizeFumling);
    await user.click(screen.getByRole('button', { name: 'Hat' }));
    await user.click(screen.getByRole('button', { name: 'Round eyes' }));
    await user.click(screen.getByRole('button', { name: 'Long ears' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(get(profile)?.fumlingFeatures).toEqual(['hat', 'roundEyes']);
  });

  it('clicking an already-selected feature deselects it', async () => {
    const user = userEvent.setup();
    render(CustomizeFumling);
    await user.click(screen.getByRole('button', { name: 'Hat' }));
    await user.click(screen.getByRole('button', { name: 'Hat' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(get(profile)?.fumlingFeatures).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/CustomizeFumling.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement CustomizeFumling**

Replace `/home/eivind/code/fumletone/src/routes/onboarding/CustomizeFumling.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { updateProfile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
  import { _ } from '$lib/i18n';
  import type { FumlingColor, FumlingFeature } from '$lib/db/schema';

  const COLORS: FumlingColor[] = ['sage', 'rose', 'sand', 'sky'];
  const FEATURES: FumlingFeature[] = ['hat', 'stripedSock', 'roundEyes', 'longEars'];

  let chosenColor = $state<FumlingColor>('sage');
  let chosenFeatures = $state<FumlingFeature[]>([]);

  function toggleFeature(f: FumlingFeature) {
    if (chosenFeatures.includes(f)) {
      chosenFeatures = chosenFeatures.filter((x) => x !== f);
    } else if (chosenFeatures.length < 2) {
      chosenFeatures = [...chosenFeatures, f];
    }
  }

  async function next() {
    await updateProfile({ fumlingColor: chosenColor, fumlingFeatures: chosenFeatures });
    navigate({ name: 'onboarding/pickInstrument' });
  }
</script>

<ScreenFrame>
  <h2>{$_('onboarding.customize.prompt')}</h2>
  <FumlingAvatar color={chosenColor} features={chosenFeatures} instrument="violin" size={220} />
  <div class="group">
    <p class="label">{$_('onboarding.customize.colorLabel')}</p>
    <div class="row">
      {#each COLORS as c (c)}
        <button
          class="swatch"
          class:active={chosenColor === c}
          style:background={`var(--color-${c})`}
          aria-label={$_(`onboarding.customize.color.${c}`)}
          onclick={() => (chosenColor = c)}
        ></button>
      {/each}
    </div>
  </div>
  <div class="group">
    <p class="label">{$_('onboarding.customize.featuresLabel')}</p>
    <div class="row">
      {#each FEATURES as f (f)}
        <button
          class="feature"
          class:active={chosenFeatures.includes(f)}
          aria-label={$_(`onboarding.customize.feature.${f}`)}
          onclick={() => toggleFeature(f)}
        >
          {$_(`onboarding.customize.feature.${f}`)}
        </button>
      {/each}
    </div>
  </div>
  <BigButton onclick={next}>{#snippet children()}{$_('onboarding.customize.next')}{/snippet}</BigButton>
</ScreenFrame>

<style>
  h2 { margin: 0; font-size: 1.6rem; }
  .group { display: flex; flex-direction: column; gap: var(--space-1); align-items: center; }
  .label { margin: 0; opacity: 0.7; }
  .row { display: flex; gap: var(--space-2); }
  .swatch {
    width: 64px; height: 64px; border-radius: 50%; border: 4px solid transparent;
    cursor: pointer;
  }
  .swatch.active { border-color: var(--color-fg); }
  .feature {
    min-height: 56px; padding: 0 var(--space-3); border-radius: var(--radius-lg);
    border: 2px solid var(--color-fg); background: var(--color-bg); cursor: pointer;
    font-size: 1.1rem; font-weight: 500;
  }
  .feature.active { background: var(--color-fg); color: var(--color-bg); }
</style>
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/CustomizeFumling.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "onboarding: customize fumling (color + 0-2 features)"
```

---

## Task 13: Onboarding — Pick Instrument

**Files:**
- Replace: `src/routes/onboarding/PickInstrument.svelte`
- Test: `tests/component/onboarding/PickInstrument.test.ts`

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/onboarding/PickInstrument.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import PickInstrument from '$routes/onboarding/PickInstrument.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile, updateProfile } from '$lib/stores/profile';
import { route, _resetRouteForTests } from '$lib/stores/route';
import { initI18n } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await updateProfile({ language: 'en' });
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
});

describe('PickInstrument screen', () => {
  it('first tap previews, second tap confirms (violin)', async () => {
    const user = userEvent.setup();
    const { container } = render(PickInstrument);
    await user.click(screen.getByRole('button', { name: 'Violin' }));
    // preview only — not yet committed
    expect(get(profile)?.instrument).not.toBe('violin');
    expect(get(route).name).toBe('onboarding/pickInstrument');
    expect(container.querySelector('[data-part="violin"]')).not.toBeNull();
    // second tap confirms
    await user.click(screen.getByRole('button', { name: 'Violin' }));
    expect(get(profile)?.instrument).toBe('violin');
    expect(get(route).name).toBe('onboarding/nameFumling');
  });

  it('first tap previews, second tap confirms (cello)', async () => {
    const user = userEvent.setup();
    const { container } = render(PickInstrument);
    await user.click(screen.getByRole('button', { name: 'Cello' }));
    expect(get(profile)?.instrument).not.toBe('cello');
    expect(container.querySelector('[data-part="cello"]')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cello' }));
    expect(get(profile)?.instrument).toBe('cello');
    expect(get(route).name).toBe('onboarding/nameFumling');
  });

  it('switching preview between violin and cello does not commit', async () => {
    const user = userEvent.setup();
    render(PickInstrument);
    await user.click(screen.getByRole('button', { name: 'Violin' }));
    await user.click(screen.getByRole('button', { name: 'Cello' }));
    expect(get(profile)?.instrument).not.toBe('violin');
    expect(get(profile)?.instrument).not.toBe('cello');
    expect(get(route).name).toBe('onboarding/pickInstrument');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickInstrument.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement PickInstrument**

Replace `/home/eivind/code/fumletone/src/routes/onboarding/PickInstrument.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { updateProfile, profile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
  import { _ } from '$lib/i18n';
  import type { Instrument } from '$lib/db/schema';

  // Two-tap flow (touch-friendly: iPad has no hover):
  // first tap previews the instrument, second tap on the same one commits.
  let preview = $state<Instrument | null>(null);

  async function tap(i: Instrument) {
    if (preview === i) {
      await updateProfile({ instrument: i });
      navigate({ name: 'onboarding/nameFumling' });
    } else {
      preview = i;
    }
  }
</script>

<ScreenFrame>
  <h2>{$_('onboarding.pickInstrument.prompt')}</h2>
  <FumlingAvatar
    color={$profile?.fumlingColor ?? 'sage'}
    features={$profile?.fumlingFeatures ?? []}
    instrument={preview ?? 'violin'}
    size={240}
  />
  <div class="row">
    <BigButton
      variant={preview === 'violin' ? 'primary' : 'ghost'}
      onclick={() => tap('violin')}
    >
      {#snippet children()}{$_('onboarding.pickInstrument.violin')}{/snippet}
    </BigButton>
    <BigButton
      variant={preview === 'cello' ? 'primary' : 'ghost'}
      onclick={() => tap('cello')}
    >
      {#snippet children()}{$_('onboarding.pickInstrument.cello')}{/snippet}
    </BigButton>
  </div>
  {#if preview}
    <p class="hint">{$_('onboarding.pickInstrument.confirmHint')}</p>
  {/if}
</ScreenFrame>

<style>
  h2 { margin: 0; font-size: 1.6rem; max-width: 26ch; }
  .row { display: flex; gap: var(--space-3); }
  .hint { margin: 0; opacity: 0.7; font-size: 1rem; }
</style>
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/PickInstrument.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "onboarding: pick instrument (violin or cello)"
```

---

## Task 14: Onboarding — Name Fumling (final step)

**Files:**
- Replace: `src/routes/onboarding/NameFumling.svelte`
- Test: `tests/component/onboarding/NameFumling.test.ts`

This screen is the *last* onboarding step. On Next, set `onboardingCompletedAt` and navigate to `hub`.

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/onboarding/NameFumling.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import NameFumling from '$routes/onboarding/NameFumling.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile, updateProfile } from '$lib/stores/profile';
import { route, _resetRouteForTests } from '$lib/stores/route';
import { initI18n } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await updateProfile({ language: 'en' });
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
});

describe('NameFumling screen', () => {
  it('pre-fills with Fumly', () => {
    render(NameFumling);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Fumly');
  });

  it('saves the typed name, marks onboarding complete, and goes to hub', async () => {
    const user = userEvent.setup();
    render(NameFumling);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.clear(input);
    await user.type(input, 'Lull');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    const p = get(profile);
    expect(p?.fumlingName).toBe('Lull');
    expect(p?.onboardingCompletedAt).toBeInstanceOf(Date);
    expect(get(route).name).toBe('hub');
  });

  it('keeps Fumly if untouched', async () => {
    const user = userEvent.setup();
    render(NameFumling);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(get(profile)?.fumlingName).toBe('Fumly');
  });

  it('disables Next when input is blank', async () => {
    const user = userEvent.setup();
    render(NameFumling);
    await user.clear(screen.getByRole('textbox'));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/NameFumling.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement NameFumling**

Replace `/home/eivind/code/fumletone/src/routes/onboarding/NameFumling.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { updateProfile, profile } from '$lib/stores/profile';
  import { reset } from '$lib/stores/route';
  import { _ } from '$lib/i18n';

  let typed = $state('Fumly');

  async function next() {
    const trimmed = typed.trim();
    await updateProfile({
      fumlingName: trimmed,
      onboardingCompletedAt: new Date(),
    });
    reset({ name: 'hub' });
  }
</script>

<ScreenFrame>
  <h2>{$_('onboarding.nameFumling.prompt')}</h2>
  <FumlingAvatar
    color={$profile?.fumlingColor ?? 'sage'}
    features={$profile?.fumlingFeatures ?? []}
    instrument={$profile?.instrument ?? 'violin'}
    size={220}
  />
  <input
    type="text"
    placeholder={$_('onboarding.nameFumling.placeholder')}
    bind:value={typed}
    maxlength="20"
  />
  <BigButton onclick={next} disabled={typed.trim().length === 0}>
    {#snippet children()}{$_('onboarding.nameFumling.next')}{/snippet}
  </BigButton>
</ScreenFrame>

<style>
  h2 { margin: 0; font-size: 1.6rem; }
  input {
    font-size: 1.6rem;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    border: 2px solid var(--color-fg);
    background: var(--color-bg);
    color: var(--color-fg);
    text-align: center;
    min-width: 320px;
  }
</style>
```

(Uses `reset` rather than `navigate` so that `back` doesn't return into onboarding once it's complete.)

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/onboarding/NameFumling.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "onboarding: name fumling and complete onboarding"
```

---

## Task 15: Hub placeholder (Fumling Hollow lite)

**Files:**
- Replace: `src/routes/Hub.svelte`

The Hub in this plan is a placeholder. Plan 3 turns it into the illustrated Fumling Hollow with land doorways, idle animations, and reflections. For now: a centered scene with a greeting and the customized fumling, plus a settings affordance.

- [ ] **Step 1: Replace Hub.svelte**

Replace `/home/eivind/code/fumletone/src/routes/Hub.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import { profile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
  import { _ } from '$lib/i18n';

  const trimmedKidName = $derived(($profile?.kidName ?? '').trim());
  const displayName = $derived(trimmedKidName || $_('app.kidNameDefault'));
  const greeting = $derived($_('hub.greetingNamed', { values: { name: displayName } }));
</script>

<ScreenFrame>
  <button class="settings-affordance" aria-label="Settings" onclick={() => navigate({ name: 'settings' })}>
    ⚙
  </button>
  <h1 class="greeting">{greeting}</h1>
  <p class="subtitle">{$_('hub.subtitle')}</p>
  {#if $profile}
    <FumlingAvatar
      color={$profile.fumlingColor}
      features={$profile.fumlingFeatures}
      instrument={$profile.instrument}
      size={300}
    />
    <p class="fumling-name">{$profile.fumlingName}</p>
  {/if}
</ScreenFrame>

<style>
  .settings-affordance {
    position: fixed;
    top: var(--space-3);
    right: var(--space-3);
    width: 56px; height: 56px;
    border-radius: 50%;
    border: 2px solid var(--color-fg);
    background: var(--color-bg);
    font-size: 1.6rem;
    cursor: pointer;
  }
  .greeting { font-size: 2.4rem; margin: 0; }
  .subtitle { margin: 0; opacity: 0.7; font-size: 1.2rem; }
  .fumling-name {
    margin: 0;
    font-size: 1.4rem;
    font-style: italic;
    opacity: 0.8;
  }
</style>
```

- [ ] **Step 2: Type check + dev sanity**

```bash
cd /home/eivind/code/fumletone && npm run check && npm test
```

Expected: type check passes; all tests pass.

- [ ] **Step 3: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "hub: placeholder fumling hollow with greeting and customized fumling"
```

---

## Task 16: Settings screen

**Files:**
- Replace: `src/routes/Settings.svelte`
- Test: `tests/component/Settings.test.ts`

Settings allows: language switch, kid name edit, fumling rename, instrument re-pick, and a hold-to-confirm Reset. (Color/feature re-pick is intentionally deferred — see plan summary.)

- [ ] **Step 1: Write the failing test**

Create `/home/eivind/code/fumletone/tests/component/Settings.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { tick } from 'svelte';
import Settings from '$routes/Settings.svelte';
import { db } from '$lib/db/db';
import { loadProfile, profile, updateProfile } from '$lib/stores/profile';
import { route, navigate, _resetRouteForTests } from '$lib/stores/route';
import { initI18n, locale } from '$lib/i18n';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await updateProfile({
    kidName: 'Sara',
    language: 'en',
    fumlingName: 'Lull',
    fumlingColor: 'rose',
    fumlingFeatures: ['hat'],
    instrument: 'cello',
    onboardingCompletedAt: new Date(),
  });
  await loadProfile();
  await initI18n('en');
  _resetRouteForTests();
  // Mirror real navigation: kid reaches Settings via Hub → Settings
  navigate({ name: 'hub' });
  navigate({ name: 'settings' });
});

describe('Settings screen', () => {
  it('shows current language and switches to nb', async () => {
    const user = userEvent.setup();
    render(Settings);
    await user.click(screen.getByRole('button', { name: 'Norsk' }));
    await tick();
    expect(get(profile)?.language).toBe('nb');
    expect(get(locale)).toBe('nb');
  });

  it('back returns to hub', async () => {
    const user = userEvent.setup();
    render(Settings);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(get(route).name).toBe('hub');
  });

  it('switches fumling color', async () => {
    const user = userEvent.setup();
    render(Settings);
    // beforeEach seeds fumlingColor: 'rose'; pick 'sage'
    await user.click(screen.getByRole('button', { name: 'Sage' }));
    expect(get(profile)?.fumlingColor).toBe('sage');
  });

  it('toggles fumling features and caps at 2', async () => {
    const user = userEvent.setup();
    render(Settings);
    // beforeEach seeds fumlingFeatures: ['hat']
    await user.click(screen.getByRole('button', { name: 'Round eyes' }));
    expect(get(profile)?.fumlingFeatures).toEqual(['hat', 'roundEyes']);
    // Third pick is ignored due to 2-cap
    await user.click(screen.getByRole('button', { name: 'Long ears' }));
    expect(get(profile)?.fumlingFeatures).toEqual(['hat', 'roundEyes']);
    // Toggling an active one removes it
    await user.click(screen.getByRole('button', { name: 'Hat' }));
    expect(get(profile)?.fumlingFeatures).toEqual(['roundEyes']);
  });

  it('hold-to-confirm reset wipes profile and returns to splash', async () => {
    // Use real timers + a shortened HOLD duration via env var would be ideal,
    // but the simpler approach is real timers and a real wait — the hold is 2s.
    const user = userEvent.setup();
    render(Settings);
    const resetBtn = screen.getByRole('button', { name: 'Hold to reset' });
    await user.pointer({ keys: '[MouseLeft>]', target: resetBtn });
    // Wait past the hold threshold (HOLD_MS = 2000) plus a small buffer for the
    // async clearProfile() chain inside the timeout callback.
    await new Promise((r) => setTimeout(r, 2200));
    await user.pointer({ keys: '[/MouseLeft]', target: resetBtn });
    expect(get(profile)).toBeNull();
    expect(get(route).name).toBe('splash');
  }, 5000);
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/Settings.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement Settings**

Replace `/home/eivind/code/fumletone/src/routes/Settings.svelte`:

```svelte
<script lang="ts">
  import ScreenFrame from '$lib/components/ScreenFrame.svelte';
  import BigButton from '$lib/components/BigButton.svelte';
  import {
    profile,
    updateProfile,
    clearProfile,
    getProfileSnapshot,
  } from '$lib/stores/profile';
  import { back, reset } from '$lib/stores/route';
  import { _, locale } from '$lib/i18n';
  import type {
    Language,
    Instrument,
    FumlingColor,
    FumlingFeature,
  } from '$lib/db/schema';

  const HOLD_MS = 2000;
  const COLORS: FumlingColor[] = ['sage', 'rose', 'sand', 'sky'];
  const FEATURES: FumlingFeature[] = ['hat', 'stripedSock', 'roundEyes', 'longEars'];
  let holdTimer: ReturnType<typeof setTimeout> | null = null;

  async function setLanguage(l: Language) {
    await updateProfile({ language: l });
    locale.set(l);
  }

  async function setInstrument(i: Instrument) {
    await updateProfile({ instrument: i });
  }

  async function setColor(c: FumlingColor) {
    await updateProfile({ fumlingColor: c });
  }

  async function toggleFeature(f: FumlingFeature) {
    const current = getProfileSnapshot()?.fumlingFeatures ?? [];
    if (current.includes(f)) {
      await updateProfile({ fumlingFeatures: current.filter((x) => x !== f) });
    } else if (current.length < 2) {
      await updateProfile({ fumlingFeatures: [...current, f] });
    }
  }

  function startHold() {
    holdTimer = setTimeout(async () => {
      await clearProfile();
      reset({ name: 'splash' });
    }, HOLD_MS);
  }

  function cancelHold() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
  }
</script>

<ScreenFrame>
  <h2>{$_('settings.title')}</h2>

  <section>
    <p class="label">{$_('settings.language')}</p>
    <div class="row">
      <BigButton variant={$profile?.language === 'nb' ? 'primary' : 'ghost'} onclick={() => setLanguage('nb')}>
        {#snippet children()}Norsk{/snippet}
      </BigButton>
      <BigButton variant={$profile?.language === 'en' ? 'primary' : 'ghost'} onclick={() => setLanguage('en')}>
        {#snippet children()}English{/snippet}
      </BigButton>
    </div>
  </section>

  <section>
    <p class="label">{$_('settings.instrument')}</p>
    <div class="row">
      <BigButton variant={$profile?.instrument === 'violin' ? 'primary' : 'ghost'} onclick={() => setInstrument('violin')}>
        {#snippet children()}{$_('onboarding.pickInstrument.violin')}{/snippet}
      </BigButton>
      <BigButton variant={$profile?.instrument === 'cello' ? 'primary' : 'ghost'} onclick={() => setInstrument('cello')}>
        {#snippet children()}{$_('onboarding.pickInstrument.cello')}{/snippet}
      </BigButton>
    </div>
  </section>

  <section>
    <p class="label">{$_('settings.fumlingColor')}</p>
    <div class="row">
      {#each COLORS as c (c)}
        <button
          class="swatch"
          class:active={$profile?.fumlingColor === c}
          style:background={`var(--color-${c})`}
          aria-label={$_(`onboarding.customize.color.${c}`)}
          onclick={() => setColor(c)}
        ></button>
      {/each}
    </div>
  </section>

  <section>
    <p class="label">{$_('settings.fumlingFeatures')}</p>
    <div class="row">
      {#each FEATURES as f (f)}
        <button
          class="feature"
          class:active={$profile?.fumlingFeatures?.includes(f)}
          aria-label={$_(`onboarding.customize.feature.${f}`)}
          onclick={() => toggleFeature(f)}
        >
          {$_(`onboarding.customize.feature.${f}`)}
        </button>
      {/each}
    </div>
  </section>

  <section>
    <BigButton onclick={back}>{#snippet children()}{$_('settings.back')}{/snippet}</BigButton>
  </section>

  <section>
    <button
      class="reset"
      onpointerdown={startHold}
      onpointerup={cancelHold}
      onpointerleave={cancelHold}
      onpointercancel={cancelHold}
    >
      {$_('settings.resetConfirm')}
    </button>
  </section>
</ScreenFrame>

<style>
  h2 { margin: 0; font-size: 1.6rem; }
  section { display: flex; flex-direction: column; gap: var(--space-1); align-items: center; }
  .label { margin: 0; opacity: 0.7; }
  .row { display: flex; gap: var(--space-2); }
  .swatch {
    width: 56px; height: 56px; border-radius: 50%; border: 4px solid transparent;
    cursor: pointer;
  }
  .swatch.active { border-color: var(--color-fg); }
  .feature {
    min-height: 48px; padding: 0 var(--space-2); border-radius: var(--radius-lg);
    border: 2px solid var(--color-fg); background: var(--color-bg); cursor: pointer;
    font-size: 1rem; font-weight: 500;
  }
  .feature.active { background: var(--color-fg); color: var(--color-bg); }
  .reset {
    min-height: var(--tap-min);
    padding: 0 var(--space-3);
    border-radius: var(--radius-lg);
    border: 2px dashed var(--color-accent);
    background: transparent;
    color: var(--color-accent);
    font-size: 1.1rem;
    cursor: pointer;
  }
</style>
```

(Plan 1 ships kid-name and fumling-name editing controls in Settings as part of completeness. Add minimal text inputs, mirroring the onboarding screens.)

Append the following sections inside `Settings.svelte`'s `<ScreenFrame>` (between the Instrument section and the Back section):

```svelte
  <section>
    <p class="label">{$_('settings.kidName')}</p>
    <input
      type="text"
      value={$profile?.kidName ?? ''}
      maxlength="20"
      onchange={(e) => updateProfile({ kidName: (e.target as HTMLInputElement).value.trim() })}
    />
  </section>

  <section>
    <p class="label">{$_('settings.fumlingName')}</p>
    <input
      type="text"
      value={$profile?.fumlingName ?? 'Fumly'}
      maxlength="20"
      onchange={(e) => updateProfile({ fumlingName: (e.target as HTMLInputElement).value.trim() || 'Fumly' })}
    />
  </section>
```

And add the input style to the style block:

```css
input {
  font-size: 1.2rem;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-fg);
  background: var(--color-bg);
  color: var(--color-fg);
  text-align: center;
  min-width: 240px;
}
```

(Color and feature re-pick are now in Settings — same interactions as onboarding's customize screen, with the same 2-feature cap.)

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/Settings.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "settings: language, instrument, names, hold-to-reset"
```

---

## Task 17: E2E happy-path onboarding

**Files:**
- Create: `tests/e2e/onboarding.spec.ts`

- [ ] **Step 1: Write the E2E test**

Create `/home/eivind/code/fumletone/tests/e2e/onboarding.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('first-launch onboarding', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      indexedDB.deleteDatabase('fumletone');
    });
  });

  test('completes the full flow and lands in the hub', async ({ page }) => {
    await page.goto('/');

    // Splash
    await expect(page.getByText(/Tap to begin|Trykk for å begynne/)).toBeVisible();
    await page.getByRole('button', { name: 'Start' }).click();

    // Pick Language
    await page.getByRole('button', { name: 'English' }).click();

    // Pick Kid Name
    await page.getByPlaceholder('Type your name').fill('Sara');
    await page.getByRole('button', { name: 'Next' }).click();

    // Customize Fumling
    await page.getByRole('button', { name: 'Rose' }).click();
    await page.getByRole('button', { name: 'Hat' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Pick Instrument (two-tap: preview, then confirm)
    await page.getByRole('button', { name: 'Cello' }).click();
    await page.getByRole('button', { name: 'Cello' }).click();

    // Name Fumling
    await page.getByRole('textbox').fill('Lull');
    await page.getByRole('button', { name: 'Next' }).click();

    // Hub
    await expect(page.getByRole('heading', { name: 'Hi, Sara!' })).toBeVisible();
    await expect(page.getByText('Lull')).toBeVisible();
  });

  test('reload after onboarding skips straight to hub', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.getByRole('button', { name: 'Next' }).click(); // customize defaults
    await page.getByRole('button', { name: 'Violin' }).click(); // preview
    await page.getByRole('button', { name: 'Violin' }).click(); // confirm
    await page.getByRole('button', { name: 'Next' }).click(); // accept Fumly
    await expect(page.getByText(/Welcome to The Fumling Hollow/)).toBeVisible();
    // Skipped name: greeting falls back to the brand default "Fumle"
    await expect(page.getByRole('heading', { name: 'Hi, Fumle!' })).toBeVisible();

    await page.reload();
    await expect(page.getByText(/Welcome to The Fumling Hollow/)).toBeVisible();
    await expect(page.getByText(/Tap to begin/)).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run the E2E**

```bash
cd /home/eivind/code/fumletone && npm run test:e2e
```

Expected: 2 tests pass on iPad device profile.

- [ ] **Step 3: Run all tests + type check**

```bash
cd /home/eivind/code/fumletone && npm run check && npm test && npm run test:e2e
```

Expected: type check passes; all unit/component tests pass; both E2E tests pass.

- [ ] **Step 4: Commit**

```bash
cd /home/eivind/code/fumletone && git add -A && git commit -m "test: e2e happy-path onboarding"
```

---

## Task 18: PWA install verification on iPad Safari

This is a manual verification task — no code, but it's how we know Plan 1 actually shipped.

**Important: iOS Safari only registers a service worker over `https://` or `localhost`.** A plain `http://<LAN-IP>:4173/` URL will install as a home-screen icon but the SW will never activate, so the airplane-mode test would silently fail. Steps 1–4 below set up local HTTPS via [mkcert](https://github.com/FiloSottile/mkcert) so the iPad sees a trusted cert.

- [ ] **Step 1: Install mkcert and create a local CA**

```bash
# install (Ubuntu)
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64 && sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# create a local CA (one-time)
mkcert -install
```

Expected: `mkcert -install` prints "The local CA is now installed in the system trust store!"

- [ ] **Step 2: Generate a cert for your LAN IP**

```bash
LAN_IP=$(hostname -I | awk '{print $1}')
echo "LAN IP is $LAN_IP"
mkdir -p /home/eivind/code/fumletone/.certs
cd /home/eivind/code/fumletone/.certs && mkcert "$LAN_IP" localhost 127.0.0.1
ls /home/eivind/code/fumletone/.certs
```

Expected: two PEM files written, e.g. `192.168.1.42+2.pem` and `192.168.1.42+2-key.pem`. Note the LAN IP — you'll use it on the iPad.

- [ ] **Step 3: Add `.certs/` to `.gitignore`**

Edit `/home/eivind/code/fumletone/.gitignore` and append a line:

```
.certs
```

(The cert files are machine-local; never commit them.)

- [ ] **Step 4: Trust the mkcert root CA on the iPad**

On the dev machine:

```bash
mkcert -CAROOT
```

Copy the `rootCA.pem` from that directory to the iPad — easiest path is AirDrop, or serve it briefly via `python3 -m http.server` from the CAROOT directory and download from Safari on the iPad. Then on the iPad: Settings → General → VPN & Device Management → install the profile → Settings → General → About → Certificate Trust Settings → enable full trust for the mkcert root CA.

(Without this step the iPad will refuse the cert and the SW won't register.)

- [ ] **Step 5: Build and preview over HTTPS**

```bash
cd /home/eivind/code/fumletone && npm run build
LAN_IP=$(hostname -I | awk '{print $1}')
npx vite preview \
  --host 0.0.0.0 \
  --port 4173 \
  --https \
  --https.cert .certs/${LAN_IP}+2.pem \
  --https.key  .certs/${LAN_IP}+2-key.pem &
```

Expected: preview server prints `Local: https://localhost:4173/` and `Network: https://<LAN-IP>:4173/`. (If `vite preview` doesn't accept `--https.cert` flags on the installed Vite version, fall back to a tiny `vite.preview.config.ts` that sets `preview.https = { cert, key }` and run `npx vite preview --config vite.preview.config.ts`.)

- [ ] **Step 6: On the iPad, navigate to `https://<LAN-IP>:4173/`**

Expected: page loads with no certificate warning (because mkcert's CA is trusted). Splash visible.

- [ ] **Step 7: Add to Home Screen**

Tap Safari's Share button → "Add to Home Screen" → confirm. Icon appears with the placeholder Fumletone "F" icon.

- [ ] **Step 8: Launch the installed PWA**

Tap the home-screen icon. Expected: app opens fullscreen (no Safari chrome) in landscape orientation, splash visible.

- [ ] **Step 9: Complete onboarding, force-quit, then re-launch**

Expected: onboarding completes; on relaunch the app boots straight into the Hub with the configured fumling and greeting visible.

- [ ] **Step 10: Confirm the service worker registered**

In Safari on the iPad (not the installed PWA): open the same `https://<LAN-IP>:4173/` URL → connect Web Inspector from the dev Mac (Settings → Safari → Advanced → Web Inspector on iPad; then Develop menu on Mac) → Storage → Service Workers — confirm a worker is listed for the origin. (If you don't have a Mac handy, skip this step and rely on Step 11.)

- [ ] **Step 11: Toggle airplane mode and re-launch the installed PWA**

Expected: app still loads (service worker serves cached shell). Onboarding-completed state is intact. If it shows a "no internet" error instead, the SW didn't register — likely the cert wasn't fully trusted on the iPad. Revisit Step 4.

- [ ] **Step 12: Document any issues**

If anything fails, file the issues in `docs/superpowers/issues/2026-05-07-foundation-onboarding-issues.md` rather than silently fixing — the user wants a clean record of what didn't work first time.

- [ ] **Step 13: Stop the preview server and commit any docs**

```bash
kill %1 2>/dev/null; cd /home/eivind/code/fumletone && git add -A && git commit --allow-empty -m "verify: ipad install + offline launch"
```

---

## Self-review (executed by the planner; not a runtime task)

- **Spec coverage check.** Spec → tasks: PWA scaffold (T1, T3) ✓ · TS+Svelte+Vite (T1) ✓ · i18n NO+EN parity (T5) ✓ · Dexie local-first storage with no analytics (T4) ✓ · Tone.js init (T6) ✓ · Onboarding 7-step flow: splash (T9) → pick language (T10) → pick kid name with skip + "Fumle" default (T11) → customize fumling color+features (T12) → pick instrument (T13) → name fumling with Fumly default (T14) → land in hub (T15) ✓ · Settings with **all** onboarding choices editable (language, kid name, fumling name, color, features, instrument) + hold-to-reset (T16) ✓ · iPad PWA install (T3, T18) ✓.
- **Out of Plan 1 (and intentionally so):** composer/scrapbook/notation (Plan 2), illustrated hub + lands + encounters + soft gating (Plan 3), encounter content (Plan 4), voice acting + animation polish (Plan 5).
- **Type consistency check.** `KidProfile`, `Language`, `Instrument`, `FumlingColor`, `FumlingFeature`, `Route` defined once in `src/lib/db/schema.ts` (T4, extended in T7). `getProfile` / `saveProfile` / `resetProfile` referenced consistently from T4 onward. `loadProfile` / `updateProfile` / `clearProfile` defined in T7 and used identically by T10–T16.
- **Placeholder scan.** No "TBD" / "implement later". Every step contains the actual code. Two unavoidable real placeholders, called out explicitly: PWA icons in T3 (real icons land in Plan 5), and the Hub scene in T15 (illustrated hub lands in Plan 3). Both have explicit shipping-criteria so they are testable as-is in Plan 1.

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-05-07-foundation-onboarding.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session with checkpoints for review.

Which approach?
