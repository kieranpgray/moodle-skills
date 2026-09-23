# moodle-prototype — install and first run

This folder is a Claude skill. Once it's in the right place, asking Claude "let's prototype the
gradebook" (or typing `/moodle-prototype`) produces a single HTML file that opens in any browser:
a throwaway prototype of a Moodle screen, built from the real Moodle code and the Moodle Design
System, with a state switcher and reviewer annotations built in.

No account, no server, no build step. Five minutes to install if Node is already on the machine;
ten if it isn't.

## What you need

| | Why | If you don't have it |
|---|---|---|
| **Claude desktop app** (Code tab or Cowork) or Claude Code in a terminal | Runs the skill | claude.ai/download |
| **A Moodle checkout on your machine** | The skill reads real Moodle code before it designs anything. It doesn't need to run, just exist. | Ask an engineer for a `git clone` of Moodle, or download a zip from github.com/moodle/moodle and unzip it somewhere |
| **Node.js** | Runs the quality check on every prototype (2 seconds, no setup) | nodejs.org → LTS → default installer → reopen Claude |

Optional, and the skill says so when it skips them: a running local Moodle (Docker) to compare
against; the Figma connector for real design frames; the `refactoring-ui-skills` plugin for the
named design checks.

## Install: Claude desktop app, Code tab (or Claude Code in a terminal)

1. Download this repository (green **Code** button → **Download ZIP** on GitHub, or `git clone`).
2. Copy the whole `moodle-prototype` folder — not just `SKILL.md`; the template and scripts inside
   it are part of the skill — to:

   ```
   ~/.claude/skills/moodle-prototype/
   ```

   On a Mac, `~` is your home folder (Finder → Go → Home; press ⌘⇧. to show the hidden `.claude`
   folder). On Windows it's `C:\Users\<you>\.claude\skills\moodle-prototype\`. Create the `skills`
   folder if it isn't there.

   To make it available in one project only, use `<that project>/.claude/skills/moodle-prototype/`
   instead.
3. Open Claude with your Moodle folder as the project.
4. Type `/moodle-prototype check`. Claude runs the readiness check and tells you, in plain words,
   what's OK, what's limited, and what to fix. `READY` means go.

No restart needed; skills are picked up on the next message.

## Install: Cowork

Cowork loads skills from **Customize** in the desktop app, which syncs through your claude.ai
account. Add the `moodle-prototype` folder there (the whole folder, same reason as above), then
choose your Moodle folder as the Cowork workspace.

Then say `/moodle-prototype check`. Cowork runs in its own sandbox rather than directly on your
machine, so the check is the honest answer to "does Node exist here" and "can it see my Moodle
folder"; if either comes back STOP, the Code tab path above is the fallback and works the same
way. (The exact Cowork mechanics change between app versions; the check is written to report
what it finds rather than assume.)

## First run

Say what you want to look at: "let's prototype the forum discussion list so it's easier to
scan". The skill will:

1. Say in one line what it takes the question to be (what this prototype exists to find out) and
   let you correct it. That question stays in the chat; it never goes into the file.
2. Ask which pathway and fidelity you want, as clickable options. Fidelity is wireframe
   (greyscale, still fully interactive), on-system, or considered.
3. Check your setup and copy its template into `public/prototypes/` in your Moodle folder.
4. Read the real Moodle code for that feature and tell you what it found.
5. Build the prototype and run the quality check on it.
6. Ask who will open the file: internal reviewers, usability-test participants, or both.
   Reviewers get the file with its State panel and annotations (and it asks whether those show on
   load or on click). Participants get a separate clean copy with all of that removed and a
   neutral title, so nothing in the file says what you're studying.
7. Hand you the file path(s). Double-click, or drag into a browser.

If the request is richer (a decision riding on it, stakeholders reviewing, a fidelity rule) it
takes a longer path with a plan and Figma grounding first. It tells you which path it's on.

## Checking things yourself

The readiness check is a plain shell script; run it any time from a terminal:

```bash
bash ~/.claude/skills/moodle-prototype/scripts/check-setup.sh
```

The prototype quality check is separate and runs on a file:

```bash
node ~/.claude/skills/moodle-prototype/scripts/proto-lint.js public/prototypes/PROTOTYPE-forum.html
```

`FAIL 0` is the bar before a prototype is shared. Every line it prints says what's wrong and
where.

## What's in the folder

| File | What it is |
|---|---|
| `SKILL.md` | The instructions Claude follows |
| `design-pass.md` | The design QA pass: what gets checked, and the rule that the Moodle Design System beats generic advice |
| `templates/course-page/TEMPLATE-shell.html` | The starting point for every prototype: top nav, course index, block drawer, state switcher, annotations, a greyscale wireframe mode, all on MDS tokens and Noto Sans |
| `scripts/proto-lint.js` | The quality gate (Node, no dependencies) |
| `scripts/proto-export.js` | Makes the usability-test copy: strips the State panel, annotations, guides and every comment, swaps in a neutral title |
| `scripts/ui-audit.js` | A measurement script Claude pastes into the browser to check type, spacing and contrast on the rendered page |
| `scripts/check-setup.sh` | The readiness check |

## If something's off

- **"Skill not found"** — the folder is in the wrong place or was renamed. It must be exactly
  `moodle-prototype` under a `skills` folder. Run the readiness check; section 1 says where it is.
- **"node: command not found"** — Node isn't installed, or Claude was opened before it was.
  Install from nodejs.org, then quit and reopen Claude.
- **"not inside a Moodle checkout"** — Claude's project (or Cowork workspace) isn't your Moodle
  folder. Open it there.
- **The prototype looks like a blank shell** — the file opened fine but the content slot is empty;
  the build was interrupted. Ask Claude to continue from Step 2.
- **Fonts look wrong offline** — Noto Sans and the icons load from the web on first open. Open it
  once online and they're cached.

Written for product and design staff; engineers can skip most of it. Method and reasoning behind
the steps: the *Prototyping Moodle with AI* guide in Confluence.
