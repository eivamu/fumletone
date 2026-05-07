# Composer & Scrapbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-notation staff-editor composer, a scrapbook of saved compositions, and the two-halves home structure on top of the Plan 1 foundation, so the kid can tap notes onto a staff in their instrument's clef, hear them play in their instrument's voice, and find their compositions later in the scrapbook.

**Architecture:** Layers cleanly on top of Plan 1. The Plan 1 Hub becomes the Discover side of a two-halves home; a new Make side hosts the composer. Compositions persist in a new Dexie `compositions` table. VexFlow renders the staff (interactive in the composer, read-only thumbnails in the scrapbook). Tone.js gains a small `InstrumentVoice` abstraction with two implementations — a synth-backed voice active in this plan, and a sampler-backed voice with empty manifests ready for Plan 5 to drop sample files into. A pure-JS gesture state machine handles tap/double-tap/long-press disambiguation outside Svelte for testability. Auto-save persists every gesture; the first note placed in a fresh staff creates a scrapbook entry.

**Tech Stack:**
- VexFlow 4 (real notation rendering — SVG)
- Tone.js 14 (Sampler + PluckSynth + Transport scheduling — already a Plan 1 dep)
- Dexie 4 (existing — bumping schema version to 2)
- Svelte 5 + TypeScript 5 (existing)
- Vitest + `@testing-library/svelte` + jsdom (existing — adds `vi.useFakeTimers` for gesture tests)
- Playwright (existing — one new E2E test)

**What this plan does NOT include** (deferred to later plans):
- Rests, dotted notes, sixteenth notes, chords (deferred to v1.5+)
- Tempo control, scrubbing, multiple measures with scrolling
- Key signature picker, scale switching
- Alternative timbres beyond the kid's instrument
- Real recorded violin/cello samples (Plan 5; this plan ships synth-backed audio with the sampler abstraction in place)
- Cellist's treble clef appearing later (cellist stays bass-only for v1)
- Archive gesture, delete gesture (items are never deleted; archive deferred to v1.5+)
- "Things we found" scrapbook section UI (data shape exists; section hidden until Plan 3+)
- Plan 3-style illustrated lands (Discover side stays as Plan 1's placeholder Hollow plus a Make doorway)
- Voice acting, fumling animations beyond a one-shot first-touch hint

**Intentional design choices** (do NOT add to this plan):
- **Auto-save with no save button.** First note placed in a fresh staff creates a `compositions` row; every subsequent gesture updates it.
- **Tap-replaces-tap on the same beat-position.** If the kid taps a different pitch row in a column that already has a note, the existing note is replaced. Monophonic enforcement.
- **All transitions are tap-on-affordance, not swipe.** Swipe gestures conflict with the staff editor's drag-pitch and drag-off-staff gestures.
- **The synth-backed voice ships in this plan.** The sampler infrastructure (manifest, loader, SW cache rule) lands too, but with empty manifests; Plan 5 adds the audio files and flips one default.

The composer is the load-bearing real-notation moment for the whole project. There is no separate "see as sheet music" view because the input *is* real notation from the first tap.

**Naming:** Norwegian locale code is `nb` (Bokmål). All Norwegian strings target Bokmål. Brand voice is playful, inviting, low-pressure — translations preserve the register.

---

## File Structure

Files created or modified in this plan (with single-responsibility callouts):

```
fumletone/
├── package.json                              # +vexflow dependency
├── vite.config.ts                            # widen PWA cache to mp3/ogg + audio/samples runtime cache
├── public/
│   └── audio/
│       └── samples/
│           ├── violin/
│           │   ├── README.md                 # placeholder; Plan 5 fills with real samples
│           │   └── manifest.json             # { "pitches": [] } in Plan 2
│           └── cello/
│               ├── README.md
│               └── manifest.json
├── src/
│   ├── lib/
│   │   ├── audio/
│   │   │   ├── engine.ts                     # extend: lazy-create + hold InstrumentVoice
│   │   │   ├── voice.ts                      # InstrumentVoice interface + createVoice factory
│   │   │   ├── synthVoice.ts                 # Tone.PluckSynth-backed implementation
│   │   │   ├── samplerVoice.ts               # Tone.Sampler-backed (empty in Plan 2)
│   │   │   └── playback.ts                   # play/loop scheduler over a composition
│   │   ├── notation/
│   │   │   ├── pitchSpec.ts                  # PitchSpec utilities (compare, cycle accidental, SPN ↔ VexFlow)
│   │   │   ├── pitchRange.ts                 # 1st-position pitch lists per instrument
│   │   │   ├── gestures.ts                   # pure-JS tap/double-tap/long-press state machine
│   │   │   └── Notation.svelte               # VexFlow staff renderer (interactive + read-only modes)
│   │   ├── db/
│   │   │   ├── schema.ts                     # extend with Composition, NotePlacement, PitchSpec, new Routes
│   │   │   ├── db.ts                         # extend with v2 migration + compositions table
│   │   │   └── compositions.ts               # CRUD helpers + generateAutoTitle()
│   │   ├── stores/
│   │   │   ├── currentComposition.ts         # writable<Composition | null> + load/persist helpers
│   │   │   └── route.ts                      # extend with make/composer/scrapbook routes
│   │   ├── router/
│   │   │   └── Router.svelte                 # extend with new route cases
│   │   ├── components/
│   │   │   ├── Doorway.svelte                # tappable place-shaped portal
│   │   │   ├── ScrapbookIcon.svelte          # corner satchel/notebook button
│   │   │   ├── PlayControls.svelte           # play/stop + loop toggle
│   │   │   ├── PlusButton.svelte             # new-composition affordance
│   │   │   └── ScrapbookTile.svelte          # one composition tile (thumbnail + title + rename)
│   │   └── i18n/
│   │       ├── nb.json                       # extend with make/composer/scrapbook/compositionTitles
│   │       └── en.json                       # extend (parallel)
│   └── routes/
│       ├── Hub.svelte                        # extend: add Make doorway + Scrapbook icon
│       ├── Make.svelte                       # composer-fills-the-half wrapper
│       ├── Composer.svelte                   # the staff editor itself (assembles Notation + controls + + + hint + back doorway)
│       └── Scrapbook.svelte                  # gallery of compositions
└── tests/
    ├── unit/
    │   ├── audio/
    │   │   ├── voice.test.ts
    │   │   ├── synthVoice.test.ts
    │   │   ├── samplerVoice.test.ts
    │   │   └── playback.test.ts
    │   ├── notation/
    │   │   ├── pitchSpec.test.ts
    │   │   ├── pitchRange.test.ts
    │   │   └── gestures.test.ts
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
    │       ├── Scrapbook.test.ts
    │       └── Hub.test.ts
    └── e2e/
        └── composer.spec.ts                  # Hub → Make → tap → cycle → loop → scrapbook → re-open
```

---

## Canonical Types (referenced throughout)

These are defined in Task 2 (`src/lib/db/schema.ts` extensions) and used by every later task. Reproduced here so cross-task references stay consistent:

```ts
// New types added by Plan 2
export type DurationName = 'quarter' | 'half' | 'whole' | 'eighth';
export type AccidentalName = 'natural' | 'sharp' | 'flat';
export type PitchStep = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface PitchSpec {
  step: PitchStep;
  octave: number;            // scientific pitch notation (4 = middle-C octave)
  accidental: AccidentalName;
}

export interface NotePlacement {
  beatIndex: number;         // 0..15 — quarter-note resolution across 4 measures of 4/4
  duration: DurationName;
  pitch: PitchSpec;
}

export interface Composition {
  id?: number;               // auto-incremented by Dexie; omitted on insert
  title: string;
  notes: NotePlacement[];    // ordered by beatIndex
  createdAt: Date;
  updatedAt: Date;
}

// Extended Route union — adds three cases on top of Plan 1's
export type Route =
  | { name: 'splash' }
  | { name: 'onboarding/pickLanguage' }
  | { name: 'onboarding/pickKidName' }
  | { name: 'onboarding/customizeFumling' }
  | { name: 'onboarding/pickInstrument' }
  | { name: 'onboarding/nameFumling' }
  | { name: 'hub' }
  | { name: 'settings' }
  | { name: 'make' }
  | { name: 'composer'; compositionId: number | 'new' }
  | { name: 'scrapbook' };
```

---

## Task 1: Install VexFlow

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add VexFlow to dependencies**

Run from `/home/eivind/code/fumletone`:

```bash
cd /home/eivind/code/fumletone && npm install vexflow@^4.2.3
```

Expected: `package.json` gains `"vexflow": "^4.2.3"` under `dependencies`; `package-lock.json` updates; no install errors.

- [ ] **Step 2: Verify VexFlow imports cleanly under TypeScript**

Run:

```bash
cd /home/eivind/code/fumletone && npx tsc --noEmit -e "import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';"
```

Expected: no output, exit code 0. (If `tsc -e` doesn't work in this version, an equivalent `npm run check` after a no-op stub usage is fine.)

- [ ] **Step 3: Commit**

```bash
cd /home/eivind/code/fumletone && git add package.json package-lock.json && git commit -m "deps: add vexflow for real-notation rendering"
```

---

## Task 2: Schema additions, types, and Dexie v2 migration

**Files:**
- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/db.ts`
- Test: `tests/unit/db.test.ts` (extend existing — keep Plan 1 tests, add new ones)

This task adds the Plan 2 types to the canonical schema file, bumps the Dexie version to 2 with a `compositions` table, and writes the migration. It does **not** add CRUD helpers — those live in Task 4 (`compositions.ts`).

- [ ] **Step 1: Extend `schema.ts` with Plan 2 types**

Edit `/home/eivind/code/fumletone/src/lib/db/schema.ts`. Append the following at the end of the file (after the existing Plan 1 declarations):

```ts
// ---- Plan 2 additions ----

export type DurationName = 'quarter' | 'half' | 'whole' | 'eighth';
export type AccidentalName = 'natural' | 'sharp' | 'flat';
export type PitchStep = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface PitchSpec {
  step: PitchStep;
  octave: number;            // scientific pitch notation (4 = middle-C octave)
  accidental: AccidentalName;
}

export interface NotePlacement {
  beatIndex: number;         // 0..15 — quarter-note resolution across 4 measures of 4/4
  duration: DurationName;
  pitch: PitchSpec;
}

export interface Composition {
  id?: number;               // auto-incremented by Dexie; omitted on insert
  title: string;
  notes: NotePlacement[];
  createdAt: Date;
  updatedAt: Date;
}
```

Then, find the existing `Route` union near the top of the file and replace it with the extended version:

```ts
export type Route =
  | { name: 'splash' }
  | { name: 'onboarding/pickLanguage' }
  | { name: 'onboarding/pickKidName' }
  | { name: 'onboarding/customizeFumling' }
  | { name: 'onboarding/pickInstrument' }
  | { name: 'onboarding/nameFumling' }
  | { name: 'hub' }
  | { name: 'settings' }
  | { name: 'make' }
  | { name: 'composer'; compositionId: number | 'new' }
  | { name: 'scrapbook' };
```

- [ ] **Step 2: Write a failing migration test**

Append to `/home/eivind/code/fumletone/tests/unit/db.test.ts`:

```ts
import type { Composition } from '$lib/db/schema';

describe('compositions table (v2 migration)', () => {
  it('exposes a compositions table after migration', async () => {
    expect(db.compositions).toBeDefined();
  });

  it('persists and reads back a composition', async () => {
    const c: Omit<Composition, 'id'> = {
      title: 'Test',
      notes: [
        {
          beatIndex: 0,
          duration: 'quarter',
          pitch: { step: 'C', octave: 4, accidental: 'natural' },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const id = await db.compositions.add(c as Composition);
    const got = await db.compositions.get(id);
    expect(got).not.toBeUndefined();
    expect(got!.title).toBe('Test');
    expect(got!.notes).toHaveLength(1);
    expect(got!.notes[0].pitch.step).toBe('C');
  });

  it('keeps the existing profile row across the v2 migration', async () => {
    // saveProfile already migrates v1 data; verify v2 doesn't drop it
    await saveProfile({ kidName: 'Sara' });
    const p = await getProfile();
    expect(p!.kidName).toBe('Sara');
  });
});
```

- [ ] **Step 3: Run tests to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/db.test.ts
```

Expected: FAIL — `db.compositions` is undefined (the table doesn't exist yet on the v1 schema).

- [ ] **Step 4: Bump Dexie version and add the table**

Edit `/home/eivind/code/fumletone/src/lib/db/db.ts`. Replace the body of the `FumletoneDB` class with:

```ts
import Dexie, { type Table } from 'dexie';
import type { Composition, KidProfile } from './schema';
import { DEFAULT_PROFILE } from './schema';

class FumletoneDB extends Dexie {
  profile!: Table<KidProfile, number>;
  compositions!: Table<Composition, number>;

  constructor() {
    super('fumletone');
    this.version(1).stores({
      profile: 'id',
    });
    this.version(2).stores({
      profile: 'id',
      compositions: '++id, createdAt',
    });
  }
}

export const db = new FumletoneDB();
```

Keep the existing `getProfile`, `saveProfile`, and `resetProfile` exports below the class — they don't change.

- [ ] **Step 5: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/db.test.ts
```

Expected: all db tests pass (Plan 1's plus the three new ones).

- [ ] **Step 6: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/db/schema.ts src/lib/db/db.ts tests/unit/db.test.ts && git commit -m "db: v2 migration adds compositions table; schema gains Composition/PitchSpec/NotePlacement"
```

---

## Task 3: Pitch utilities — `pitchSpec.ts` and `pitchRange.ts`

**Files:**
- Create: `src/lib/notation/pitchSpec.ts`, `src/lib/notation/pitchRange.ts`
- Test: `tests/unit/notation/pitchSpec.test.ts`, `tests/unit/notation/pitchRange.test.ts`

These are small, pure-function modules. `pitchSpec.ts` handles per-note utilities (cycle accidental, format for VexFlow, equality). `pitchRange.ts` enumerates the kid's instrument's first-position diatonic pitches.

- [ ] **Step 1: Write failing tests for `pitchSpec`**

Create `/home/eivind/code/fumletone/tests/unit/notation/pitchSpec.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  pitchEquals,
  cycleAccidental,
  toVexKey,
  toToneNote,
} from '$lib/notation/pitchSpec';
import type { PitchSpec } from '$lib/db/schema';

const C4: PitchSpec = { step: 'C', octave: 4, accidental: 'natural' };
const Cs4: PitchSpec = { step: 'C', octave: 4, accidental: 'sharp' };
const D4: PitchSpec = { step: 'D', octave: 4, accidental: 'natural' };

describe('pitchEquals', () => {
  it('returns true for identical pitches', () => {
    expect(pitchEquals(C4, { ...C4 })).toBe(true);
  });
  it('returns false when accidental differs', () => {
    expect(pitchEquals(C4, Cs4)).toBe(false);
  });
  it('returns false when step differs', () => {
    expect(pitchEquals(C4, D4)).toBe(false);
  });
  it('returns false when octave differs', () => {
    expect(pitchEquals(C4, { ...C4, octave: 5 })).toBe(false);
  });
});

describe('cycleAccidental', () => {
  it('cycles natural → sharp → flat → natural', () => {
    expect(cycleAccidental('natural')).toBe('sharp');
    expect(cycleAccidental('sharp')).toBe('flat');
    expect(cycleAccidental('flat')).toBe('natural');
  });
});

describe('toVexKey', () => {
  it('formats natural pitches as "c/4"', () => {
    expect(toVexKey(C4)).toBe('c/4');
  });
  it('formats sharps as "c#/4"', () => {
    expect(toVexKey(Cs4)).toBe('c#/4');
  });
  it('formats flats as "cb/4"', () => {
    expect(toVexKey({ step: 'C', octave: 4, accidental: 'flat' })).toBe('cb/4');
  });
});

describe('toToneNote', () => {
  it('formats natural pitches as "C4"', () => {
    expect(toToneNote(C4)).toBe('C4');
  });
  it('formats sharps as "C#4"', () => {
    expect(toToneNote(Cs4)).toBe('C#4');
  });
  it('formats flats as "Cb4"', () => {
    expect(toToneNote({ step: 'C', octave: 4, accidental: 'flat' })).toBe('Cb4');
  });
});
```

- [ ] **Step 2: Write failing tests for `pitchRange`**

Create `/home/eivind/code/fumletone/tests/unit/notation/pitchRange.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { firstPositionRange, isInRange } from '$lib/notation/pitchRange';

describe('firstPositionRange (violin / treble)', () => {
  const range = firstPositionRange('violin');

  it('starts at G3 (open G string)', () => {
    expect(range[0]).toEqual({ step: 'G', octave: 3, accidental: 'natural' });
  });

  it('ends at B5 (4th finger, E string, 1st position)', () => {
    expect(range[range.length - 1]).toEqual({
      step: 'B',
      octave: 5,
      accidental: 'natural',
    });
  });

  it('contains exactly 17 diatonic naturals in C major', () => {
    expect(range).toHaveLength(17);
    expect(range.every((p) => p.accidental === 'natural')).toBe(true);
  });

  it('is sorted ascending by pitch height', () => {
    const heights = range.map((p) => p.octave * 7 + 'CDEFGAB'.indexOf(p.step));
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThan(heights[i - 1]);
    }
  });
});

describe('firstPositionRange (cello / bass)', () => {
  const range = firstPositionRange('cello');

  it('starts at C2 (open C string)', () => {
    expect(range[0]).toEqual({ step: 'C', octave: 2, accidental: 'natural' });
  });

  it('ends at D4 (4th finger, A string, 1st position)', () => {
    expect(range[range.length - 1]).toEqual({
      step: 'D',
      octave: 4,
      accidental: 'natural',
    });
  });

  it('contains exactly 16 diatonic naturals in C major', () => {
    expect(range).toHaveLength(16);
  });
});

describe('isInRange', () => {
  it('returns true for naturals within the range', () => {
    expect(
      isInRange({ step: 'C', octave: 4, accidental: 'natural' }, 'violin'),
    ).toBe(true);
  });

  it('returns true for accidentals at in-range natural positions', () => {
    expect(
      isInRange({ step: 'C', octave: 4, accidental: 'sharp' }, 'violin'),
    ).toBe(true);
  });

  it('returns false for naturals outside the range', () => {
    expect(
      isInRange({ step: 'F', octave: 2, accidental: 'natural' }, 'violin'),
    ).toBe(false);
  });
});
```

- [ ] **Step 3: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/notation/
```

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `pitchSpec.ts`**

Create `/home/eivind/code/fumletone/src/lib/notation/pitchSpec.ts`:

```ts
import type {
  AccidentalName,
  PitchSpec,
  PitchStep,
} from '$lib/db/schema';

export function pitchEquals(a: PitchSpec, b: PitchSpec): boolean {
  return (
    a.step === b.step &&
    a.octave === b.octave &&
    a.accidental === b.accidental
  );
}

export function cycleAccidental(a: AccidentalName): AccidentalName {
  switch (a) {
    case 'natural':
      return 'sharp';
    case 'sharp':
      return 'flat';
    case 'flat':
      return 'natural';
  }
}

const ACCIDENTAL_GLYPH: Record<AccidentalName, string> = {
  natural: '',
  sharp: '#',
  flat: 'b',
};

/**
 * VexFlow key format, e.g. "c/4" or "f#/5".
 */
export function toVexKey(p: PitchSpec): string {
  const step = p.step.toLowerCase() as Lowercase<PitchStep>;
  return `${step}${ACCIDENTAL_GLYPH[p.accidental]}/${p.octave}`;
}

/**
 * Tone.js note format, e.g. "C4" or "F#5".
 */
export function toToneNote(p: PitchSpec): string {
  return `${p.step}${ACCIDENTAL_GLYPH[p.accidental]}${p.octave}`;
}
```

- [ ] **Step 5: Implement `pitchRange.ts`**

Create `/home/eivind/code/fumletone/src/lib/notation/pitchRange.ts`:

```ts
import type { Instrument, PitchSpec, PitchStep } from '$lib/db/schema';

const STEPS: PitchStep[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

interface Endpoint {
  step: PitchStep;
  octave: number;
}

const VIOLIN_LOW: Endpoint = { step: 'G', octave: 3 };
const VIOLIN_HIGH: Endpoint = { step: 'B', octave: 5 };
const CELLO_LOW: Endpoint = { step: 'C', octave: 2 };
const CELLO_HIGH: Endpoint = { step: 'D', octave: 4 };

function diatonicHeight(step: PitchStep, octave: number): number {
  return octave * 7 + STEPS.indexOf(step);
}

function range(low: Endpoint, high: Endpoint): PitchSpec[] {
  const out: PitchSpec[] = [];
  const lowH = diatonicHeight(low.step, low.octave);
  const highH = diatonicHeight(high.step, high.octave);
  for (let h = lowH; h <= highH; h++) {
    const octave = Math.floor(h / 7);
    const step = STEPS[h - octave * 7];
    out.push({ step, octave, accidental: 'natural' });
  }
  return out;
}

export function firstPositionRange(instrument: Instrument): PitchSpec[] {
  if (instrument === 'violin') return range(VIOLIN_LOW, VIOLIN_HIGH);
  return range(CELLO_LOW, CELLO_HIGH);
}

export function isInRange(p: PitchSpec, instrument: Instrument): boolean {
  const r = firstPositionRange(instrument);
  const h = diatonicHeight(p.step, p.octave);
  const lowH = diatonicHeight(r[0].step, r[0].octave);
  const highH = diatonicHeight(r[r.length - 1].step, r[r.length - 1].octave);
  return h >= lowH && h <= highH;
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/notation/
```

Expected: all pitchSpec + pitchRange tests pass.

- [ ] **Step 7: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/notation/pitchSpec.ts src/lib/notation/pitchRange.ts tests/unit/notation/ && git commit -m "notation: pitchSpec utilities + first-position pitch ranges per instrument"
```

---

## Task 4: Compositions CRUD and auto-title generation

**Files:**
- Create: `src/lib/db/compositions.ts`
- Test: `tests/unit/db/compositions.test.ts`

CRUD over the new `compositions` table plus the auto-title generator described in the design spec (weekday-keyed phrase pools indexed by `count(compositions) % pool.length`).

- [ ] **Step 1: Write the failing tests**

Create `/home/eivind/code/fumletone/tests/unit/db/compositions.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createComposition,
  getComposition,
  updateComposition,
  listCompositions,
  generateAutoTitle,
} from '$lib/db/compositions';
import { db } from '$lib/db/db';
import type { NotePlacement } from '$lib/db/schema';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const C4_QUARTER: NotePlacement = {
  beatIndex: 0,
  duration: 'quarter',
  pitch: { step: 'C', octave: 4, accidental: 'natural' },
};

describe('createComposition', () => {
  it('creates a row with auto-generated title and one note', async () => {
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    expect(c.id).toBeDefined();
    expect(c.title.length).toBeGreaterThan(0);
    expect(c.notes).toHaveLength(1);
    expect(c.notes[0]).toEqual(C4_QUARTER);
    expect(c.createdAt).toBeInstanceOf(Date);
    expect(c.updatedAt).toBeInstanceOf(Date);
  });

  it('uses the language-specific pool', async () => {
    const nb = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    await db.compositions.clear();
    const en = await createComposition({ firstNote: C4_QUARTER, language: 'en' });
    // Norwegian titles never contain English words like "Tuesday" or "Tune"
    expect(/Tuesday|Tune|Friday|Sunday/i.test(nb.title)).toBe(false);
    // English titles never contain Norwegian -dagens suffix
    expect(/dagens/.test(en.title)).toBe(false);
  });
});

describe('getComposition', () => {
  it('returns the composition by id', async () => {
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    const got = await getComposition(c.id!);
    expect(got!.title).toBe(c.title);
  });

  it('returns null for an unknown id', async () => {
    expect(await getComposition(999)).toBeNull();
  });
});

describe('updateComposition', () => {
  it('replaces the notes array and bumps updatedAt', async () => {
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    const newNotes: NotePlacement[] = [
      C4_QUARTER,
      {
        beatIndex: 1,
        duration: 'quarter',
        pitch: { step: 'D', octave: 4, accidental: 'natural' },
      },
    ];
    await new Promise((r) => setTimeout(r, 5));
    await updateComposition(c.id!, { notes: newNotes });
    const got = await getComposition(c.id!);
    expect(got!.notes).toHaveLength(2);
    expect(got!.updatedAt.getTime()).toBeGreaterThan(c.updatedAt.getTime());
    expect(got!.createdAt.getTime()).toBe(c.createdAt.getTime());
  });

  it('renames the composition', async () => {
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    await updateComposition(c.id!, { title: 'Min sang' });
    const got = await getComposition(c.id!);
    expect(got!.title).toBe('Min sang');
  });
});

describe('listCompositions', () => {
  it('returns an empty list when none exist', async () => {
    expect(await listCompositions()).toEqual([]);
  });

  it('returns compositions newest-first', async () => {
    const a = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    await new Promise((r) => setTimeout(r, 5));
    const b = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    await new Promise((r) => setTimeout(r, 5));
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    const list = await listCompositions();
    expect(list.map((x) => x.id)).toEqual([c.id, b.id, a.id]);
  });
});

describe('generateAutoTitle', () => {
  it('picks a deterministic title from the language/weekday pool', () => {
    const t1 = generateAutoTitle('nb', new Date('2026-05-05T12:00:00'), 0); // Tuesday
    const t2 = generateAutoTitle('nb', new Date('2026-05-05T12:00:00'), 0);
    expect(t1).toBe(t2);
  });

  it('returns different pool entries for adjacent counts', () => {
    const t1 = generateAutoTitle('nb', new Date('2026-05-05T12:00:00'), 0);
    const t2 = generateAutoTitle('nb', new Date('2026-05-05T12:00:00'), 1);
    expect(t1).not.toBe(t2);
  });

  it('cycles when count exceeds pool size', () => {
    // Pool size is bounded; the test asserts that 100 calls produce only
    // strings (no undefined / no exception).
    for (let i = 0; i < 100; i++) {
      const t = generateAutoTitle('nb', new Date('2026-05-05T12:00:00'), i);
      expect(typeof t).toBe('string');
      expect(t.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/db/compositions.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `compositions.ts`**

Create `/home/eivind/code/fumletone/src/lib/db/compositions.ts`:

```ts
import { db } from './db';
import type {
  Composition,
  Language,
  NotePlacement,
} from './schema';
import nb from '$lib/i18n/nb.json';
import en from '$lib/i18n/en.json';

const POOLS = { nb, en } as const;

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

function poolFor(language: Language, weekday: WeekdayKey): string[] {
  // i18n JSON shape is { compositionTitles: { monday: [...], ... } }
  const pack = POOLS[language] as unknown as {
    compositionTitles?: Record<WeekdayKey, string[]>;
  };
  const list = pack.compositionTitles?.[weekday];
  if (!list || list.length === 0) {
    // Defensive fallback so a missing pool doesn't crash composing.
    return language === 'nb' ? ['Ny sang'] : ['New song'];
  }
  return list;
}

export function generateAutoTitle(
  language: Language,
  when: Date,
  countIndex: number,
): string {
  const weekday = WEEKDAY_KEYS[when.getDay()];
  const pool = poolFor(language, weekday);
  return pool[countIndex % pool.length];
}

export async function createComposition(opts: {
  firstNote: NotePlacement;
  language: Language;
  now?: Date;
}): Promise<Composition> {
  const now = opts.now ?? new Date();
  const count = await db.compositions.count();
  const title = generateAutoTitle(opts.language, now, count);
  const row: Composition = {
    title,
    notes: [opts.firstNote],
    createdAt: now,
    updatedAt: now,
  };
  const id = await db.compositions.add(row);
  return { ...row, id };
}

export async function getComposition(id: number): Promise<Composition | null> {
  const row = await db.compositions.get(id);
  return row ?? null;
}

export async function updateComposition(
  id: number,
  patch: Partial<Pick<Composition, 'title' | 'notes'>>,
  now: Date = new Date(),
): Promise<void> {
  await db.compositions.update(id, { ...patch, updatedAt: now });
}

export async function listCompositions(): Promise<Composition[]> {
  return db.compositions.orderBy('createdAt').reverse().toArray();
}

export async function compositionCount(): Promise<number> {
  return db.compositions.count();
}
```

- [ ] **Step 4: Provisional i18n stub so the import resolves**

The tests above import `$lib/i18n/nb.json` and `$lib/i18n/en.json` — Plan 1 already created these. Task 11 fills in the `compositionTitles` keys; for now we add empty placeholders so the test fallbacks ("Ny sang" / "New song") fire and `generateAutoTitle` works. Append the following key to `/home/eivind/code/fumletone/src/lib/i18n/nb.json` (place it after the existing top-level keys, with a leading comma in the existing JSON):

```json
,"compositionTitles": {
    "sunday": ["Søndagens sang"],
    "monday": ["Mandagens melodi"],
    "tuesday": ["Tirsdagens tone"],
    "wednesday": ["Onsdagens vise"],
    "thursday": ["Torsdagens tema"],
    "friday": ["Fredagens flytrille"],
    "saturday": ["Lørdagens leik"]
  }
```

And to `/home/eivind/code/fumletone/src/lib/i18n/en.json`:

```json
,"compositionTitles": {
    "sunday": ["Sunday's song"],
    "monday": ["Monday's melody"],
    "tuesday": ["Tuesday's tune"],
    "wednesday": ["Wednesday's whistle"],
    "thursday": ["Thursday's theme"],
    "friday": ["Friday's fumble"],
    "saturday": ["Saturday's serenade"]
  }
```

(Task 11 expands these pools.)

- [ ] **Step 5: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/db/compositions.test.ts
```

Expected: all 11 composition tests pass. Note: the "uses the language-specific pool" test asserts that NB titles don't contain `Tuesday/Tune/Friday/Sunday`; with the stub pools above, NB May-5-2026 (Tuesday) yields "Tirsdagens tone" — passes.

- [ ] **Step 6: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/db/compositions.ts src/lib/i18n/nb.json src/lib/i18n/en.json tests/unit/db/compositions.test.ts && git commit -m "db: compositions CRUD + auto-title from weekday pools"
```

---

## Task 5: Audio voice abstraction (interface + synth + sampler)

**Files:**
- Create: `src/lib/audio/voice.ts`, `src/lib/audio/synthVoice.ts`, `src/lib/audio/samplerVoice.ts`
- Create: `public/audio/samples/violin/manifest.json`, `public/audio/samples/cello/manifest.json`
- Create: `public/audio/samples/violin/README.md`, `public/audio/samples/cello/README.md`
- Test: `tests/unit/audio/voice.test.ts`, `tests/unit/audio/synthVoice.test.ts`, `tests/unit/audio/samplerVoice.test.ts`

The `InstrumentVoice` interface plus two implementations. Plan 2 ships with the synth path active; the sampler path exists but reads empty manifests and falls through to a synth fallback.

- [ ] **Step 1: Write failing tests for the voice factory**

Create `/home/eivind/code/fumletone/tests/unit/audio/voice.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('tone', () => {
  const PluckSynth = vi.fn(function () {
    return { connect: vi.fn(), triggerAttackRelease: vi.fn() };
  });
  const Sampler = vi.fn(function () {
    return { connect: vi.fn(), triggerAttackRelease: vi.fn() };
  });
  const Volume = vi.fn(function () {
    return { connect: vi.fn(), toDestination: vi.fn().mockReturnThis() };
  });
  const Limiter = vi.fn(function () {
    return { connect: vi.fn(), toDestination: vi.fn().mockReturnThis() };
  });
  return {
    PluckSynth,
    Sampler,
    Volume,
    Limiter,
    Transport: { schedule: vi.fn(), cancel: vi.fn() },
    start: vi.fn().mockResolvedValue(undefined),
    getContext: () => ({ state: 'running' }),
  };
});

import { createVoice } from '$lib/audio/voice';

describe('createVoice factory', () => {
  it('returns a synth voice in default mode', () => {
    const v = createVoice('violin', 'synth');
    expect(typeof v.playNote).toBe('function');
    expect(typeof v.playSequence).toBe('function');
  });

  it('returns a sampler voice when mode is sampler', () => {
    const v = createVoice('violin', 'sampler');
    expect(typeof v.playNote).toBe('function');
  });
});
```

- [ ] **Step 2: Write failing tests for the synth voice**

Create `/home/eivind/code/fumletone/tests/unit/audio/synthVoice.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const triggerAttackRelease = vi.fn();
vi.mock('tone', () => ({
  PluckSynth: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), triggerAttackRelease };
  }),
  Volume: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Limiter: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Transport: { schedule: vi.fn(), cancel: vi.fn() },
}));

import { SynthVoice } from '$lib/audio/synthVoice';

beforeEach(() => {
  triggerAttackRelease.mockReset();
});

describe('SynthVoice.playNote', () => {
  it('triggers attack-release on the underlying PluckSynth with Tone-formatted pitch', () => {
    const v = new SynthVoice('violin');
    v.playNote(
      { step: 'C', octave: 4, accidental: 'natural' },
      0.667,
    );
    expect(triggerAttackRelease).toHaveBeenCalledWith('C4', 0.667);
  });

  it('formats sharps correctly', () => {
    const v = new SynthVoice('violin');
    v.playNote(
      { step: 'F', octave: 5, accidental: 'sharp' },
      0.333,
    );
    expect(triggerAttackRelease).toHaveBeenCalledWith('F#5', 0.333);
  });
});
```

- [ ] **Step 3: Write failing tests for the sampler voice**

Create `/home/eivind/code/fumletone/tests/unit/audio/samplerVoice.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const samplerInstance = {
  connect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
  loaded: true,
};
const synthInstance = {
  connect: vi.fn().mockReturnThis(),
  triggerAttackRelease: vi.fn(),
};

vi.mock('tone', () => ({
  Sampler: vi.fn(function () {
    return samplerInstance;
  }),
  PluckSynth: vi.fn(function () {
    return synthInstance;
  }),
  Volume: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Limiter: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Transport: { schedule: vi.fn(), cancel: vi.fn() },
}));

// Mock fetch for manifest loading
global.fetch = vi.fn(async (url: string) => ({
  ok: true,
  json: async () => {
    if (url.includes('violin')) return { pitches: [] };
    return { pitches: [{ note: 'C2', url: 'C2.mp3' }] };
  },
})) as unknown as typeof fetch;

import { SamplerVoice } from '$lib/audio/samplerVoice';

describe('SamplerVoice with empty manifest', () => {
  it('falls through to a synth fallback when manifest is empty', async () => {
    const v = new SamplerVoice('violin');
    await v.ready();
    v.playNote({ step: 'C', octave: 4, accidental: 'natural' }, 0.667);
    expect(synthInstance.triggerAttackRelease).toHaveBeenCalled();
  });
});

describe('SamplerVoice with populated manifest', () => {
  it('uses the sampler when manifest has pitches', async () => {
    samplerInstance.triggerAttackRelease.mockReset();
    const v = new SamplerVoice('cello');
    await v.ready();
    v.playNote({ step: 'C', octave: 2, accidental: 'natural' }, 2.667);
    expect(samplerInstance.triggerAttackRelease).toHaveBeenCalledWith('C2', 2.667);
  });
});
```

- [ ] **Step 4: Run all three to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio/
```

Expected: FAIL — modules not found.

- [ ] **Step 5: Implement `voice.ts`**

Create `/home/eivind/code/fumletone/src/lib/audio/voice.ts`:

```ts
import type { Instrument, PitchSpec } from '$lib/db/schema';
import { SynthVoice } from './synthVoice';
import { SamplerVoice } from './samplerVoice';

export type VoiceMode = 'synth' | 'sampler';

export interface ScheduledNote {
  pitch: PitchSpec;
  startSeconds: number;
  durationSeconds: number;
}

export interface InstrumentVoice {
  playNote(pitch: PitchSpec, durationSeconds: number): void;
  playSequence(notes: ScheduledNote[]): Promise<void>;
  setLoop(enabled: boolean): void;
  ready(): Promise<void>;
}

export function createVoice(
  instrument: Instrument,
  mode: VoiceMode = 'synth',
): InstrumentVoice {
  return mode === 'sampler'
    ? new SamplerVoice(instrument)
    : new SynthVoice(instrument);
}
```

- [ ] **Step 6: Implement `synthVoice.ts`**

Create `/home/eivind/code/fumletone/src/lib/audio/synthVoice.ts`:

```ts
import * as Tone from 'tone';
import type { Instrument, PitchSpec } from '$lib/db/schema';
import { toToneNote } from '$lib/notation/pitchSpec';
import type { InstrumentVoice, ScheduledNote } from './voice';

export class SynthVoice implements InstrumentVoice {
  private synth: Tone.PluckSynth;
  private loop = false;

  constructor(_instrument: Instrument) {
    // Both instruments use PluckSynth in Plan 2; Plan 5 swaps to samples.
    const limiter = new Tone.Limiter(-2).toDestination();
    const volume = new Tone.Volume(-6).connect(limiter);
    this.synth = new Tone.PluckSynth({
      attackNoise: 0.5,
      dampening: 4000,
      resonance: 0.85,
    }).connect(volume);
  }

  playNote(pitch: PitchSpec, durationSeconds: number): void {
    this.synth.triggerAttackRelease(
      toToneNote(pitch),
      durationSeconds,
    );
  }

  async playSequence(notes: ScheduledNote[]): Promise<void> {
    Tone.Transport.cancel();
    for (const n of notes) {
      Tone.Transport.schedule((time) => {
        this.synth.triggerAttackRelease(
          toToneNote(n.pitch),
          n.durationSeconds,
          time,
        );
      }, n.startSeconds);
    }
    Tone.Transport.start();
  }

  setLoop(enabled: boolean): void {
    this.loop = enabled;
    Tone.Transport.loop = enabled;
  }

  async ready(): Promise<void> {
    return;
  }
}
```

- [ ] **Step 7: Implement `samplerVoice.ts`**

Create `/home/eivind/code/fumletone/src/lib/audio/samplerVoice.ts`:

```ts
import * as Tone from 'tone';
import type { Instrument, PitchSpec } from '$lib/db/schema';
import { toToneNote } from '$lib/notation/pitchSpec';
import type { InstrumentVoice, ScheduledNote } from './voice';
import { SynthVoice } from './synthVoice';

interface ManifestEntry {
  note: string;
  url: string;
}

interface Manifest {
  pitches: ManifestEntry[];
}

const SAMPLE_BASE: Record<Instrument, string> = {
  violin: '/audio/samples/violin/',
  cello: '/audio/samples/cello/',
};

export class SamplerVoice implements InstrumentVoice {
  private sampler: Tone.Sampler | null = null;
  private fallback: SynthVoice;
  private readyPromise: Promise<void>;
  private loop = false;

  constructor(private instrument: Instrument) {
    this.fallback = new SynthVoice(instrument);
    this.readyPromise = this.load();
  }

  private async load(): Promise<void> {
    let manifest: Manifest;
    try {
      const res = await fetch(`${SAMPLE_BASE[this.instrument]}manifest.json`);
      manifest = res.ok ? await res.json() : { pitches: [] };
    } catch {
      manifest = { pitches: [] };
    }
    if (manifest.pitches.length === 0) return; // synth fallback stays in charge

    const urls: Record<string, string> = {};
    for (const p of manifest.pitches) {
      urls[p.note] = p.url;
    }
    const limiter = new Tone.Limiter(-2).toDestination();
    const volume = new Tone.Volume(-6).connect(limiter);
    this.sampler = new Tone.Sampler({
      urls,
      baseUrl: SAMPLE_BASE[this.instrument],
    }).connect(volume);
    await Tone.loaded();
  }

  ready(): Promise<void> {
    return this.readyPromise;
  }

  playNote(pitch: PitchSpec, durationSeconds: number): void {
    if (this.sampler) {
      this.sampler.triggerAttackRelease(toToneNote(pitch), durationSeconds);
    } else {
      this.fallback.playNote(pitch, durationSeconds);
    }
  }

  async playSequence(notes: ScheduledNote[]): Promise<void> {
    if (this.sampler) {
      Tone.Transport.cancel();
      for (const n of notes) {
        Tone.Transport.schedule((time) => {
          this.sampler!.triggerAttackRelease(
            toToneNote(n.pitch),
            n.durationSeconds,
            time,
          );
        }, n.startSeconds);
      }
      Tone.Transport.start();
    } else {
      await this.fallback.playSequence(notes);
    }
  }

  setLoop(enabled: boolean): void {
    this.loop = enabled;
    Tone.Transport.loop = enabled;
    this.fallback.setLoop(enabled);
  }
}
```

- [ ] **Step 8: Create the empty sample manifests and READMEs**

Create `/home/eivind/code/fumletone/public/audio/samples/violin/manifest.json`:

```json
{ "pitches": [] }
```

Create `/home/eivind/code/fumletone/public/audio/samples/cello/manifest.json`:

```json
{ "pitches": [] }
```

Create `/home/eivind/code/fumletone/public/audio/samples/violin/README.md`:

```markdown
# Violin samples (placeholder)

Plan 2 ships with an empty manifest. The `SamplerVoice` reads `manifest.json`,
sees no pitches, and falls through to a `SynthVoice` (Tone.PluckSynth).

Plan 5 fills in this folder with CC-licensed recorded violin pitches and
populates `manifest.json` with `{ "note": "<spn>", "url": "<filename>" }`
entries. No code change is required at that point — the factory in
`src/lib/audio/voice.ts` will start using the sampler path when the manifest
is non-empty.
```

Create `/home/eivind/code/fumletone/public/audio/samples/cello/README.md`:

```markdown
# Cello samples (placeholder)

Plan 2 ships with an empty manifest. The `SamplerVoice` reads `manifest.json`,
sees no pitches, and falls through to a `SynthVoice` (Tone.PluckSynth).

Plan 5 fills in this folder with CC-licensed recorded cello pitches and
populates `manifest.json` with `{ "note": "<spn>", "url": "<filename>" }`
entries.
```

- [ ] **Step 9: Run audio tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio/
```

Expected: all voice / synthVoice / samplerVoice tests pass.

- [ ] **Step 10: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 11: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/audio/voice.ts src/lib/audio/synthVoice.ts src/lib/audio/samplerVoice.ts public/audio/ tests/unit/audio/ && git commit -m "audio: InstrumentVoice abstraction with synth + sampler implementations (sampler latent)"
```

---

## Task 6: Playback scheduler

**Files:**
- Create: `src/lib/audio/playback.ts`
- Test: `tests/unit/audio/playback.test.ts`

Walks a composition's `NotePlacement[]`, computes second-offsets at 90 bpm, and feeds them into `voice.playSequence`. Loop mode toggles `Tone.Transport.loop`.

- [ ] **Step 1: Write the failing tests**

Create `/home/eivind/code/fumletone/tests/unit/audio/playback.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { compositionToScheduled, BPM, durationSeconds } from '$lib/audio/playback';
import type { Composition } from '$lib/db/schema';

describe('durationSeconds at 90 bpm', () => {
  it('quarter = 60/90 seconds', () => {
    expect(durationSeconds('quarter')).toBeCloseTo(60 / 90, 5);
  });
  it('half = 2 * quarter', () => {
    expect(durationSeconds('half')).toBeCloseTo((60 / 90) * 2, 5);
  });
  it('whole = 4 * quarter', () => {
    expect(durationSeconds('whole')).toBeCloseTo((60 / 90) * 4, 5);
  });
  it('eighth = quarter / 2', () => {
    expect(durationSeconds('eighth')).toBeCloseTo((60 / 90) / 2, 5);
  });
});

describe('compositionToScheduled', () => {
  it('emits a ScheduledNote per NotePlacement at the right offset', () => {
    const c: Composition = {
      title: 't',
      notes: [
        {
          beatIndex: 0,
          duration: 'quarter',
          pitch: { step: 'C', octave: 4, accidental: 'natural' },
        },
        {
          beatIndex: 4,
          duration: 'half',
          pitch: { step: 'D', octave: 4, accidental: 'natural' },
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const scheduled = compositionToScheduled(c);
    expect(scheduled).toHaveLength(2);
    expect(scheduled[0].startSeconds).toBeCloseTo(0, 5);
    expect(scheduled[0].durationSeconds).toBeCloseTo(60 / 90, 5);
    expect(scheduled[1].startSeconds).toBeCloseTo(4 * (60 / 90), 5);
    expect(scheduled[1].durationSeconds).toBeCloseTo(2 * (60 / 90), 5);
  });

  it('confirms BPM is 90', () => {
    expect(BPM).toBe(90);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio/playback.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `playback.ts`**

Create `/home/eivind/code/fumletone/src/lib/audio/playback.ts`:

```ts
import type { Composition, DurationName } from '$lib/db/schema';
import type { ScheduledNote } from './voice';

export const BPM = 90;
const QUARTER = 60 / BPM;

const DURATION_BEATS: Record<DurationName, number> = {
  eighth: 0.5,
  quarter: 1,
  half: 2,
  whole: 4,
};

export function durationSeconds(d: DurationName): number {
  return DURATION_BEATS[d] * QUARTER;
}

export function compositionToScheduled(c: Composition): ScheduledNote[] {
  return c.notes.map((n) => ({
    pitch: n.pitch,
    startSeconds: n.beatIndex * QUARTER,
    durationSeconds: durationSeconds(n.duration),
  }));
}

/**
 * Total composition length in seconds (4 measures of 4/4 at 90 bpm = 16 quarters).
 */
export const COMPOSITION_LENGTH_SECONDS = 16 * QUARTER;
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio/playback.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 5: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/audio/playback.ts tests/unit/audio/playback.test.ts && git commit -m "audio: playback scheduler — composition → ScheduledNote[] at 90 bpm"
```

---

## Task 7: Engine extension and PWA cache widening

**Files:**
- Modify: `src/lib/audio/engine.ts`
- Modify: `vite.config.ts`
- Test: `tests/unit/audio.test.ts` (extend existing)

The Plan 1 `engine.ts` only exposed `unlock()` / `isReady()` / `_resetForTests()`. Plan 2 extends it to lazily create + hold the kid's instrument voice, fronted by a small `getVoice()` accessor. Vite's PWA config widens the precache and adds a runtime cache rule for the audio samples folder.

- [ ] **Step 1: Append failing tests to `tests/unit/audio.test.ts`**

Open `/home/eivind/code/fumletone/tests/unit/audio.test.ts` and append:

```ts
import { getVoice, _resetForTests as _resetEngine } from '$lib/audio/engine';

describe('getVoice', () => {
  beforeEach(() => {
    _resetEngine();
  });

  it('throws if called before unlock', () => {
    expect(() => getVoice('violin')).toThrow();
  });

  it('returns a voice after unlock', async () => {
    await unlock();
    const v = getVoice('violin');
    expect(typeof v.playNote).toBe('function');
  });

  it('returns the same voice across calls (stable identity)', async () => {
    await unlock();
    const v1 = getVoice('violin');
    const v2 = getVoice('violin');
    expect(v1).toBe(v2);
  });

  it('returns a different voice when instrument changes', async () => {
    await unlock();
    const v1 = getVoice('violin');
    const v2 = getVoice('cello');
    expect(v1).not.toBe(v2);
  });
});
```

The existing Plan 1 mock at the top of the file (`vi.mock('tone', ...)`) needs to also mock `PluckSynth`, `Volume`, `Limiter`, `Transport`. Update the mock body to:

```ts
vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getContext: () => ({ state: 'running' }),
  PluckSynth: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn() };
  }),
  Sampler: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn() };
  }),
  Volume: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Limiter: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Transport: { schedule: vi.fn(), cancel: vi.fn(), start: vi.fn(), loop: false },
  loaded: vi.fn().mockResolvedValue(undefined),
}));
```

(Stub fetch globally for the SamplerVoice import path — only matters if any test path constructs a SamplerVoice; existing engine tests don't, but the global mock keeps things deterministic):

```ts
global.fetch = vi.fn(async () => ({
  ok: true,
  json: async () => ({ pitches: [] }),
})) as unknown as typeof fetch;
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio.test.ts
```

Expected: FAIL — `getVoice` not exported.

- [ ] **Step 3: Extend `engine.ts`**

Replace the body of `/home/eivind/code/fumletone/src/lib/audio/engine.ts`:

```ts
import * as Tone from 'tone';
import type { Instrument } from '$lib/db/schema';
import type { InstrumentVoice, VoiceMode } from './voice';
import { createVoice } from './voice';

let started = false;
const voices = new Map<Instrument, InstrumentVoice>();

const VOICE_MODE: VoiceMode = 'synth';
// ^^^ Plan 5 flips this to 'sampler' once the sample manifests are populated.

export async function unlock(): Promise<void> {
  if (started) return;
  await Tone.start();
  started = true;
}

export function isReady(): boolean {
  return started;
}

export function getVoice(instrument: Instrument): InstrumentVoice {
  if (!started) {
    throw new Error('audio engine not unlocked yet');
  }
  let v = voices.get(instrument);
  if (!v) {
    v = createVoice(instrument, VOICE_MODE);
    voices.set(instrument, v);
  }
  return v;
}

export function _resetForTests(): void {
  started = false;
  voices.clear();
}
```

- [ ] **Step 4: Run engine tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/audio.test.ts
```

Expected: all engine tests pass (Plan 1's three plus the four new ones).

- [ ] **Step 5: Widen the PWA service-worker cache**

Edit `/home/eivind/code/fumletone/vite.config.ts`. Find the `globPatterns` entry inside the `VitePWA` plugin config. Currently it covers `js/css/html/svg/png/woff2`. Replace the line with:

```ts
globPatterns: ['**/*.{js,css,html,svg,png,woff2,mp3,ogg,json}'],
```

Then, in the same plugin config, find the `runtimeCaching` array (or add one if missing). Add this rule:

```ts
runtimeCaching: [
  {
    urlPattern: /\/audio\/samples\/.*$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'fumletone-audio-samples',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      },
    },
  },
],
```

If `runtimeCaching` already existed in the Plan 1 file, append the rule object to that array instead of replacing.

- [ ] **Step 6: Verify the build still produces a service worker**

```bash
cd /home/eivind/code/fumletone && npm run build
```

Expected: build succeeds; `dist/sw.js` is generated; no errors. (You can `grep` the generated SW for `audio/samples` or `mp3` to confirm the patterns are present, but a clean build is a sufficient pass signal.)

- [ ] **Step 7: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/audio/engine.ts vite.config.ts tests/unit/audio.test.ts && git commit -m "audio: engine holds InstrumentVoice per instrument; PWA cache widened to mp3/ogg + audio/samples runtime rule"
```

---

## Task 8: Gesture detection state machine

**Files:**
- Create: `src/lib/notation/gestures.ts`
- Test: `tests/unit/notation/gestures.test.ts`

A pure-JS state machine that converts pointer events into typed gestures: `tap`, `doubleTap`, `longPress`, `dragStart` / `dragMove` / `dragEnd`. Centralising timing logic here keeps it out of Svelte and makes it testable with `vi.useFakeTimers()`.

Thresholds:
- Single-vs-double-tap window: **250 ms**
- Long-press threshold: **400 ms**
- Drag activation distance: **8 px** (movement before long-press fires escapes early as a drag instead)

- [ ] **Step 1: Write failing tests**

Create `/home/eivind/code/fumletone/tests/unit/notation/gestures.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GestureRecogniser,
  type GestureEvent,
} from '$lib/notation/gestures';

let events: GestureEvent[];
let r: GestureRecogniser;

beforeEach(() => {
  vi.useFakeTimers();
  events = [];
  r = new GestureRecogniser((e) => events.push(e));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('single tap', () => {
  it('emits a tap after the double-tap window', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    r.pointerUp({ x: 10, y: 10, t: 50 });
    vi.advanceTimersByTime(260);
    expect(events).toEqual([{ type: 'tap', x: 10, y: 10 }]);
  });
});

describe('double tap', () => {
  it('emits doubleTap when two taps land within 250ms', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    r.pointerUp({ x: 10, y: 10, t: 50 });
    r.pointerDown({ x: 11, y: 11, t: 100 });
    r.pointerUp({ x: 11, y: 11, t: 150 });
    vi.advanceTimersByTime(260);
    expect(events).toEqual([{ type: 'doubleTap', x: 11, y: 11 }]);
  });

  it('does not emit a single tap when a double tap lands', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    r.pointerUp({ x: 10, y: 10, t: 50 });
    r.pointerDown({ x: 11, y: 11, t: 100 });
    r.pointerUp({ x: 11, y: 11, t: 150 });
    vi.advanceTimersByTime(500);
    expect(events.filter((e) => e.type === 'tap')).toEqual([]);
  });
});

describe('long press', () => {
  it('emits longPress at the threshold when the finger stays put', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    vi.advanceTimersByTime(401);
    expect(events).toEqual([{ type: 'longPress', x: 10, y: 10 }]);
  });

  it('does not emit longPress if the finger lifts first', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    vi.advanceTimersByTime(300);
    r.pointerUp({ x: 10, y: 10, t: 300 });
    vi.advanceTimersByTime(200);
    expect(events.filter((e) => e.type === 'longPress')).toEqual([]);
  });
});

describe('drag (after long-press)', () => {
  it('emits dragStart / dragMove / dragEnd after long-press fires', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    vi.advanceTimersByTime(401);
    r.pointerMove({ x: 30, y: 20, t: 410 });
    r.pointerUp({ x: 30, y: 20, t: 500 });
    expect(events.map((e) => e.type)).toEqual([
      'longPress',
      'dragStart',
      'dragMove',
      'dragEnd',
    ]);
    const drag = events.find((e) => e.type === 'dragMove') as Extract<
      GestureEvent,
      { type: 'dragMove' }
    >;
    expect(drag.x).toBe(30);
    expect(drag.y).toBe(20);
  });
});

describe('cancellation on early move', () => {
  it('cancels a pending tap if the finger moves more than 8px before lifting', () => {
    r.pointerDown({ x: 10, y: 10, t: 0 });
    r.pointerMove({ x: 30, y: 10, t: 50 });
    r.pointerUp({ x: 30, y: 10, t: 100 });
    vi.advanceTimersByTime(500);
    // No tap, no double-tap, no long-press
    expect(events).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/notation/gestures.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `gestures.ts`**

Create `/home/eivind/code/fumletone/src/lib/notation/gestures.ts`:

```ts
export interface PointerSample {
  x: number;
  y: number;
  t: number;
}

export type GestureEvent =
  | { type: 'tap'; x: number; y: number }
  | { type: 'doubleTap'; x: number; y: number }
  | { type: 'longPress'; x: number; y: number }
  | { type: 'dragStart'; x: number; y: number }
  | { type: 'dragMove'; x: number; y: number }
  | { type: 'dragEnd'; x: number; y: number };

const DOUBLE_TAP_WINDOW_MS = 250;
const LONG_PRESS_MS = 400;
const DRAG_DISTANCE_PX = 8;

export class GestureRecogniser {
  private down: PointerSample | null = null;
  private lastTap: { x: number; y: number; t: number } | null = null;
  private pendingTapTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private inDrag = false;
  private cancelled = false;

  constructor(private emit: (e: GestureEvent) => void) {}

  pointerDown(s: PointerSample): void {
    this.cancelled = false;
    this.inDrag = false;
    this.down = s;
    this.longPressTimer = setTimeout(() => {
      if (!this.down || this.cancelled) return;
      this.emit({ type: 'longPress', x: this.down.x, y: this.down.y });
      this.inDrag = true;
      this.emit({ type: 'dragStart', x: this.down.x, y: this.down.y });
    }, LONG_PRESS_MS);
  }

  pointerMove(s: PointerSample): void {
    if (!this.down) return;
    if (this.inDrag) {
      this.emit({ type: 'dragMove', x: s.x, y: s.y });
      return;
    }
    const dx = s.x - this.down.x;
    const dy = s.y - this.down.y;
    if (Math.hypot(dx, dy) > DRAG_DISTANCE_PX) {
      // Movement before long-press fires cancels the pending tap.
      this.cancelled = true;
      this.clearLongPressTimer();
    }
  }

  pointerUp(s: PointerSample): void {
    if (this.inDrag) {
      this.emit({ type: 'dragEnd', x: s.x, y: s.y });
      this.reset();
      return;
    }
    this.clearLongPressTimer();
    if (this.cancelled || !this.down) {
      this.reset();
      return;
    }
    // Either a tap or a double-tap.
    const now = s.t;
    if (
      this.lastTap &&
      now - this.lastTap.t <= DOUBLE_TAP_WINDOW_MS
    ) {
      this.cancelPendingTap();
      this.lastTap = null;
      this.emit({ type: 'doubleTap', x: s.x, y: s.y });
      this.reset();
      return;
    }
    // First tap — schedule a single-tap emission unless a second arrives.
    this.lastTap = { x: s.x, y: s.y, t: now };
    const x = s.x;
    const y = s.y;
    this.cancelPendingTap();
    this.pendingTapTimer = setTimeout(() => {
      this.lastTap = null;
      this.emit({ type: 'tap', x, y });
    }, DOUBLE_TAP_WINDOW_MS);
    this.down = null;
  }

  private cancelPendingTap(): void {
    if (this.pendingTapTimer !== null) {
      clearTimeout(this.pendingTapTimer);
      this.pendingTapTimer = null;
    }
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private reset(): void {
    this.down = null;
    this.inDrag = false;
    this.cancelled = false;
    this.clearLongPressTimer();
  }
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/notation/gestures.test.ts
```

Expected: all 7 gesture tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/notation/gestures.ts tests/unit/notation/gestures.test.ts && git commit -m "notation: pure-JS gesture state machine (tap, doubleTap, longPress, drag)"
```

---

## Task 9: Notation component (VexFlow staff renderer)

**Files:**
- Create: `src/lib/notation/Notation.svelte`
- Test: `tests/component/notation/Notation.test.ts`

The Notation component renders a 4-measure staff in the kid's clef using VexFlow, lays out tap zones for each pitch row × beat-position, and emits typed events corresponding to gesture outcomes:

- `place` — fired when an empty position is tapped (the `Composer` decides whether this is a placement or a replacement based on existing column state).
- `cycleDuration` — fired when an existing note is single-tapped.
- `cycleAccidental` — fired when an existing note is double-tapped.
- `grab`, `dragMove`, `dragEnd` — fired by long-press + drag, with the current target pitch row + the off-staff signal.

The component also accepts a `playCursorBeat` prop for highlighting during playback, and a `readOnly` prop that suppresses gesture wiring (used by `ScrapbookTile`).

- [ ] **Step 1: Write failing component tests**

Create `/home/eivind/code/fumletone/tests/component/notation/Notation.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Notation from '$lib/notation/Notation.svelte';
import type { NotePlacement } from '$lib/db/schema';

describe('Notation component', () => {
  it('renders an SVG staff for the given clef', () => {
    const { container } = render(Notation, {
      props: {
        clef: 'treble',
        instrument: 'violin',
        notes: [],
        readOnly: false,
      },
    });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('renders one note glyph per NotePlacement', () => {
    const notes: NotePlacement[] = [
      {
        beatIndex: 0,
        duration: 'quarter',
        pitch: { step: 'C', octave: 4, accidental: 'natural' },
      },
      {
        beatIndex: 4,
        duration: 'half',
        pitch: { step: 'D', octave: 4, accidental: 'natural' },
      },
    ];
    const { container } = render(Notation, {
      props: { clef: 'treble', instrument: 'violin', notes, readOnly: false },
    });
    const noteheads = container.querySelectorAll('.vf-notehead');
    expect(noteheads.length).toBeGreaterThanOrEqual(2);
  });

  it('emits a place event when an empty cell is tapped', async () => {
    const handlePlace = vi.fn();
    const { container, component } = render(Notation, {
      props: {
        clef: 'treble',
        instrument: 'violin',
        notes: [],
        readOnly: false,
      },
    });
    component.$on('place', handlePlace);
    const svg = container.querySelector('svg')!;
    // The Notation component exposes a test hook that converts a
    // logical (beatIndex, pitch-row-index) into a synthetic pointer event,
    // so we don't have to reproduce the layout math here.
    (component as unknown as { _testTap: (b: number, r: number) => void })._testTap(
      0,
      0,
    );
    expect(handlePlace).toHaveBeenCalled();
    const evt = handlePlace.mock.calls[0][0] as CustomEvent;
    expect(evt.detail.beatIndex).toBe(0);
    expect(evt.detail.pitch.step).toBeDefined();
  });

  it('does not emit gesture events in readOnly mode', async () => {
    const handlePlace = vi.fn();
    const { container, component } = render(Notation, {
      props: {
        clef: 'treble',
        instrument: 'violin',
        notes: [],
        readOnly: true,
      },
    });
    component.$on('place', handlePlace);
    (component as unknown as { _testTap?: (b: number, r: number) => void })._testTap?.(
      0,
      0,
    );
    expect(handlePlace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/notation/
```

Expected: FAIL — component not found.

- [ ] **Step 3: Implement `Notation.svelte`**

Create `/home/eivind/code/fumletone/src/lib/notation/Notation.svelte`:

```svelte
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    Renderer,
    Stave,
    StaveNote,
    Voice,
    Formatter,
    Accidental,
  } from 'vexflow';
  import type { Instrument, NotePlacement, PitchSpec } from '$lib/db/schema';
  import { firstPositionRange } from '$lib/notation/pitchRange';
  import { toVexKey, pitchEquals } from '$lib/notation/pitchSpec';
  import { GestureRecogniser, type GestureEvent } from '$lib/notation/gestures';

  type Clef = 'treble' | 'bass';

  let { clef, instrument, notes, readOnly = false, playCursorBeat = -1 } = $props<{
    clef: Clef;
    instrument: Instrument;
    notes: NotePlacement[];
    readOnly?: boolean;
    playCursorBeat?: number;
  }>();

  const dispatch = createEventDispatcher<{
    place: { beatIndex: number; pitch: PitchSpec };
    cycleDuration: { beatIndex: number };
    cycleAccidental: { beatIndex: number };
    grab: { beatIndex: number };
    dragMove: { x: number; y: number; pitch: PitchSpec | null; offStaff: boolean };
    dragEnd: { x: number; y: number; pitch: PitchSpec | null; offStaff: boolean };
  }>();

  let host: HTMLDivElement;
  let svgEl: SVGSVGElement | null = null;
  const STAFF_WIDTH = 800;
  const STAFF_HEIGHT_PER_ROW = 32;
  const TOP_MARGIN = 40;
  const LEFT_MARGIN = 60;
  const BEATS_PER_MEASURE = 4;
  const MEASURES = 4;
  const TOTAL_BEATS = BEATS_PER_MEASURE * MEASURES;

  const pitchRange = firstPositionRange(instrument);
  // Reverse so that high pitches are at the top of the SVG (lower y).
  const pitchRows = [...pitchRange].reverse();

  function rowYCenter(rowIndex: number): number {
    return TOP_MARGIN + rowIndex * STAFF_HEIGHT_PER_ROW + STAFF_HEIGHT_PER_ROW / 2;
  }

  function beatXCenter(beatIndex: number): number {
    const usable = STAFF_WIDTH - LEFT_MARGIN - 20;
    const colWidth = usable / TOTAL_BEATS;
    return LEFT_MARGIN + beatIndex * colWidth + colWidth / 2;
  }

  function xToBeatIndex(x: number): number {
    const usable = STAFF_WIDTH - LEFT_MARGIN - 20;
    const colWidth = usable / TOTAL_BEATS;
    const i = Math.floor((x - LEFT_MARGIN) / colWidth);
    return Math.max(0, Math.min(TOTAL_BEATS - 1, i));
  }

  function yToRowIndex(y: number): number {
    const i = Math.floor((y - TOP_MARGIN) / STAFF_HEIGHT_PER_ROW);
    return Math.max(0, Math.min(pitchRows.length - 1, i));
  }

  function isOffStaff(x: number, y: number): boolean {
    return (
      x < LEFT_MARGIN - 20 ||
      x > STAFF_WIDTH ||
      y < TOP_MARGIN - STAFF_HEIGHT_PER_ROW ||
      y > TOP_MARGIN + pitchRows.length * STAFF_HEIGHT_PER_ROW + STAFF_HEIGHT_PER_ROW
    );
  }

  function noteAtBeat(beatIndex: number): NotePlacement | undefined {
    return notes.find((n) => n.beatIndex === beatIndex);
  }

  function noteAtCell(beatIndex: number, rowIndex: number): NotePlacement | undefined {
    const at = noteAtBeat(beatIndex);
    if (!at) return undefined;
    return pitchEquals(at.pitch, pitchRows[rowIndex]) ? at : undefined;
  }

  let gesture: GestureRecogniser;

  onMount(() => {
    render();
    if (!readOnly) {
      gesture = new GestureRecogniser(handleGesture);
    }
  });

  $effect(() => {
    // Re-render when notes or playCursor change.
    if (host) render();
  });

  function render() {
    host.innerHTML = '';
    const renderer = new Renderer(host, Renderer.Backends.SVG);
    renderer.resize(STAFF_WIDTH, TOP_MARGIN + pitchRows.length * STAFF_HEIGHT_PER_ROW + 20);
    const ctx = renderer.getContext();
    const measureWidth = (STAFF_WIDTH - LEFT_MARGIN) / MEASURES;
    for (let m = 0; m < MEASURES; m++) {
      const stave = new Stave(LEFT_MARGIN + m * measureWidth, TOP_MARGIN, measureWidth);
      if (m === 0) {
        stave.addClef(clef);
        stave.addTimeSignature('4/4');
      }
      stave.setContext(ctx).draw();
      const measureNotes = notes.filter(
        (n) =>
          n.beatIndex >= m * BEATS_PER_MEASURE &&
          n.beatIndex < (m + 1) * BEATS_PER_MEASURE,
      );
      const vexNotes = measureNotes.map((n) => {
        const sn = new StaveNote({
          clef,
          keys: [toVexKey(n.pitch)],
          duration: durationCode(n.duration),
        });
        if (n.pitch.accidental !== 'natural') {
          sn.addModifier(
            new Accidental(n.pitch.accidental === 'sharp' ? '#' : 'b'),
            0,
          );
        }
        return sn;
      });
      // Pad with rests so VexFlow's voice fills 4/4. (Rests are render-only;
      // the data model doesn't store them.)
      const beatsUsed = measureNotes.reduce(
        (acc, n) => acc + DURATION_BEATS[n.duration],
        0,
      );
      const beatsLeft = BEATS_PER_MEASURE - beatsUsed;
      if (beatsLeft > 0) {
        vexNotes.push(
          new StaveNote({
            clef,
            keys: ['b/4'],
            duration: `${restDurationCode(beatsLeft)}r`,
          }),
        );
      }
      if (vexNotes.length > 0) {
        const voice = new Voice({ num_beats: BEATS_PER_MEASURE, beat_value: 4 });
        voice.addTickables(vexNotes);
        new Formatter().joinVoices([voice]).format([voice], measureWidth - 20);
        voice.draw(ctx, stave);
      }
    }
    svgEl = host.querySelector('svg');
    if (svgEl && playCursorBeat >= 0) drawCursor(svgEl);
  }

  function drawCursor(svg: SVGSVGElement) {
    const ns = 'http://www.w3.org/2000/svg';
    const x = beatXCenter(playCursorBeat);
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', String(x));
    line.setAttribute('x2', String(x));
    line.setAttribute('y1', String(TOP_MARGIN - 4));
    line.setAttribute(
      'y2',
      String(TOP_MARGIN + pitchRows.length * STAFF_HEIGHT_PER_ROW),
    );
    line.setAttribute('stroke', 'rgba(255,140,0,0.6)');
    line.setAttribute('stroke-width', '3');
    svg.appendChild(line);
  }

  const DURATION_BEATS: Record<NotePlacement['duration'], number> = {
    eighth: 0.5,
    quarter: 1,
    half: 2,
    whole: 4,
  };

  function durationCode(d: NotePlacement['duration']): string {
    return { quarter: 'q', half: 'h', whole: 'w', eighth: '8' }[d];
  }
  function restDurationCode(beats: number): string {
    if (beats >= 4) return 'w';
    if (beats >= 2) return 'h';
    if (beats >= 1) return 'q';
    return '8';
  }

  function handleGesture(e: GestureEvent) {
    const beat = xToBeatIndex(e.x);
    const row = yToRowIndex(e.y);
    const existing = noteAtBeat(beat);
    const pitch = pitchRows[row];
    const sameCell = !!existing && pitchEquals(existing.pitch, pitch);

    switch (e.type) {
      case 'tap':
        if (sameCell) {
          dispatch('cycleDuration', { beatIndex: beat });
        } else {
          dispatch('place', { beatIndex: beat, pitch });
        }
        return;
      case 'doubleTap':
        if (sameCell) {
          dispatch('cycleAccidental', { beatIndex: beat });
        } else {
          // A double-tap on a different cell first places, then would cycle —
          // we keep it simple: emit a place. (Spec note: this is an
          // edge-case interaction; cycle-accidental requires double-tapping
          // the existing note.)
          dispatch('place', { beatIndex: beat, pitch });
        }
        return;
      case 'longPress':
        if (sameCell) dispatch('grab', { beatIndex: beat });
        return;
      case 'dragMove': {
        const off = isOffStaff(e.x, e.y);
        const p = off ? null : pitchRows[yToRowIndex(e.y)];
        dispatch('dragMove', { x: e.x, y: e.y, pitch: p, offStaff: off });
        return;
      }
      case 'dragEnd': {
        const off = isOffStaff(e.x, e.y);
        const p = off ? null : pitchRows[yToRowIndex(e.y)];
        dispatch('dragEnd', { x: e.x, y: e.y, pitch: p, offStaff: off });
        return;
      }
    }
  }

  function onPointerDown(ev: PointerEvent) {
    if (readOnly) return;
    const r = host.getBoundingClientRect();
    gesture.pointerDown({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: ev.timeStamp });
  }
  function onPointerMove(ev: PointerEvent) {
    if (readOnly) return;
    const r = host.getBoundingClientRect();
    gesture.pointerMove({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: ev.timeStamp });
  }
  function onPointerUp(ev: PointerEvent) {
    if (readOnly) return;
    const r = host.getBoundingClientRect();
    gesture.pointerUp({ x: ev.clientX - r.left, y: ev.clientY - r.top, t: ev.timeStamp });
  }

  // Test hook: dispatch a synthetic gesture without going through pointer events.
  // Tests can call (component as any)._testTap(beatIndex, rowIndex).
  export function _testTap(beatIndex: number, rowIndex: number) {
    if (readOnly) return;
    handleGesture({
      type: 'tap',
      x: beatXCenter(beatIndex),
      y: rowYCenter(rowIndex),
    });
  }
</script>

<div
  bind:this={host}
  class="notation"
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  role="application"
  aria-label="staff editor"
></div>

<style>
  .notation {
    width: 100%;
    max-width: 800px;
    user-select: none;
    touch-action: none;
  }
</style>
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/notation/
```

Expected: 4 tests pass. Note: VexFlow inserts `.vf-notehead` class names; if the assertion finds zero, fall back to counting `<path>` elements within the rendered SVG instead.

- [ ] **Step 5: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/notation/Notation.svelte tests/component/notation/Notation.test.ts && git commit -m "notation: VexFlow staff renderer with gesture wiring; place/cycle/grab/drag events"
```

---

## Task 10: Stores — `currentComposition` and route extensions

**Files:**
- Create: `src/lib/stores/currentComposition.ts`
- Modify: `src/lib/stores/route.ts` (the type union is already extended in Task 2 via `schema.ts`; this just adds a small helper)
- Test: `tests/unit/stores/currentComposition.test.ts`

The `currentComposition` store holds the in-progress composition. It exposes `loadById(id)`, `startFresh()`, and `applyMutation(fn)` which mutates the store + auto-saves.

- [ ] **Step 1: Write failing tests**

Create `/home/eivind/code/fumletone/tests/unit/stores/currentComposition.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  currentComposition,
  startFresh,
  loadById,
  applyMutation,
  _resetForTests,
} from '$lib/stores/currentComposition';
import { db } from '$lib/db/db';
import { createComposition } from '$lib/db/compositions';
import type { NotePlacement } from '$lib/db/schema';

const C4_QUARTER: NotePlacement = {
  beatIndex: 0,
  duration: 'quarter',
  pitch: { step: 'C', octave: 4, accidental: 'natural' },
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  _resetForTests();
});

describe('currentComposition store', () => {
  it('starts as null', () => {
    expect(get(currentComposition)).toBeNull();
  });

  it('startFresh sets the store to null (a fresh empty staff has no row yet)', () => {
    startFresh();
    expect(get(currentComposition)).toBeNull();
  });

  it('loadById fills the store from the database', async () => {
    const c = await createComposition({ firstNote: C4_QUARTER, language: 'nb' });
    await loadById(c.id!);
    const cur = get(currentComposition);
    expect(cur).not.toBeNull();
    expect(cur!.id).toBe(c.id);
  });

  it('applyMutation creates a row on the first mutation when store is null', async () => {
    startFresh();
    await applyMutation(
      (cur) => {
        if (cur) return cur;
        return null; // signal "create with first note"
      },
      { language: 'nb', firstNote: C4_QUARTER },
    );
    const cur = get(currentComposition);
    expect(cur).not.toBeNull();
    expect(cur!.id).toBeDefined();
    expect(cur!.notes).toHaveLength(1);
  });

  it('applyMutation persists subsequent mutations', async () => {
    startFresh();
    await applyMutation(() => null, {
      language: 'nb',
      firstNote: C4_QUARTER,
    });
    await applyMutation((cur) => ({
      ...cur!,
      notes: [
        ...cur!.notes,
        {
          beatIndex: 1,
          duration: 'quarter',
          pitch: { step: 'D', octave: 4, accidental: 'natural' },
        },
      ],
    }));
    const cur = get(currentComposition);
    expect(cur!.notes).toHaveLength(2);
    const reloaded = await db.compositions.get(cur!.id!);
    expect(reloaded!.notes).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/currentComposition.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `currentComposition.ts`**

Create `/home/eivind/code/fumletone/src/lib/stores/currentComposition.ts`:

```ts
import { writable, get } from 'svelte/store';
import type { Composition, Language, NotePlacement } from '$lib/db/schema';
import {
  createComposition,
  getComposition,
  updateComposition,
} from '$lib/db/compositions';

export const currentComposition = writable<Composition | null>(null);

export function startFresh(): void {
  currentComposition.set(null);
}

export async function loadById(id: number): Promise<void> {
  const c = await getComposition(id);
  currentComposition.set(c);
}

export interface MutationContext {
  language: Language;
  firstNote: NotePlacement;
}

/**
 * Apply a mutation to the current composition and persist it.
 *
 * - If the store is null (fresh empty staff) and the mutator returns null,
 *   AND a `MutationContext` is supplied, a new row is created from
 *   `firstNote`.
 * - Otherwise the mutator receives the current composition and must return
 *   the next state (or the same reference, unchanged).
 */
export async function applyMutation(
  mutator: (cur: Composition | null) => Composition | null,
  ctx?: MutationContext,
): Promise<void> {
  const cur = get(currentComposition);
  const next = mutator(cur);

  if (cur === null && next === null && ctx) {
    const created = await createComposition({
      firstNote: ctx.firstNote,
      language: ctx.language,
    });
    currentComposition.set(created);
    return;
  }
  if (next === null) return;
  if (next.id !== undefined) {
    await updateComposition(next.id, {
      title: next.title,
      notes: next.notes,
    });
  }
  currentComposition.set(next);
}

export function _resetForTests(): void {
  currentComposition.set(null);
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/stores/currentComposition.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors. (Plan 1's existing `route.ts` already imports `Route` from `schema.ts`, so its type union is already extended via Task 2's edit.)

- [ ] **Step 6: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/stores/currentComposition.ts tests/unit/stores/currentComposition.test.ts && git commit -m "stores: currentComposition with loadById/startFresh/applyMutation auto-persist"
```

---

## Task 11: i18n strings — composer / scrapbook / make / weekday pools

**Files:**
- Modify: `src/lib/i18n/nb.json`
- Modify: `src/lib/i18n/en.json`
- Test: `tests/unit/i18n.test.ts` (extend existing)

Adds the full Plan 2 string set, including expanded weekday pools so the auto-title generator has variety.

- [ ] **Step 1: Append failing tests**

Open `/home/eivind/code/fumletone/tests/unit/i18n.test.ts` and append:

```ts
describe('plan 2 strings', () => {
  it('exposes make.doorway in both languages', async () => {
    await waitLocale('nb');
    expect(get(_)('make.doorway')).toBe('Lag');
    await waitLocale('en');
    expect(get(_)('make.doorway')).toBe('Make');
  });

  it('exposes composer.play / stop / loop / newComposition in both languages', async () => {
    await waitLocale('nb');
    expect(get(_)('composer.play')).toBe('Spill');
    expect(get(_)('composer.stop')).toBe('Stopp');
    expect(get(_)('composer.loop')).toBe('Gjenta');
    expect(get(_)('composer.newComposition')).toBe('Ny sang');
    await waitLocale('en');
    expect(get(_)('composer.play')).toBe('Play');
    expect(get(_)('composer.stop')).toBe('Stop');
    expect(get(_)('composer.loop')).toBe('Loop');
    expect(get(_)('composer.newComposition')).toBe('New song');
  });

  it('exposes scrapbook section titles in both languages', async () => {
    await waitLocale('nb');
    expect(get(_)('scrapbook.title')).toBe('Skrapboka');
    expect(get(_)('scrapbook.thingsIMade')).toBe('Det jeg har laget');
    await waitLocale('en');
    expect(get(_)('scrapbook.title')).toBe('Scrapbook');
    expect(get(_)('scrapbook.thingsIMade')).toBe('Things I made');
  });

  it('has at least 5 weekday-pool entries per weekday in both languages', async () => {
    const nb = (await import('$lib/i18n/nb.json')).default as Record<string, unknown>;
    const en = (await import('$lib/i18n/en.json')).default as Record<string, unknown>;
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const w of weekdays) {
      expect(
        ((nb.compositionTitles as Record<string, string[]>)[w]).length,
      ).toBeGreaterThanOrEqual(5);
      expect(
        ((en.compositionTitles as Record<string, string[]>)[w]).length,
      ).toBeGreaterThanOrEqual(5);
    }
  });
});
```

(`waitLocale` is the helper Plan 1 added to `tests/unit/i18n.test.ts`; reuse it.)

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/i18n.test.ts
```

Expected: FAIL — keys missing.

- [ ] **Step 3: Update `nb.json`**

In `/home/eivind/code/fumletone/src/lib/i18n/nb.json`, replace the `compositionTitles` block (added in Task 4) with the expanded pools, and add `make`, `composer`, `scrapbook` blocks. Final shape (merge into the existing file, preserving Plan 1's keys):

```json
{
  "make": {
    "doorway": "Lag",
    "doorwayBack": "Tilbake til Fumlehulen"
  },
  "composer": {
    "play": "Spill",
    "stop": "Stopp",
    "loop": "Gjenta",
    "newComposition": "Ny sang",
    "firstTouchHint": "Trykk på en linje"
  },
  "scrapbook": {
    "title": "Skrapboka",
    "thingsIMade": "Det jeg har laget",
    "renamePrompt": "Gi den et navn",
    "renameConfirm": "Greit",
    "renameCancel": "Nei takk"
  },
  "compositionTitles": {
    "sunday": [
      "Søndagens sang",
      "Søndagens sukk",
      "Søndagens sus",
      "Søndagens slingrevise",
      "Søndagens stille tone"
    ],
    "monday": [
      "Mandagens melodi",
      "Mandagens marsj",
      "Mandagens munterhet",
      "Mandagens muntre tone",
      "Mandagens lille sang"
    ],
    "tuesday": [
      "Tirsdagens tone",
      "Tirsdagens trille",
      "Tirsdagens tralle",
      "Tirsdagens taktslag",
      "Tirsdagens turkis tone"
    ],
    "wednesday": [
      "Onsdagens vise",
      "Onsdagens vandring",
      "Onsdagens varme tone",
      "Onsdagens veivise",
      "Onsdagens vimsesang"
    ],
    "thursday": [
      "Torsdagens tema",
      "Torsdagens trille",
      "Torsdagens triolett",
      "Torsdagens tre toner",
      "Torsdagens lille tone"
    ],
    "friday": [
      "Fredagens flytrille",
      "Fredagens fumling",
      "Fredagens fred og toner",
      "Fredagens flygesang",
      "Fredagens festsnurr"
    ],
    "saturday": [
      "Lørdagens leik",
      "Lørdagens lille sang",
      "Lørdagens lette tone",
      "Lørdagens latterstrofe",
      "Lørdagens lange linje"
    ]
  }
}
```

- [ ] **Step 4: Update `en.json`**

In `/home/eivind/code/fumletone/src/lib/i18n/en.json`, the same shape with parallel evocative weight:

```json
{
  "make": {
    "doorway": "Make",
    "doorwayBack": "Back to the Fumling Hollow"
  },
  "composer": {
    "play": "Play",
    "stop": "Stop",
    "loop": "Loop",
    "newComposition": "New song",
    "firstTouchHint": "Tap a line"
  },
  "scrapbook": {
    "title": "Scrapbook",
    "thingsIMade": "Things I made",
    "renamePrompt": "Give it a name",
    "renameConfirm": "OK",
    "renameCancel": "Never mind"
  },
  "compositionTitles": {
    "sunday": [
      "Sunday's song",
      "Sunday's sigh",
      "Sunday's slow tune",
      "Sunday's small song",
      "Sunday's stillness"
    ],
    "monday": [
      "Monday's melody",
      "Monday's march",
      "Monday's muddle",
      "Monday's morning tune",
      "Monday's little song"
    ],
    "tuesday": [
      "Tuesday's tune",
      "Tuesday's trill",
      "Tuesday's tinkle",
      "Tuesday's tap",
      "Tuesday's tiny tone"
    ],
    "wednesday": [
      "Wednesday's whistle",
      "Wednesday's wander",
      "Wednesday's wave",
      "Wednesday's warm tune",
      "Wednesday's little dance"
    ],
    "thursday": [
      "Thursday's theme",
      "Thursday's three notes",
      "Thursday's thrum",
      "Thursday's tinkering",
      "Thursday's lull"
    ],
    "friday": [
      "Friday's fumble",
      "Friday's flight",
      "Friday's fanfare",
      "Friday's flutter",
      "Friday's free tune"
    ],
    "saturday": [
      "Saturday's serenade",
      "Saturday's swing",
      "Saturday's silly song",
      "Saturday's slow dance",
      "Saturday's spin"
    ]
  }
}
```

(The user clears the final NB phrase pool before shipping. EN pool can be tightened too. Both pools are placeholders relative to lasting brand voice — see "Open Items" of the design spec.)

- [ ] **Step 5: Run i18n tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/unit/i18n.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/i18n/nb.json src/lib/i18n/en.json tests/unit/i18n.test.ts && git commit -m "i18n: composer/scrapbook/make strings + expanded weekday auto-title pools"
```

---

## Task 12: Small components — Doorway, ScrapbookIcon, PlayControls, PlusButton, ScrapbookTile

**Files:**
- Create: `src/lib/components/Doorway.svelte`, `ScrapbookIcon.svelte`, `PlayControls.svelte`, `PlusButton.svelte`, `ScrapbookTile.svelte`
- Test: `tests/component/components/Doorway.test.ts`, `PlayControls.test.ts`, `PlusButton.test.ts`, `ScrapbookTile.test.ts`

Five small, focused components. Each is implemented + tested in its own sub-step within this task.

- [ ] **Step 1: Write failing tests for `Doorway`**

Create `/home/eivind/code/fumletone/tests/component/components/Doorway.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Doorway from '$lib/components/Doorway.svelte';

describe('Doorway', () => {
  it('renders with the given label', () => {
    const { getByText } = render(Doorway, {
      props: { label: 'Lag', side: 'right' },
    });
    expect(getByText('Lag')).toBeTruthy();
  });

  it('emits click when tapped', async () => {
    const handler = vi.fn();
    const { getByRole, component } = render(Doorway, {
      props: { label: 'Lag', side: 'right' },
    });
    component.$on('open', handler);
    await fireEvent.click(getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `Doorway.svelte`**

Create `/home/eivind/code/fumletone/src/lib/components/Doorway.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let { label, side = 'right' } = $props<{ label: string; side?: 'right' | 'left' }>();
  const dispatch = createEventDispatcher<{ open: void }>();
</script>

<button
  type="button"
  class="doorway side-{side}"
  on:click={() => dispatch('open')}
  aria-label={label}
>
  <svg viewBox="0 0 60 80" aria-hidden="true">
    <rect x="6" y="4" width="48" height="72" rx="6" ry="6" fill="none" stroke="currentColor" stroke-width="3"/>
    <circle cx="44" cy="40" r="2" fill="currentColor"/>
  </svg>
  <span class="label">{label}</span>
</button>

<style>
  .doorway {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--color-fg, #2d2a26);
    cursor: pointer;
    padding: 8px;
    min-width: 88px;
    min-height: 88px;
  }
  .doorway svg { width: 56px; height: 76px; }
  .label { font-size: 14px; margin-top: 4px; }
</style>
```

- [ ] **Step 3: Run Doorway tests**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/components/Doorway.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 4: Implement `ScrapbookIcon.svelte`**

(No standalone test — covered by `Hub.test.ts` and `Make.test.ts` later.)

Create `/home/eivind/code/fumletone/src/lib/components/ScrapbookIcon.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  const dispatch = createEventDispatcher<{ open: void }>();
</script>

<button
  type="button"
  class="scrapbook-icon"
  on:click={() => dispatch('open')}
  aria-label={$_('scrapbook.title')}
>
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4" y="6" width="24" height="22" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
    <line x1="10" y1="2" x2="10" y2="6" stroke="currentColor" stroke-width="2"/>
    <line x1="22" y1="2" x2="22" y2="6" stroke="currentColor" stroke-width="2"/>
    <line x1="9" y1="13" x2="23" y2="13" stroke="currentColor" stroke-width="1.5"/>
    <line x1="9" y1="18" x2="23" y2="18" stroke="currentColor" stroke-width="1.5"/>
    <line x1="9" y1="23" x2="20" y2="23" stroke="currentColor" stroke-width="1.5"/>
  </svg>
</button>

<style>
  .scrapbook-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 56px;
    height: 56px;
    background: transparent;
    border: 0;
    color: var(--color-fg, #2d2a26);
    cursor: pointer;
  }
  .scrapbook-icon svg { width: 100%; height: 100%; }
</style>
```

- [ ] **Step 5: Write failing tests for `PlayControls`**

Create `/home/eivind/code/fumletone/tests/component/components/PlayControls.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import PlayControls from '$lib/components/PlayControls.svelte';
import { waitLocale } from 'svelte-i18n';

describe('PlayControls', () => {
  it('shows Play when stopped, Stop when playing', async () => {
    await waitLocale('nb');
    const { getByRole, rerender } = render(PlayControls, {
      props: { isPlaying: false, isLooping: false },
    });
    expect(getByRole('button', { name: /Spill/ })).toBeTruthy();
    rerender({ isPlaying: true, isLooping: false });
    expect(getByRole('button', { name: /Stopp/ })).toBeTruthy();
  });

  it('emits play when Play is tapped', async () => {
    await waitLocale('nb');
    const handler = vi.fn();
    const { getByRole, component } = render(PlayControls, {
      props: { isPlaying: false, isLooping: false },
    });
    component.$on('play', handler);
    await fireEvent.click(getByRole('button', { name: /Spill/ }));
    expect(handler).toHaveBeenCalled();
  });

  it('emits toggleLoop when loop toggle is tapped', async () => {
    await waitLocale('nb');
    const handler = vi.fn();
    const { getByRole, component } = render(PlayControls, {
      props: { isPlaying: false, isLooping: false },
    });
    component.$on('toggleLoop', handler);
    await fireEvent.click(getByRole('button', { name: /Gjenta/ }));
    expect(handler).toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Implement `PlayControls.svelte`**

Create `/home/eivind/code/fumletone/src/lib/components/PlayControls.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  let { isPlaying, isLooping } = $props<{ isPlaying: boolean; isLooping: boolean }>();
  const dispatch = createEventDispatcher<{
    play: void;
    stop: void;
    toggleLoop: void;
  }>();
</script>

<div class="play-controls">
  {#if isPlaying}
    <button type="button" class="primary" on:click={() => dispatch('stop')}>
      {$_('composer.stop')}
    </button>
  {:else}
    <button type="button" class="primary" on:click={() => dispatch('play')}>
      {$_('composer.play')}
    </button>
  {/if}
  <button
    type="button"
    class="ghost loop"
    aria-pressed={isLooping}
    on:click={() => dispatch('toggleLoop')}
  >
    {$_('composer.loop')}
  </button>
</div>

<style>
  .play-controls {
    display: flex;
    gap: 16px;
    justify-content: center;
    padding: 16px;
  }
  button {
    min-width: 120px;
    min-height: 56px;
    border-radius: 12px;
    font-size: 18px;
    border: 0;
    cursor: pointer;
  }
  .primary { background: var(--color-accent, #c97); color: var(--color-bg, #fdf6ec); }
  .ghost { background: transparent; color: var(--color-fg, #2d2a26); border: 2px solid currentColor; }
  .ghost[aria-pressed='true'] {
    background: var(--color-fg, #2d2a26);
    color: var(--color-bg, #fdf6ec);
  }
</style>
```

- [ ] **Step 7: Write failing tests for `PlusButton`**

Create `/home/eivind/code/fumletone/tests/component/components/PlusButton.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import PlusButton from '$lib/components/PlusButton.svelte';

describe('PlusButton', () => {
  it('is hidden when isHidden is true', () => {
    const { container } = render(PlusButton, { props: { isHidden: true } });
    expect(container.querySelector('button')).toBeNull();
  });

  it('is visible when isHidden is false', () => {
    const { container } = render(PlusButton, { props: { isHidden: false } });
    expect(container.querySelector('button')).not.toBeNull();
  });

  it('emits new on tap', async () => {
    const handler = vi.fn();
    const { getByRole, component } = render(PlusButton, {
      props: { isHidden: false },
    });
    component.$on('new', handler);
    await fireEvent.click(getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });
});
```

- [ ] **Step 8: Implement `PlusButton.svelte`**

Create `/home/eivind/code/fumletone/src/lib/components/PlusButton.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  let { isHidden } = $props<{ isHidden: boolean }>();
  const dispatch = createEventDispatcher<{ new: void }>();
</script>

{#if !isHidden}
  <button
    type="button"
    class="plus"
    on:click={() => dispatch('new')}
    aria-label={$_('composer.newComposition')}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>
  </button>
{/if}

<style>
  .plus {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: var(--color-accent, #c97);
    color: var(--color-bg, #fdf6ec);
    border: 0;
    cursor: pointer;
  }
  .plus svg { width: 24px; height: 24px; }
</style>
```

- [ ] **Step 9: Write failing tests for `ScrapbookTile`**

Create `/home/eivind/code/fumletone/tests/component/components/ScrapbookTile.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import ScrapbookTile from '$lib/components/ScrapbookTile.svelte';
import type { Composition } from '$lib/db/schema';

const sample: Composition = {
  id: 1,
  title: 'Tirsdagens tone',
  notes: [
    {
      beatIndex: 0,
      duration: 'quarter',
      pitch: { step: 'C', octave: 4, accidental: 'natural' },
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ScrapbookTile', () => {
  it('renders the title', () => {
    const { getByText } = render(ScrapbookTile, {
      props: { composition: sample, instrument: 'violin' },
    });
    expect(getByText('Tirsdagens tone')).toBeTruthy();
  });

  it('emits open when tapped', async () => {
    const handler = vi.fn();
    const { getByRole, component } = render(ScrapbookTile, {
      props: { composition: sample, instrument: 'violin' },
    });
    component.$on('open', handler);
    await fireEvent.click(getByRole('button', { name: /Tirsdagens tone/ }));
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail.id).toBe(1);
  });
});
```

- [ ] **Step 10: Implement `ScrapbookTile.svelte`**

Create `/home/eivind/code/fumletone/src/lib/components/ScrapbookTile.svelte`:

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Notation from '$lib/notation/Notation.svelte';
  import type { Composition, Instrument } from '$lib/db/schema';

  let { composition, instrument } = $props<{
    composition: Composition;
    instrument: Instrument;
  }>();
  const clef = instrument === 'violin' ? ('treble' as const) : ('bass' as const);
  const dispatch = createEventDispatcher<{
    open: { id: number };
    rename: { id: number };
  }>();

  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  function down() {
    pressTimer = setTimeout(() => {
      pressTimer = null;
      dispatch('rename', { id: composition.id! });
    }, 500);
  }
  function up() {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
      dispatch('open', { id: composition.id! });
    }
  }
</script>

<button
  type="button"
  class="tile"
  on:pointerdown={down}
  on:pointerup={up}
  on:pointerleave={() => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  }}
  aria-label={composition.title}
>
  <div class="thumb">
    <Notation {clef} {instrument} notes={composition.notes} readOnly />
  </div>
  <span class="title">{composition.title}</span>
</button>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: rgba(255, 255, 255, 0.6);
    border: 2px solid var(--color-fg, #2d2a26);
    border-radius: 12px;
    padding: 12px;
    cursor: pointer;
    text-align: left;
  }
  .thumb {
    width: 100%;
    transform: scale(0.5);
    transform-origin: top left;
    pointer-events: none;
  }
  .title { font-size: 16px; margin-top: 8px; }
</style>
```

- [ ] **Step 11: Run all small-component tests**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/components/
```

Expected: all 11 tests pass (Doorway 2 + PlayControls 3 + PlusButton 3 + ScrapbookTile 2 + ScrapbookIcon implicit-only).

- [ ] **Step 12: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 13: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/lib/components/ tests/component/components/ && git commit -m "components: Doorway, ScrapbookIcon, PlayControls, PlusButton, ScrapbookTile"
```

---

## Task 13: Composer route

**Files:**
- Create: `src/routes/Composer.svelte`
- Test: `tests/component/routes/Composer.test.ts`

The Composer route assembles the staff (`Notation`), the play controls, the `+` button, the back-to-Hub doorway, the scrapbook icon, and the first-touch hint. It wires:
- `Notation` events → `currentComposition.applyMutation` (with audio preview through `getVoice`)
- `PlayControls` → `playback.compositionToScheduled` + `voice.playSequence`
- `PlusButton` → `startFresh()`
- Doorway → `navigate({ name: 'hub' })` (or `back()` — using `back()` is friendlier to the route stack)

- [ ] **Step 1: Write the failing component test**

Create `/home/eivind/code/fumletone/tests/component/routes/Composer.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Composer from '$routes/Composer.svelte';
import { waitLocale } from 'svelte-i18n';
import { db } from '$lib/db/db';
import { profile, loadProfile } from '$lib/stores/profile';
import { saveProfile } from '$lib/db/db';
import { _resetForTests as _resetEngine } from '$lib/audio/engine';
import { _resetForTests as _resetCurrent } from '$lib/stores/currentComposition';

vi.mock('tone', () => ({
  start: vi.fn().mockResolvedValue(undefined),
  getContext: () => ({ state: 'running' }),
  PluckSynth: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn() };
  }),
  Sampler: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), triggerAttackRelease: vi.fn() };
  }),
  Volume: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Limiter: vi.fn(function () {
    return { connect: vi.fn().mockReturnThis(), toDestination: vi.fn().mockReturnThis() };
  }),
  Transport: { schedule: vi.fn(), cancel: vi.fn(), start: vi.fn(), loop: false },
  loaded: vi.fn().mockResolvedValue(undefined),
}));
global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ pitches: [] }) })) as unknown as typeof fetch;

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveProfile({
    instrument: 'violin',
    language: 'nb',
    onboardingCompletedAt: new Date(),
  });
  await loadProfile();
  _resetEngine();
  _resetCurrent();
  await waitLocale('nb');
});

describe('Composer route', () => {
  it('renders the staff and the controls', () => {
    const { container, getByRole } = render(Composer);
    expect(container.querySelector('svg')).not.toBeNull();
    expect(getByRole('button', { name: /Spill/ })).toBeTruthy();
  });

  it('places a note when the staff is tapped', async () => {
    const { container, component } = render(Composer);
    const notation = container.querySelector('.notation')!;
    const notationCmp = (notation as HTMLElement & { __svelteCmp?: unknown }).__svelteCmp;
    // Use the notation's exposed _testTap hook by querying it via the parent.
    // The Composer re-exports the Notation reference for testing.
    const composerCmp = component as unknown as {
      _testTapNotation: (b: number, r: number) => void;
    };
    composerCmp._testTapNotation(0, 8);
    // Wait for the auto-save microtask
    await new Promise((r) => setTimeout(r, 50));
    const rows = await db.compositions.toArray();
    expect(rows.length).toBe(1);
    expect(rows[0].notes).toHaveLength(1);
  });

  it('hides the + button when current draft is empty', () => {
    const { queryByRole } = render(Composer);
    expect(queryByRole('button', { name: /Ny sang/ })).toBeNull();
  });

  it('shows the first-touch hint when no compositions exist', () => {
    const { getByText } = render(Composer);
    expect(getByText(/Trykk på en linje/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/routes/Composer.test.ts
```

Expected: FAIL — Composer doesn't yet exist or doesn't behave as asserted.

- [ ] **Step 3: Implement `Composer.svelte`**

Create `/home/eivind/code/fumletone/src/routes/Composer.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import Notation from '$lib/notation/Notation.svelte';
  import PlayControls from '$lib/components/PlayControls.svelte';
  import PlusButton from '$lib/components/PlusButton.svelte';
  import Doorway from '$lib/components/Doorway.svelte';
  import ScrapbookIcon from '$lib/components/ScrapbookIcon.svelte';
  import {
    currentComposition,
    applyMutation,
    startFresh,
  } from '$lib/stores/currentComposition';
  import { compositionCount } from '$lib/db/compositions';
  import { profile } from '$lib/stores/profile';
  import { back, navigate } from '$lib/stores/route';
  import { unlock, getVoice } from '$lib/audio/engine';
  import { compositionToScheduled, durationSeconds } from '$lib/audio/playback';
  import type { NotePlacement, PitchSpec } from '$lib/db/schema';
  import { pitchEquals } from '$lib/notation/pitchSpec';

  const DURATIONS: NotePlacement['duration'][] = ['quarter', 'half', 'whole', 'eighth'];
  function nextDuration(d: NotePlacement['duration']): NotePlacement['duration'] {
    return DURATIONS[(DURATIONS.indexOf(d) + 1) % DURATIONS.length];
  }

  let isPlaying = $state(false);
  let isLooping = $state(false);
  let showHint = $state(false);
  let notationRef: { _testTap: (b: number, r: number) => void } | undefined;

  $: instrument = $profile?.instrument ?? 'violin';
  $: language = $profile?.language ?? 'nb';
  $: clef = instrument === 'violin' ? ('treble' as const) : ('bass' as const);
  $: notes = $currentComposition?.notes ?? [];
  $: hasNotes = notes.length > 0;

  onMount(async () => {
    showHint = (await compositionCount()) === 0;
    setTimeout(() => (showHint = false), 3000);
  });

  async function playPreview(pitch: PitchSpec, duration: NotePlacement['duration'] = 'quarter') {
    await unlock();
    getVoice(instrument).playNote(pitch, durationSeconds(duration));
  }

  async function onPlace(ev: CustomEvent<{ beatIndex: number; pitch: PitchSpec }>) {
    const { beatIndex, pitch } = ev.detail;
    const placement: NotePlacement = { beatIndex, duration: 'quarter', pitch };
    await playPreview(pitch);
    await applyMutation(
      (cur) => {
        if (!cur) return null; // signals create-from-context
        const filtered = cur.notes.filter((n) => n.beatIndex !== beatIndex);
        return { ...cur, notes: [...filtered, placement].sort((a, b) => a.beatIndex - b.beatIndex) };
      },
      { language, firstNote: placement },
    );
  }

  async function onCycleDuration(ev: CustomEvent<{ beatIndex: number }>) {
    await applyMutation((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        notes: cur.notes.map((n) =>
          n.beatIndex === ev.detail.beatIndex
            ? { ...n, duration: nextDuration(n.duration) }
            : n,
        ),
      };
    });
    const updated = $currentComposition?.notes.find((n) => n.beatIndex === ev.detail.beatIndex);
    if (updated) await playPreview(updated.pitch, updated.duration);
  }

  async function onCycleAccidental(ev: CustomEvent<{ beatIndex: number }>) {
    await applyMutation((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        notes: cur.notes.map((n) => {
          if (n.beatIndex !== ev.detail.beatIndex) return n;
          const next: NotePlacement['pitch']['accidental'] =
            n.pitch.accidental === 'natural'
              ? 'sharp'
              : n.pitch.accidental === 'sharp'
              ? 'flat'
              : 'natural';
          return { ...n, pitch: { ...n.pitch, accidental: next } };
        }),
      };
    });
    const updated = $currentComposition?.notes.find((n) => n.beatIndex === ev.detail.beatIndex);
    if (updated) await playPreview(updated.pitch, updated.duration);
  }

  let grabbedBeat = $state<number | null>(null);
  function onGrab(ev: CustomEvent<{ beatIndex: number }>) {
    grabbedBeat = ev.detail.beatIndex;
  }
  async function onDragMove(
    ev: CustomEvent<{ pitch: PitchSpec | null; offStaff: boolean }>,
  ) {
    if (grabbedBeat === null || ev.detail.offStaff || !ev.detail.pitch) return;
    await playPreview(ev.detail.pitch);
  }
  async function onDragEnd(
    ev: CustomEvent<{ pitch: PitchSpec | null; offStaff: boolean }>,
  ) {
    if (grabbedBeat === null) return;
    const beat = grabbedBeat;
    grabbedBeat = null;
    if (ev.detail.offStaff || !ev.detail.pitch) {
      // delete
      await applyMutation((cur) => {
        if (!cur) return cur;
        return { ...cur, notes: cur.notes.filter((n) => n.beatIndex !== beat) };
      });
      return;
    }
    const target: PitchSpec = ev.detail.pitch;
    await applyMutation((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        notes: cur.notes.map((n) =>
          n.beatIndex === beat ? { ...n, pitch: target } : n,
        ),
      };
    });
  }

  async function onPlay() {
    if (!$currentComposition) return;
    await unlock();
    const voice = getVoice(instrument);
    voice.setLoop(isLooping);
    isPlaying = true;
    await voice.playSequence(compositionToScheduled($currentComposition));
    if (!isLooping) setTimeout(() => (isPlaying = false), 16 * (60 / 90) * 1000);
  }
  function onStop() {
    isPlaying = false;
    // Tone.Transport.stop() is called inside voice.setLoop(false); for tests
    // we keep this minimal — full transport-stop wiring is in voice impls.
  }
  function onToggleLoop() {
    isLooping = !isLooping;
    if ($currentComposition) getVoice(instrument).setLoop(isLooping);
  }

  function onNew() {
    onStop();
    startFresh();
  }

  function onBack() {
    onStop();
    back();
  }
  function onScrapbook() {
    onStop();
    navigate({ name: 'scrapbook' });
  }

  // Test hook: forward a synthetic tap into the embedded Notation component.
  export function _testTapNotation(beatIndex: number, rowIndex: number) {
    notationRef?._testTap(beatIndex, rowIndex);
  }
</script>

<section class="composer">
  <header class="top">
    <Doorway label={$_('make.doorwayBack')} side="left" on:open={onBack} />
    <ScrapbookIcon on:open={onScrapbook} />
  </header>

  <div class="staff">
    <Notation
      bind:this={notationRef}
      {clef}
      {instrument}
      {notes}
      readOnly={false}
      on:place={onPlace}
      on:cycleDuration={onCycleDuration}
      on:cycleAccidental={onCycleAccidental}
      on:grab={onGrab}
      on:dragMove={onDragMove}
      on:dragEnd={onDragEnd}
    />
    {#if showHint && !hasNotes}
      <p class="hint">{$_('composer.firstTouchHint')}</p>
    {/if}
  </div>

  <PlayControls {isPlaying} {isLooping} on:play={onPlay} on:stop={onStop} on:toggleLoop={onToggleLoop} />

  <div class="plus-row">
    <PlusButton isHidden={!hasNotes} on:new={onNew} />
  </div>
</section>

<style>
  .composer { position: relative; min-height: 100vh; padding: 16px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .staff { margin: 16px 0; position: relative; }
  .hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: var(--color-fg, #2d2a26);
    opacity: 0.6;
    pointer-events: none;
  }
  .plus-row { display: flex; justify-content: flex-end; }
</style>
```

- [ ] **Step 4: Run Composer tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/routes/Composer.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/routes/Composer.svelte tests/component/routes/Composer.test.ts && git commit -m "routes: Composer assembles staff + controls + plus + back-doorway + first-touch hint"
```

---

## Task 14: Make / Scrapbook routes, Hub extension, Router extension

**Files:**
- Create: `src/routes/Make.svelte`, `src/routes/Scrapbook.svelte`
- Modify: `src/routes/Hub.svelte`, `src/lib/router/Router.svelte`
- Test: `tests/component/routes/Make.test.ts`, `Scrapbook.test.ts`, `Hub.test.ts`

`Make` is just a thin wrapper that routes to `Composer` with the current draft. (The design treats `make` as semantically distinct from `composer` for navigation clarity, but the rendered surface is the same.) `Scrapbook` lists tiles. `Hub` gains the Make doorway and the scrapbook icon.

- [ ] **Step 1: Write failing tests**

Create `/home/eivind/code/fumletone/tests/component/routes/Make.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Make from '$routes/Make.svelte';
import { waitLocale } from 'svelte-i18n';
import { db, saveProfile } from '$lib/db/db';
import { loadProfile } from '$lib/stores/profile';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveProfile({ instrument: 'violin', language: 'nb', onboardingCompletedAt: new Date() });
  await loadProfile();
  await waitLocale('nb');
});

describe('Make route', () => {
  it('renders the composer surface', () => {
    const { container } = render(Make);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
```

Create `/home/eivind/code/fumletone/tests/component/routes/Scrapbook.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Scrapbook from '$routes/Scrapbook.svelte';
import { waitLocale } from 'svelte-i18n';
import { db, saveProfile } from '$lib/db/db';
import { loadProfile } from '$lib/stores/profile';
import { createComposition } from '$lib/db/compositions';
import type { NotePlacement } from '$lib/db/schema';

const C4: NotePlacement = {
  beatIndex: 0,
  duration: 'quarter',
  pitch: { step: 'C', octave: 4, accidental: 'natural' },
};

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveProfile({ instrument: 'violin', language: 'nb', onboardingCompletedAt: new Date() });
  await loadProfile();
  await waitLocale('nb');
});

describe('Scrapbook route', () => {
  it('shows the section title', () => {
    const { getByText } = render(Scrapbook);
    expect(getByText('Det jeg har laget')).toBeTruthy();
  });

  it('lists tiles for each saved composition newest-first', async () => {
    await createComposition({ firstNote: C4, language: 'nb' });
    await new Promise((r) => setTimeout(r, 5));
    await createComposition({ firstNote: C4, language: 'nb' });
    const { findAllByRole } = render(Scrapbook);
    const tiles = await findAllByRole('button');
    // 2 tiles + back doorway = at least 3
    expect(tiles.length).toBeGreaterThanOrEqual(3);
  });

  it('hides Things-we-found section entirely when empty', () => {
    const { queryByText } = render(Scrapbook);
    expect(queryByText(/Det vi har funnet/)).toBeNull();
  });
});
```

Create `/home/eivind/code/fumletone/tests/component/routes/Hub.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import Hub from '$routes/Hub.svelte';
import { waitLocale } from 'svelte-i18n';
import { db, saveProfile } from '$lib/db/db';
import { loadProfile } from '$lib/stores/profile';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveProfile({ instrument: 'violin', language: 'nb', onboardingCompletedAt: new Date() });
  await loadProfile();
  await waitLocale('nb');
});

describe('Hub route (Plan 2 extension)', () => {
  it('renders a Make doorway', () => {
    const { getByLabelText } = render(Hub);
    expect(getByLabelText('Lag')).toBeTruthy();
  });

  it('renders a scrapbook icon', () => {
    const { getByLabelText } = render(Hub);
    expect(getByLabelText('Skrapboka')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/routes/
```

Expected: FAIL — Make / Scrapbook don't exist; Hub doesn't have the new affordances.

- [ ] **Step 3: Implement `Make.svelte`**

Create `/home/eivind/code/fumletone/src/routes/Make.svelte`:

```svelte
<script lang="ts">
  import Composer from './Composer.svelte';
</script>

<Composer />
```

(Make is intentionally a thin wrapper. If a future plan introduces a make-side scene that's distinct from the composer surface, it goes here.)

- [ ] **Step 4: Implement `Scrapbook.svelte`**

Create `/home/eivind/code/fumletone/src/routes/Scrapbook.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { _ } from 'svelte-i18n';
  import ScrapbookTile from '$lib/components/ScrapbookTile.svelte';
  import Doorway from '$lib/components/Doorway.svelte';
  import { listCompositions, updateComposition } from '$lib/db/compositions';
  import { loadById } from '$lib/stores/currentComposition';
  import { profile } from '$lib/stores/profile';
  import { back, navigate } from '$lib/stores/route';
  import type { Composition } from '$lib/db/schema';

  let compositions = $state<Composition[]>([]);
  let renamingId = $state<number | null>(null);
  let renameValue = $state('');

  $: instrument = $profile?.instrument ?? 'violin';

  onMount(async () => {
    compositions = await listCompositions();
  });

  async function refresh() {
    compositions = await listCompositions();
  }

  async function onOpen(ev: CustomEvent<{ id: number }>) {
    await loadById(ev.detail.id);
    navigate({ name: 'composer', compositionId: ev.detail.id });
  }

  function onRename(ev: CustomEvent<{ id: number }>) {
    renamingId = ev.detail.id;
    renameValue = compositions.find((c) => c.id === ev.detail.id)?.title ?? '';
  }

  async function commitRename() {
    if (renamingId === null) return;
    const trimmed = renameValue.trim();
    if (trimmed) await updateComposition(renamingId, { title: trimmed });
    renamingId = null;
    await refresh();
  }
  function cancelRename() {
    renamingId = null;
  }
</script>

<section class="scrapbook">
  <header class="top">
    <Doorway label={$_('make.doorwayBack')} side="left" on:open={() => back()} />
  </header>

  <h1>{$_('scrapbook.title')}</h1>

  <h2>{$_('scrapbook.thingsIMade')}</h2>
  <div class="grid">
    {#each compositions as c (c.id)}
      {#if renamingId === c.id}
        <div class="rename-card">
          <input
            type="text"
            bind:value={renameValue}
            aria-label={$_('scrapbook.renamePrompt')}
          />
          <button type="button" on:click={commitRename}>{$_('scrapbook.renameConfirm')}</button>
          <button type="button" on:click={cancelRename}>{$_('scrapbook.renameCancel')}</button>
        </div>
      {:else}
        <ScrapbookTile composition={c} {instrument} on:open={onOpen} on:rename={onRename} />
      {/if}
    {/each}
  </div>
</section>

<style>
  .scrapbook { padding: 16px; }
  .top { margin-bottom: 16px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }
  .rename-card { display: flex; gap: 8px; flex-wrap: wrap; }
  .rename-card input { flex: 1; min-width: 100px; padding: 8px; }
</style>
```

- [ ] **Step 5: Extend `Hub.svelte`**

Open `/home/eivind/code/fumletone/src/routes/Hub.svelte`. The Plan 1 implementation rendered the placeholder Hollow scene plus an entry to Settings. Extend it to add a Make doorway and a scrapbook icon. Replace the file's body with:

```svelte
<script lang="ts">
  import { _ } from 'svelte-i18n';
  import FumlingAvatar from '$lib/components/FumlingAvatar.svelte';
  import Doorway from '$lib/components/Doorway.svelte';
  import ScrapbookIcon from '$lib/components/ScrapbookIcon.svelte';
  import { profile } from '$lib/stores/profile';
  import { navigate } from '$lib/stores/route';
</script>

<section class="hub">
  <ScrapbookIcon on:open={() => navigate({ name: 'scrapbook' })} />

  <div class="scene">
    <FumlingAvatar
      color={$profile?.fumlingColor ?? 'sage'}
      features={$profile?.fumlingFeatures ?? []}
      instrument={$profile?.instrument ?? 'violin'}
    />
    <p class="greeting">
      {$_('hub.greetingNamed', { values: { name: $profile?.kidName || $_('app.kidNameDefault') } })}
    </p>
  </div>

  <div class="doorways">
    <Doorway
      label={$_('make.doorway')}
      side="right"
      on:open={() => navigate({ name: 'make' })}
    />
    <button
      type="button"
      class="settings-link"
      on:click={() => navigate({ name: 'settings' })}
    >
      {$_('settings.title')}
    </button>
  </div>
</section>

<style>
  .hub { position: relative; min-height: 100vh; padding: 16px; text-align: center; }
  .scene { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 80px; }
  .greeting { font-size: 22px; }
  .doorways {
    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 24px;
  }
  .settings-link {
    background: transparent;
    border: 0;
    color: var(--color-fg, #2d2a26);
    font-size: 14px;
    text-decoration: underline;
    cursor: pointer;
  }
</style>
```

(If Plan 1's `hub.greetingNamed` key doesn't exist, fall back to `hub.greeting` and a name-less greeting; both keys exist per Plan 1 nb.json/en.json structure.)

- [ ] **Step 6: Extend `Router.svelte`**

Open `/home/eivind/code/fumletone/src/lib/router/Router.svelte`. Add three imports and three new branches in the existing `{#if}/{:else if}` chain:

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
  import Make from '$routes/Make.svelte';
  import Composer from '$routes/Composer.svelte';
  import Scrapbook from '$routes/Scrapbook.svelte';
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
{:else if $route.name === 'make'}
  <Make />
{:else if $route.name === 'composer'}
  <Composer />
{:else if $route.name === 'scrapbook'}
  <Scrapbook />
{/if}
```

- [ ] **Step 7: Run tests to confirm pass**

```bash
cd /home/eivind/code/fumletone && npm test -- tests/component/routes/
```

Expected: all Make / Scrapbook / Hub / Composer tests pass.

- [ ] **Step 8: Type check**

```bash
cd /home/eivind/code/fumletone && npm run check
```

Expected: 0 errors.

- [ ] **Step 9: Commit**

```bash
cd /home/eivind/code/fumletone && git add src/routes/Make.svelte src/routes/Scrapbook.svelte src/routes/Hub.svelte src/lib/router/Router.svelte tests/component/routes/ && git commit -m "routes: Make + Scrapbook + Hub extension + Router wiring for new routes"
```

---

## Task 15: End-to-end test

**Files:**
- Create: `tests/e2e/composer.spec.ts`

A single Playwright test exercising the happy path: onboarded kid → Hub → Make doorway → tap a note → cycle duration → loop → scrapbook → re-open → rename.

- [ ] **Step 1: Write the E2E test**

Create `/home/eivind/code/fumletone/tests/e2e/composer.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('compose, save, find, re-open, rename', async ({ page }) => {
  // Seed an onboarded profile so we land at the Hub immediately.
  await page.goto('/');
  await page.evaluate(async () => {
    const req = indexedDB.open('fumletone', 2);
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        const dbInst = req.result;
        const tx = dbInst.transaction(['profile'], 'readwrite');
        tx.objectStore('profile').put({
          id: 1,
          kidName: 'TestKid',
          language: 'nb',
          fumlingName: 'Fumly',
          fumlingColor: 'sage',
          fumlingFeatures: [],
          instrument: 'violin',
          onboardingCompletedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        tx.oncomplete = () => resolve();
      };
    });
  });

  // Reload so the boot guard picks up the seeded profile.
  await page.reload();

  // Hub → Make
  await page.getByLabel('Lag').click();

  // Wait for the staff to render
  const staff = page.locator('.notation svg');
  await expect(staff).toBeVisible();

  // Tap an empty staff position. We use bounding-box math to hit a row roughly
  // in the middle of the staff. The staff is 800px wide; we tap at x ≈ 200.
  const box = await staff.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + 200, box!.y + 200);

  // Tap again on the same column to cycle duration
  await page.mouse.click(box!.x + 200, box!.y + 200);

  // Tap loop
  await page.getByRole('button', { name: /Gjenta/ }).click();
  // Tap play
  await page.getByRole('button', { name: /Spill/ }).click();
  // Tap stop
  await page.getByRole('button', { name: /Stopp/ }).click();

  // Open scrapbook
  await page.getByLabel('Skrapboka').first().click();

  // The new composition tile should be visible
  const tile = page.getByRole('button', { name: /Tirsdagens|Mandagens|Onsdagens|Torsdagens|Fredagens|Lørdagens|Søndagens/ });
  await expect(tile.first()).toBeVisible();

  // Tap it to re-open in the composer
  await tile.first().click();
  await expect(staff).toBeVisible();

  // Back to scrapbook for rename
  await page.getByLabel('Tilbake til Fumlehulen').click();
  await page.getByLabel('Skrapboka').first().click();

  // Long-press the tile to trigger rename
  const tile2 = page.getByRole('button', { name: /Tirsdagens|Mandagens|Onsdagens|Torsdagens|Fredagens|Lørdagens|Søndagens/ }).first();
  const tile2Box = await tile2.boundingBox();
  await page.mouse.move(tile2Box!.x + 30, tile2Box!.y + 30);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();

  await page.getByLabel('Gi den et navn').fill('Min vakre sang');
  await page.getByRole('button', { name: 'Greit' }).click();
  await expect(page.getByText('Min vakre sang')).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E test**

```bash
cd /home/eivind/code/fumletone && npm run test:e2e
```

Expected: 1 test passes. (Playwright will start the dev server per Plan 1's `playwright.config.ts`.) If the test times out at the long-press step, raise the `waitForTimeout` to 800ms; the threshold inside `ScrapbookTile.svelte` is 500ms.

- [ ] **Step 3: Commit**

```bash
cd /home/eivind/code/fumletone && git add tests/e2e/composer.spec.ts && git commit -m "e2e: composer happy-path — Hub → Make → tap → loop → scrapbook → re-open → rename"
```

---

## Task 16: Manual verification on iPad-sized viewport

**Files:**
- None (this task is verification-only).

The composer is a touch UI; type-check and unit tests don't catch tap-target sizing, gesture-conflict, or the actual sound coming out of the speakers. This task runs the dev server, walks through the happy path in a browser at iPad-sized viewport, and confirms the build is shippable.

- [ ] **Step 1: Start the dev server**

```bash
cd /home/eivind/code/fumletone && npm run dev
```

Expected: `vite` reports `Local: http://localhost:5173/`.

- [ ] **Step 2: Open in a browser at iPad viewport**

Open `http://localhost:5173/` in Chrome / Safari with the developer tools' device toolbar set to "iPad Pro 11" (or any 1024 × 1366 portrait / 1366 × 1024 landscape preset). Disable the address bar to mimic a home-screen-installed PWA.

- [ ] **Step 3: Walk the happy path manually**

Verify each of the following works without console errors:

1. Splash screen → tap → onboarding (or, if a profile exists, you land in the Hub).
2. Onboarding flows complete and you arrive at the Hub.
3. Hub shows the fumling silhouette, a "Lag" / "Make" doorway, and a scrapbook icon in the top-right.
4. Tap the "Lag" doorway → Make side appears, showing an empty staff in the kid's clef, a "Tap a line" first-touch hint that fades after ~3 seconds, and play / loop / stop controls below.
5. Tap a position on the staff → a quarter note appears AND you hear the note through your speakers (via Tone.PluckSynth).
6. Tap the same note again → it changes to a half note and plays once.
7. Tap a different pitch row in the same column → the original note is replaced; new pitch plays.
8. Fast double-tap an existing note → accidental cycles (sharp / flat / natural) and plays.
9. Long-press an existing note (~400ms) → the note becomes "grabbed"; drag it up/down → pitch changes audibly; release on the staff → pitch sticks.
10. Long-press another note, drag off the staff edge, release → note disappears.
11. Tap "Gjenta" / "Loop" → pressed state visible.
12. Tap "Spill" / "Play" → composition plays in a loop until you tap "Stopp" / "Stop".
13. Tap the scrapbook icon → scrapbook lists your composition with an auto-generated title and a small staff thumbnail.
14. Tap the tile → composer opens with the composition loaded; you can keep editing.
15. Tap the back doorway → returns to the Hub.
16. Long-press a tile in the scrapbook → rename UI appears.
17. Verify the "Things we found" section is **not** visible (no header, no empty-state).

- [ ] **Step 4: Sanity-check the production build**

```bash
cd /home/eivind/code/fumletone && npm run build && npm run preview -- --port 4173
```

Open `http://localhost:4173/` and repeat steps 3.4–3.6 (just enough to confirm the production bundle works). Also confirm the service worker registered (Application tab → Service Workers in Chrome devtools).

- [ ] **Step 5: Run the full test suite one final time**

```bash
cd /home/eivind/code/fumletone && npm run check && npm test && npm run test:e2e
```

Expected: 0 type errors; all unit tests pass; all component tests pass; E2E test passes.

- [ ] **Step 6: Final commit (if anything was tweaked during manual verification)**

If the manual walkthrough surfaced any small fixes (CSS, hint-fade timing, etc.) commit them now. Otherwise nothing to commit and this step is a no-op:

```bash
cd /home/eivind/code/fumletone && git status
# If clean: nothing to do.
# If modified: git add <files> && git commit -m "polish: <what was tweaked during manual verification>"
```

---

## Self-review

After implementing all 16 tasks, run a final review pass:

**1. Spec coverage.** Walk each "In scope" line in the design spec (`docs/superpowers/specs/2026-05-07-composer-scrapbook-design.md`) and confirm a task implements it:

- Two-halves home with Make/Discover doorways → Tasks 12, 14
- Real-notation staff editor → Tasks 3, 9, 13
- Gesture set (tap / single-tap-cycles / double-tap-cycles / long-press-grab + drag) → Tasks 8, 9, 13
- Auto-save + +-button new-composition → Tasks 4, 10, 13
- Playback (play / stop / loop, fixed 90 bpm) → Tasks 6, 7, 13
- Audio engine with synth + sampler abstraction (sampler latent) → Tasks 5, 7
- Real-notation rendering (VexFlow) → Tasks 1, 9
- Scrapbook with hidden Things-we-found → Tasks 4, 12, 14
- i18n parity → Task 11
- Auto-save creates row only on first note placed → Task 10 (`applyMutation` semantics) + Task 13 (`onPlace` calls with context)
- First-touch hint → Task 13
- Test discipline (Vitest unit + component, Playwright E2E) → Tasks 3-15
- SW cache widening → Task 7

**2. Placeholder scan.** Search the plan for "TBD", "TODO", "implement later", or naked phrases like "add appropriate error handling." There should be none — every step has concrete code or commands.

**3. Type consistency.** Verify the names used across tasks match:
- `Composition`, `NotePlacement`, `PitchSpec`, `DurationName`, `AccidentalName`, `PitchStep` are defined in Task 2 and used identically in Tasks 4, 6, 9, 10, 13.
- `InstrumentVoice` defined in Task 5 with methods `playNote`, `playSequence`, `setLoop`, `ready`; used unchanged in Task 7's `engine.ts` extension and Task 13's `Composer.svelte`.
- `GestureEvent` defined in Task 8 with types `tap`, `doubleTap`, `longPress`, `dragStart`, `dragMove`, `dragEnd`; consumed in Task 9.
- Route additions (`make`, `composer`, `scrapbook`) defined in Task 2 (`schema.ts`) and used in Task 14's Router extension.
- `compositionTitles` shape: i18n JSON keyed by lowercase weekday names; consumed by `compositions.ts` (Task 4) and asserted by i18n tests (Task 11).

**4. Audio test caveats.** The audio engine is mocked aggressively in Tests 5 and 7 — assertions are loose ("triggerAttackRelease was called with the right pitch") rather than tight ("a sound was actually heard"). The manual verification step (Task 16) is the human-ear check.

**5. iPad-only constraint.** Mouse-only events (`onmouseenter`, hover) do not appear anywhere in the plan. All interaction goes through `pointer` events and `click`. ✓

**6. No back-during-onboarding regression.** The Plan 1 onboarding screens are not modified. The new routes (`make`, `composer`, `scrapbook`) freely use `back()` because they are post-onboarding. ✓

**7. Real-notation everywhere it's visible.** The composer renders via VexFlow. Scrapbook tiles render via the same VexFlow component in read-only mode. There are no piano-roll, colored-block, or simplified visual representations. ✓

If any of these checks fails during execution, fix inline and commit the fix as part of the task that surfaced it.

---

## Plan complete

Sixteen tasks, each task a small set of TDD-disciplined steps with tests written first, implementation second, type checks throughout, and a commit at the end. The composer + scrapbook ship with the synth-backed audio path active and the sampler infrastructure in place for Plan 5 to drop CC-licensed sample files into. The two-halves home and the doorway navigation are placeholder-art ready for Plan 3 to reskin into illustrated lands.
