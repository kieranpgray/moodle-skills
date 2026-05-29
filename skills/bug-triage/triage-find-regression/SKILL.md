---
name: findregression
description: Determine the most likely source of a regression through disciplined narrowing, evidence gathering, and causal validation.
version: 1.0
tags:
  - triage
  - debugging
  - regression
  - git
  - root-cause-analysis
---

# Regression Source Identification Skill

## Purpose

Use this skill during issue triage to identify the most likely source of a regression.

The objective is not merely to find suspicious code, but to:
- establish a reliable regression window,
- narrow the candidate change set,
- validate causality,
- and produce actionable outputs for the broader triage process.

This skill should bias toward evidence and elimination over intuition.

---

# Expected Outputs

The investigation should produce:

1. A concise regression summary
2. Last known good state
3. First known bad state
4. Most likely causal change(s)
5. Supporting evidence
6. Confidence level
7. Recommended next actions

---

# Required Inputs

Attempt to gather:

- Symptom description
- Expected behaviour
- Actual behaviour
- Reproduction steps
- Affected environments
- Relevant logs/errors
- Approximate timeframe
- Related tickets/PRs/releases

Highly valuable if available:
- Last known good commit
- Failing test
- Deployment identifiers
- Feature flags
- Telemetry or metrics

---

# Core Rules

## Rule 1: Reproduce Before Theorising

Do not speculate about root cause until:
- the issue is reproducible,
- OR deterministic evidence exists.

If reproduction is impossible:
- focus on logs,
- telemetry,
- deployment diffs,
- environmental changes,
- and behavioural timelines.

---

## Rule 2: Establish a Regression Window

Always determine:
- last known good state,
- first known bad state.

A narrow window is more valuable than deep speculation.

Possible sources:
- git history,
- deployments,
- release versions,
- CI runs,
- user reports,
- monitoring timestamps.

---

## Rule 3: Prefer Elimination Over Intuition

Do not rely on:
- “this looks suspicious”
- “this subsystem feels likely”

Prefer:
- git bisect,
- controlled isolation,
- reproducible tests,
- dependency comparison,
- configuration diffing,
- behavioural verification.

---

## Rule 4: Correlation Is Not Causation

A change is not considered causal unless at least one is true:
- reverting it removes the issue,
- reapplying it reproduces the issue,
- a targeted test demonstrates the failure,
- the failure mechanism is clearly demonstrated.

---

# Investigation Workflow

## Step 1: Define the Regression Precisely

Create a concise statement describing:
- what changed,
- where,
- when,
- under what conditions.

Capture:
- deterministic vs intermittent,
- full failure vs degradation,
- affected user groups,
- environment specificity.

### Example

> LTI launches from Canvas fail with HTTP 401 after JWT signing changes introduced in Moodle 5.1.

### Output

Produce:
- concise regression statement.

---

## Step 2: Determine the Regression Window

Identify:
- last known good state,
- first known bad state.

Use:
- git history,
- release history,
- deployment metadata,
- CI artifacts,
- production timelines.

### Suggested Commands

```bash
git log
git diff GOOD..BAD
git bisect
