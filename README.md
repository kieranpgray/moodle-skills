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

## Using these skills

1. Clone or download this repo
2. Copy the skill folder(s) you want into the `skills/` directory of your Cowork workspace
3. Claude will pick them up automatically in your next session

Each skill folder contains a single `SKILL.md` file. Some skills also include a `context/` directory — this is created at runtime and holds local state generated during use (triage logs, indexes, pending review queues). The `context/` directory is gitignored; it will be created automatically the first time the skill runs.

---

## Status

These skills are under active development during Sprint 2026-I2.1 (May–June 2026). They are experiment-grade, not production tooling. Guardrails are conservative: no autonomous posting to Jira, no ticket closures, human confirmation required before reporter-facing actions.

---

## Contributing

Skills are added as the team builds them. Each skill lives in its own directory and is self-contained. If you're building a new step in the bug triage workflow, follow the existing structure and the JSON handoff contract defined in `bug-triage/bug-triage-orchestrator/SKILL.md` — that contract is what the orchestrator uses to route between steps.
