# moodle-skills

A collection of AI workflow skills for Moodle product and engineering work. They are designed to automate or augment specific, repeatable workflows — not to be general-purpose assistants.For Product and Design staff, use these within Claude. For engineering, go nuts.

---

## What is a skill?

A skill is a markdown instruction file (`SKILL.md`) that tells an AI agent how to handle a specific task. When placed in your Cowork workspace, Claude picks it up and applies it automatically when you ask for something that matches the skill's trigger.

Each skill defines its inputs, step-by-step instructions, guardrails, and expected outputs. Skills in this repo are opinionated — they encode Moodle-specific conventions, tools, and quality standards rather than generic approaches.

---

## Skills

### Bug Triage (`bug-triage/`)

**Part of:** Alpha team bug triage automation workflow (Sprint 2026-I2.1)

A 5-step pipeline that takes a Jira bug ticket, runs it through a sequence of automated checks, and produces a structured triage note. The orchestrator coordinates the full sequence; each step skill can also run standalone.

Trigger with `/triage-bug MDL-XXXXX` (single ticket), a batch of keys, or no arguments to run the default JQL filter across the Alpha team's component queue.

See `bug-triage/README.md` for the full pipeline overview, triage labels, human checkpoints, and how to add new step skills.

**Requires:** sooperset Atlassian MCP connected to moodle.atlassian.net

---

### Moodle Discovery (`moodledisco`)

Runs structured discovery on a Moodle product initiative. Harvests evidence from connected sources (Confluence, Google Drive, Granola), frames the customer problem, maps to company goals, and produces a discovery synthesis document — the evidence base a PRD is built on.

Phase 1 of the `moodledisco → moodleprd` workflow. Also callable standalone via `/moodledisco`.

---

### Moodle PRD (`moodleprd`)

Drafts a PRD for a Moodle initiative. Pulls context from primary sources, fills gaps through targeted questions, and renders output against the standard Moodle PRD template — with Moodle-specific patterns around source attribution, open decisions, and certainty labelling built in.

Phase 2 of the `moodledisco → moodleprd` workflow. Also callable standalone via `/moodleprd`.

---

### PM Orchestrator (`pm-orchestrator`)

Takes a product idea, customer problem, or business opportunity and develops it into execution-ready artifacts: discovery synthesis, PRD, and Jira tickets. Coordinates `moodledisco` and `moodleprd` as sub-skills. Use when you want to move from raw input to something buildable in one workflow.

---

### Moodle Prototype (`moodle-prototype`)

Builds a throwaway HTML prototype of a Moodle course-page screen — reads the real codebase before designing anything, starts from a bundled template shell, and corrects the result against a running local Moodle (with a Docker fast-path so a second server usually isn't needed). Includes an optional design-QA pass before the correction step. Written for product and design staff with no git or terminal background, as well as engineers. Also callable via `/moodle-prototype`.

Ships a bundled HTML template, a lint, a browser measurement script and a readiness check alongside `SKILL.md` — copying the folder means copying all of it, not just the one file. Install guide: `moodle-prototype/README.md`. First command once installed: `/moodle-prototype check`.

---

## Using these skills

1. Clone or download this repo (green **Code** button → **Download ZIP** works fine)
2. Copy the skill folder(s) you want to where your Claude looks for skills:
   - **Claude desktop app, Code tab / Claude Code:** `~/.claude/skills/<skill-name>/` (all projects) or `<project>/.claude/skills/<skill-name>/` (one project)
   - **Cowork:** add the folder under **Customize** in the desktop app; it syncs through your claude.ai account
3. Claude picks them up on the next message; no restart

`moodle-prototype` has its own step-by-step install guide and a readiness check for non-technical users — see `moodle-prototype/README.md`, or just type `/moodle-prototype check` once it's in place.

Most skill folders contain a single `SKILL.md` file. Some also include a `context/` directory — created at runtime, gitignored, holding local state generated during use (triage logs, indexes, pending review queues) — or, like `moodle-prototype`, checked-in asset files (templates, scripts) that the skill's own instructions reference by relative path. Copy the whole folder in either case, not just `SKILL.md`.

---

## Status

These skills are under active development during Sprint 2026-I2.1 (May–June 2026). They are experiment-grade, not production tooling. Guardrails are conservative: no autonomous posting to Jira, no ticket closures, human confirmation required before reporter-facing actions.

---

## Contributing

Skills are added as the team builds them. Each skill lives in its own directory and is self-contained. If you're building a new step in the bug triage workflow, follow the existing structure and the JSON handoff contract defined in `bug-triage/bug-triage-orchestrator/SKILL.md` — that contract is what the orchestrator uses to route between steps.
