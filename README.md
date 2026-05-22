# moodle-skills

A collection of AI workflow skills for Moodle product and engineering work, built for use with [Claude Cowork](https://claude.ai) and the Claude Agent SDK.

Skills in this repo are developed by the Moodle Alpha team and Platform Solutions group. They are designed to automate or augment specific, repeatable workflows — not to be general-purpose assistants.

---

## What is a skill?

A skill is a markdown instruction file (`SKILL.md`) that tells an AI agent how to handle a specific task. When placed in your Cowork workspace, Claude picks it up and applies it automatically when you ask for something that matches the skill's trigger.

Each skill defines its inputs, step-by-step instructions, guardrails, and expected outputs. Skills in this repo are opinionated — they encode Moodle-specific conventions, tools, and quality standards rather than generic approaches.

---

## Skills

### Bug Triage: Quality and Completeness Check (`bug-triage-quality-check`)

**Part of:** Alpha team bug triage automation workflow (Sprint 2026-I2.1)

Step 1 of a multi-step bug triage pipeline. Given an MDL Jira issue key, it fetches the ticket and checks it against Moodle's public tracker standards — reproduction steps, expected vs actual behaviour, affected version, and sufficient context. 

- Incomplete tickets: applies `needs_more_info` label, drafts a reporter comment for human review before posting
- Complete tickets: applies `AI_triaged` label and passes a structured result to the next step
- Writes a local triage log and ticket index to support the end-of-sprint review

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

Skills are added as the team builds them. Each skill lives in its own directory and is self-contained. If you're building a new step in the bug triage workflow, follow the existing structure and interface contract in `bug-triage-quality-check/SKILL.md` — specifically the JSON handoff block, which is the contract between steps.
