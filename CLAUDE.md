# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

**Pre-implementation.** This repo contains the spec, the implementation plans, and the GitHub-issue projection of those plans — there is no `src/` yet. The first runnable code lands when issue #3 (Plan 1 Task 1) is implemented.

Once Plan 1 Task 1 ships, these commands exist:

```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run preview      # serve the build (uses --host so an iPad on the LAN can hit it)
npm run check        # svelte-check / TypeScript — must pass before every commit
npm run test         # Vitest one-shot
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright (one happy-path E2E per plan)
```

Single-test selection follows Vitest/Playwright conventions: `npm test -- tests/unit/stores/route.test.ts` or `npm run test:e2e -- tests/e2e/onboarding.spec.ts`.

## How work is organised

The project deliberately uses a **spec → plan → GitHub issues** chain instead of a backlog:

1. **Spec** — `docs/superpowers/specs/2026-05-07-fumletone-design.md` is the canonical source for naming, structure, and pedagogy. Companion specs (`*-composer-scrapbook-design.md`, name-decision) feed into it.
2. **Plans** — `docs/superpowers/plans/2026-05-07-foundation-onboarding.md` (Plan 1) and `2026-05-07-composer-scrapbook.md` (Plan 2). Each plan is task-numbered, TDD-disciplined, with verbatim code in every step. Plans 3–5 are not yet written; do not pre-write them — see "Plans 3–5" below.
3. **GitHub issues #1–#37** on `eivamu/fumletone` are a verbatim projection of Plans 1+2 designed to be self-contained. An implementer should be able to work from issues alone without reading the plan files. **If you patch a plan file, patch the matching issue body too** (or the issues drift from the source).

Issue map:
- **#1** — project context & principles (read first)
- **#2** — Plan 1 epic, **#3..#20** — Plan 1 Tasks 1–18
- **#21** — Plan 2 epic, **#22..#37** — Plan 2 Tasks 1–16

## Load-bearing rules (override defaults)

These come from the spec and are not negotiable:

1. **Real notation always.** Wherever notation appears it is real Western notation — real clefs, real note values, real names (C–B), real accidentals. **No colored-block substitutes, no number systems, no "kid-friendly" simplifications.** This is the brand's whole pedagogy.
2. **No judgment, no scoring.** No stars, streaks, levels, points, completion bars, or "best." Progress is observable only through artifacts and through the fumling's relational reflections.
3. **Equal NO + EN.** Norwegian (Bokmål — locale code `nb`) and English ship in the same commit, with parallel evocative weight. **i18n keys are nested objects, never flat dotted strings.**
4. **iPad / touch-only.** No `onmouseenter`, no hover, no mouse-position assumptions. All interaction goes through `pointer` events and `click`. Plan 1 already hit this bug once; do not repeat it.
5. **No URL routing.** A hand-rolled in-memory `route` store with `navigate` / `back` / `reset` drives screen transitions. Kids never see URLs.
6. **No back affordance during onboarding.** Onboarding screens (#12..#16) are forward-only. `back()` exists for Hub ↔ Settings but not within onboarding. (This rule does NOT extend to composer/scrapbook — those are normal flows.)
7. **Local-first only.** IndexedDB via Dexie. No accounts, no cloud sync, no analytics, no telemetry, no third-party tracking, no network calls.
8. **Voice scripts never name people.** Voice acting (recorded once per language in Plan 5) must use "you" and "we" — never the kid's name or the fumling's name (both are user-chosen). On-screen *text* renders both names live.

## Architecture (once Plans 1+2 are implemented)

**Stack:** TypeScript 5 + Svelte 5 + Vite 5, PWA via `vite-plugin-pwa` (Workbox), Dexie 4 over IndexedDB, `svelte-i18n`, Tone.js 14, **VexFlow 4** for staff rendering. Vitest + `@testing-library/svelte` + jsdom for unit/component, Playwright for one happy-path E2E per plan, `fake-indexeddb` for Dexie-in-jsdom.

**Two halves of the app:**
- **Discover** (`Oppdag`) — the curriculum side. Plan 1 ships a placeholder Hub; Plan 3 turns it into the illustrated Fumling Hollow with lands and encounters.
- **Make** (`Lag`) — the composition workshop. Plan 2 ships the real-notation staff editor.

**Data model (singleton + collection):**
- `profile` table: a single Dexie row (`id: 1`) holding the kid's `KidProfile` (language, kid name, fumling color/features/name, instrument, onboarding completion).
- `compositions` table (Plan 2 schema v2): one row per saved composition, with `notes: NotePlacement[]`. Auto-saved on every gesture; the first note placed in a fresh staff creates the row.

**State flow:** Svelte stores wrap the Dexie tables. `profile.ts` and `currentComposition.ts` persist on change. The in-memory `route` store drives `Router.svelte`, which is a `{#switch $route.name}` over the `Route` discriminated union (defined in `db/schema.ts`).

**Audio model (Plan 2):** Tone.js is initialized lazily on first user gesture. An `InstrumentVoice` interface (`playNote`, `playSequence`, `setLoop`, `ready`) has two implementations — `synthVoice` (Tone.PluckSynth, ships active in Plan 2) and `samplerVoice` (Tone.Sampler with empty manifests in Plan 2; Plan 5 fills them with CC-licensed violin/cello samples and flips one default).

**Notation model (Plan 2):** VexFlow renders the staff in the kid's clef (treble for violinist, bass for cellist — and the cellist stays bass-only across all of v1). The same `Notation.svelte` component renders interactively in the composer and read-only as scrapbook tile thumbnails. A pure-JS gesture state machine (`notation/gestures.ts`) handles tap / double-tap / long-press disambiguation outside Svelte for testability.

## Workflow conventions

- **TDD throughout.** Every task issue is a tests-first slice: failing test → implementation → green → commit.
- **One commit per task** at minimum. Some tasks list intermediate commits inside their Steps; preserve those exactly.
- **`npm run check` must be green before every commit.** Strict TS config — `noUnusedLocals: true` is on; an unused import is a build error, not a warning.
- **No `any`.** The canonical types in each plan's epic are the single source of truth — copy them into `schema.ts` verbatim and reference them.
- **One commit, two languages.** Every new UI string ships in `nb` and `en` together. Never "translate later."

## Plans 3–5

Not yet written, **and intentionally so.** Plans 3 (illustrated lands + encounters), 4 (encounter content), 5 (voice + animation + real samples) depend on decisions that should come from running Plans 1+2 on an actual iPad — soft-gating thresholds, encounter feel, sample-quality testing. Do not pre-write these plans on session context alone; they need play data first.
