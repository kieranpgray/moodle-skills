---
name: bug-triage-assignment
description: >
  Run Step 5 of the Alpha team bug triage workflow: assignment and triage outcome.
  Aggregates results from Steps 1–4, determines the triage outcome (ready-for-human
  or wontfix), and produces a final structured triage note that serves as both an audit
  trail and a work brief for whoever picks up the ticket.
  Use when asked to complete triage on a bug, run Step 5, or determine assignment for a ticket.
  Also invoked by the bug-triage-orchestrator after Steps 2–4 complete.
  Accepts a Jira issue key and the Step 1–4 handoff blocks.
compatibility:
  mcp_servers:
    - name: mcp-atlassian-sooperset
      note: >
        Use the sooperset Atlassian MCP (mcp__mcp-atlassian-sooperset__*) for Jira access.
        Confirmed in Alpha team standup 2026-05-21.
---

# Step 5: Assignment and Triage Outcome

This is **Step 5** of the Alpha team bug triage automation workflow (Sprint 2026-I2.1).
It aggregates the findings from Steps 1–4, determines the triage outcome, and produces
a final triage note. This note is both an audit trail and a work brief.

**Guardrails:**
- The agent does not determine security priority. Any ticket with security-related signals must be flagged as a human handoff immediately.
- The `triage/wontfix` label requires human confirmation before being applied.
- All comments posted to Jira require explicit human confirmation.
- The agent does not assign tickets to individuals — it labels them for routing.

---

## Inputs

Provided by the caller (orchestrator or direct invocation):

| Field | Source | Notes |
|-------|--------|-------|
| `issue_key` | Direct or orchestrator | e.g. `MDL-12345` |
| `ticket_details` | Step 1 fetch | Full ticket. Do not re-fetch — use the data already in context. |
| `step2_result` | Step 2 handoff JSON | May be SKIPPED |
| `step3_result` | Step 3 handoff JSON | May be SKIPPED |
| `step4_result` | Step 4 handoff JSON | May be SKIPPED |
| `jira_cloud_id` | Constant | `db26294c-09fa-4e4e-bebe-d7410e9e2a67` |

If called standalone (not via orchestrator), run Steps 1–4 first, or ask the user to provide
the step results. Do not proceed to Step 5 without at least Step 1 data.

---

## Step-by-Step Instructions

### 1. Check for security signals

Before doing anything else, scan the ticket description, comments, and step results for security signals:
- References to authentication bypass, privilege escalation, data exposure, XSS, SQL injection, SSRF, or similar
- Any description that could indicate a security vulnerability rather than a functional bug

If security signals are present: return `outcome: SECURITY_ESCALATION` immediately. Do not continue.

### 2. Aggregate the pipeline findings

Summarise what each completed step found:
- **Step 1:** Completeness (already passed to reach Step 5)
- **Step 2:** Regression candidate(s) if found, or clear, or skipped
- **Step 3:** Genuine bug / working as intended / ambiguous — and whether a won't-fix pattern matched
- **Step 4:** Coverage status (exists / gaps / none / skipped)

Note how many steps were skipped. If two or more steps were skipped, overall confidence is LOW.

### 3. Determine the triage outcome

Apply the following decision logic:

**WONTFIX** — use when:
- Step 3 returned `WORKING_AS_INTENDED`, OR
- Step 3 matched a won't-fix pattern AND human has confirmed (the orchestrator will have surfaced this — check whether confirmation was received)
- Note: `triage/wontfix` must be confirmed by a human before applying

**READY_FOR_HUMAN** — use when:
- Step 3 returned `GENUINE_BUG` (at any confidence level)
- Step 3 returned `AMBIGUOUS` and the team should make the call
- Default when in doubt

Apply the `HQ team alpha` label alongside `triage/ready-for-human` to add the ticket to the team backlog.

> **Future option — not currently active:** A `READY_FOR_AGENT` outcome and corresponding `triage/ready-for-agent` label could be introduced later to distinguish tickets where an automated agent could plausibly implement the fix — making the longer-term automation opportunity measurable. This distinction is excluded from the current workflow.

### 4. Assess fix scope

Provide a brief fix scope assessment:
- What needs to change to fix this bug?
- What is the likely change surface (files, APIs, test coverage required)?
- What dependencies or risks could affect the fix?

This is the "agent brief" component — the triage note should be useful to whoever picks this ticket up, not just an audit record.

### 5. Draft the final triage note

The triage note is posted as a comment on the Jira ticket. It must:
- Be readable by someone who has not seen the pipeline run
- Summarise what was found, not just what was checked
- State the triage outcome and recommended next action clearly
- Not reveal internal tooling details (e.g. do not mention "Step 2 handoff JSON")

Use this structure:

```
## AI Triage Note — [ISSUE KEY]

**Triage outcome:** [READY FOR AGENT / READY FOR HUMAN / WONTFIX]
**Confidence:** [HIGH / MEDIUM / LOW] — [one sentence on why]

---

### What was assessed

**Quality check (Step 1):** Complete — all required fields present.

**Recent changes (Step 2):** [Summary of findings, or "Not assessed — GitHub access unavailable."]

**Bug validation (Step 3):** [Genuine bug / Working as intended / Ambiguous] — [one sentence on evidence, with doc link if applicable]

**Test coverage (Step 4):** [Coverage exists / Gaps found / No coverage / Not assessed] — [one sentence on what was found]

---

### Fix scope

[2–4 sentences describing what needs to change, the likely change surface, and any known risks or dependencies.
Omit if outcome is WONTFIX.]

### Regression candidates

[List commits from Step 2 if any, or "None identified." Omit if Step 2 was skipped.]

### Test coverage gaps

[Note gaps from Step 4 that a fix should address. Omit if no gaps found or Step 4 was skipped.]

---

### Recommended action

[One clear sentence: e.g. "Add to team backlog for agent implementation" / "Add to backlog — requires human judgement on architectural approach" / "Close as working as intended — see [link]"]

*This note was generated by the Alpha team triage agent. Human review completed by [reviewer].*
```

### 6. Return handoff block

```json
{
  "issue_key": "MDL-XXXXX",
  "step": 5,
  "outcome": "READY_FOR_HUMAN" | "WONTFIX" | "SECURITY_ESCALATION",
  "label_to_apply": "triage/ready-for-human" | "triage/wontfix" | null,
  "overall_confidence": "high" | "medium" | "low",
  "steps_skipped": ["step2", "step4"],
  "fix_scope_summary": "One sentence on fix scope, or null for WONTFIX",
  "triage_note_draft": "Full triage note text as a string",
  "human_confirmation_required": true,
  "security_escalation": false
}
```

`human_confirmation_required` is always `true` — the triage note and final label are never applied without explicit human confirmation.

---

## Labels used by this skill

| Label | Applied when |
|-------|-------------|
| `triage/ready-for-human` | Valid bug — added to team backlog for human review and assignment |
| `triage/wontfix` | Not a bug or out of scope — **human confirmation required before applying** |
| `HQ team alpha` | Applied alongside `triage/ready-for-human` — adds the ticket to the Alpha team backlog |

When applying a final label, remove `triage/in-progress` from the ticket.
