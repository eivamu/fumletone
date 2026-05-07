# Plan 2 — Composer & Scrapbook Design Spec

**Date:** 2026-05-07
**Status:** Approved (ready for implementation planning)
**Companion docs:**
- [Fumletone Design Spec (canonical, updated 2026-05-07)](./2026-05-07-fumletone-design.md)
- [Plan 1 — Foundation & Onboarding](../plans/2026-05-07-foundation-onboarding.md)

## Overview

Plan 2 builds the **composer**, the **scrapbook**, and the supporting
real-notation rendering and audio engine on top of the Plan 1 foundation
(splash → onboarding → placeholder Hub). The kid leaves Plan 1's hub and
can now make music.

**The single load-bearing experience this plan delivers:** the kid
arrives in the Hub, walks through a doorway into the Make side, taps a
note onto a real staff, hears it played back in their own instrument's
voice, and discovers that the thing they just made is — already, from
the first tap — real notation. They can keep adding, hear it loop, and
find it later in their scrapbook with a name like "Tirsdagens tone."

Everything else in this plan exists to make that single moment land.

## Scope

### In scope (this plan ships)

- **Two-halves home screen.** The Plan 1 Hub becomes the Discover
  /Oppdag side (Fumling Hollow placeholder, unchanged from Plan 1). A
  new Make/Lag side hosts the composer. Doorways between the two halves
  in each direction. Persistent **Scrapbook** corner icon on both
  halves.
- **Composer.** Real-notation staff editor as described in the canonical
  spec. Single staff, kid's clef, 1st-position pitch range, C major
  naturals + per-note accidentals via gesture, monophonic, 4 measures of
  4/4, durations limited to quarter/half/whole/eighth, no rests.
- **Gesture set.** Tap-empty-to-place; single-tap-cycles-duration;
  double-tap-cycles-accidental; long-press-grabs-then-drag-to-delete-or-
  re-pitch.
- **Playback.** Play/stop button, loop toggle, fixed 90 bpm. Per-note
  preview audio on placement, cycle, and grab-drag.
- **Audio engine.** Tone.Sampler-shaped abstraction with the kid's
  instrument as the only voice. Plan 2 ships with a Tone.Synth-backed
  implementation (string-flavoured: PluckSynth or AMSynth, tuned to feel
  string-ish). The asset loader and SW cache are wired such that Plan 5
  drops sample files into a known folder and flips one flag, no
  refactor.
- **Real-notation rendering.** VexFlow renders the composition staff
  live in the composer, and renders staff thumbnails in the scrapbook.
- **Scrapbook.** Two sections in the data model — *Things I made / Det
  jeg har laget* and *Things we found / Det vi har funnet*. Plan 2 hides
  the "Things we found" section entirely until it has content (Plan 3+).
  Tile list of saved compositions, newest-first, with a small staff
  thumbnail and the auto-generated title. Tap a tile to open in the
  composer. Long-press to rename.
- **Auto-save.** Compositions persist to IndexedDB on every gesture.
  First note placed in a fresh staff creates a new scrapbook entry.
  Empty drafts never enter the scrapbook.
- **New-composition flow.** A `+` affordance in the composer opens a
  fresh empty staff. Hidden when the current draft is already empty.
- **First-touch hint.** First-ever composer entry: a small fumling
  silhouette gestures toward an empty staff line; one-shot, dismissed on
  first tap, never shown again.
- **i18n.** All new strings in NB and EN with parallel evocative weight.
- **Tests.** Vitest unit + component tests for every new module and
  component; one Playwright E2E covering the happy-path
  Hub→Make→tap-note→hear-it→loop-it→see-it-in-scrapbook flow.

### Out of scope (deferred to later plans)

- **Rests, dotted notes, sixteenth notes, chords.** All deferred.
- **Multiple measures with horizontal scrolling.** Plan 2 is fixed
  4-measure canvas.
- **Tempo control, scrubbing.** Deferred.
- **Key signature selection, scale switching.** C major naturals only;
  accidentals reachable per-note.
- **Multiple timbres / sound palette.** Kid's instrument only.
- **Real recorded violin/cello samples.** Plan 5 swaps in samples; Plan
  2 ships with a synth-backed implementation behind the same engine
  abstraction.
- **Cellist's treble clef appearing later.** Cellist stays in bass-only
  for v1.
- **Archive gesture.** Items are never deleted; archive UI is deferred
  to v1.5+ when scrapbook scale becomes a real problem.
- **Discovery → Make material flow.** No "Things we found" section
  surfaced; no encounter-found rhythms or melodies; no Fumly cameos. All
  Plan 3+.
- **Plan 3-style illustrated lands.** Discover side stays as the Plan 1
  placeholder Hollow plus a new doorway to Make. Plan 3 reskins the
  whole Discover surface.
- **Voice acting.** Fumling is silent on the Make side; no voice lines
  in Plan 2. Plan 5.
- **Animations.** Fumling silhouette is decorative-only on Make side;
  no idle behaviors. Plan 5.

## Architecture

Plan 2 layers cleanly on top of Plan 1's foundation. No file from Plan
1's `src/` is rewritten; new files are added and the Plan 1 router
gains new routes.

### Routes (additions to the in-memory router)

```ts
| { name: 'make' }
| { name: 'composer'; compositionId: number | 'new' }
| { name: 'scrapbook' }
```

- `make` is the Make-side landing surface (composer-fills-the-half: the
  composer is the make-side; arriving on `make` and arriving on
  `composer` with the current draft are the same view in practice, so
  the router can resolve `make` to `composer` with the current
  composition. Kept as a distinct route for clarity in the navigation
  model.)
- `composer` opens the staff editor for a specific composition or a new
  one. `compositionId === 'new'` opens a fresh empty staff and creates a
  composition row only when the kid places the first note.
- `scrapbook` opens the gallery of saved compositions.

The Plan 1 `Hub` route remains as the Discover-side landing. Plan 1's
no-back-during-onboarding rule stays; back-navigation is allowed
freely between `hub`/`make`/`composer`/`scrapbook`/`settings`.

### Schema additions

Plan 1 has a Dexie singleton `profile`. Plan 2 adds a `compositions`
table:

```ts
export interface Composition {
  id?: number;                   // auto-incremented, omitted on insert
  title: string;                 // auto-generated; kid-renamable
  notes: NotePlacement[];        // ordered by beat-position then pitch
  createdAt: Date;
  updatedAt: Date;
}

export interface NotePlacement {
  beatIndex: number;             // 0..15 (4 measures × 4 beats), but
                                 // longer durations span multiple beats
  duration: 'quarter' | 'half' | 'whole' | 'eighth';
  pitch: PitchSpec;
}

export interface PitchSpec {
  step: 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
  octave: number;                // scientific pitch notation, e.g. 4 for C4
  accidental: 'natural' | 'sharp' | 'flat';
}
```

Dexie database version bumps from 1 to 2. The migration only adds the
new table; the existing `profile` row is untouched.

### Audio engine abstraction

The Plan 1 `src/lib/audio/engine.ts` already lazy-initializes Tone.js on
first user gesture but is otherwise inert. Plan 2 expands it into a
small interface plus two implementations.

```ts
export interface InstrumentVoice {
  playNote(pitch: PitchSpec, durationSeconds: number): void;
  playSequence(notes: ScheduledNote[]): Promise<void>;
  setLoop(enabled: boolean): void;
}
```

Two implementations behind the interface:

- `SynthVoice` — backed by `Tone.PluckSynth` (or `Tone.AMSynth`,
  whichever sounds closer to a bowed/pizzed string at the lo-fi
  placeholder bar). Active in Plan 2.
- `SamplerVoice` — backed by `Tone.Sampler` with a manifest at
  `public/audio/samples/violin/manifest.json` (and `cello/`
  equivalent), loading recorded pitches lazily on first play. Empty
  in Plan 2 but the loader, manifest format, and SW cache rules are
  in place.

A factory `createVoice(instrument, mode)` returns the right
implementation. `mode` defaults to `'synth'` for Plan 2; flipping to
`'sampler'` is the Plan 5 change.

### Real-notation rendering (VexFlow)

A thin `Notation` component wraps VexFlow:

- Renders an SVG staff for the kid's clef.
- Accepts a list of `NotePlacement` and lays out the visible bars.
- Emits two coordinate spaces: pitch-row hit zones (for tap-to-place)
  and per-note bounding boxes (for tap-cycle / double-tap-cycle /
  long-press-grab).
- Animates a play-cursor during playback.

The same component, in a smaller size and read-only mode, renders
scrapbook tile thumbnails.

### Service worker / cache

Plan 1's Workbox config caches `js/css/html/svg/png/woff2`. Plan 2
widens `globPatterns` to also include `mp3` and `ogg`, and adds a
runtime cache rule for `/audio/samples/**` (cache-first, max 50 entries,
30-day expiration). The cache rule applies even though Plan 2 ships no
samples — Plan 5 drops files into the folder and they're cacheable
without further config changes.

### File structure additions

```
fumletone/
├── public/
│   └── audio/
│       └── samples/
│           ├── violin/
│           │   ├── README.md          # placeholder, Plan 5 fills
│           │   └── manifest.json      # empty pitch list for now
│           └── cello/
│               ├── README.md
│               └── manifest.json
├── src/
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── engine.ts              # (Plan 1) — extended in Plan 2
│   │   │   ├── voice.ts               # InstrumentVoice interface + factory
│   │   │   ├── synthVoice.ts          # Tone.PluckSynth/AMSynth impl
│   │   │   ├── samplerVoice.ts        # Tone.Sampler impl (empty manifest)
│   │   │   └── playback.ts            # play/loop scheduler over a composition
│   │   ├── notation/
│   │   │   ├── pitchRange.ts          # 1st-position pitch lists per instrument
│   │   │   ├── pitchSpec.ts           # PitchSpec utilities (compare, transpose)
│   │   │   └── Notation.svelte        # VexFlow staff renderer (interactive)
│   │   ├── db/
│   │   │   ├── schema.ts              # extended with Composition types
│   │   │   ├── db.ts                  # extended with v2 migration
│   │   │   └── compositions.ts        # CRUD helpers for compositions
│   │   ├── stores/
│   │   │   ├── currentComposition.ts  # writable<Composition | null>
│   │   │   └── route.ts               # extended with new routes
│   │   ├── components/
│   │   │   ├── Doorway.svelte         # tappable place-shaped portal
│   │   │   ├── ScrapbookIcon.svelte   # corner satchel/notebook button
│   │   │   ├── PlayControls.svelte    # play/stop + loop toggle
│   │   │   ├── PlusButton.svelte      # new-composition affordance
│   │   │   └── ScrapbookTile.svelte   # one composition tile (thumbnail+title)
│   │   └── i18n/
│   │       ├── nb.json                # extended
│   │       └── en.json                # extended
│   └── routes/
│       ├── Hub.svelte                 # extended: doorway to Make,
│       │                              # scrapbook icon
│       ├── Make.svelte                # composer-fills-the-half
│       ├── Composer.svelte            # the staff editor itself
│       └── Scrapbook.svelte           # gallery of compositions
└── tests/
    ├── unit/
    │   ├── audio/
    │   │   ├── voice.test.ts
    │   │   ├── synthVoice.test.ts
    │   │   ├── samplerVoice.test.ts
    │   │   └── playback.test.ts
    │   ├── notation/
    │   │   ├── pitchRange.test.ts
    │   │   └── pitchSpec.test.ts
    │   ├── db/
    │   │   └── compositions.test.ts
    │   └── stores/
    │       └── currentComposition.test.ts
    ├── component/
    │   ├── notation/
    │   │   └── Notation.test.ts
    │   ├── components/
    │   │   ├── Doorway.test.ts
    │   │   ├── PlayControls.test.ts
    │   │   ├── PlusButton.test.ts
    │   │   └── ScrapbookTile.test.ts
    │   └── routes/
    │       ├── Make.test.ts
    │       ├── Composer.test.ts
    │       └── Scrapbook.test.ts
    └── e2e/
        └── composer.spec.ts           # Hub → Make → tap → loop → scrapbook
```

## Composer details

### Pitch model

The composer shows real notation in the kid's clef. Pitch rows are
*tappable zones* — one zone per available pitch. C major naturals fill
the rows by default; accidentals are reached per-note via gesture.

**Violin (treble clef):** 17 diatonic rows from G3 (open G string,
sitting under the 2nd ledger line below the staff) through B5 (above
the 1st ledger line above the staff). Specifically: G3 A3 B3 C4 D4 E4
F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5.

**Cello (bass clef):** 16 diatonic rows from C2 (open C string, on
the 2nd ledger line below the staff) through D4 (above the 1st ledger
line above the staff). Specifically: C2 D2 E2 F2 G2 A2 B2 C3 D3 E3 F3
G3 A3 B3 C4 D4.

Tap zones are sized to be comfortable on iPad. With ~600px of usable
vertical space and 17 rows, each row is ~35px tall — tappable but
tight at the extremes; the long-press-grab-and-drag-pitch gesture
exists partly to compensate (kid can correct an off-tap without
deleting).

### Gesture set (canonical)

| Gesture | On empty staff position | On existing note |
|---|---|---|
| Single tap | Place a quarter note at the tapped pitch | Cycle duration: quarter → half → whole → eighth → quarter |
| Fast double-tap | (Treats first tap as place; second tap as cycle-duration) | Cycle accidental: natural → sharp → flat → natural |
| Long-press (~400ms) | (No effect — no note to grab) | Grab; while held: drag off-staff = delete; drag vertical = re-pitch |

Implementation note: single-tap-vs-double-tap requires a ~250ms
disambiguation delay. This is acceptable for note placement (kids
expect a brief settle on touch UIs), and matches iOS-native double-tap
behavior. The delay applies on first tap of any tap; subsequent rapid
taps on the same note can short-circuit to the cycle.

### Audio feedback

- **Place a note:** play the placed pitch once at its placed duration,
  using the kid's instrument voice.
- **Cycle duration:** play the new duration once at the existing pitch.
- **Cycle accidental:** play the new accidental-coloured pitch once.
- **Grab + drag pitch:** play the moving pitch softly (lower velocity)
  on each crossing of a pitch row; release does not re-trigger.
- **Grab + drag off-staff:** silent; visual fade-out of the note as it
  crosses the staff boundary.

### Playback controls

A small persistent control strip below the staff: **play/stop** button
(toggles), **loop** toggle. No tempo control; fixed at 90 bpm.

Looping continues until the kid taps stop or leaves the composer.
Leaving the composer (back to Make / via doorway / scrapbook tap) stops
playback. Coming back resumes paused, not playing.

### Empty state and first-touch

First-ever entry to the composer (no saved compositions exist):

- Empty staff in the kid's clef.
- A small fumling silhouette gestures toward an empty staff line — a
  single arc-of-motion animation, no voice, no text. Lasts ~3 seconds,
  then the silhouette settles into its idle corner position.
- The hint never replays. "First-ever" is detected by the absence of
  any composition rows in the `compositions` table — once any row
  exists (i.e., the kid has placed at least one note in their life),
  the hint is suppressed forever. No new flag on `KidProfile` is
  needed; the database state itself is the source of truth.

Subsequent entries: the composer opens to whatever the kid was last
working on (the "current draft" — the most recently-edited composition,
or fresh-empty if the kid tapped `+` last).

### `+` (new composition) affordance

A small button in the composer's corner. Tapping it:

1. Stops any active playback.
2. Saves the current composition (auto-save already did this on every
   gesture, so this is a no-op write but ensures consistency).
3. Opens a fresh empty staff. The new draft has no scrapbook entry yet
   — only the first-note-placed gesture creates one.

The `+` button is **hidden when the current draft is empty** (no notes
placed). This prevents the kid from creating a chain of empty
compositions; if they want to "start over," they're already on a fresh
staff.

## Scrapbook details

### Sections

- **Things I made / Det jeg har laget** — saved compositions.
- **Things we found / Det vi har funnet** — fragments from encounters.
  **Hidden in Plan 2.** No section header, no empty state — invisible
  until Plan 3+ encounters drop content into it.

### Tile list

Each tile shows:

- A small staff thumbnail (read-only `Notation` component, ~120px
  wide), rendered live from the composition.
- The composition's title.
- A subtle "tap to open" affordance (just visual hierarchy; no extra
  button).

Newest-first ordering. Vertical scrolling if needed (the iPad has
plenty of room for many tiles; we don't need pagination).

### Renaming

Long-press a tile → an inline text field appears with the current
title pre-selected. Confirm via a checkmark or by tapping outside.
Cancel via a back arrow. Renaming persists on confirm.

### Title generation

Auto-generated when a composition first becomes a scrapbook entry
(first note placed). The format is **day-of-week + brand-themed
noun**, evocative-but-tappable:

- NB: "Tirsdagens tone", "Fredagens flytrille", "Søndagens sang"
- EN: "Tuesday's tune", "Friday's fumble", "Sunday's song"

A small curated phrase pool per language, indexed by day-of-week
(seven sub-pools, one per weekday). Selection: take the count of
existing compositions in the database, modulo the size of that
weekday's pool. This is deterministic, varies by total composition
count to minimize same-day repetition, and produces a stable title
even if the kid renames it later (the original auto-title is never
re-derived). The full phrase pools live in the i18n files
(`compositionTitles.<weekday>` arrays); selection logic lives in
`src/lib/db/compositions.ts`.

### Re-opening a composition

Tap a tile → the composer opens with that composition loaded as the
current draft. From that point, every gesture continues to auto-save
into *that* composition's row. The kid can edit freely; tapping `+`
later switches to a fresh empty staff.

### Never-delete

No delete gesture. No swipe-to-remove. Items remain in the scrapbook
forever. Long-press is reserved for renaming.

The "archive into a drawer" gesture from the canonical spec is
**deferred to v1.5+**. With the modest tile counts kids will
realistically make in months, archive UI is unnecessary chrome for
Plan 2.

## Two-halves home screen

The Plan 1 Hub becomes the **Discover side** (Fumling Hollow
placeholder, otherwise unchanged for Plan 2). A new **Make side** hosts
the composer.

### Layout per half

**Discover side** (`Hub` route — extended from Plan 1):
- Plan 1's centered scene background, fumling silhouette, kid's name
  — unchanged.
- A new **doorway-to-Make** affordance positioned to one side of the
  scene (e.g., right edge). A simple SVG portal/door for Plan 2; Plan
  3 reskins this as part of the illustrated lands.
- Persistent **Scrapbook icon** in the top-right corner.

**Make side** (`Make` / `Composer` routes):
- The composer fills the half. Staff occupies the bulk of the screen.
- Play controls strip below the staff.
- `+` button (when applicable) at the corner of the composer area.
- A small fumling silhouette in the bottom corner — decorative only
  (Plan 5 adds animations).
- A **doorway-back-to-Hub** affordance in a top corner (mirroring the
  Hub's portal direction).
- Persistent **Scrapbook icon** in the top-right corner.

**Scrapbook surface** (`Scrapbook` route):
- Plain tile list.
- **Doorway-back** that returns the kid to whichever half they
  arrived from. Implementation: the Plan 1 router's `back()` function
  walks one entry up the route history stack, which naturally lands
  the kid on `hub` or `make` depending on where they tapped the
  scrapbook icon. No new history bookkeeping required.

### Navigation gestures

All transitions are **tap-on-affordance**, not swipe. This is
deliberate: swipe gestures conflict with the staff editor's
drag-off-staff-to-delete and drag-pitch gestures. Tapping a doorway is
unambiguous.

### First-launch entry

Plan 1's onboarding flow lands the kid in the Hub once
`onboardingCompletedAt` is set. The Make doorway is **immediately
visible and tappable** from first arrival — no gating, no unlock
moment. The fumling does a small one-shot gesture toward the doorway
on first arrival, mirroring the composer's first-touch hint.

## i18n additions

New strings added to `src/lib/i18n/nb.json` and `en.json`. Nested
object structure (per Plan 1's convention — never flat dotted keys):

```json
{
  "make": {
    "doorway": "Lag" / "Make",
    "doorwayBack": "Tilbake til Fumlehulen" / "Back to the Fumling Hollow"
  },
  "composer": {
    "play": "Spill" / "Play",
    "stop": "Stopp" / "Stop",
    "loop": "Gjenta" / "Loop",
    "newComposition": "Ny sang" / "New song",
    "firstTouchHint": "Trykk på en linje" / "Tap a line"
  },
  "scrapbook": {
    "title": "Skrapboka" / "Scrapbook",
    "thingsIMade": "Det jeg har laget" / "Things I made",
    "renamePrompt": "Gi den et navn" / "Give it a name",
    "renameConfirm": "Greit" / "OK",
    "renameCancel": "Nei takk" / "Never mind"
  },
  "compositionTitles": {
    "monday":    ["Mandagens melodi", "Mandagens marsj", "..."],
    "tuesday":   ["Tirsdagens tone", "Tirsdagens trille", "..."],
    "wednesday": ["Onsdagens vise", "Onsdagens vandring", "..."],
    "thursday":  ["Torsdagens tema", "Torsdagens triller", "..."],
    "friday":    ["Fredagens flytrille", "Fredagens fumling", "..."],
    "saturday":  ["Lørdagens lille sang", "Lørdagens leik", "..."],
    "sunday":    ["Søndagens sang", "Søndagens sukk", "..."]
  }
}
```

(EN `compositionTitles` mirror with parallel weight: "Tuesday's tune",
"Tuesday's tinkle", etc. Final phrase pools are filled in during plan
implementation, with the final lists cleared by the user before
shipping.)

The "Things we found" string is **not added in Plan 2** — it doesn't
render anywhere, so adding it now would be dead i18n. Plan 3 adds it
when the section becomes visible.

## Audio engine details

### Initialization

Plan 1's `engine.ts` already exposes an `unlock()` function and an
`isReady()` flag, called on first gesture. Plan 2 extends:

- `unlock()` now also creates the kid's instrument voice (synth-backed
  in Plan 2).
- The voice is held in module state and reused across the composer
  session.
- A second voice is **not** created — Plan 2 plays only the kid's
  instrument.

### Volume / always-listenable

A single `Tone.Volume` node in front of the destination, set to a
mild attenuation (~-6 dB) to leave headroom. A `Tone.Limiter` (-2 dB
threshold) prevents clipping on rapid tap-spam. No compression beyond
that.

### Playback scheduler

`src/lib/audio/playback.ts` walks a composition's `NotePlacement[]`,
schedules each note via `Tone.Transport.schedule`, and emits a
play-cursor position for the `Notation` component to highlight. Loop
mode just re-schedules on transport completion.

90 bpm fixed. Calculated note durations: quarter = 0.667s, half =
1.333s, whole = 2.667s, eighth = 0.333s. (60 / 90 = 0.667.)

### Sample loader (latent)

Even though Plan 2 ships with the synth path active, the sampler
infrastructure is built:

- `manifest.json` schema: `{ "pitches": [{ "note": "C4", "url":
  "C4.mp3" }, ...] }`. Plan 2 ships empty manifests; Plan 5 fills
  them.
- `samplerVoice.ts` reads the manifest, loads samples lazily on first
  `playNote`, falls through to a synth fallback if any pitch is
  missing.
- Service worker cache rule for `/audio/samples/**` is registered
  even though no files match.

The `mode` parameter on `createVoice(instrument, mode)` defaults to
`'synth'` in Plan 2. Plan 5 changes the default to `'sampler'`.

## Real-notation rendering details

### VexFlow integration

VexFlow renders to SVG. Wrapped in a Svelte component
(`Notation.svelte`) that re-renders on `notes` prop changes. The
component also handles:

- Hit-testing tap zones (per-pitch-row, per-existing-note).
- Translating tap coordinates to `PitchSpec` for the placement gesture.
- Highlighting the play-cursor during playback.
- Read-only mode for scrapbook thumbnails (smaller scale, no hit
  zones).

### Layout

- Time signature drawn at the start of the staff: 4/4.
- Bar lines between measures.
- No clef label besides the clef itself (no key signature drawn —
  C major has none).
- Notes drawn with stems, beams (for adjacent eighths), and per-note
  accidental glyphs as needed.
- Ledger lines drawn for pitches above/below the staff.

## Testing strategy

Mirroring Plan 1's TDD discipline.

### Unit tests (Vitest + jsdom)

- `pitchSpec.test.ts` — pitch comparison, accidental cycling,
  transposition between SPN and VexFlow string formats.
- `pitchRange.test.ts` — violin/cello range generation, in-range
  validation.
- `compositions.test.ts` — Dexie CRUD: create, update, delete (no
  delete gesture exists, but the helper does — for tests + future
  archive); list newest-first; first-note-creates-row behavior.
- `voice.test.ts` — factory returns synth voice for both instruments
  in default mode; sampler voice when mode flipped.
- `synthVoice.test.ts` — playNote schedules a tone of correct
  pitch/duration; playSequence schedules in order; loop re-schedules.
- `samplerVoice.test.ts` — empty manifest falls through to synth
  fallback; populated manifest loads samples; ManifestNotFound is a
  warn-not-throw.
- `playback.test.ts` — beat math at 90 bpm; cursor emits per
  scheduled position.
- `currentComposition.test.ts` — store loads, mutates, persists;
  resets on `+`.

### Component tests (Vitest + @testing-library/svelte)

- `Notation.test.ts` — renders a staff with a note; tap on empty pitch
  row emits placement event; tap on existing note emits cycle event;
  long-press emits grab event.
- `Doorway.test.ts` — tap emits navigate event with correct target.
- `PlayControls.test.ts` — play emits start; stop emits stop; loop
  toggle emits state change.
- `PlusButton.test.ts` — hidden when current draft is empty; visible
  when current draft has notes; tap emits new-draft event.
- `ScrapbookTile.test.ts` — renders title and thumbnail; tap emits
  open event; long-press triggers rename mode.
- `Make.test.ts` — first-touch hint shows once; doorway back to Hub
  works.
- `Composer.test.ts` — tap-empty places quarter; tap-existing cycles;
  double-tap cycles accidental; long-press-and-drag-off deletes;
  long-press-and-drag-vertical re-pitches.
- `Scrapbook.test.ts` — newest-first ordering; long-press rename;
  Things-we-found section hidden when empty.

### E2E (Playwright)

`tests/e2e/composer.spec.ts`:

1. Reset to fresh state.
2. Walk through Plan 1 onboarding (or seed profile directly).
3. From Hub, tap Make doorway.
4. Tap a staff position; assert a quarter note appears.
5. Tap the note; assert it changes to a half note.
6. Double-tap the note; assert sharp accidental glyph appears.
7. Tap play; assert audio context resumes and a note plays
   (assertion: Tone.Transport state = 'started').
8. Tap loop; let it loop once; tap stop.
9. Tap Scrapbook icon; assert a tile with auto-generated title appears.
10. Tap the tile; assert composer opens with the same note in place.
11. Long-press the tile; rename to "My song"; assert title updates.

The audio assertion is loose — Tone.js doesn't expose easy "was sound
heard" hooks, but Transport state and scheduled-event count are
inspectable.

## Non-goals (Plan 2 will not do)

(Repeating from Scope for emphasis — these are easy to scope-creep
into during implementation.)

- No rests, no dotted notes, no sixteenth notes, no chords.
- No tempo control, no scrubbing.
- No multiple measures / scrolling canvas.
- No key signature picker.
- No alternative timbres beyond the kid's instrument.
- No real recorded samples (synth-backed, with the abstraction ready
  for Plan 5).
- No archive gesture, no delete.
- No "Things we found" surfaced (data shape exists, UI hidden).
- No Fumly cameos, no voice acting, no animations beyond the one-shot
  hint nudge.
- No Plan 3 illustrated lands.
- No back-navigation rule for the composer/scrapbook (it's allowed,
  unlike Plan 1's onboarding flow which forbids back).

## Open items (deferred to implementation planning)

- **Final composition-title phrase pools** in NB and EN. The
  implementation plan drafts these and the user reviews/clears the
  final lists before shipping.
- **Specific synth choice** for the Plan 2 placeholder voice
  (PluckSynth vs AMSynth vs MetalSynth blend) — decided by ear during
  implementation; the abstraction is what matters for plan structure.
- **Exact pixel sizing** of staff, tap zones, doorway portals, and
  scrapbook tiles for iPad in landscape — finalised during
  implementation against the iPad device's actual viewport.
- **First-touch hint animation** specifics — kept minimal; visual
  detail decided in implementation.

## Guardrail for Plan 3+

Plan 3 will:
- Replace the Discover-side placeholder Hollow with an illustrated
  scene plus illustrated land doorways.
- Reskin the Make-doorway and back-to-Hub doorway as illustrated
  affordances continuous with the surrounding scene.
- Begin populating the "Things we found" scrapbook section with
  encounter-found rhythms and melodies, and surface the section.
- Define how found material flows back into the staff-editor composer
  (likely as starter material the kid can drop in rather than as
  cell-grid stamps; see updated canonical spec).

Plan 5 will:
- Drop CC-licensed sample files into `public/audio/samples/violin/`
  and `cello/`, fill in `manifest.json`, flip the voice factory mode
  to `'sampler'`. No code changes elsewhere.
- Replace the fumling silhouette with illustrated artwork and add the
  idle/cameo animation set.
- Add voice acting for the fumling.

These guardrails exist so Plan 2's placeholders are *replaceable in
isolation* — no cascading rewrites.

## References

- [Fumletone Design Spec (canonical)](./2026-05-07-fumletone-design.md)
  — composer / saving / scrapbook sections updated to match Plan 2.
- [Plan 1 — Foundation & Onboarding](../plans/2026-05-07-foundation-onboarding.md)
  — file conventions, store patterns, i18n nesting style, TDD approach.
- [Project memory: Real notation rule](~/.claude/projects/-home-eivind-code-fumletone/memory/fumletone_real_notation.md)
  — load-bearing pedagogical rule.
