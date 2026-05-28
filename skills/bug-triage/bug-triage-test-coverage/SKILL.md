---
name: bug-triage-test-coverage
description: >
  Run Step 4 of the Alpha team bug triage workflow: test coverage check.
  Checks whether the area affected by the reported bug has existing unit test coverage and flags gaps.
  Use when asked to check test coverage for a bug, run Step 4, or assess coverage in an affected area.
  Also invoked by the bug-triage-orchestrator after Steps 1–3 complete (skipped if Step 3 returns WORKING_AS_INTENDED).
  Accepts a Jira issue key (e.g. MDL-XXXXX).
status: stub — interface contract defined, implementation in progress (owner: Shamim Rezaie)
compatibility:
  mcp_servers:
    - name: github
      note: >
        Requires read access to github.com/moodle/moodle to inspect test files.
        GitHub access approach to be confirmed with the team. If unavailable, return outcome: SKIPPED.
---

# Step 4: Test Coverage Check

This is **Step 4** of the Alpha team bug triage automation workflow (Sprint 2026-I2.1).
It checks whether the area affected by the reported bug has existing unit test coverage,
and flags where coverage gaps exist. This is informational — it helps prioritise and
scope a fix, not validate the bug itself.

**This step is optional:** it is skipped when Step 3 returns `WORKING_AS_INTENDED`, and
can be skipped if GitHub access is unavailable. Skipping does not block the pipeline.

**Guardrails:**
- Writing new tests is out of scope for this skill and this sprint.
- This step reports coverage status; it does not make pass/fail decisions.

---

## Inputs

Provided by the caller (orchestrator or direct invocation):

| Field | Source | Notes |
|-------|--------|-------|
| `issue_key` | Direct or orchestrator | e.g. `MDL-12345` |
| `ticket_details` | Step 1 fetch | Full ticket including component and description |
| `step3_result` | Step 3 handoff | Used to confirm this step should run |
| `jira_cloud_id` | Constant | `db26294c-09fa-4e4e-bebe-d7410e9e2a67` |

---

## Step-by-Step Instructions

### 1. Identify the affected code area

From the ticket's `Component/s` and description (and Step 2 regression candidates if available),
identify the specific file(s) or directory path(s) in `github.com/moodle/moodle` most likely
to contain the defective code.

### 2. Locate test files for the affected area

In the Moodle codebase, unit tests follow a consistent pattern:
- PHPUnit tests: `[component]/tests/[area]_test.php`
- Behat tests: `[component]/tests/behat/[feature].feature`

Search the affected component directory for test files covering the relevant area.

### 3. Assess coverage

For each test file found:
- Does it cover the specific code path described in the bug?
- Does it test the expected behaviour that the bug violates?

Determine coverage status:
- **COVERAGE_EXISTS:** Relevant tests exist and plausibly cover the affected path
- **GAPS_FOUND:** Tests exist for the component but do not cover the specific path/behaviour
- **NO_COVERAGE:** No test files found for the affected area
- **SKIPPED:** GitHub access unavailable, or component path could not be determined

### 4. Return triage note and handoff block

Return a brief coverage note including:
- What paths were inspected
- What tests were found (or not found)
- The assessment

Follow with the structured JSON handoff block.

---

## Handoff to Orchestrator

```json
{
  "issue_key": "MDL-XXXXX",
  "step": 4,
  "outcome": "COVERAGE_EXISTS" | "GAPS_FOUND" | "NO_COVERAGE" | "SKIPPED",
  "affected_paths": ["mod/lti/locallib.php", "mod/lti/lib.php"],
  "test_files_found": ["mod/lti/tests/locallib_test.php"],
  "coverage_notes": "Tests exist for the LTI locallib but do not cover the deep link submission path identified in the bug",
  "skip_reason": "GitHub access unavailable" | null,
  "proceed_to_step_5": true
}
```

**Notes:**
- `proceed_to_step_5` is always `true` — Step 4 is informational and never blocks the pipeline.
- `test_files_found` may be empty if outcome is `NO_COVERAGE` or `SKIPPED`.
