---
name: triage-find-regression
description: >
  Run Step 2 of the Alpha team bug triage workflow: regression source identification.
  Given a bug ticket, searches recent commits in the affected Moodle component to find
  the change most likely to have introduced the reported behaviour.
  Use when asked to find a regression, run Step 2, or identify the source of a bug.
  Also invoked by the bug-triage-orchestrator as part of the Steps 2–4 parallel analysis.
  Accepts a Jira issue key and ticket details (provided by Step 1 via the orchestrator).
version: 2.0
compatibility:
  tools:
    - name: mcp__github__list_commits
      path: Path A (preferred)
      note: >
        GitHub MCP — queries moodle/moodle public repo directly. No local clone required.
        Use when available. Confirmed working in Alpha team triage sessions.
    - name: mcp__github__get_commit
      path: Path A (preferred)
      note: >
        GitHub MCP — retrieves full commit diff for candidate inspection.
    - name: git
      path: Path B (fallback)
      note: >
        Local git CLI — requires a checked-out Moodle repository. Jake Dallimore's
        original execution model. Supports full git bisect workflow not available in Path A.
---

# Step 2: Regression Source Identification

This is **Step 2** of the Alpha team bug triage automation workflow (Sprint 2026-I2.1).
It searches recent commit history in the affected Moodle component to identify the change
most likely to have introduced the reported behaviour.

**Guardrails:**
- This skill makes no Jira mutations — it is analysis only.
- It surfaces regression candidates to a human. It does not prove causality.
- The human checkpoint in the orchestrator handles `outcome: AMBIGUOUS` escalation.

---

## Execution path detection

The skill supports two execution paths. Run this check before starting:

1. Attempt `mcp__github__list_commits` with `owner: moodle, repo: moodle, perPage: 1`.
   If it succeeds → **use Path A (GitHub MCP)**.
2. If Path A is unavailable, attempt `git log --oneline -1` in the current directory.
   If it returns output from a Moodle repository → **use Path B (local git)**.
3. If both fail → return `outcome: SKIPPED`. Note both paths were unavailable in the triage note.

The handoff contract JSON is identical for both paths. Path A adds `execution_path: "github_mcp"`;
Path B adds `execution_path: "local_git"`. This field is informational only — it does not affect routing.

---

## Inputs

Provided by the caller (orchestrator or direct invocation):

| Field | Source | Notes |
|-------|--------|-------|
| `issue_key` | Direct or orchestrator | e.g. `MDL-12345` |
| `ticket_details` | Step 1 fetch (orchestrator handoff) | Summary, description, components, affected versions, priority, reporter |
| `ticket_created_at` | Step 1 fetch | ISO 8601 date — used to bound the commit search window |
| `jira_cloud_id` | Constant | `db26294c-09fa-4e4e-bebe-d7410e9e2a67` |

**Standalone invocation (without orchestrator):**
If ticket details are not provided, fetch the ticket using
`mcp__mcp-atlassian-sooperset__jira_get_issue` (or ask the user to paste the ticket details).

---

## Lookup tables

### Component to GitHub path

Maps the Jira `Component/s` field to the corresponding directory in `github.com/moodle/moodle`.

> ⚠️ **For Jake Dallimore to validate:** This table is based on known Alpha team component scope.
> Please confirm coverage is complete and correct, especially `core_ltix` which is in active
> development (target path will change as MDL-88220–88223 decisions are resolved).

| Jira component | GitHub path | Notes |
|----------------|-------------|-------|
| `mod_lti` | `mod/lti` | |
| `core_ltix` | `mod/lti` | ⚠️ Interim — path TBC pending MDL-88220–88223 |
| `ltiservice_gradebookservices` | `mod/lti/services/gradebookservices` | |
| `ltiservice_basicoutcomes` | `mod/lti/services/basicoutcomes` | |
| `ltiservice_memberships` | `mod/lti/services/memberships` | |
| `ltiservice_toolproxy` | `mod/lti/services/toolproxy` | |
| `ltiservice_toolsettings` | `mod/lti/services/toolsettings` | |
| `mod_assign` | `mod/assign` | |
| `core_backup` | `backup/` | |
| `core_grades` | `grade/` | |
| Not listed / `Unknown` | — | Fall back to keyword search on commit messages only |

If a component maps to multiple paths (e.g., a ticket covering both `mod/lti` and `backup/`),
run the commit search for each path and merge the results before narrowing candidates.

### Moodle version to stable branch

Maps the `Affects Version/s` field to the GitHub branch name for `moodle/moodle`.

| Affects version | GitHub branch |
|-----------------|---------------|
| 4.5.x | `MOODLE_405_STABLE` |
| 4.4.x | `MOODLE_404_STABLE` |
| 4.3.x | `MOODLE_403_STABLE` |
| 4.2.x | `MOODLE_402_STABLE` |
| 4.1.x (LTS) | `MOODLE_401_STABLE` |
| Future dev | `main` |
| Multiple versions | Use the oldest affected stable branch |
| Blank or unsupported | Use `main`; note in output |

---

## Core rules

These rules apply regardless of which execution path is used.

**Rule 1: Reproduce before theorising.**
Do not speculate about root cause until the issue is reproducible, or deterministic evidence
exists. If reproduction is impossible, focus on commit history, affected versions, and
behavioural timelines.

**Rule 2: Establish a regression window.**
Always identify the last known good state and the first known bad state. A narrow window
is more valuable than deep speculation. Use the `Affects Version/s` field as the starting bound.

**Rule 3: Prefer elimination over intuition.**
Do not rely on "this looks suspicious" or "this subsystem feels likely." Prefer evidence:
commit messages that reference the reported behaviour, diffs that touch the specific
code path described, MDL ticket numbers that overlap with the symptom.

**Rule 4: Correlation is not causation.**
A commit is a candidate, not a confirmed cause. A change is only causal if reverting it
removes the issue, reapplying it reproduces it, or a targeted test demonstrates the failure.
This skill surfaces candidates. Causal validation is the human reviewer's responsibility.

---

## Path A: GitHub MCP investigation workflow

### Step 1: Resolve component path and branch

- Map `Component/s` → GitHub path using the component-to-path table.
- Map `Affects Version/s` → branch name using the version-to-branch table.
- If the component is missing or unmapped: note this in the output, set `path` to `null`,
  and proceed with keyword-only commit message search across the branch.

### Step 2: List recent commits in the affected area

Call `mcp__github__list_commits` with:
- `owner: moodle`
- `repo: moodle`
- `sha`: resolved branch name
- `path`: resolved component path (omit if component unmapped — broader search)
- `since`: the earlier of (a) 90 days before `ticket_created_at`, or
  (b) the release date of the previous minor Moodle version

Collect the full result set (paginate if needed, cap at 100 commits).

### Step 3: Narrow to regression candidates

From the commit list:
1. Flag commits whose messages contain keywords from the ticket summary or description
   (e.g., component name, error text, setting name, user action described).
2. Flag commits that reference an MDL ticket number appearing in the bug's linked issues.
3. Flag commits with message patterns that suggest the affected behaviour changed
   (e.g., "fix", "revert", "change", "update" combined with component keywords).

Score candidates by relevance. Take the top 3 for inspection.

### Step 4: Inspect candidate commits

For each candidate (max 3):
- Call `mcp__github__get_commit` with `include_diff: true`.
- Review the diff: does it touch the specific code path, function, or setting described in the bug?
- Apply Rule 4: note this is a candidate, not a confirmed cause.

### Step 5: Establish the regression window

From the inspected candidates:
- **Last known good:** the commit immediately before the earliest candidate.
- **First known bad:** the earliest candidate commit itself.
- If no candidates: the window is unknown.

Determine outcome:
- `REGRESSION_CANDIDATE` — at least one candidate identified with medium or high confidence.
- `CLEAR` — no relevant changes found in the search period; regression is unlikely to be a recent commit.
- `AMBIGUOUS` — candidates identified but causality is unconfirmed, or the window is too wide to narrow.

### Step 6: Produce output and handoff block

See [Output format](#output-format) below.

**Path A limitation:** `git bisect` with automated test execution is not available via the
GitHub MCP. This path surfaces candidates for human review. If causality must be confirmed
programmatically, switch to Path B in a local Moodle repository.

---

## Path B: Local git investigation workflow

Jake Dallimore's original workflow. Use when running inside a checked-out Moodle repository.

### Step 1: Establish the regression window

Identify the last known good state and first known bad state using:
```bash
git log --oneline <version_tag>..HEAD -- <component_path>
git log --oneline <branch>
```

Use the `Affects Version/s` field to determine the version tag (e.g., `v4.5.0`).

### Step 2: Narrow candidate changes

```bash
git log -- <component_path>          # commits touching the affected component
git diff GOOD..BAD                   # diff between known good and bad states
```

### Step 3: Validate with bisect (if a reproducible test exists)

```bash
git bisect start
git bisect bad <first_known_bad>
git bisect good <last_known_good>
git bisect run <test_command>
```

Path B exclusively supports `git bisect` with automated test execution — this capability
is not available in Path A.

### Step 4: Apply Rules 3 and 4

Prefer elimination over intuition. Do not call a commit causal unless:
- Reverting it removes the issue, OR
- Reapplying it reproduces the issue, OR
- A targeted test demonstrates the failure, OR
- The failure mechanism is clearly demonstrated.

### Step 5: Produce output and handoff block

See [Output format](#output-format) below.

---

## Output format

Structure the response as follows:

```
## Step 2 Regression Analysis — [ISSUE KEY]

**Execution path:** GitHub MCP / Local git

### Regression window

| | |
|---|---|
| Last known good | [version / commit / date, or "Unknown"] |
| First known bad | [version / commit / date, or "Unknown"] |

### Regression candidates

| Commit | Message | Author | Date | Relevance |
|--------|---------|--------|------|-----------|
| [SHA] | [message excerpt] | [author] | [date] | [why flagged] |

### Evidence

[For each candidate: what was found in the diff and why it is or is not plausibly causal.]

### Confidence

[HIGH / MEDIUM / LOW] — [one sentence explaining why]

### Recommended actions

- [Specific next step, e.g. "Revert MDL-XXXXX on MOODLE_405_STABLE and test against the reporter's steps"]
- [Or: "No regression candidate found — likely configuration or environmental issue"]
```

---

## Handoff to Orchestrator

Return this JSON block alongside the output above:

```json
{
  "issue_key": "MDL-XXXXX",
  "step": 2,
  "outcome": "REGRESSION_CANDIDATE" | "CLEAR" | "AMBIGUOUS" | "SKIPPED",
  "human_review_required": true | false,
  "execution_path": "github_mcp" | "local_git" | "skipped",
  "regression_window": {
    "last_known_good": "version/commit/date or null",
    "first_known_bad": "version/commit/date or null"
  },
  "causal_candidates": [
    {
      "sha": "commit SHA or null",
      "message": "commit message excerpt",
      "url": "https://github.com/moodle/moodle/commit/SHA or null",
      "author": "author name",
      "date": "ISO 8601 date"
    }
  ],
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "summary": "<max 100 words — decision-relevant finding>",
  "recommended_actions": ["next steps or empty"],
  "skip_reason": "both paths unavailable" | "SKILL.md not present" | null
}
```

**Outcome values:**
- `REGRESSION_CANDIDATE` — causal change identified with medium or high confidence
- `CLEAR` — no regression evidence found in the search period
- `AMBIGUOUS` — candidates found but causality unconfirmed, or window too wide to narrow
- `SKIPPED` — both GitHub MCP and local git were unavailable

Set `human_review_required: true` when `outcome` is `AMBIGUOUS`. Otherwise `false`.

The `summary` field must not exceed 100 words. Write full investigation detail to the step
file on disk (`context/triage-notes/MDL-XXXXX-step2.md`). Keep this block concise.

The `causal_candidates` array may be empty if `outcome` is `CLEAR` or `SKIPPED`.

`execution_path` is informational — the orchestrator does not change routing based on it.
