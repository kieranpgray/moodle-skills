---
name: bug-triage-validation
description: >
  Run Step 3 of the Alpha team bug triage workflow: bug validation.
  Checks Moodle user documentation to determine whether the reported behaviour is expected,
  and compares against known won't-fix patterns.
  Use when asked to validate a bug, run Step 3, or check whether reported behaviour matches documentation.
  Also invoked by the bug-triage-orchestrator as part of the Steps 2–4 parallel analysis.
  Accepts a Jira issue key and ticket details (provided by Step 1 via the orchestrator).
compatibility:
  mcp_servers:
    - name: mcp-atlassian-sooperset
      note: >
        Used for standalone Jira ticket fetch when ticket details are not provided by the orchestrator.
        Use mcp__mcp-atlassian-sooperset__jira_get_issue if available. If the MCP is unavailable,
        fall back to web_fetch from https://moodle.atlassian.net/rest/api/2/issue/MDL-XXXXX.
        Confirmed approach per Alpha team standup 2026-05-21.
  tools:
    - name: web_fetch
      note: >
        Used for two purposes: (1) fetching Moodle user documentation from docs.moodle.org,
        and (2) as a fallback for Jira ticket fetch if mcp-atlassian-sooperset is unavailable.
---

# Step 3: Bug Validation

This is **Step 3** of the Alpha team bug triage automation workflow (Sprint 2026-I2.1).
It checks whether the behaviour reported in a bug ticket is expected (per Moodle user documentation)
or genuinely unexpected, and checks against known won't-fix patterns.

**Guardrails:**
- This skill does not close, reject, or resolve tickets autonomously.
- This skill makes no Jira mutations — it is analysis only.
- The `triage/wontfix` label requires human confirmation before being applied (handled by the orchestrator).
- When confidence is based on LLM knowledge rather than live documentation, maximum confidence is **Medium**.

---

## Inputs

Provided by the caller (orchestrator or direct invocation):

| Field | Source | Notes |
|-------|--------|-------|
| `issue_key` | Direct or orchestrator | e.g. `MDL-12345` |
| `ticket_details` | Step 1 fetch (orchestrator handoff) | Summary, description, components, affected versions, fix versions, status, priority, reporter, labels, environment |
| `wontfix_patterns_content` | Orchestrator (from `bug-triage-shared/wontfix-patterns.md`) | Full content of won't-fix patterns file. When running standalone, read directly from `skills/bug-triage/bug-triage-shared/wontfix-patterns.md`. |
| `jira_cloud_id` | Constant | `db26294c-09fa-4e4e-bebe-d7410e9e2a67` |

**Standalone invocation (without orchestrator):**
If called directly (not via the orchestrator), and `ticket_details` is not provided:
1. Accept ticket details directly from the user if they paste them, OR
2. Attempt to fetch the ticket using `mcp__mcp-atlassian-sooperset__jira_get_issue`. If the MCP is unavailable, fall back to `web_fetch` from `https://moodle.atlassian.net/rest/api/2/issue/MDL-XXXXX`.
3. Read `skills/bug-triage/bug-triage-shared/wontfix-patterns.md` directly for won't-fix patterns.

If the ticket cannot be obtained by any means, inform the user and stop.

---

## Workflow

Follow these steps in order:

### Step 1: Identify the Feature(s)

Based on the `ticket_details` (summary, description, and components), determine which Moodle feature(s) are involved. Consider:
- The component name (e.g., "Assignment", "Quiz", "Gradebook", "Forum")
- Keywords in the summary and description
- Activity or resource types mentioned
- Admin settings or user-facing features referenced

### Step 2: Check Won't-Fix Patterns

Compare the ticket against the provided `wontfix_patterns_content`. Check each pattern category:
1. Third-party plugin compatibility
2. Behaviour is intentional but confusing
3. Version outside the supported matrix
4. Not a Moodle core bug (platform/server config)
5. Duplicate of a known open issue

If a pattern matches:
- Set `wontfix_pattern_matched: true` in the handoff block
- Record the matched pattern category
- Continue with documentation search to confirm the match

If a pattern matches but the documentation confirms the behaviour is genuinely unexpected (i.e., it is a real bug), set `outcome: GENUINE_BUG` and `wontfix_pattern_matched: true`. The orchestrator's wontfix stop only triggers when both `outcome: WORKING_AS_INTENDED` and `wontfix_pattern_matched: true` — so a genuine bug will route correctly. Prefer surfacing a valid bug over suppressing it.

If no pattern matches, proceed to documentation search normally.

### Step 3: Search Moodle User Documentation

**Primary source: Live documentation.** Attempt to fetch relevant pages from the Moodle docs wiki using `web_fetch`:

1. **Direct doc page** — Try fetching the likely documentation page based on the component/feature:
   ```
   https://docs.moodle.org/en/FEATURE_NAME
   ```
   For example: `https://docs.moodle.org/en/Assignment`, `https://docs.moodle.org/en/Quiz`, `https://docs.moodle.org/en/Forum`

2. **Search the wiki** — If the direct page doesn't cover the specific behaviour, search:
   ```
   https://docs.moodle.org/en/Special:Search?search=SEARCH_TERMS&fulltext=1
   ```
   Use specific keywords from the ticket to find relevant pages.

3. **Related pages** — Check sub-pages or related features if applicable:
   - `https://docs.moodle.org/en/FEATURE_settings`
   - `https://docs.moodle.org/en/Using_FEATURE`
   - `https://docs.moodle.org/en/FEATURE_FAQ`

Fetch at least 2-3 relevant doc pages to get comprehensive coverage. Focus on user-facing documentation that describes how the feature is supposed to work.

#### Fallback: Knowledge-Based Assessment

If live documentation cannot be accessed (e.g., HTTP 403, 5xx errors, timeouts on all attempted pages), activate the **knowledge fallback** path:

1. **Do not stop the analysis.** Proceed using your trained knowledge of Moodle's user-facing features and documented behaviour.
2. **Identify the relevant documentation topics** — note which doc pages *would* be relevant (e.g., "Marking workflow", "Assignment settings") and provide their expected URLs.
3. **Describe expected behaviour from knowledge** — use what you know about how the feature is documented to work in Moodle's user documentation.
4. **Clearly disclose the source** — always indicate that the assessment is based on LLM knowledge rather than a live doc fetch (see output template below).

### Step 4: Analyse and Compare

Compare the behaviour reported in the ticket against what the documentation says:
- Identify the specific action or scenario described in the bug report
- Find the corresponding section in the documentation
- Note any discrepancies between reported behaviour and documented behaviour
- Consider whether the documentation explicitly covers the reported scenario

### Step 5: Produce Output

Structure your response as follows:

---

## 🎫 Ticket Summary

| Field | Value |
|-------|-------|
| Ticket | MDL-XXXXX |
| Summary | [ticket summary] |
| Component(s) | [components] |
| Status | [status] |
| Priority | [priority] |
| Affected Version(s) | [versions] |

**Reported Issue:**
[Brief description of what the reporter says is wrong]

---

## 📖 Relevant Documentation

List the documentation pages found with links:
- [Page Title](URL) — brief note on relevance

**If live documentation was successfully fetched**, cite pages as above.

**If using knowledge fallback** (live fetch failed), use this format instead:

> ℹ️ **Source: LLM Knowledge** — Live documentation at docs.moodle.org could not be accessed. The following assessment is based on trained knowledge of Moodle's documented behaviour.

- [Expected Page Title](expected URL) — brief note on what this page covers (based on knowledge)

If neither live docs nor knowledge can cover the feature, state:
> ⚠️ No relevant Moodle user documentation found for this feature, and no reliable knowledge is available. Cannot assess expected behaviour.

Then stop here (skip Steps 4 and the recommendation).

---

## ✅ Expected Behaviour (from documentation)

Provide step-by-step expected behaviour based on what the documentation says:

1. [Step 1 from docs]
2. [Step 2 from docs]
3. [Expected outcome from docs]

Quote or reference the specific documentation sections that describe this behaviour.

---

## 🔍 Recommendation

**Assessment:** [Expected Behaviour / Unexpected Behaviour / Unclear]

**Reasoning:** [Explain why you reached this conclusion based on the documentation]

**Confidence Level:** [High / Medium / Low]

Confidence criteria:
- **High** — Documentation explicitly describes the expected behaviour for this exact scenario, and the reported behaviour clearly contradicts (or matches) it.
- **Medium** — Documentation covers the feature but doesn't explicitly address this specific scenario. Assessment is based on reasonable inference from documented behaviour.
- **Low** — Documentation is sparse, ambiguous, or only tangentially related to the reported issue. Assessment is largely inferential.

---

## Important Rules

- **Prefer live Moodle user documentation** (docs.moodle.org). Always attempt to fetch live docs first.
- **Fall back to LLM knowledge when live docs are inaccessible** — if all fetch attempts fail (403, timeout, etc.), use your trained knowledge of Moodle's documented features and behaviour.
- **Always disclose your source** — clearly state whether your assessment is based on live documentation or LLM knowledge.
- **Cap confidence for knowledge-based assessments** — when using the fallback path, the maximum confidence level is **Medium**, even if you are highly familiar with the feature. Only live documentation can support **High** confidence.
- **Do not guess** — if neither live docs nor your knowledge reliably cover the scenario, say so clearly.
- **Be objective** — base your assessment on documented behaviour (whether from live fetch or knowledge), not on what you think *should* happen.
- **Cite your sources** — for live docs, link to the specific page(s). For knowledge-based assessments, reference the expected doc page URLs and note the source.
- **Handle edge cases** — if the ticket describes a feature that has changed across versions, note which version's docs/knowledge you're referencing.

---

## Won't-Fix Pattern Match

If a won't-fix pattern was matched in Step 3, include an additional section in the output:

## ⚠️ Won't-Fix Pattern Matched

**Pattern:** [Category name from wontfix-patterns.md]
**Signals observed:** [Specific signals from the ticket that match the pattern]
**Routing:** [Recommended action from the pattern]

Note: The orchestrator will surface this to a human for confirmation before applying the `triage/wontfix` label.

---

## Handoff to Orchestrator

When called by the orchestration skill, return a structured JSON handoff block alongside the triage note:

```json
{
  "issue_key": "MDL-XXXXX",
  "step": 3,
  "outcome": "GENUINE_BUG" | "WORKING_AS_INTENDED" | "AMBIGUOUS",
  "wontfix_pattern_matched": true | false,
  "matched_pattern": "pattern category name or null",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "summary": "<max 100 words — decision-relevant finding>",
  "doc_sources": ["list of doc URLs consulted, or expected URLs if using knowledge fallback"],
  "source_type": "live_docs" | "llm_knowledge" | "mixed",
  "proceed_to_step_5": true
}
```

**Outcome values:**
- `GENUINE_BUG` — reported behaviour contradicts documented behaviour (maps from "Unexpected Behaviour" assessment)
- `WORKING_AS_INTENDED` — reported behaviour matches documented behaviour (maps from "Expected Behaviour" assessment)
- `AMBIGUOUS` — documentation does not clearly cover the scenario, or conflicting signals (maps from "Unclear" assessment)

**Notes:**
- `proceed_to_step_5` is always `true` — Step 3 does not block the pipeline directly. The orchestrator may pause for human confirmation before proceeding to Step 5 when a wontfix pattern is confirmed.
- `wontfix_pattern_matched: true` triggers the orchestrator's automatic stop checkpoint only when combined with `outcome: WORKING_AS_INTENDED`. A genuine bug with a matched pattern routes through normally.
- The `summary` field must not exceed 100 words. Write the full analysis to the step file on disk; keep this block concise.
- When `source_type` is `llm_knowledge`, maximum `confidence` is `MEDIUM`.
