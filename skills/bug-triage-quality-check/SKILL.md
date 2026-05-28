---
name: bug-triage-quality-check
description: >
  Run Step 1 of the Alpha team bug triage workflow: quality and completeness check on an MDL Jira bug ticket.
  Use this skill when asked to triage a bug, check a ticket, run the quality check, or process a bug from the team's Jira filter.
  Also triggered when an orchestration skill calls Step 1 of the bug triage workflow.
  Accepts a Jira issue key (e.g. MDL-XXXXX) or a batch of keys from the team components filter.
compatibility:
  mcp_servers:
    - name: mcp-atlassian-sooperset
      note: >
        Use the sooperset Atlassian MCP (mcp__mcp-atlassian-sooperset__*) — NOT the official
        Atlassian MCP. The official MCP has auth issues with the public Moodle tracker (moodle.atlassian.net).
        Confirmed in Alpha team standup 2026-05-21.
---
# Step 1: Bug Quality and Completeness Check

This is **Step 1** of the Alpha team bug triage automation workflow (Sprint 2026-I2.1).
It checks whether a new bug ticket from the team's Jira components filter contains enough information to proceed to deeper triage steps.

**Guardrails:**
- This skill does not close, reject, or resolve tickets autonomously.
- **Test phase — no auto-posting of comments.** When a ticket is incomplete, the skill drafts a reporter comment and returns it to the human for review. The human must explicitly confirm (or request edits) before the comment is posted to Jira. Labels may be applied immediately as they are internal and reversible.
- If a ticket has the `external_confirmed` label, treat reproduction as confirmed and skip the reproduction-steps sufficiency check.

---

## Inputs

- **Jira issue key** — e.g. `MDL-12345` (passed directly or by the orchestrator)
- **Jira cloud ID** — `db26294c-09fa-4e4e-bebe-d7410e9e2a67` (moodle.atlassian.net)

If no issue key is provided, run the default Jira filter (see [JQL Filter](#jql-filter) below) and process each result in turn.

---

## Step-by-Step Instructions

### 1. Check the ticket index first

Before fetching from Jira, check `skills/bug-triage-quality-check/context/triage-index.json` to see if the issue key has already been processed.

- If found with outcome `COMPLETE` or `INCOMPLETE` and `comment_status: posted`: report the cached result and stop. No re-processing.
- If found with `comment_status: pending_review`: surface the existing draft comment from `pending-review.md` and ask the human whether to post, edit, or discard it.
- If not found: proceed to Step 2.

### 2. Fetch the ticket

Use `mcp__mcp-atlassian-sooperset__jira_get_issue` to retrieve the full issue details including: summary, description, issue type, components, affects version/s, priority, labels, reporter, and any existing comments.

Confirm the issue type is **Bug**. If it is not a Bug (e.g. Improvement, New Feature, Task), stop and note this in the output — this skill is scoped to bugs only.

### 3. Run the completeness checklist

Evaluate the ticket description against the **Moodle public tracker standards** (source: [moodledev.io/general/development/tracker](https://moodledev.io/general/development/tracker) and [moodledev.io/general/development/tracker/guide](https://moodledev.io/general/development/tracker/guide)).

A bug report meets minimum standard when it contains **all five** of the following:

| # | Check | What to look for |
|---|-------|-----------------|
| 1 | **Steps to reproduce** | Step-by-step instructions starting from a login state (e.g. "Login as teacher, go to..."). Must be specific enough that someone unfamiliar with the area could follow them. |
| 2 | **Expected behaviour** | A clear statement of what the reporter expected to happen. |
| 3 | **Actual behaviour** | A clear statement of what actually happened (the bug). Vague summaries like "it doesn't work" do not satisfy this. |
| 4 | **Affected Moodle version** | At least one released, supported Moodle version in the `Affects Version/s` field. If the field is blank or set only to `Future dev` or an unsupported version, flag it. Supported versions: check [moodledev.io/general/releases](https://moodledev.io/general/releases) if uncertain. |
| 5 | **Sufficient context for an unfamiliar reader** | The description must give enough context for someone outside the team to understand the scope and area. This includes: the Moodle feature/area affected, user role context where relevant, and any error messages (with debugging output where applicable). |

**Optional but strong positive signals** (note these in the output but do not require them):
- Screenshot or screen recording attached
- Error message with full debugging output pasted
- Confirmed reproduction on sandbox.moodledemo.net
- `external_confirmed` label present (treat as confirmed reproduction)

**Fields also checked for basic completeness:**
- `Component/s` — must not be blank or `Unknown` only. If blank, flag as missing.
- `Summary` — must clearly describe the problem (not generic like "Error in Moodle" or "Some issues with X").

### 4. Determine outcome and take actions

**If INCOMPLETE** (one or more of checks 1–5 fail):

1. **Apply the label immediately:** Apply `needs_more_info` using `mcp__mcp-atlassian-sooperset__jira_update_issue` with `{"labels": [...existing_labels, "needs_more_info"]}`. This is an internal, reversible action that does not notify the reporter.

2. **Draft a reporter comment** that:
   - Thanks them for reporting the issue (per Moodle community norms: always show gratitude)
   - Clearly lists exactly what information is missing (be specific, not generic)
   - Explains why each missing piece matters for the team to investigate
   - Encourages them to update the ticket and notes the team will follow up
   - Uses a warm, community-appropriate tone

3. **Return the draft comment to the human for review** — do not post it. Present it clearly with options:
   - `post` — post to Jira as-is
   - `edit [feedback]` — revise and return updated draft
   - `discard` — abandon the comment (label remains applied)

4. **Write to context files** (see [Context File Outputs](#context-file-outputs)):
   - Add entry to `triage-index.json` with `comment_status: pending_review`
   - Add draft comment to `pending-review.md`
   - Add entry to `triage-log.md`

5. Once the human confirms `post`:
   - Post the comment using `mcp__mcp-atlassian-sooperset__jira_add_comment`
   - Update `triage-index.json` entry: `comment_status: posted`
   - Remove the entry from `pending-review.md`
   - Update `triage-log.md` entry to reflect posting

**If COMPLETE** (all five checks pass):

1. **Apply the label immediately:** Apply `AI_triaged` using `mcp__mcp-atlassian-sooperset__jira_update_issue` with `{"labels": [...existing_labels, "AI_triaged"]}`.
2. No comment is needed — do not post anything to Jira.
3. **Write to context files:** Add entry to `triage-index.json` and `triage-log.md`.
4. Set outcome as `COMPLETE — proceed to Step 2`.

### 5. Produce the triage note

Return a structured triage note as your response. For INCOMPLETE tickets, present this alongside the draft comment. Format:

```
## Step 1 Triage Note — [ISSUE KEY]

**Outcome:** COMPLETE / INCOMPLETE
**Comment status:** PENDING REVIEW / POSTED / N/A

**Completeness check:**
- [✅/❌] Steps to reproduce: [brief note]
- [✅/❌] Expected behaviour: [brief note]
- [✅/❌] Actual behaviour: [brief note]
- [✅/❌] Affects version populated: [value found or MISSING]
- [✅/❌] Sufficient context: [brief note]

**Fields:**
- Component/s: [value or MISSING]
- Summary quality: [OK / FLAG: reason]

**Positive signals noted:** [list or "none"]

**Actions taken:**
- [Label applied]
- [Comment: PENDING HUMAN REVIEW / Posted / Not applicable]

**Next step:** [Proceed to Step 2 / Awaiting human review of draft comment / Awaiting reporter response]
```

If outcome is INCOMPLETE, follow the triage note with:

```
---
## Draft reporter comment — awaiting your review

[full draft comment text]

---
Reply with: **post** | **edit [your feedback]** | **discard**
```

---

## Context File Outputs

The skill writes to three local files in `skills/bug-triage-quality-check/context/`. Create this directory if it does not exist.

### `triage-index.json`

Machine-readable index of all tickets processed by this skill. Keyed by issue key.
Primary purpose: prevent re-fetching and re-processing tickets already handled.

```json
{
  "MDL-12345": {
    "processed_at": "2026-05-21T10:30:00Z",
    "outcome": "INCOMPLETE",
    "missing_fields": ["steps_to_reproduce", "expected_behaviour", "actual_behaviour"],
    "labels_applied": ["needs_more_info"],
    "comment_status": "posted",
    "summary": "Quiz submission fails on mobile"
  },
  "MDL-12346": {
    "processed_at": "2026-05-21T10:45:00Z",
    "outcome": "COMPLETE",
    "missing_fields": [],
    "labels_applied": ["AI_triaged"],
    "comment_status": "not_applicable",
    "summary": "LTI deep link fails when activity name contains special characters"
  }
}
```

`comment_status` values: `pending_review` | `posted` | `not_applicable` | `discarded`

### `pending-review.md`

Human-readable queue of draft comments awaiting human confirmation. Each entry is removed once the comment is posted or discarded.

```markdown
## MDL-12345 — 2026-05-21 10:30

**Reporter:** Jane Smith
**Summary:** Quiz submission fails on mobile

**Draft comment:**

Hi Jane — thank you for taking the time to report this! ...

[full draft text]

**Status:** Awaiting review
**Reply with:** post | edit [feedback] | discard

---
```

### `triage-log.md`

Append-only human-readable log of all triage runs. Used for the end-of-sprint qualitative assessment (see Confluence workflow doc). Never truncate this file.

```markdown
## 2026-05-21 10:30 — MDL-12345

- **Outcome:** INCOMPLETE
- **Missing:** Steps to reproduce, expected behaviour, actual behaviour
- **Label applied:** needs_more_info
- **Comment:** Posted (confirmed by [reviewer], 2026-05-21 11:00)
- **Summary:** Quiz submission fails on mobile
- **Reporter:** Jane Smith

---
```

---

## JQL Filter

```jql
project = MDL
  AND resolution = Unresolved
  AND filter = "Education - Alpha Team components"
  AND created >= -7d
  AND type = BUG
  AND labels not in ("AI_triaged", "needs_more_info")
ORDER BY created ASC
```

**Notes on this JQL:**
- `filter = "Education - Alpha Team components"` — the confirmed saved filter for Alpha team component ownership. No manual component list needed.
- `created >= -7d` — 7-day window matches the team's default triage cadence. Extend to `-14d` if running catch-up after a gap.
- `resolution = Unresolved` — skips tickets that have already been resolved.
- The `labels not in` clause skips tickets already processed by this agent. Remove it to re-process or audit previous runs. The `triage-index.json` provides a second layer of protection against re-processing regardless.
- Consider adding `AND priority in (Blocker, Critical, Major)` to prioritise severity over recency during high-volume periods.
- `external_confirmed` label handling: if a ticket has this label, skip check #1 (steps to reproduce sufficiency) — treat reproduction as confirmed per the experiment guardrails.

---

## Reference: Moodle Bug Report Minimum Standards

Sourced from [moodledev.io/general/development/tracker](https://moodledev.io/general/development/tracker) (last updated April 2026):

> "Complete the form, making sure you include FULL STEPS that developers should take to reproduce the problem, as well as information about WHAT YOU EXPECTED and WHAT ACTUALLY HAPPENS for you."

From the [Tracker guide](https://moodledev.io/general/development/tracker/guide), the `Description` field must include:
- Replication steps
- The expected result
- The actual result
- Any error messages shown with debugging turned on
- Any other relevant information

The `Affects Version/s` field must reference at least one released and supported version.

The `Component/s` field must be set correctly — it is the primary variable used for routing and search.

---

## Labels Used by This Skill

| Label | Applied when | Visibility |
|-------|-------------|------------|
| `AI_triaged` | Ticket passes completeness check; proceed to Step 2 | Internal |
| `needs_more_info` | Ticket is incomplete; label applied immediately, comment pending human review | Internal |

These labels distinguish agent-processed tickets from human-triaged ones throughout the experiment.

---

## Handoff to Orchestrator

When called by the orchestration skill, return a structured JSON result alongside the triage note:

```json
{
  "issue_key": "MDL-XXXXX",
  "step": 1,
  "outcome": "COMPLETE" | "INCOMPLETE",
  "missing_fields": ["list of failed checks, or empty"],
  "labels_applied": ["AI_triaged" | "needs_more_info"],
  "comment_status": "pending_review" | "posted" | "not_applicable" | "discarded",
  "proceed_to_step_2": true | false
}
```

**Note for orchestrator:** During the test phase, `comment_status` will be `pending_review` for all INCOMPLETE tickets until a human confirms. The orchestrator should pause the workflow for that ticket and surface the pending review to the human before continuing. `proceed_to_step_2` is always `false` when `outcome` is `INCOMPLETE`.
