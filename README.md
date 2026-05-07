# Fumletone

A music-theory app for kids, built primarily for two daughters (ages 7 and 10) on iPad. The kid genuinely learns real music theory — pitch, rhythm, intervals, scales, real notation — but never through instruction. Concepts are encountered through play with a fumbling companion (a *fumling*) who finds music by accident. There are no scores, streaks, or judgments.

The brand thesis: *fumling* is how music gets found. The mascot fumbles. The kid fumbles. The app never punishes trial-and-error.

## Status

**Pre-implementation.** No `src/` yet. The work is broken into two plans:

| Plan | Scope | Tracking |
|---|---|---|
| Plan 1 — Foundation & Onboarding | Installable PWA, onboarding flow, placeholder Hub, Settings | issues [#2..#20](../../issues?q=is%3Aissue+label%3Aplan-1) |
| Plan 2 — Composer & Scrapbook | Real-notation staff editor, scrapbook, two-halves home, audio | issues [#21..#37](../../issues?q=is%3Aissue+label%3Aplan-2) |

Each task is a small TDD-disciplined slice with tests first, implementation second, one commit at the end. Start at issue [#1](../../issues/1) for project-wide context that applies to every task.

Plans 3–5 (illustrated lands & encounters, encounter content, voice + animations + real instrument samples) are deliberately deferred until Plans 1+2 are running on a real iPad and have play-data to design against.

## Stack

TypeScript 5 · Svelte 5 · Vite · `vite-plugin-pwa` (Workbox) · Dexie 4 (IndexedDB) · `svelte-i18n` · Tone.js 14 · VexFlow 4 · Vitest + `@testing-library/svelte` · Playwright

Local-first. No accounts, no cloud sync, no analytics, no telemetry, no network calls.

## Audience and constraints

- **Primary users:** the author's two daughters. One iPad each — no multi-kid mode.
- **Languages:** Norwegian Bokmål (`nb`) and English (`en`), shipped in parity. One active at a time, switchable in Settings.
- **Instruments:** violin and cello. The kid's choice flows through clef rendering, default timbre, and (in Plan 3) a dedicated instrument-specific land.
- **iPad-only.** Touch interaction only — no hover, no mouse, no keyboard input expected.

## Repository layout

```
docs/superpowers/
├── specs/         canonical design specs (read first if working on a plan)
└── plans/         per-version implementation plans (Plan 1 = foundation, Plan 2 = composer)
hooks/             tracked git hooks; activate with `git config core.hooksPath hooks`
CLAUDE.md          guidance for Claude Code instances working on this repo
```

`main` is protected: every change goes through a PR. The `hooks/pre-push` script rejects direct pushes to `main` locally for a clearer error than the server-side ruleset rejection.

The plan files live here in source form, but the GitHub issues are designed to be **self-contained** — an implementer should be able to work from the issues alone, without reading the plans. If a plan file is patched, the corresponding issue body is patched too.

## Pedagogical principles (load-bearing)

These shape every design and code decision:

1. **Real notation, never alternatives.** Real clefs, real note values, real names (C–B), real accidentals. No colored-block substitutes, no number systems, no "kid-friendly" simplifications.
2. **Real instrument support from day one.** v1 supports violin and cello.
3. **No judgment, no scoring.** No stars, streaks, levels, points, or completion bars.
4. **Always sounds good.** The composer guarantees no clipping or harsh transients. It does not auto-correct "wrong" notes — mistakes belong; ugliness does not.
5. **Equally Norwegian and English.** Every visible string and every spoken line exists in both languages with parallel evocative weight.
6. **Fumle / fumble as the brand thesis.** The mascot fumbles. The kid fumbles. The app never punishes trial-and-error.

## Out of scope (v1)

Multi-kid profiles, parent dashboards, cloud sync, accounts, in-app purchases, ads, social features, microphone input, MIDI input, sheet-music export, App Store distribution. Some are candidates for v1.5+ or v2; many are deliberately never.

## License

Not yet licensed. Treat as all rights reserved.
