---
name: bug-triage-orchestrator
description: >
  Coordinate the Alpha team bug triage pipeline for one or more MDL Jira bug tickets.
  Invokes Steps 1–5 in sequence, manages state machine labels, handles human checkpoints,
  and produces a final structured triage note.

  Triggers:
  - "/triage-bug MDL-XXXXX" — single ticket
  - "/triage-bug MDL-XXXXX MDL-YYYYY ..." — batch of tickets
  - "/triage-bug" — run the default JQL filter and process new untriaged tickets
  - "/triage-bug MDL-XXXXX --recheck" — re-run pipeline for a ticket previously marked needs-info (reporter has updated)

  Do NOT trigger on: feature requests, improvements, tasks, or any non-Bug issue type.
  Do NOT trigger on: requests to summarise meetings, search Jira, or look up tickets.
compatibility:
  mcp_servers:
    - name: mcp-atlassian-sooperset
      note: >
        Use the sooperset Atlassian MCP (mcp__mcp-atlassian-sooperset__*) — NOT the official
        Atlassian MCP. The official MCP has auth issues with the public Moodle tracker (moodle.atlassian.net).
        Confirmed in Alpha team standup 2026-05-21.
---

# Bug Triage Orchestrator

This skill coordinates the Alpha team's 5-step bug triage pipeline. It calls each step skill
in sequence, manages workflow state, applies the triage state machine labels to Jira, handles
human checkpoints, and produces a final structured triage note.

Each step skill can also run standalone — this orchestrator is one entry point, not the only one.

**Guardrails:**
- The agent does not close, reject, or resolve Jira tickets autonomously.
- The agent does not assess security priority — all security flags are immediate human handoffs.
- All agent-processed tickets receive a `triage/` label to maintain a clear audit trail.
- No comment is posted to Jira without explicit human confirmation.

---

## Jira cloud ID

`db26294c-09fa-4e4e-bebe-d7410e9e2a67` (moodle.atlassian.net)

---

## State machine

Each ticket in the pipeline has exactly one active `triage/` state label:

| Label | Applied when |
|---|---|
| `triage/needs-info` | Step 1 INCOMPLETE — awaiting reporter response |
| `triage/in-progress` | Step 1 COMPLETE — pipeline is running |
| `triage/ready-for-human` | Step 5: valid bug — add to team backlog for human review and assignment |
| `triage/wontfix` | Step 3 or 5: not a bug or out of scope — human confirmed before applying |

> **Future option — not yet active:** A `triage/ready-for-agent` label is a logical next step once the team decides to explore automated fix attempts. It is deliberately excluded from the current workflow.

Only one `triage/` label should be active on a ticket at a time. When transitioning states,
remove the previous `triage/` label before applying the new one.

---

## Context files

**The file system is your memory. Use it.** Full outputs go to disk. Only compact summaries and JSON handoff blocks stay in active context. If a later step needs detail, read the file.

All context files live in `skills/bug-triage-orchestrator/context/`. Create this directory if it does not exist.

### `run-index.json`

Tracks the run state for every ticket that has entered the orchestrator. Keyed by issue key.
Primary purpose: idempotency — prevent re-running a pipeline that has already completed.

```json
{
  "MDL-12345": {
    "started_at": "2026-05-21T10:30:00Z",
    "completed_at": "2026-05-21T11:05:00Z",
    "status": "complete",
    "step_results": {
      "step1": "COMPLETE",
      "step2": "CLEAR",
      "step3": "GENUINE_BUG",
      "step4": "GAPS_FOUND",
      "step5": "READY_FOR_HUMAN"
    },
    "final_label": "triage/ready-for-human",
    "triage_note_file": "context/triage-notes/MDL-12345.md"
  }
}
```

`status` values: `running` | `paused_pending_review` | `paused_security` | `complete` | `incomplete_reporter`

### `run-log.md`

Append-only log of all orchestrator runs. Never truncate.

```markdown
## 2026-05-21 10:30 — MDL-12345

- **Started by:** [reviewer]
- **Step 1:** COMPLETE
- **Step 2:** CLEAR (no regression candidates)
- **Step 3:** GENUINE_BUG
- **Step 4:** GAPS_FOUND — missing unit tests for LTI deep link handler
- **Step 5:** READY_FOR_HUMAN
- **Final label:** triage/ready-for-human
- **Triage note:** Posted to Jira (confirmed by [reviewer], 2026-05-21 11:05)

---
```

### `triage-notes/` directory

Create `skills/bug-triage-orchestrator/context/triage-notes/` if it does not exist before writing any ticket files.

One markdown file per ticket, written after Step 5 completes. These become the permanent record of what the pipeline found and what action was taken.

---

## Pre-flight

Before running the pipeline for any ticket:

1. **Initialise directories.** Ensure the following exist, creating them if they do not:
   - `skills/bug-triage-orchestrator/context/`
   - `skills/bug-triage-orchestrator/context/triage-notes/`

2. **Check `run-index.json`.** If the ticket is present with `status: complete`, report the cached result and stop. Do not re-run.
   - Exception: if invoked with `--recheck`, remove the existing entry and proceed.

3. **If `status: paused_pending_review`**, surface the pending human review item and wait for resolution before continuing.

4. **Verify issue type.** Fetch the ticket using `mcp__mcp-atlassian-sooperset__jira_get_issue`. Confirm `issuetype` is **Bug**. If not, stop and note it.

5. **Write initial entry** to `run-index.json` with `status: running` and `started_at` timestamp.

---

## Step execution

### Step 1: Quality and completeness check

Read `skills/bug-triage-quality-check/SKILL.md` and follow its instructions fully for the target ticket.

Step 1 returns a structured JSON handoff block. Capture it.

**If `outcome: INCOMPLETE`:**
- The ticket cannot proceed. Step 1 will have drafted a reporter comment and applied `needs_more_info` label.
- Apply label `triage/needs-info` (replacing any prior `triage/` label).
- Update `run-index.json`: `status: incomplete_reporter`.
- Surface the draft comment for human review per Step 1's instructions.
- **Stop the pipeline for this ticket.** Do not proceed to Step 2.
- Log to `run-log.md`.

**If `outcome: COMPLETE`:**
- Apply label `triage/in-progress` (remove `needs_more_info` label if present, or any other `triage/` label).
- **Write ticket data to disk.** Save the full ticket payload to `context/triage-notes/MDL-XXXXX-ticket.json`. From this point forward, carry only these fields in active context: `issue_key`, `summary`, `component`, `affects_version`, `description` (first 200 characters). Do not re-fetch from Jira in subsequent steps — read the file if detail is needed.
- **Discard Step 1 SKILL.md instructions from active context.** Retain only the JSON handoff block.
- Proceed to Steps 2–4.

---

### Steps 2, 3, 4: Parallel analysis

Steps 2, 3, and 4 have no inter-dependencies. Execute them together — start all three before waiting for any results. For each step, check whether the skill is available before invoking:

**Step 2 — Recent changes analysis**
Read `skills/bug-triage-recent-changes/SKILL.md` and follow its instructions.
**Skip condition:** If the SKILL.md is not present or GitHub access has not been confirmed, set step 2 result to `SKIPPED` and note this in the triage note.

**Step 3 — Bug validation**
Read `skills/bug-triage-validation/SKILL.md` and follow its instructions.
Before invoking, read `skills/bug-triage-shared/wontfix-patterns.md` and pass its full content
to Step 3 as the `wontfix_patterns_content` input. Step 3 uses this to check for known won't-fix
categories without needing to locate the file itself.
**Skip condition:** If the SKILL.md is not present, set step 3 result to `SKIPPED`.

**Step 4 — Test coverage check**
Read `skills/bug-triage-test-coverage/SKILL.md` and follow its instructions.
**Skip condition:** If the SKILL.md is not present, or if Step 3 returned `WORKING_AS_INTENDED`, skip Step 4 (no value in checking coverage for non-bugs).

Collect JSON handoff blocks from all three steps before proceeding.

**Handoff block size constraint.** JSON handoff blocks must be concise. Any string field (summaries, notes, rationale) must not exceed 100 words. If a step produces more detail than that, write it to its step file and truncate the string in the handoff block to the most decision-relevant sentence. Length in the handoff block is a signal of poor compression, not thoroughness.

**Write and discard after Steps 2–4.** For each completed step, write the full output to `context/triage-notes/MDL-XXXXX-stepN.md` (e.g. `step2.md`, `step3.md`, `step4.md`). Discard each step's SKILL.md instructions and analysis prose from active context. Retain only the three JSON handoff blocks. If Step 5 needs detail from an earlier step, read the relevant file.

**Human checkpoint — Step 2 escalation:**
If Step 2 returns `outcome: AMBIGUOUS` and `human_review_required: true`, pause and surface the ambiguous regression context to the human. Ask: "Step 2 found ambiguous regression candidates. Do you want me to continue the pipeline and include this as an open flag, or stop for deeper manual investigation?" Wait for explicit response before proceeding.

**Automatic stop — Step 3 wontfix:**
If Step 3 returns `outcome: WORKING_AS_INTENDED` and `wontfix_pattern_matched: true`, pause and surface the matched pattern to the human. Ask them to confirm before applying `triage/wontfix`. If confirmed: apply label, post a brief internal triage note, update run-index.json as `complete`, stop pipeline.

---

### Step 5: Assignment and outcome

**Context checkpoint before Step 5.** Confirm that active context contains only: the compact ticket summary (issue key, summary, component, affects version, description excerpt), and the JSON handoff blocks from Steps 1–4. Everything else is on disk. If this is not the case, write any remaining full outputs to their respective files before continuing.

Read `skills/bug-triage-assignment/SKILL.md` and follow its instructions.

Pass the following context to Step 5:
- Compact ticket summary (issue key, summary, component, affects version, description excerpt)
- File path to full ticket data: `context/triage-notes/MDL-XXXXX-ticket.json`
- Step 1 JSON handoff
- Step 2 JSON handoff
- Step 3 JSON handoff
- Step 4 JSON handoff

Step 5 should read the full ticket file only if it needs detail not present in the compact summary.

Step 5 returns a final triage note and a JSON handoff block.

**If Step 5 outcome is `SECURITY_ESCALATION`:**
- Immediately stop and surface a human handoff alert:

  > ⚠️ **Security flag — human handoff required.**
  > This ticket has been flagged as a potential security issue by Step 5.
  > Do not apply public labels or post a public comment.
  > Please handle directly and contact the Moodle security team per the standard process.

- Update `run-index.json` with `status: paused_security`. Stop.

**For all other outcomes (READY_FOR_HUMAN, WONTFIX):**

Present the full triage note to the human with options:
- `post` — post the triage note as a Jira comment and apply the final label
- `edit [feedback]` — revise and return updated note
- `discard` — abandon comment; labels already applied remain

**On `post` confirmation:**
- Post the triage note using `mcp__mcp-atlassian-sooperset__jira_add_comment`
- Apply the final `triage/` label (remove `triage/in-progress`)
- Write the triage note to `context/triage-notes/MDL-XXXXX.md`
- Update `run-index.json`: `status: complete`, `completed_at`, `final_label`
- Append to `run-log.md`

---

## Batch mode

If multiple ticket keys are provided (or the JQL filter returns multiple results), run the pipeline for each ticket sequentially. Report a summary at the end:

```
## Triage run complete

| Ticket | Outcome | Label applied | Action |
|--------|---------|---------------|--------|
| MDL-12345 | READY_FOR_HUMAN | triage/ready-for-human | Note posted |
| MDL-12346 | INCOMPLETE | triage/needs-info | Draft comment pending review |
| MDL-12347 | WONTFIX | triage/wontfix (pending confirm) | Awaiting human confirmation |

Pending human actions: [list any items requiring response]
```

For batch runs, present all pending human review items together after the pipeline has completed all tickets, not inline during processing.

---

## Re-entry: `--recheck` flag

Use when a reporter has updated a ticket that was previously marked `triage/needs-info`.

1. Remove the existing `run-index.json` entry for that ticket.
2. Remove the `needs_more_info` and `triage/needs-info` labels from the ticket.
3. Run the full pipeline from Step 1.

---

## Default JQL filter

When invoked with no ticket keys, run this filter to find new untriaged tickets:

```jql
project = MDL
  AND resolution = Unresolved
  AND filter = "Education - Alpha Team components"
  AND created >= -7d
  AND type = BUG
  AND labels not in ("AI_triaged", "needs_more_info", "triage/needs-info", "triage/in-progress", "triage/ready-for-human", "triage/wontfix")
ORDER BY created ASC
```

**Notes:**
- `filter = "Education - Alpha Team components"` — confirmed saved filter for Alpha team component ownership.
- `created >= -7d` — 7-day window matches the team's default triage cadence. Extend to `-14d` for catch-up runs.
- `resolution = Unresolved` — skips already-resolved tickets.
- The `labels not in` clause skips tickets the orchestrator or Step 1 has already processed. The `run-index.json` provides a second layer of idempotency protection regardless of this clause.

---

## Graceful degradation

The orchestrator is designed to run partial pipelines when steps are unavailable.

| Condition | Behaviour |
|---|---|
| Step 2 SKILL.md missing or GitHub unavailable | Skip Step 2; note in triage note as "not assessed" |
| Step 3 SKILL.md missing | Skip Step 3; flag in triage note — Step 5 proceeds with reduced confidence |
| Step 4 SKILL.md missing | Skip Step 4; note as "not assessed" |
| Step 5 SKILL.md missing | Stop after Steps 1–4; present aggregated findings and ask human to determine outcome |

If two or more of Steps 2–4 are skipped, set overall confidence to LOW and flag this prominently in the triage note.

---

## Orchestrator handoff contract

When called by another skill or agent, return:

```json
{
  "issue_key": "MDL-XXXXX",
  "pipeline_status": "complete" | "incomplete_reporter" | "paused_security" | "paused_pending_review",
  "step_results": {
    "step1": "COMPLETE" | "INCOMPLETE",
    "step2": "REGRESSION_CANDIDATE" | "CLEAR" | "AMBIGUOUS" | "SKIPPED",
    "step3": "GENUINE_BUG" | "WORKING_AS_INTENDED" | "AMBIGUOUS" | "SKIPPED",
    "step4": "COVERAGE_EXISTS" | "GAPS_FOUND" | "NO_COVERAGE" | "SKIPPED",
    "step5": "READY_FOR_HUMAN" | "WONTFIX" | "SECURITY_ESCALATION" | "SKIPPED"
  },
  "final_label": "triage/ready-for-human" | "triage/wontfix" | null,
  "triage_note_file": "path/to/triage-notes/MDL-XXXXX.md" | null,
  "pending_human_actions": ["list of items requiring human response, or empty"]
}
```
