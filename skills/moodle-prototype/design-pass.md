# Design pass

An optional polish stage that runs after a first version of the prototype exists (either from
step 2's shortcut or step 3+4's considered path) and before step 5's correction against real
Moodle. It catches internal hierarchy, spacing and contrast problems cheaply, before step 5's
side-by-side screenshot diffing gets distracted by them.

If the [refactoring-ui-skills](https://github.com/gnurio/refactoring-ui-plugin) plugin is
installed, use its ten named PASS/FAIL checks, invoked individually (e.g.
`Skill(skill: "refactoring-ui-skills:01-establish-visual-hierarchy")`), following the phase table
below. If it isn't installed, skip the named checks and go straight to the audit loop and the
plain-language review in "No plugin installed" — don't block the prototype on a missing plugin.

## Rule 0 — the design system wins

This template already has tokens. Skills **02 (typography scale)** and **03 (colour palette)**
are conformance checks against them, not generative advice: does this prototype use the existing
scale, or has it invented values? Never "fix" a token to satisfy generic Refactoring UI advice.
Where the two genuinely conflict, report the conflict as a finding about the design system and
leave the token alone — that finding is often the most valuable thing a prototype produces.

"The design system" means the Moodle Design System (MDS): `lib/bundles/design-system/scss/tokens/`
in a Moodle checkout, `$mds-*` variables generated from the Figma library. The template's
`:root` is an alias layer over it — every value there is an MDS value under a short name, with
the `$mds-*` source in the comment beside it — so the two never disagree, and `proto-lint
mds-values` warns the moment one does. Read values from `:root` (or the tokens directory), not
from a screenshot or memory. The tokens actually in play:

- Type: `--font-family` (Noto Sans, `$mds-font-family-base`; the only face), `--font-code`,
  `--fs-sm/md/lead`, `--fs-h1…h6`, `--lh-*`, `--fw-regular/medium/semibold/bold`
- Spacing: `--sp-xxs`, `--sp-xs`, `--sp-sm`, `--sp-md`, `--sp-lg`, `--sp-xl`, `--sp-xxl`
- Radius: `--r-xs`, `--r-sm`, `--r-md`, `--r-lg`, `--r-xl`, `--r-pill`
- Colour: `--text-default/subtle/muted/inverse`, `--bg-subtle`, `--bg-strong`,
  `--border-subtle/default/ring`, `--primary`, `--primary-dark`, `--primary-active`,
  `--primary-light/subtle`, `--surface`, `--page-bg`, `--danger/success/warning/info` (+
  `-light`), `--activity-*` (+ `-bg`), `--shadow-sm/md/lg`
- Layout: `--shell-max`, `--shell-pad`, `--nav-h`, `--ci-width` / `--ci-min` / `--ci-max`,
  `--cb-width`, `--sitenav-width`, `--content-max`, `--btn` (these are Boost/Figma geometry,
  not MDS tokens, and the lint doesn't check them against MDS)

Typography in particular: skill 02's "pick a scale" is already answered. The MDS scale is
14/16/20/24/28/32/40px; `ui-audit.js` reports `typography.offMdsScale` (real text elements
whose size isn't on it) and `typography.nonMdsFaces` (anything rendering in a face other than
Noto Sans). Both should be empty inside `#prototype-content`; icon glyphs and avatar initials
are the usual legitimate exceptions.

If the prototype has since diverged from the shell (a different feature area, custom colours for
a specific data visualisation, etc.), that's fine — Rule 0 applies to whatever tokens the
prototype is actually using, not strictly this list. The point is: check against declared
`:root` values, don't eyeball it.

**One dialect per file.** The older prototypes (`PROTOTYPE-course-settings.html`,
`PROTOTYPE-grading.html`, most of the `mod/` ones) speak `--mds-*`; this template speaks
`--sp-*/--text-*`. Lifting a widget from an older file imports its dialect, and a file that
references both is the single most common token defect in the existing set. Translate when you
lift; `proto-lint` fails `token-dialect` on the mix and `undefined-token` on any `var()` that was
never declared (a silent fallback to nothing).

## When to run what

The pass is split into **conformance** (always) and **polish** (only when the brief says
stakeholders are reviewing). The reason is NN/g's aesthetic-usability effect: a polished prototype
makes reviewers comment on the visuals instead of the problem it was built to expose, and hi-fi
reads as "done". Conformance makes the prototype more on-system without making it prettier;
polish makes it prettier. Record which ran in the NOTES `Fidelity:` field (`rough` = conformance
only, `considered` = polish too) so a reviewer knows what they're looking at.

| Phase | Tier | Checks | What you're actually doing |
|---|---|---|---|
| **Before any markup** | conformance | 01 visual hierarchy, 10 group related elements, 05 button hierarchy | One line per screen: what is primary, secondary, tertiary; which elements form groups; which single action is the primary button. Written down before CSS exists, this is cheap; after, it's a rewrite. |
| **While building** | conformance | 04 spacing, 02 typography, 03 palette | Pull from the token set above. Keep within-group gaps smaller than between-group gaps. Reach for weight and colour before size. |
| **After it renders** | conformance | 09 contrast, plus `ui-audit.js`'s `scroll.trapped` | Measure, don't squint — see the audit loop below. `scroll.trapped: true` means content below the fold is unreachable; fix it before anything else. |
| **After it renders** | polish | 06 clutter, 08 shadows, 07 empty states | Ask first. 07 is the one worth arguing for even on a rough build: prototypes are built on happy-path data and the zero state is exactly what stakeholders ask about — which is why the template's `AWKWARD` constants include a zero count. |

**Don't run the full pass on every variant** if step 2's "build fast, fix later" produced more
than one rough attempt. A quick prototype's job is to show something fast, not be polished; run
only 01 and 10 across rough attempts, and the rest once one direction is chosen.

## The audit loop

1. Open the prototype however step 0 set it up — the Docker-served URL if a local Moodle instance
   is running, or the static server otherwise (see the source doc's step 0 for both paths).
2. Run [`scripts/ui-audit.js`](scripts/ui-audit.js) in the browser (paste its full contents into
   a JS execution tool against the loaded page). It returns a census: distinct font size/weight
   pairs, spacing values off the scale, WCAG failures with selector + measured ratio, shadow and
   border-radius counts, distinct colours. It measures; it does not judge — feed the numbers into
   each check's PASS/FAIL criteria (or into the plain-language review below if the plugin isn't
   installed).
3. Screenshot for the things no script can see: is the primary element actually the first thing
   your eye lands on, is the grouping legible, does the empty state exist at all.
4. Resize to a mobile width and re-run — spacing and hierarchy fail differently at narrow widths,
   and the census is per-viewport.

Blind spots the script reports rather than guesses at: text over a gradient or image lands in
`contrast.unmeasured` (screenshot it instead), `.sr-only` text is skipped, and only the current
route and viewport are measured — re-run per screen and per breakpoint that matters.

## No plugin installed

Without `refactoring-ui-skills`, still run the audit loop above, then review the numbers against
the phase table's intent directly: does the census show a coherent hierarchy (2-3 font
size/weight pairs used deliberately, not a dozen accidental ones), is spacing on the scale, do
all text/background pairs clear 4.5:1 (3:1 for large text), does an empty/zero state exist. Same
output shape as below, just without a named check to cite.

## What to hand back

A short **Design pass** block appended to the prototype hand-over. Not a scorecard:

- **≤5 fixes, ordered by impact.** Each one names the check (or, without the plugin, the
  category), the selector, and the specific change: *"09 contrast — `span#collapseAllLabel`
  `--text-muted` on `--bg-strong` is 4.07:1, needs 4.5:1. Use `--text-subtle` instead."*
- **Conflicts with the design system, called out separately** (Rule 0), because those are
  decisions for the user, not edits for you.
- **No PASS list.** If a check passed, it earns one clause, not a section.

## Anti-patterns

- Running the design pass *instead of* answering the prototype's question (see the source doc's
  step 2/3 framing — "what you're trying to learn"). A contrast audit that arrives with the
  question unanswered is a distraction with good manners.
- Polishing a losing rough attempt. Delete it.
- Silently rewriting tokens, spacing scales, or brand colours to satisfy the audit.
- Treating the census as a verdict. Thirteen size/weight pairs is a smell, not a failure — a
  dense admin or grading screen legitimately needs more steps than a course-page card.
