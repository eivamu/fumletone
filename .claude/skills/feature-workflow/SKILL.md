---
name: feature-workflow
description: >
  Guided feature-branch workflow for the Fumletone repo. Use this skill whenever you need to implement
  a plan task (issues #3..#20 and #22..#37), fix a bug, update documentation, change configuration, or
  make ANY change to the codebase. ALL changes — no matter how small — must go through this workflow:
  branch, commit, PR, review. `main` is ruleset-protected; direct pushes are rejected. Invoke explicitly
  with /feature-workflow or trigger automatically when the user asks to implement, fix, add, update,
  change, refactor, or modify anything in the project.
---

# Feature Branch Workflow — Fumletone

This skill guides every change to the Fumletone codebase through branch → commit → PR → review.

**Rules that never bend:**
- Never edit files on `main`. Direct pushes are rejected by the GitHub ruleset *and* by `hooks/pre-push`.
- Never merge a PR without explicit user approval — even for trivial changes.
- Never skip TDD on plan-task work. Tests come before implementation; that order is load-bearing per CLAUDE.md.
- Never ship a UI string in only one language. `nb` and `en` go in the same commit.

---

## Step 0: Identify the work mode

Fumletone has two work modes. Almost everything you'll be asked to do is one of these:

| | **Plan-task mode** | **Ad-hoc mode** |
|---|---|---|
| Trigger | User asks to implement a Plan 1/Plan 2 task, or names an issue in #3..#20 or #22..#37 | Bug, infra change, doc tweak, follow-up not covered by an existing plan-task issue |
| Issue exists? | **Yes — already** (created when Plans 1+2 were filed) | Usually no — you'll create one |
| Acceptance criteria | Read the issue body's "Definition of done" + "Steps" verbatim | You write them when creating the issue |
| Branch name | `task-<plan>-<num>-<short-desc>` e.g. `task-1-3-pwa-config` | `<issue>-<short-desc>` e.g. `42-fix-icon-cache` |
| Commit messages | Use the messages specified in the issue's Steps verbatim | Imperative one-liners |

**Decide the mode first.** If unclear, ask: "Is this Plan 1/Plan 2 task work, or ad-hoc?" Then proceed.

---

## Step 1: Search for overlapping issues / context

```bash
gh issue list --state all --search "<keywords>"
```

For plan-task mode: confirm the issue is the right one and has not already been closed by a previous PR. `gh issue view <N>` to read it.

For ad-hoc mode: check for duplicates before creating a new issue.

**Decision gate:**
- Plan-task: if the issue is closed → ask the user whether to reopen, work on a follow-up, or stop.
- Ad-hoc: if an overlapping issue exists → tell the user and ask how to proceed.

---

## Step 2: Check spec and plan for contradictions

The canonical sources, in priority order:

1. **`docs/superpowers/specs/2026-05-07-fumletone-design.md`** — the canonical design spec. Names, structural decisions, pedagogy, the six load-bearing principles. If the planned change conflicts with this, **STOP**.
2. **`docs/superpowers/plans/2026-05-07-foundation-onboarding.md`** (Plan 1) and **`docs/superpowers/plans/2026-05-07-composer-scrapbook.md`** (Plan 2) — for plan-task mode the matching plan task is the contract.
3. **`CLAUDE.md`** — load-bearing rules (real notation, no scoring, NO+EN parity, iPad/touch-only, no URL routing, no back-during-onboarding, local-first, voice scripts never name people).

For plan-task mode, also reconcile: if the issue body's Steps contradict the source plan file, the issue body wins (it was patched to match agreed-upon fixes — but flag it to the user too).

**Decision gate:** If contradictions exist → **STOP**. Quote the conflicting passages, ask the user to resolve before any code is written.

---

## Step 3: Check the codebase for contradictions

If `src/` exists yet (Plan 1 Task 1 has shipped), grep for naming conventions, types, or assumptions that the planned change would break.

What to look for:
- Names that already exist with a different meaning
- Existing implementations that overlap
- Strict-TS issues (`noUnusedLocals: true`, no `any`)
- Touch-only invariants (no hover, no `onmouseenter`, no mouse-only events)

If `src/` does not yet exist, this step is mostly a no-op — but still skim CLAUDE.md and any prior task issues that may have set conventions.

**Decision gate:** If concerns found → **STOP**, flag to the user before writing code.

---

## Step 4: Pick or create the issue

**Plan-task mode:** the issue exists (#3..#20 for Plan 1, #22..#37 for Plan 2). Record its number.

**Ad-hoc mode:** create the issue first.

```bash
gh issue create \
  --title "<concise title>" \
  --label "<labels>" \
  --body "<description with acceptance criteria>"
```

Useful labels: `task` + `plan-1` / `plan-2` for plan tasks (already applied), `bug`, `documentation`, `enhancement` for ad-hoc work. Don't reuse `epic` or `context`.

**Exception:** If the user explicitly says "skip issue", skip ahead to Step 5. Still create a branch and PR; just omit `Fixes #N`.

---

## Step 5: Create a feature branch

```bash
git checkout main && git pull --ff-only
git checkout -b <branch-name>
```

**Branch naming:**

| Pattern | Use for | Example |
|---|---|---|
| `task-<plan>-<num>-<desc>` | Plan task work | `task-1-7-stores-and-router` |
| `<issue>-<desc>` | Ad-hoc work with an issue | `42-fix-icon-cache` |
| `fix/<issue>-<desc>` | Bug fixes | `fix/53-onboarding-loop` |
| `docs/<short-desc>` | Doc-only changes (with or without issue) | `docs/clarify-real-notation` |

Lowercase, hyphens, short. If "skip issue" was used, use a descriptive name without an issue number.

Note: `core.hooksPath` should be set to `hooks` so the local pre-push hook fires. Verify with `git config --get core.hooksPath`. If it's empty in a fresh clone, run `git config core.hooksPath hooks` once.

---

## Step 6: Implement, test-first

**For plan-task mode this is non-negotiable:** the issue body specifies tests first, then implementation. Follow the Steps in order — they're TDD slices. Don't reorder, don't batch implementation before the matching tests.

**For ad-hoc mode:** if you're touching code with tests, add or update tests. If you're touching code without tests, ask yourself whether the change is risky enough to need them.

**Per-task discipline:**

- After each Step's commit, run `npm run check` (no TS errors) and `npm test` for the changed area before moving on.
- New UI strings: **`nb` and `en` in the same commit, every time.** No "translate later." Use nested-object i18n keys — never flat dotted strings.
- No `any`. Use the canonical types defined in the matching plan's epic (#2 for Plan 1, #21 for Plan 2).
- No mouse-only events: `pointer` and `click` only.
- No URL routing: use the in-memory `route` store (`navigate` / `back` / `reset`).

**Commit style:**

- **Plan-task mode:** use the commit messages specified in the issue's Steps verbatim. Don't paraphrase.
- **Ad-hoc mode:** concise imperative messages.
  - `Fix splash race when audio engine takes >1s to start`
  - `Update CLAUDE.md to mention pre-push hook activation`
  - `Add task-3 PWA icons placeholder set`

Do **not** add `Co-Authored-By` trailers for Claude Code, opencode, Cursor, Aider, Copilot, etc. Do not add "Generated with [Tool]" markers.

---

## Step 7: Test locally

Before pushing:

```bash
npm run check       # strict TS — must be zero errors
npm test            # Vitest one-shot, all suites
npm run test:e2e    # Playwright (slower; run when relevant)
```

For plan-task work the issue's Steps already enumerate the test commands inside specific Steps — follow those.

If `src/` doesn't exist yet (pre-Plan-1-Task-1), these commands aren't installed. That's expected only for the very first task; otherwise it means your branch is missing setup.

For UI changes: run `npm run dev` and verify in a browser at iPad-sized viewport (≈ 1024×768 or 834×1194 portrait). Plan 2 Task 16 (#37) describes this in detail.

Do not proceed past failing tests. If a test fails, diagnose and fix; do not work around with `--no-verify` or by skipping the test.

---

## Step 8: Push and open the PR

```bash
git push -u origin <branch-name>
```

The pre-push hook will pass for any non-`main` ref. If it blocks unexpectedly, that's a bug in the hook — don't `--no-verify` past it; debug.

```bash
gh pr create --base main \
  --title "<plan task or fix title> (Fixes #N)" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullet points: what changed and why>

## Test plan
- [ ] <specific verification steps>

Fixes #<issue-number>
EOF
)"
```

**PR title patterns:**

- Plan-task: `Plan <P> / Task <N>: <title> (Fixes #<issue>)`
- Ad-hoc: `<Imperative summary> (Fixes #<issue>)`
- "Skip issue" mode: omit `(Fixes #N)`

The repo ruleset requires a PR but 0 approvals are needed — you (the user) can self-merge. Force-push to `main` is rejected.

---

## After Review: Documenting Fixes

When PR review surfaces issues that are fixed within the same PR, **comment on the PR** summarising the change. This is the audit trail.

```bash
gh pr comment <PR> --body "$(cat <<'EOF'
## Review fixes

- <what changed and why>
EOF
)"
```

For review findings that are *not* fixed in this PR → create a follow-up issue instead.

---

## Step 9: Provide testing instructions

Tell the user:
- Exact commands to run
- Specific URLs or routes to open
- What to verify against each acceptance criterion (or each Definition-of-Done checkbox in the issue body)

Make it possible to verify the change without reading the diff.

---

## Step 10: Wait for explicit approval

**HARD STOP.** Do not merge without an explicit approval signal — phrases like:

- "merge it" / "squash-merge it" / "looks good, merge"
- "ship it"
- A direct command like `gh pr merge ...`

**A passive ack ("ok", "thanks") is not approval.** Ask if uncertain.

After approval (default to `--squash --delete-branch` unless the user requests otherwise):

```bash
gh pr merge <PR> --squash --delete-branch
git checkout main && git pull --ff-only
```

Then close out: confirm the PR closed the linked issue (the `Fixes #N` line auto-closes on merge), and verify `main` is at the new HEAD.

---

## Exceptions

| Scenario | What changes |
|---|---|
| User says "skip issue" | Skip Step 4. Still branch + PR. Omit `Fixes #N`. |
| Trivial fixes (typos, single-line) | Lighter issue body is fine. Branch + PR still required. |
| Plan-task is mid-implementation in another session | Pull latest main; rebase your branch if needed; do NOT force-push unless the branch is yours alone. |
| Doc-only changes | Same workflow. No tests needed; `npm run check` not required. |

There is no "emergency push to main" exception. The ruleset would reject it anyway.
