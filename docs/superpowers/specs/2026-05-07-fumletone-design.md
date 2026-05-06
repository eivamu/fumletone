# Fumletone — Design Spec

**Date:** 2026-05-07
**Status:** Approved (ready for implementation planning)
**Companion docs:** [Name Decision (2026-05-06)](./2026-05-06-name-decision.md)

## Overview

Fumletone is a music-theory app for children, primarily for the author's two
daughters (ages 7 and 10) on iPad. It is built as a Progressive Web App
(installable to the iPad home screen). The kid genuinely learns real
music theory — pitch, rhythm, intervals, scales, chords, real notation, song
structure — but never through instruction. Concepts are encountered through
play with a fumbling, friendly companion (a *fumling*, named Fumly by default)
who finds music by accident. There are no scores, streaks, or judgments.
Growth is observable through artifacts (the kid's scrapbook of made loops and
"found" musical fragments) and through the fumling's relational reflections
("we've found nine melodies together — want to find a tenth?").

## Pedagogical Principles

These are load-bearing for every design decision and must not drift during
implementation.

1. **Real notation, never alternatives.** Wherever musical notation appears,
   it is real notation: standard treble/bass clef, real note values, real note
   names (C–B), real rests, real time/key signatures, real accidentals. No
   colored-block substitutes, no number systems, no "kid-friendly"
   simplifications. The whole pedagogy depends on proving that the basics of
   real notation are intuitive — substituting alternatives would silently teach
   the kid that real music is too hard for them.
2. **Real instrument support from day one.** The two daughters play violin
   and cello. v1 supports both. The kid's fumling has an instrument; this
   choice flows through clef rendering, default timbre, and a dedicated
   instrument-specific land.
3. **No judgment, no scoring.** No stars, no streaks, no "best", no "you
   earned X". Progress is visible only through artifacts and through the
   fumling's relational reflections, never through quantification.
4. **Always sounds good.** Anything the kid produces in the composer is, at
   minimum, listenable — and often actually pretty. This is what allows them
   to feel competent before they technically are.
5. **Equally Norwegian and English.** Every visible string and every spoken
   line exists in both languages with parallel evocative weight.
6. **Fumle / fumble as the brand thesis.** The mascot fumbles. The kid
   fumbles. Fumbling is how music gets found. The app never punishes
   trial-and-error.

## Audience

- **Primary:** the author's two daughters
  - Daughter A (10): plays cello
  - Daughter B (7): plays violin
- **Use context:** each daughter has her own iPad. No multi-kid profiles
  needed; one device = one kid.
- **Possible later:** broader release (App Store via Capacitor wrap, plus
  parent-dashboard, possibly multi-kid mode). Out of scope for v1.
- **Languages:** Norwegian (primary for these kids) and English, with parity.
- **Reading ability assumed:** the 7yo cannot comfortably read paragraphs.
  All instruction is delivered by voice with minimal text. The 10yo reads
  fluently in NO and acceptably in EN.

## Architecture

### Home screen — two halves

The app has two halves the kid moves between freely. They are styled as
distinct *places*, not tabs:

- **Discover** (NO: *Oppdag*) — the curriculum side. Warmer, more
  illustrated, more storied. The fumling is a present, voiced character here.
- **Make** (NO: *Lag*) — the composition workshop. Cleaner visual style,
  less to distract from the music being made. The fumling is visible but
  quiet; the kid drives.

A persistent **Scrapbook** affordance (a satchel/notebook icon) is reachable
from both halves.

### The fumling (avatar/companion)

The mascot is a *species* — a *fumling*. **Fumly** is the canonical fumling
(the brand face on the app icon and in marketing). Inside the kid's app, the
kid customizes their own fumling:

- **Name:** the default is *Fumly*; kid can rename freely. Used in on-screen
  text only.
- **Visual:** kid picks one of 3-4 colors and 2-3 small features (e.g., a
  hat, a striped sock, eye style). Enough that the fumling looks like
  *theirs*; not so much that the species silhouette is lost.
- **Instrument:** kid picks **violin** or **cello** at first launch. The
  fumling visually carries this instrument across the app (two animation sets
  per fumling: violin-playing and cello-playing).

**Voice acting constraint:** The fumling's voice is recorded once per
language. Scripts must never say the fumling's name or the kid's name (both
are user-chosen). Voice always uses "you" and "we." On-screen text *can* and
*does* render both names, since text is rendered live.

### Discover side

#### The hub: The Fumling Hollow / Fumlehulen

A cozy painted scene the fumling lives in. Calm, warm, inviting. Visible from
the hub: doorways or paths leading to the lands the kid currently has access
to. The fumling idles, occasionally doing something endearing (humming,
fumbling with a leaf, peeking at the kid through the screen). When the kid
returns from a land, the fumling reacts to whatever just happened. The hub
is also where Fumly's reflections happen.

#### Lands

Each land is a self-contained illustrated scene focused on one topic cluster.
v1 lands:

| Land | English | Norwegian | Topic |
|---|---|---|---|
| Rhythm | **Rhythm Island** | **Rytmeøya** | Pulse, beat, real note values, rests, time signatures, basic polyrhythm |
| Melody | **Melody Wood** | **Melodiskogen** | High/low, up/down, steps vs leaps, treble/bass clef, note names, intervals by ear, major/minor, pentatonic + diatonic scales |
| Violin (only if kid picked violin) | **The Violin Vista** | **Fiolintoppen** | Open-string tuning (G-D-A-E), bow vs pizzicato, fingering basics, instrument-specific quirks. Aesthetic: high, light, airy, tree-canopy vista |
| Cello (only if kid picked cello) | **The Cello Valley** | **Cellodalen** | Open-string tuning (C-G-D-A), bow vs pizzicato, fingering basics, instrument-specific quirks. Aesthetic: low, warm, deep, valley floor |

Only one of *The Violin Vista* / *The Cello Valley* exists in a given kid's
app — the other is invisible until/unless the kid changes instrument.

Post-v1 lands (designed but not built v1):

| Land | English | Norwegian | When | Topic |
|---|---|---|---|---|
| Notation | **Note Cottage** | **Notehytta** | v1.5 | Reading written music explicitly, written rhythms, key signatures (C, G, D, F first), accidentals |
| Chord | **Chord Tower** | **Akkordtårnet** | v2 | Triad shapes (major/minor), simple progressions (I–IV–V then vi), arpeggios |
| Composition | **The Song Loom** | **Sangveven** | v2.x | Phrasing, repetition and variation, call-and-response, song structure (verse/chorus, AABA), dynamics, tempo. Brand metaphor: "weaving" songs from threads |

#### Encounters

Inside a land, content is structured as a small set of **encounters** — 2-5
minute interactions where the fumling fumbles into a concept and the kid is
drawn in. Encounters are not lessons:

- The fumling tries to do something musical and gets it slightly wrong
- The kid is invited to participate (tap along, fix the mistake, contribute)
- The concept is named in passing ("oh — that's *the pulse*!"), not taught
- Many encounters yield "found things" that drop into the scrapbook

Encounters are softly gated *within* a land — foundational ones first, later
ones appear once the kid has spent time on the foundations. **No visible
gating UI.** No "X of Y unlocked." Later encounters simply aren't there yet;
when the kid is ready, they show up.

Each land has 5-8 encounters at v1, with variations per visit so revisits
remain fresh.

**Example encounters in Rhythm Island:**
- *The Pulse.* The ground has a heartbeat. Fumling taps along, drifts off-time;
  kid steadies it.
- *Found Rhythms.* Kid taps any rhythm on a log. Fumling tries to copy it
  (sometimes badly). The result is saved to the scrapbook in real notation.
- *Subdivisions.* A pulse splits into halves, then quarters. Fumling fumbles
  between them, kid demonstrates.
- *Time signatures by feel.* Same pulse in 4/4 vs 3/4 — march vs waltz.

**Example encounters in Melody Wood:**
- *Up and Down.* Notes climb a tree; notes roll down a hill. Fumling sings
  along, sometimes wrong. Real staff notation is visible behind the visual.
- *Steps and Leaps.* Fumling jumps between two trees — sometimes neighbors,
  sometimes far. Same shape feels very different.
- *Major and Minor.* The same melodic phrase played two ways. Fumling reacts
  emotionally — happy on major, wistful on minor.

**Example encounters in The Violin Vista / The Cello Valley:**
- *Open Strings.* Each open string sung by Fumly, then plucked, then bowed.
  Names appear in text. (Violin: G-D-A-E. Cello: C-G-D-A.)
- *Tuning.* Fumling's instrument has gone slightly out of tune. Kid helps
  tune by listening.
- *Bow and Pizz.* The same phrase played two ways. Different feel, different
  symbols in notation.
- *First Fingerings.* Where fingers go on the fingerboard for the simplest
  notes. Visual diagrams using real instrument geometry.

#### Soft gating

Encounter availability within a land is driven by:
- What the kid has already encountered (in this land and others)
- Light time-on-task signals

Cross-land progression is also soft. If the kid only ever visits Melody Wood,
they progress through its encounters at their own pace; Rhythm Island content
referenced in Melody Wood (e.g., a melodic phrase in 3/4) appears with light
just-in-time exposition rather than blocking on completion.

For the cello-playing kid, **clef level is also soft-gated:**

| Level | Violin | Cello |
|---|---|---|
| Beginner | Treble | Bass |
| Intermediate | Treble | Bass |
| Advanced | Treble | Bass primary + treble appears |

(No C clefs at any level.)

The cellist starts in bass-only across the entire app. Treble appears in
later encounters/views once they've crossed an internal readiness threshold
(driven by encounter count, content variety, and time on task). The
transition is invisible to the kid — treble simply starts showing up, and
when it does, the fumling treats it as a normal thing.

### Make side

#### Composer

A cell-grid sequencer the kid taps to build short loops. Time runs
left-to-right; tracks stack vertically.

**v1 ships with 2 tracks:**

- **Rhythm track.** 8-beat grid; tap a cell to toggle a hit at that beat.
  Real note-value notation visible if the kid taps "see as sheet music."
- **Melody track.** y-axis shows in-scale pitches (default C pentatonic;
  other scales unlock as the kid encounters them in Melody Wood). x-axis is
  time. Tap a cell to drop a note. The grid only ever displays in-scale
  pitches, so any cell tap is harmonically safe. Cells are **labeled with
  real note names** (C, D, E, F, G, A, B) — not colors, not numbers.

**v1.5 adds a third track:** harmony/bass with chord stamps drawn from
Chord Tower content, plus a 16-beat loop length option.

#### Always-sounds-good rule

Notes are quantized to scale and beat. Levels auto-balance. There is no ugly
combination. A 7yo mashing the screen produces something at minimum
listenable, and often actually pretty.

#### Sound palette

A small curated set of warm timbres:
- Soft mallet
- Plucked kalimba
- Music-box bells
- Gentle synth pad
- Light hand drum

Plus the two new core timbres at v1: **sampled (or modeled) violin** and
**sampled (or modeled) cello**.

The kid's instrument is the **default melody timbre** on the making side —
violinist's loops sound like violin by default, cellist's like cello. Other
timbres are still selectable; the instrument is the home base.

#### Discovery → Make

Things "found" in the lands appear in the making side as tools:
- A rhythm found in Rhythm Island becomes a *stamp* the kid can drop into the
  rhythm track in one tap
- A melody fragment found in Melody Wood becomes a melody preset
- (v2) Chord progressions found in Chord Tower become harmony stamps

This binds the two halves: discovery is *gathering tools*, making is *using
them*.

#### Fumly cameos

The fumling is visible on the making side (lounging in a corner, watching),
but doesn't talk over the kid's composition. Occasionally — rough cadence: 1
in ~5 sessions — Fumly appears with a fumbled half-loop and asks: *"I
started something — can you finish it?"* The half-loop uses concepts the kid
has been encountering. The kid can finish it, ignore it, or save Fumly's
fragment as-is. Cameos are gentle, skippable, brand-thread-only.

#### Saving

Tap a save button (satchel/heart icon). The loop drops into the scrapbook
with an auto-generated name in the kid's language (e.g., "Tirsdagens tone" /
"Tuesday's tune"), kid-renamable.

Every saved loop has a **"see as sheet music"** view. One tap, the loop
renders on a real staff in real notation, in the kid's clef (treble or bass).
This is brand-load-bearing: the kid's own creations arrive in real
notation as evidence that they're already a real musician.

### Scrapbook

Two browseable sections:

- **Things I made** (NO: *Det jeg har laget*) — saved loops from the composer
- **Things we found** (NO: *Det vi har funnet*) — fragments the kid found
  with their fumling during encounters. v1: rhythms and melodies. v2+: chord
  shapes (from Chord Tower).

Each item has an auto-generated name in the kid's language, kid-renamable.
Tap to play / view. Loops re-open in the composer; found rhythms/melodies
replay and can be dropped into the composer as stamps. **All scrapbook items
render in real musical notation** — saved loops on a real staff in the
kid's clef, found rhythms in real note values, found melodies on the staff.

**Items are never deleted.** The scrapbook is a record of the kid's musical
journey, kept forever. An "archive" gesture (tucks into a drawer) handles
clutter without destruction. No favoriting, no rating, no "best" — every
item is equally welcome.

### Progress and motivation

No points, stars, streaks, levels, or completion bars are visible to the
kid. Progress is observable only through:

- **Artifacts** — what's accumulating in the scrapbook
- **Fumly's reflections** — short voiced + text moments triggered at natural
  points (returning to the hub from a land, saving a loop, opening the
  scrapbook, idle moments). Phrasing is always relational and qualitative:
  "we made nine loops this week," "we keep finding rhythms in fours,"
  "remember this melody?" Never quantitative ("you've earned X").
- **The world unfolding** — later encounters, later clefs, later scales,
  later timbres simply *appear* as the kid is ready. The kid never sees a
  "locked" state.

## Curriculum Scope (long-term)

| Land | Concepts | Ships |
|---|---|---|
| **Rhythm Island** | Pulse, beat, real note values (whole/half/quarter/eighth/sixteenth + dotted), rests, time signatures (4/4 and 3/4 first), basic polyrhythm | v1 |
| **Melody Wood** | High/low, up/down, steps vs leaps, pitch on treble/bass clef (per kid's instrument), note names (C–B), intervals by ear, major/minor by feeling, pentatonic + diatonic scales | v1 |
| **The Violin Vista / The Cello Valley** | Open strings, tuning, bow vs pizzicato, basic fingerings, instrument-specific notation conventions | v1 |
| **Note Cottage** | Reading written music explicitly, written rhythms, key signatures (C, G, D, F first), accidentals | v1.5 |
| **Chord Tower** | Triad shapes (major/minor), simple progressions (I–IV–V then vi), arpeggios | v2 |
| **The Song Loom** | Phrasing, repetition and variation, call-and-response, song structure (verse/chorus, AABA), dynamics, tempo | v2.x |

Real notation is **ambient** from day 1 across all lands — visible,
decorative, not yet "taught." Note Cottage is when *reading* becomes the
explicit subject.

## Onboarding

First launch flow, ~60-90 seconds. Mostly tappable visuals; voice narrates,
no required reading.

1. **Splash.** Brief — fumling waves.
2. **Pick language.** Fumly says hello in NO and EN; kid taps the preferred
   one.
3. **Pick your name.** Kid types their name. Skippable; default *Venn* /
   *Friend*.
4. **Customize your fumling.** Pick color (3-4 options), pick small features
   (2-3 options each).
5. **Pick instrument.** *"Will your fumling learn the violin or the cello?"*
   Fumling appears holding each in turn; kid picks one.
6. **Name your fumling.** Default *Fumly* pre-filled; kid can keep or
   change.
7. **Land in The Fumling Hollow.** Brief intro from Fumly; first doorway is
   already open.

All onboarding choices are settable later in Settings.

## Language

- **One active language at a time**, switchable in Settings.
- All UI strings localized in NO + EN with parallel evocative weight.
- Voice acting recorded once per language. For v1, the user records NO
  himself; an English voice actor is recruited separately. Both performances
  share the same script.
- Voice script never says the fumling's name or the kid's name. Both names
  appear only in on-screen text.
- Tone-of-voice reference: "Kom, så vever vi en sang" — playful, inviting,
  collaborative, low-pressure. Translations should preserve this register.

## Tech Stack

Recommended (subject to refinement during implementation planning):

- **Language:** TypeScript
- **App framework:** Svelte + Vite (small bundle, reactive, well-suited to
  animated PWAs). React + Vite is an acceptable fallback if the
  implementer prefers.
- **Audio:** Tone.js over the Web Audio API for synthesis, playback,
  scheduling.
- **Notation rendering:** **VexFlow** for real musical notation (essentially
  required given the real-notation rule; de-facto standard for SVG-based
  notation).
- **Storage:** Dexie.js over IndexedDB. Local-first. No cloud sync.
- **PWA:** Workbox for the service worker (offline + install).
- **Instrument samples:** sampled or modeled violin and cello, plus the
  curated timbre palette. Implementation plan picks specific sample sets or
  synthesis approaches — CC-licensed orchestral sample libraries exist;
  Tone.js can synthesize the simpler timbres.

## Storage and Privacy

- **100% local-first** in IndexedDB on the device.
- No sign-in, no account, no cloud sync.
- No analytics, no telemetry, no third-party tracking.
- "Reset" option in Settings, gated behind a hold-to-confirm interaction
  (so kids can't accidentally wipe their scrapbook).

## v1 Deliverables

- PWA built with TypeScript + Svelte + Tone.js + VexFlow + Dexie.js +
  Workbox
- The Fumling Hollow (hub)
- Three lands: **Rhythm Island**, **Melody Wood**, and (**The Violin Vista**
  *or* **The Cello Valley** — only the kid's instrument's land)
- Composer with 2 tracks (rhythm + melody; melody-track default timbre =
  kid's instrument)
- Scrapbook (Things I made + Things we found + "see as sheet music" view in
  the kid's clef)
- Onboarding flow as specified
- NO + EN with one-language-at-a-time switching
- Voice-acted Fumly (NO recorded by user; EN recruited separately)
- Local-first storage; no accounts, no cloud, no analytics

## Roadmap

| Version | Adds |
|---|---|
| **v1.5** | Note Cottage; cellist's treble clef begins to appear; composer 3rd track (harmony/bass) with chord stamps; 16-beat loop option |
| **v2** | Chord Tower; piano as third instrument (with grand-staff awareness); voice/song as fourth |
| **v2.x** | The Song Loom; possible parent-dashboard for broader release; possible microphone input for call-and-response |

## Out of Scope (v1)

- Multi-kid profiles or shared-device mode (one iPad each → not needed)
- Parent dashboard / progress reports
- Cloud sync, accounts, sign-in
- In-app purchases, ads, monetization
- Social features (no sharing, posting, community)
- Microphone input (singing, pitch detection) — promising for v2+
- MIDI / external instrument input
- Sheet music PDF export / printing
- Native App Store distribution (possible later via Capacitor wrap)

## Open Items (deferred to implementation planning)

- Specific sample libraries or synthesis approaches for violin and cello
  timbres (license review + audio quality test)
- Exact list of 5-8 encounters per v1 land, with variation ranges
- Voice-acting script for v1 encounters and Fumly's reflection bank, in NO
  and EN
- Visual style guide for the fumling (silhouette, color palette,
  customization options)
- Aesthetic style guides for The Fumling Hollow (hub) and each v1 land
  (Rhythm Island, Melody Wood, Violin Vista, Cello Valley)
- Soft-gating thresholds (encounter count, time on task) tuned to
  observed play patterns

## Companion Memories

- `/home/eivind/.claude/projects/-home-eivind-code-musiclearn/memory/project_overview.md`
- `/home/eivind/.claude/projects/-home-eivind-code-musiclearn/memory/fumletone_real_notation.md`
