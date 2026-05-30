# Bug Triage Automation — Alpha Team

A modular, AI-assisted bug triage pipeline for the Moodle public tracker. Built for the Alpha team's Jira component queue. Each step is a standalone skill; an orchestrator coordinates the full sequence.

The agent assists. Humans remain accountable for every decision.

---

## What it does

The pipeline takes a Jira bug ticket, runs it through a sequence of automated checks, and produces a structured triage note. The note tells a reviewer what was found, whether the bug is valid, how complex the fix looks, and what action to take.

No change is made to Jira — no label applied, no label removed, no comment posted — without the agent first pausing and asking for explicit confirmation.

---

## Pipeline overview

```
Step 1 — Quality check
    Incomplete ticket: reporter comment drafted, pipeline stops
    Complete ticket:   proceed
              ↓
Steps 2, 3, 4 — parallel analysis
    Step 2 — Recent changes    (regression candidates)
    Step 3 — Bug validation    (genuine bug vs working as intended)
    Step 4 — Test coverage     (gaps in the affected area)
              ↓
Step 5 — Assignment and outcome
    Aggregates findings, determines triage label, drafts triage note
              ↓
Human reviews and confirms. Note posted to Jira.
```

---

## Skills in this set

| Skill | Step | What it does |
|-------|------|--------------|
| `bug-triage-quality-check` | 1 | Checks ticket completeness against Moodle tracker standards |
| `triage-find-regression` | 2 | Queries GitHub commits for regression candidates |
| `bug-triage-validation` | 3 | Cross-references reported behaviour against Moodle docs |
| `bug-triage-test-coverage` | 4 | Checks test coverage in the affected code area |
| `bug-triage-assignment` | 5 | Determines outcome and produces the final triage note |
| `bug-triage-orchestrator` | — | Coordinates Steps 1–5, manages state, handles checkpoints |

Each skill can run standalone. The orchestrator is one entry point, not the only one.

---

## How to trigger the pipeline

The pipeline is triggered by typing a command in your AI assistant. When the assistant sees `/triage-bug`, it loads the orchestrator skill and begins following its instructions. There is no separate process, CLI tool, or API call. The AI reads the orchestrator's instruction file, then reads each step skill's instruction file in turn, carrying results forward as structured handoff blocks.

**What actually happens when you type `/triage-bug MDL-12345`:**
1. The AI matches the trigger phrase to the `bug-triage-orchestrator` skill
2. It loads the orchestrator's instructions
3. Those instructions direct it to invoke each step skill in sequence
4. Each step skill is a separate instruction file the AI reads and follows
5. Results are carried forward in the same session as JSON handoff blocks and local files

```
/triage-bug MDL-12345                    single ticket
/triage-bug MDL-12345 MDL-12346          batch
/triage-bug                              run the default JQL filter
/triage-bug MDL-12345 --recheck          re-run after a reporter update
```

---

## Triage labels

Every ticket in the pipeline carries exactly one `triage/` label. Labels are mutually exclusive — applying a new one removes the previous.

| Label | Meaning |
|-------|---------|
| `triage/needs-info` | Ticket is incomplete. Awaiting reporter response. |
| `triage/in-progress` | Step 1 passed. Pipeline running. |
| `triage/ready-for-human` | Valid bug. Added to team backlog for review and assignment. |
| `triage/wontfix` | Not a bug, or out of scope. Human confirmed. |

`HQ team alpha` is applied alongside `triage/ready-for-human` to add the ticket to the team backlog.

**Future option, not currently active:** A `triage/ready-for-agent` label would distinguish tickets where an automated agent could plausibly implement the fix — making the longer-term automation case measurable. Excluded from the current workflow by design.

---

## Human checkpoints

The agent pauses and waits for explicit confirmation before every Jira action. This covers every label application, label removal, and comment post — not just the final ones.

**Label confirmations (every run):**

- **Step 1 complete** — before applying `AI_triaged` to the ticket, the agent shows what it is about to do and asks `[apply / skip]`
- **Step 1 incomplete** — before applying `needs_more_info`, same `[apply / skip]` prompt
- **Orchestrator — pipeline start** — before applying `triage/in-progress` or `triage/needs-info`, same `[apply / skip]` prompt
- **Re-check** — before removing `needs_more_info` and `triage/needs-info` labels, `[remove / cancel]` prompt

**Decision checkpoints (situation-dependent):**

- **Step 1 incomplete** — draft reporter comment shown for review before posting; `[post / edit / discard]`
- **Step 2 ambiguous** — regression candidates surfaced; human decides whether to continue or investigate manually
- **Step 3 wontfix match** — human confirms before `triage/wontfix` is applied
- **Security signal** — immediate stop; no public labels or comments; human handoff only
- **Final triage note** — full note shown for review before posting; `[post / edit / discard]`

Choosing `skip` on a label prompt does not stop the pipeline — the analysis continues, and the triage note records that the label was not applied.

---

## Won't-fix patterns

`bug-triage-shared/wontfix-patterns.md` lists known categories of tickets the team consistently does not fix. Step 3 checks reported behaviour against these patterns before consulting documentation. This makes recurring calls faster and more consistent.

Current categories: third-party plugin compatibility, intentional-but-confusing behaviour, unsupported version, server/platform configuration issues, known duplicates.

Add new patterns as they emerge from triage runs. The file is the team's accumulated triage knowledge — keep it current.

---

## Jira filter

Used when the pipeline runs without a specific ticket key:

```jql
project = MDL
  AND resolution = Unresolved
  AND filter = "Education - Alpha Team components"
  AND created >= -7d
  AND type = BUG
  AND labels not in ("AI_triaged", "needs_more_info", "triage/needs-info",
                     "triage/in-progress", "triage/ready-for-human", "triage/wontfix")
ORDER BY created ASC
```

Extend the window to `-14d` for catch-up runs after a gap.

---

## State tracking and multi-engineer use

The orchestrator writes a local `run-index.json` to its context directory. This records the state of every ticket it has processed in the current session. If the same ticket is triggered again, the orchestrator checks the index first and stops if the ticket is already complete — saving Jira calls and preventing duplicate notes.

**This file is local to each engineer's session.** It does not sync across the team.

That is by design. The real shared idempotency mechanism is Jira labels. Once any engineer's pipeline applies `triage/in-progress` to a ticket, that label is visible to everyone and the JQL filter excludes the ticket from any subsequent batch run. The local index is a session-level convenience on top of the label guard, not a replacement for it.

For the current manual experiment, this is sufficient. If the pipeline moves to automated triggers on a shared schedule, revisit whether a shared state store is needed.

The `triage-log.md` is an append-only record of all runs for the session. It supports the end-of-experiment qualitative review. Do not truncate it.

---

## Adding a new step skill

When a new step skill is ready:

1. Drop the `SKILL.md` into the appropriate `skills/bug-triage/bug-triage-[step-name]/` directory
2. Register it in your local skills configuration so the AI can find it
3. Test it standalone before wiring into the orchestrator

The orchestrator handles absent skills gracefully. It runs whatever steps are available, notes what was skipped, and sets overall confidence accordingly. A partial pipeline is more useful than no pipeline.

The orchestrator's `SKILL.md` defines the expected JSON handoff shape for each step. New step skills must return a handoff block in that format for the orchestrator to route correctly.

---

## Guardrails

- The agent does not close, reject, or resolve Jira tickets.
- The agent does not assess security priority. All security flags are human handoffs.
- Every Jira mutation — label application, label removal, or comment post — requires explicit human confirmation before the call is made. There are no silent writes to the tracker.
- All agent-processed tickets receive a `triage/` label for auditability (subject to human confirmation above).
