---
name: moodle-prototype
description: >
  Build a throwaway HTML prototype of a Moodle course-page screen, grounded in
  the real codebase before anything is designed. Use whenever someone wants to
  sketch, mock up, or explore how an existing Moodle feature could look — even
  if they don't say "prototype". Trigger phrases include "let's prototype the
  course index", "build me a prototype of the gradebook", "I want to mock up
  how X could look", "can we sketch this in code before Figma", "spin up a
  prototype of X so I can look at it". Also triggered by /moodle-prototype, and
  by /moodle-prototype check (or "is my setup ready?") to test the setup only.
---

# moodle-prototype

Builds a throwaway, self-contained HTML prototype of an existing Moodle screen. The method is
always the same: read how the feature actually works before designing anything, build one file
someone can click, correct it against the real Moodle, then decide what happens next. A prototype
is not the deliverable — the answer it produces is. Once that answer holds up, it becomes an MDL
ticket; the file itself gets deleted.

This skill covers **reimagining an existing feature**. For genuinely new functionality with
nothing in the codebase to read first, see "No existing feature to read" under Mode detection —
the method runs differently there.

Audience note: this is written to be run by product and design staff with no git or terminal
background, as well as engineers. Explain worktrees, servers, and any other technical step in
plain language as you go rather than assuming familiarity — don't skip that explanation just
because it feels obvious.

---

## Mode detection — do this before anything else

Read the request and pick a branch. This changes which steps below get skipped, so don't guess —
if it's genuinely unclear which applies, ask.

- **Setup check only** (`/moodle-prototype check`, "is my setup ready", "can I use this here",
  or any first contact from someone who sounds unsure the skill will work on their machine) —
  run `bash <this skill's folder>/scripts/check-setup.sh` from the project directory and
  translate its output into two or three plain sentences: what's ready, what's limited and what
  that costs them, and the one thing to fix if anything says STOP (the script prints the fix
  under each STOP; repeat it, don't improvise a different one). Then stop. Don't start a
  prototype from a setup check, and don't skip the script and eyeball the environment instead —
  the script is the same answer every time, a look around isn't.
- **Bare ask** ("let's prototype the gradebook", "mock up how the course index could look") — no
  stated question, no requirements, no mention of stakeholders or a real decision riding on it.
  Default to the **shortcut path**: Step 0, Step 1 (good-enough tier), then Step 2. Don't reach
  for Step 3's planning or Step 4's Figma grounding unless the result comes back thin, or the
  user redirects.
- **Rich brief already given** — the request already states what to demonstrate, what data to
  use, a fidelity rule, or explicitly says this is going in front of stakeholders for a decision.
  Skip straight to the **considered path**: Step 0, Step 1 (full tier), then Step 3. Don't re-ask
  for information already given.
- **No existing feature to read** — genuinely new functionality, nothing in the codebase to
  ground Step 1 against. Skip Step 1 and Step 2/3 entirely. Instead, sketch two or three
  structurally different directions rather than build one ("give me three different ways to
  achieve `<the outcome>`"). There's no existing implementation to correct against, so this is
  seeding an exploration, not converging on a right answer. Hand the strongest direction to Figma,
  or keep iterating on it here if the idea is still forming. None of the remaining steps in this
  file apply until a direction is chosen and something exists to correct against.

Two tiers run through every step that follows: **good enough** (short, the default, produces
useful work fast) and **the full version** (costs more, use it when the prototype is going in
front of stakeholders for a real decision, the feature is one you don't understand yet, or you've
been burned on this area before). Escalate to the full version mid-flow if a good-enough result
comes back too thin — don't restart, just deepen the step that's weak.

---

## Step 0 — set up, once

Not part of the repeating cycle below; do this once per workspace, not per prototype.

0. Run `bash <this skill's folder>/scripts/check-setup.sh` first and read it before doing
   anything by hand. It answers the three questions the rest of this step depends on — is the
   skill folder complete, is Node there for the lint, is this a Moodle checkout — plus the
   optional ones (Docker, a static server). If it prints STOP, relay the fix it gives and wait;
   there's no point copying a template into a folder that isn't Moodle. If it prints LIMIT, say
   what the limit costs in one sentence (e.g. "no running Moodle, so Step 5's comparison gets
   skipped") and carry on. Non-technical users get this output translated, not pasted.
1. Confirm this is a Moodle checkout, on a working copy (a git worktree) that won't affect anyone
   else's work. Explain what a worktree is in plain language if the user seems unfamiliar — "a
   second folder pointing at the same repository, so nothing here can break real work."
2. Create `public/prototypes/` if it doesn't exist.
3. **Copy the bundled template and the lint into place.** This skill ships its own copies at
   `templates/course-page/TEMPLATE-shell.html` and `scripts/proto-lint.js`. If
   `public/prototypes/TEMPLATE-shell.html` doesn't exist in this checkout, copy the bundled one
   in; copy `proto-lint.js` beside it. If a file already exists there, diff it against the
   bundled copy and ask before overwriting — don't silently clobber someone's in-progress edits
   to their own shell. The lint runs with `node public/prototypes/proto-lint.js <file>` and is
   the gate at Step 6; the template itself passes it with 0 FAIL, so any failure on a prototype
   is the prototype's own.

   State this plainly when you do it: **this is the skill's own bundled copy, not yet part of
   Moodle's tracked codebase.** `git log --all -- public/prototypes/TEMPLATE-shell.html` returns
   nothing as of when this skill was written — it has never been committed to Moodle core, and
   forks silently across worktrees as a result. Copying it into this checkout fixes that for this
   one checkout; it does not fix the underlying gap. If asked, say that committing it properly to
   Moodle core is a separate, still-open task, not something this skill does for you.
4. Check whether a local Moodle instance is already running (Docker or otherwise) **and serving
   this checkout — not just running.** A Docker instance can be up on port 9443 and mounted to a
   different worktree; using it would silently serve someone else's files. Verify, don't assume:
   write a tiny marker file into this checkout's `public/prototypes/` and fetch it through the
   instance's URL. If it comes back, the instance serves this checkout; if it 404s, it doesn't.
   Delete the marker either way.
   - **If it serves this checkout:** prototypes are already reachable through it, no extra
     server needed. Moodle 5's docroot is `public/`, and `public/prototypes/` sits inside it, so
     the moment a prototype file exists there it's reachable at something like
     `https://localhost:9443/prototypes/PROTOTYPE-<thing>.html`.
   - **If nothing is running, or it serves a different checkout:** set up a simple static server
     for this checkout's `public/prototypes/` instead, and save the config so it doesn't need
     redoing next time.

   Why a server at all, rather than opening the file directly: a stable URL is what lets you open,
   screenshot and click through the prototype yourself, rather than asking the user to describe
   what's on screen. A `file://` path also restricts or behaves inconsistently for things like
   fetching a sibling file.
5. Check the Figma connection works by pulling any node the user provides, if one is available at
   this point. If not, this happens later at Step 4 instead.

Report back the one thing the user needs to do to see a prototype in their browser — nothing more.

---

## Step 1 — read the code first

Do not propose any changes yet. This step exists to stop the prototype being grounded in a
hunch.

**Good enough:** Go and read how the named feature actually works in this codebase. Establish
where it lives, what settings control it, any dependencies worth knowing about, and what already
exists that would otherwise get reinvented. **Done when** you can name the template(s) and the
one stylesheet that shape the thing, with file paths, and say which of them the prototype is
about to diverge from. Three or four citations is enough; you are not writing a report.

**Full version:** Answer all five of the following, citing file and line for each:
1. Where is it defined? Templates, JS, SCSS, PHP renderers.
2. Where is it invoked from, and are there alternate render paths?
3. What admin, course or user settings change its behaviour?
4. What are its layout rules and breakpoints, and where do those numbers come from?
5. What already exists here that would otherwise get reinvented?

Anything that can't be pointed at in the code is an assumption — list those separately, don't let
them arrive disguised as fact. Write the findings to `public/prototypes/FINDINGS-<feature>.md`
(same folder as the prototype, so they travel together); the investigation is often the most
valuable output of the whole session and otherwise disappears when the chat ends. **Done when**
all five can be answered without hedging — this one constraint produces more depth than any
amount of extra detail in a request; hold to it even under time pressure. It applies to the full
version only; the good-enough tier has its own, lighter, done-when above.

---

## Step 2 — build fast and fix later (shortcut path only)

This is the shortcut, not a lighter version of Steps 3–4. It skips planning and Figma grounding
entirely: get something clickable in front of the user straight away, and fix what's wrong once
it can actually be seen, rather than getting it right on paper first. There is no full-version
tier of this step — a considered version of "build fast" doesn't mean anything. If more rigour
turns out to be needed partway through, move to Step 3 rather than trying to retrofit it here.

Build the prototype at `public/prototypes/PROTOTYPE-<thing>.html`, starting from
`public/prototypes/TEMPLATE-shell.html`. Establish what the user is trying to learn in a sentence
or two, show the two or three things that answer it, and don't invent scope beyond what was asked
for.

**Data minimum, even on the shortcut:** inside `#prototype-content`, at least one string of 60+
characters, one zero/empty state, and one count of 1,000+. The template's `AWKWARD` constants
exist for exactly this — use two of them. Tidy data is the single most common way a prototype
lies: it looks fine on three short rows and falls over on the first real course.

**Design system, even on the shortcut.** Every colour, spacing, radius and type size is a
Moodle Design System (MDS) value, and the only typeface is Noto Sans. The template's `:root` is
already an MDS alias layer (each token names its `$mds-*` source), so the rule in practice is:
use what's in `:root`; if the value you need isn't there, look it up in
`lib/bundles/design-system/scss/tokens/` and add it to `:root` with the `$mds-` name in the
comment. Never write a hex, a `font-family`, or an off-scale size straight into a rule. The
older prototypes did — invented activity-purpose pinks, an "MDS-named" orange that isn't in MDS,
a header prototype with no Noto Sans at all — and it's the reason "does this match Moodle?"
could never be answered by looking. `proto-lint` warns on any `:root` value that isn't MDS and
fails on any face that isn't Noto Sans.

Once it renders, run `node public/prototypes/proto-lint.js <file>` as a habit, not a gate —
it's a 2-second read of what you've missed. The gate is at Step 6.

---

## Step 3 — brief and plan (considered path only)

The entry point to the considered path, independent of Step 2, not a continuation of it. Use this
instead of Step 2, not after it, when the answer needs to hold up under real scrutiny.

**Good enough:** Plan before building. State the assumptions the plan rests on, and ask about
anything ambiguous rather than guessing.

**Full version:** Before writing any code, establish and write down:
- **What this needs to teach us** — stated plainly enough that a reviewer knows exactly what
  they're being asked to weigh in on.
- **Must demonstrate** — a numbered list of checkable behaviours, each with the number that makes
  it checkable. "The toggle should not jump" is arguable; "at 1400px and above the toggle keeps a
  constant gap from the content edge" is testable by measuring, not by looking.
- **Data** — the source, and the hard cases specifically. Minimum, inside `#prototype-content`:
  one string of 60+ characters, one zero/empty state, one count of 1,000+ (the template's
  `AWKWARD` constants). Tidy invented data hides the exact problem the prototype exists to surface.
- **Fidelity** — `rough` or `considered`, written into the NOTES `Fidelity:` field so reviewers
  calibrate what they're looking at; plus Boost-loose or Figma-accurate, and which wins where they
  conflict, with the reason noted. Figma node IDs go in the NOTES `Figma nodes:` field, or
  literally `none (Boost-loose)` if there are none — never a placeholder.
- **Out of scope this pass** — named explicitly, with an invitation to flag anything load-bearing
  before it gets built rather than after. Naming exclusions up front avoids scope quietly
  accumulating and needing two turns to pull back later.

Then, before presenting the plan:
- List every assumption it rests on, marked as verified in code, verified in Figma, or
  unverified.
- Name the two decisions most likely to be wrong, and what the fallback would be if they were.
- State where the design and the code disagree — don't resolve that silently, surface it.

Ask about anything ambiguous rather than picking a default. Left to pick a default, the sensible
choice made now is often revealed as *the* decision three iterations later — surfacing it costs
one question up front.

Fill in the NOTES block at the bottom of the file once building starts (see "What a prototype
file looks like" below).

---

## Step 4 — bring in Figma and the design system

This is where the considered path's actual build happens, once Step 3's plan holds up.

Paste a Figma node URL and read the frame: layout, variables, measurements, and a screenshot. A
Figma file with the Moodle Design System library attached, and components with descriptions
written for code generation, produces noticeably better results — those notes get read and used.

The design system also lives directly in the codebase, at `lib/bundles/design-system/`, as
colour, spacing and type tokens (`scss/tokens/`, generated from Figma variables, `$mds-*`) and
a set of ready-made components. **It is the source of every value in the prototype.** The
template's `:root` aliases the subset a course page needs; anything beyond that comes from the
tokens directory, added to `:root` with its `$mds-` name, never invented. The base face is
`$mds-font-family-base`, Noto Sans; no prototype changes it.

Three things can go wrong between those two places, none of them unique to Moodle, all of them
liable to have changed since this was written — check rather than assume:
- **Figma can be ahead of the code.** A component gets designed before it's built. When a design
  calls for something the codebase doesn't have, say so — build to spec, don't quietly invent a
  lookalike.
- **Not every Figma component has a code match.** Where a match exists, use the real component.
  Where it doesn't, anything built is likely to duplicate something that already exists.
- **A component only helps if a real Moodle screen already uses it.** This works by pattern-
  matching existing code; a component with no real-screen usage has nothing to copy from. Confirm
  the current state directly (check the package, check Figma, check for real usage) rather than
  trusting this list, since it's the thing most likely to be stale.

Build to each frame given (desktop, tablet, mobile) as a state, not a suggestion. Two rules
settle most disagreements before they start:
- **The Figma component is the authority for its own measurements.** Where an earlier prototype
  disagrees with it, the component wins.
- **Where core already has a real value — an SCSS variable, a breakpoint — core wins over
  Figma.** Record the decision and the reason in NOTES.

Before writing any UI primitive, check `lib/bundles/design-system/js/components/` and the SCSS
tokens. If the design system has it, use it; if Figma has it and the package doesn't, say so
rather than inventing one. Record every Figma node ID used in the NOTES `Figma nodes:` field —
six weeks later it's the only way to know what "matches the design" actually meant.

---

## Step 4.5 — design QA pass, leveraging refactoring-ui-skills

Runs once a first version exists — from either Step 2's shortcut build or Step 3+4's considered
build — and before Step 5. It is split in two, and the split is the point:

- **Conformance, always.** Tokens, spacing scale, contrast, hierarchy. These make the prototype
  *more on-system*, not prettier, so they run on every build without asking. Set
  `Fidelity: rough` in NOTES. **On the shortcut path, conformance is the `ui-audit.js` census
  scoped to `#prototype-content` plus `proto-lint` — not four separate skill invocations.** The
  census is what catches an off-scale gap or a 4.07:1 chip; the named refactoring-ui checks
  (02/03/04/09) are for the considered path, where the extra turns are already budgeted.
- **Polish, only when the brief says stakeholders are reviewing.** Clutter, shadows, empty-state
  treatment (06/07/08). Ask before running these. Set `Fidelity: considered` if they ran.

Why the split: NN/g's aesthetic-usability finding is that a polished prototype makes reviewers
comment on the visuals instead of the problem it was built to expose, and hi-fi reads as "done".
A rough prototype that answers its question beats a polished one that gets admired. The
`Fidelity:` field exists so a reviewer knows which one they're looking at.

**Scope the census to what you built.** Run `ui-audit.js` with `window.__uiAuditRoot =
'#prototype-content'` set first, or its numbers describe the shell, not the prototype. The
shell's own known conflict — `--text-muted` on `--bg-strong` measures 4.07:1 against a 4.5:1
target — is a design-system finding recorded in SHELL-NOTES, not something to fix in a
prototype (Rule 0 in design-pass.md: report the conflict, leave the token alone). The same rule
covers refactoring-ui's "25% type jumps" against the MDS type scale (14/16/20/24/28/32/40px):
the token set wins, the disagreement gets reported. The census's `typography.offMdsScale` and
`typography.nonMdsFaces` are the two numbers to read first — text off the scale or in a face
other than Noto Sans is a defect on either path, not a taste question.

Only skip conformance if the user says this specific prototype is disposable and won't be looked
at again — don't make that call unprompted because the shortcut path was used.

See [design-pass.md](design-pass.md) for the full process: which checks run at which phase, how
the design system's own tokens override generic advice, and how to run the bundled measurement
script at [scripts/ui-audit.js](scripts/ui-audit.js) (its `scroll.trapped` field catches the
unscrollable-page class of bug at runtime).

---

## Step 5 — correct it against the real Moodle

This step is reactive: it runs when a reviewer says what's wrong, or when there's a real Moodle
to compare against. On a first shortcut build with neither — no reviewer yet, no logged-in
instance serving this checkout — there is nothing to correct against yet. Say so in the report
and move on to Step 6; don't invent a correction to have done the step.

The most effective correction available is a side-by-side screenshot against the real build.

**Good enough:** Given a description of what's wrong, find out why the prototype and the real
Moodle differ in the code, then match it.

**Full version:** Find the specific rule in core that produces the difference, state what it is,
then match it — or, if the real build looks like the actual problem, say so instead of matching
it. Either way, the mechanism is what matters, not just the fix.

When the prototype has used the wrong control, work from the real markup rather than a
description of it — inspect the real element and use its actual HTML.

When something looks wrong and the cause might be meaningful rather than cosmetic: identify what
that state actually is in the codebase and what it means, then present two ways to solve it with
a recommendation and the trade-off between them, rather than picking silently. This is where the
best, most specific details tend to come from — a semantic fix a description alone would never
have specified.

---

## What a prototype file looks like

Every prototype starts from `public/prototypes/TEMPLATE-shell.html` (this skill's bundled copy,
placed there in Step 0) and is renamed `PROTOTYPE-<thing>.html`. One self-contained HTML file, no
build step — it has to open from a file, serve as a static page, and survive being emailed.

The template ships the scaffolding below with **fixed ids** — `#devPanel`, `#devMin`, `#guidesBtn`,
`#annotBtn`, `#measureBar`, `#debug` — so every prototype's scaffolding is the same scaffolding.
Don't rename them and don't re-invent them; older prototypes did (`.prov`, `devSwitch`, three id
conventions) and it's why nothing was ever consistent. Carry these forward into whatever gets built:

- **Annotations ship in the template** — callouts that guide a reviewer through key aspects of
  the prototype, wherever they need telling that something is there (including that it works from
  the keyboard). Add `data-annot="the callout"` (and optionally `data-annot-side`) to any element
  and the layer builds the rest. One question to ask, at Step 6 not here: should they show on load,
  or stay hidden until the reviewer clicks Annotations? Don't decide it silently.
- **A State panel** that switches between the states the prototype is about. It ships minimised
  by default (a small pill, not an open panel) — the bundled template already starts this way; if
  building a screen from scratch, match that default rather than leaving the panel open. A
  reviewer having to be told "now imagine it in edit mode" is a worse review than one where they
  can click a toggle, but that toggle shouldn't sit open over the screen it describes.
  **As soon as the panel has more than one axis of state** (page width, role, edit mode, and so
  on), disable the control for any combination that isn't valid, rather than leaving a broken
  combined state reachable — a greyed-out button reads as "this doesn't apply here"; a silently
  broken screen doesn't.
- **Alignment guides and a measurement bar**, using shared vocabulary: nav contents, cap, page
  furniture, reading column. This is what turns "looks a bit narrow" into "the drawers are 23px
  inside the cap."
- **Two NOTES blocks at the bottom, and they are not the same thing.** `SHELL-NOTES` is inherited
  from the template — the shell's decisions and traps — and is never edited in a prototype; if it
  needs changing, change the template. `NOTES` is the prototype's own, with six fixed fields:
  `Question:`, `Answer:`, `Fidelity:`, `Figma nodes:`, `Decisions:`, `Traps:`. Exactly one
  `Answer:` in the whole file. Keep it short; the lint warns past 120 lines. This is what stops a
  NOTES block growing to 900 lines by inheriting the previous prototype's (it happened), and stops
  a file carrying two contradictory Answers (that happened too).
- **MDS inherited, not bolted on.** `:root` is an alias layer over the Moodle Design System:
  short names (`--sp-md`, `--text-muted`, `--fs-sm`, `--danger`) each carrying the `$mds-*` name
  they stand for. `--font-family` is Noto Sans and the body uses it; `--font-code` is the MDS
  monospace face for code. Extend `:root` from the tokens directory when a value is missing;
  never inline a hex or a `font-family` in a rule. Older prototypes speak `--mds-*` directly —
  the same values under the long names — and one dialect per file is the rule when lifting.
- Accessibility inherited, not bolted on: the template carries a global `:focus-visible` ring,
  and the drag handle carries Pointer Events + `touch-action:none` + a 24px coarse-pointer grab
  zone together — keep all three together, each alone is a silent failure on iPad. Anything you
  add that's draggable also works from the keyboard.

---

## Step 6 — set the landing state, then share it

A reviewer shouldn't have to click anything to see the thing being decided, and getting the file
to them shouldn't need explaining either.

Three things happen here in both tiers, and the third is a gate, not a suggestion:

1. **Ask the annotations question**: show on load, or hidden until the reviewer clicks
   Annotations? Set DEFAULTS accordingly (`setAnnots(true)` for on-load). If you can't ask —
   no user in the loop — default to hidden-until-clicked and say so in the report; on-load is
   the right answer when the reviewer is a stakeholder seeing it cold, hidden when it's someone
   who'll drive it themselves.
2. **Fill in `Answer:` in NOTES** with what was concluded — a real sentence, forty characters or
   more, not a placeholder. Across the existing prototypes this was filled in 0 times out of 13.
   The method says the answer is the only thing worth keeping; a prototype without one is a file
   nobody will be able to interpret in a month. If the review hasn't concluded yet, write what's
   known so far and say so — that is still not a placeholder.
3. **Run the lint and get 0 FAIL** — `node public/prototypes/proto-lint.js <file>`. Do not
   report the file path until it passes. If a FAIL is genuinely wrong for this prototype, fence it
   with a `proto-lint-disable <check>: <reason>` comment that says why; a fence without a reason is
   ignored.

**Good enough:** Do the three above, set the prototype to open on the state that matters, minimise
the State panel, report the file path with the lint summary line.

**Full version:** Same, plus confirm the prototype works when opened directly from the file
system rather than through whatever local server was used to build it, and check `SHELL-NOTES` is
still byte-identical to the template's (the lint warns if not).

The landing state is whatever the reviewer should be looking at the moment the file opens, no
clicking required — mobile width with the drawer open, edit mode on, a specific tab active. Pick
the one thing they should see first.

Sharing is simpler than it sounds: the output is always an HTML file, and sharing it means
sending that file the way any other attachment gets sent — Slack, email, wherever. Whoever gets
it double-clicks it and it opens; no hosting, no link required. A shared prototype hosting site
may exist for finished work (check the current project's own conventions before assuming one), but
it is not a substitute for sending the file directly, and access to it may be restricted.

---

## Turn this into an MDL ticket

The prototype is not the finish line — the answer it produced is. Scope hard: if the prototype
demonstrated several things, the first ticket covers one of them.

**Good enough:** Turn it into an MDL ticket for one thing only, nothing else. Plain language, no
filler, written for someone who hasn't seen the prototype.

**Full version:** Write the ticket for a developer who will read it once and think "just tell me
what you want changed" — product and design staff read it too, so keep the jargon out. Include:
design rationale in three sentences, what changes, what to test, open questions. Nothing else —
don't explain what isn't being done. Cite the prototype as the evidence and **quote its `Answer:`
line verbatim** — that's what makes the Answer load-bearing rather than a field people skip — and
its lint result. Include an opening prompt that lets a fresh session with no prior context
implement this directly off main.

Do not create, comment on, or push anything to Jira without the user's explicit approval — draft
the ticket and show it first.
