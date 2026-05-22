---
name: moodledisco
description: >
  Run discovery for a Moodle product initiative. Produces a discovery synthesis
  document — the evidence base and problem frame that a PRD is built on. Use when
  the user wants to understand a customer problem or business opportunity before
  writing a PRD. Trigger phrases include "let's run discovery on", "I want to
  understand the problem with", "help me frame this opportunity", "do a discovery
  for", "what do we know about this problem", or any similar expression of intent
  to produce a discovery synthesis. Also works as Phase 1 of the moodledisco →
  moodleprd → moodletickets workflow when invoked by pm-orchestrator. Also
  triggered by /moodledisco.
---

# moodledisco

A skill for running structured discovery on a Moodle product initiative. It
harvests evidence from connected sources, frames the customer problem, maps
to company goals, and produces a discovery synthesis document — the foundation
a PRD is built on. It is Phase 1 of the moodledisco → moodleprd → moodletickets
workflow, coordinated by pm-orchestrator. It also works as a standalone skill
when called directly.

---

## Mode detection — do this before anything else

Detect which mode applies. This changes how the skill starts and ends.

**Orchestrated mode** — pm-orchestrator has already loaded context and named
the initiative. The invoking message contains an explicit initiative name or
problem statement with prior context already in the conversation. Skip setup
questions and preamble. Go straight to work. On completion, write the synthesis
doc and handoff summary and stop — do not present or ask for approval.
Pm-orchestrator owns the checkpoint.

**Standalone mode** — the user is calling this skill directly with no prior
orchestration context. Ask setup questions if scope or context is ambiguous.
On completion, present the full synthesis doc and ask for explicit review and
approval before producing the handoff summary. Incorporate any feedback, update
the file, then present the handoff summary.

**Detection rule:** if the invoking message contains an explicit initiative name
or problem statement with prior context already in the conversation, treat as
orchestrated. If the user is initiating cold, treat as standalone.

---

## Step 1: Identify scope

Extract the initiative name and problem area from the user's message or
conversation context.

In standalone mode, if the scope is genuinely ambiguous, ask one question to
pin it down. Do not ask more than one question and do not proceed with a scope
you cannot name.

In orchestrated mode, use the initiative name and context provided by
pm-orchestrator. Do not ask questions.

---

## Step 2: Read the output template

The discovery synthesis template is embedded in this skill file. Use the
content in the **## Discovery Synthesis Template** section at the bottom of
this document. Do not look for an external file.

The section headings are fixed. Every synthesis doc produced by this skill must
use them verbatim in the order they appear:

1. Bottom Line
2. The Problem
3. Strategic Alignment
4. Cost of the Problem
5. Solution Hypotheses
6. Load-Bearing Assumptions
7. Open Unknowns
8. Evidence Quality

A synthesis doc that uses different headings, merges sections, or omits any
section is wrong.

---

## Step 3: Source company goals

Check the current project workspace for a goals or strategy file. Look for
likely filenames — `goals.md`, `strategy.md`, `okrs.md`, or similar — in the
workspace root or a `context/` subdirectory. If found, load it.

If not found, ask the user:

> "I could not find a company goals or strategy file in your workspace. Can
> you paste the relevant goals or point me to where they live?"

Do not proceed past this step without goals in context. Goal alignment is a
required section of the output and cannot be filled without knowing the goals.

---

## Step 4: Harvest evidence from connectors

Search all of the following. Do not stop at one source — each captures a
different type of signal and the gaps between them are often where the most
important context sits.

- **Dovetail** — user research, interview synthesis, insight tags, customer
  evidence. Primary source for validated customer signal. Search first when
  assessing whether customer evidence exists.
- **Confluence** — initiative briefs, OKRs, kick-off pages, prior discovery
  docs, design decisions.
- **Google Drive** — strategy docs, research briefs, partner requirements,
  slide decks.
- **Granola** — meeting notes for intent and discussion context. Reliable for
  what was discussed and agreed in principle. Not a confirmation source. Claims
  drawn solely from Granola are labelled ⚠️ Intent — pending confirmation in
  Jira, Confluence, or partner communication.
- **Miro** — if linked or mentioned by the user.
- **Product analytics** — ask specifically if the problem relates to LMS,
  MoodleCloud, Workplace, or Marketplace. Ask whether Amplitude, Pendo, or
  equivalent data exists. Do not assume it does.
- **User-provided context** — transcripts, links, docs, or data provided
  directly. Treat as primary; use connector search to fill gaps only.

**Relevance check — apply before rating any source:**

Before rating a source as strong, write one sentence in your working notes
connecting it to the specific problem being explored: "This source covers
[topic] and is relevant because [direct connection to the problem]."

If you cannot write that sentence — because the evidence is tangentially
related, covers a different user segment, or predates the current problem
context — rate the source as thin, not strong, regardless of its origin.

After searching, assess evidence quality across four categories:

- **Customer signal** — Dovetail insights, interview synthesis, support
  tickets, NPS/CSAT feedback, quantitative usage data. Granola meeting notes
  alone do not constitute customer signal.
- **Prior product thinking** — existing specs, PRDs, decision docs, Jira epics
  or past exploration.
- **Business context** — OKRs, strategy docs, competitive signals, revenue or
  retention data.
- **Technical context** — architecture docs, known constraints, existing API
  contracts, relevant system docs.

Rate each as: Strong / Thin / Absent.

---

## Step 5: Evidence quality gate

If the only customer signal found is Granola meeting notes — no Dovetail
insights, no interview synthesis, no support ticket analysis, no quantitative
usage data — push back before continuing:

> "I searched and found meeting notes but no validated customer research.
> Meeting notes capture intent and discussion but are not a substitute for
> evidence. Before framing this problem I would want to see at least one of:
> a Dovetail study or insight set, an interview synthesis document, support
> ticket analysis, or usage data that speaks directly to the problem. Do you
> have any of these? If you want to proceed without validated research, tell me
> why and I will note it as an unvalidated assumption throughout the output."

Only continue if the user explicitly instructs it. If proceeding without
validated research, set discovery confidence to Low and surface this in the
Bottom Line confidence flag in the synthesis doc.

In orchestrated mode, if this gate is hit, surface the push back in context and
wait for the user's response before continuing. Pm-orchestrator passes the
response back.

---

## Step 6: Frame the problem

Write the Problem section of the synthesis using the template structure: who
experiences it, what the pain or unmet need is, why now, why Moodle. Back each
claim with evidence and certainty labels.

If problem framing comes primarily from internal stakeholders rather than
customer evidence, label it explicitly:

⚠️ Problem framing is based on internal input, not validated customer research.

The "Why us" line is deliberately uncomfortable to fill. If there is no clear
answer, write that plainly — surfacing the absence of a clear strategic
rationale is a valid and useful output.

---

## Step 7: Map to company goals

Using the goals loaded in Step 3, identify which goal or strategic priority
this problem most directly serves.

If alignment is clear, state it and the connecting reasoning in the Strategic
Alignment section.

If alignment is weak or absent, push back rather than silently inferring a
connection:

> "Based on the goals I have in context, I cannot find a clear alignment between
> this problem and a current company priority. Before going further, can you
> help me understand which goal this serves and why now? If there is no
> alignment, that is worth surfacing explicitly before investing in a PRD."

Do not fabricate goal connections. A "Weak" alignment strength rating with an
honest rationale is more useful than a false "Strong."

Also note the market and competitive context in one sentence in the Strategic
Alignment section: is anyone else solving this, and does that affect urgency
or approach.

---

## Step 8: Quantify the cost of the problem

Attempt to answer: what is this problem currently costing? Populate the Cost
of the Problem section using only what is evidenced. Omit categories where no
data exists rather than filling with estimates.

Categories to attempt (from the template):
- Revenue at risk or being lost
- Churn or retention impact
- Addressable population and frequency of pain
- Support or ops burden
- Competitive exposure

Label every figure with its source and certainty. If no quantitative data
exists, state that plainly and name what instrumentation or research would be
needed to establish it. Do not invent numbers or ranges. A sparse section is
itself a signal — it tells the PRD author what research is still needed.

---

## Step 9: Light solution exploration

Generate 2-3 candidate solution directions framed as hypotheses. Include one
conservative or incremental option and one more ambitious option. Flag one as
recommended.

Format each as: "If we [approach], we believe [outcome] because [reasoning]."

For the recommended hypothesis, add 1-2 sentences of deciding logic —
connecting the cost framing and evidence base to why this direction is the
right response over the others. Make the reasoning explicit; do not leave it
to inference.

Do not score, rank comparatively, or estimate effort. This is directional
framing to inform the PRD, not a decision. Solution scoring and assumption
testing belong in moodleprd and pm-orchestrator respectively.

---

## Step 10: Surface assumptions and unknowns

Separate into two distinct categories:

**Load-bearing assumptions** — things being proceeded with as if true, where
being wrong would change the recommended direction. Each must have an owner
and a validation action. Write to the Load-Bearing Assumptions table in the
template.

**Open unknowns** — things not yet known and not assumed either way. Lower
urgency than assumptions but should be tracked. Each needs a person to resolve
it. Write to the Open Unknowns table in the template.

---

## Step 11: Write the synthesis doc

Write the full discovery synthesis using the section structure from
`MoodleDisco_Template.md`. Apply certainty labelling throughout.

If any evidence category is rated Absent, ensure the Bottom Line opens with a
confidence flag before the recommendation.

Save to:
- Working directory: `disco-[feature-slug].md`
- Current project workspace: `docs/discovery/DISCO_[InitiativeName].md` (create
  the directory if it does not exist; if the workspace is unavailable, the
  working directory copy is sufficient)

Use title case for the initiative name in the filename, with underscores for
spaces.

---

## Step 12: Write the handoff summary

Produce a compact handoff summary (150 words maximum) in this format:

> "Problem: [one sentence]. Evidence quality: customer signal
> [strong/thin/absent], business context [strong/thin/absent]. Goal alignment:
> [which goal, one sentence rationale, or 'weak — flagged to user']. Competitive
> context: [one sentence or 'none identified']. Cost of problem: [key figure or
> 'not yet quantified — reason']. Discovery confidence: [high/medium/low, one
> sentence]. Solution hypotheses: [2-3 names, recommended flagged].
> Load-bearing assumptions: [count + top item].
> Synthesis doc: `disco-[feature-slug].md`."

---

## Step 13: Exit

**Standalone mode:** Present the full synthesis doc. Ask: "Does this problem
framing look right? Any changes before this feeds into the PRD?" Wait for
explicit approval. Incorporate feedback, update the file, then present the
handoff summary.

**Orchestrated mode:** Write the file, produce the handoff summary, and stop.
Do not present or ask for approval. Pm-orchestrator owns the checkpoint.

---

## Non-goals — moodledisco must not do these

- Conduct user research
- Write a PRD
- Score or prioritise solution options comparatively
- Estimate effort or feasibility
- Run assumption testing or pre-mortem

---

## Output standards

**Certainty labelling.** Label every material claim inline:
- ✅ Confirmed — traceable to a named primary source (Jira ticket, partner
  communication, Confluence page, Granola meeting note, direct user quote)
- ⚠️ Assumption — believed but not verified; note what verification looks like
- 🔍 Inference — reasonable conclusion from related evidence; note the chain
- ❓ Unresolved — genuinely open; note who should resolve it

Claims drawn solely from Granola meeting notes are labelled ⚠️ Intent —
pending confirmation in Jira, Confluence, or partner communication.

**Source hierarchy.**
- Jira → ground truth for ticket status and acceptance criteria
- Partner communications → ground truth for partner requirements
- Confluence and Google Drive → primary for design decisions, research, strategy
- Granola → reliable for intent and discussion; not a confirmation source
- Workspace context files → synthesis only; trace claims to the original source

**Writing standards.** Australian English spelling. No jargon, no
nominalisations, no em dashes. Direct and specific — no padding or
throat-clearing. No fabricated figures, ticket numbers, people, or
architectural details. Certainty labelling on every material claim. Bottom
Line written for someone who reads nothing else.

---

## Discovery Synthesis Template

The following is the standard Moodle discovery synthesis template. Use this
structure verbatim when producing the synthesis doc. The eight section headings
are mandatory and must not be renamed, merged, or omitted.

---

# Discovery Synthesis: [Initiative Name]

**Status:** Draft | In Review | Final
**Author:** [Name]
**Date:** [Date]

---

## Bottom Line

[3-5 sentences. State the problem, who it affects, what it is costing, and the
recommended direction. If any evidence category is Absent or discovery
confidence is Low, open with: "This synthesis is based on [limited/absent
customer signal] — treat the direction as indicative, not validated." Written
for someone who reads nothing else. No hedging, no caveats — those live below.]

---

## The Problem

**Who:** [The specific user or customer segment most affected]

**What:** [The pain, unmet need, or opportunity in one or two sentences.
Customer's perspective, not internal framing.]

**Why now:** [What has changed — in the market, in the data, in customer
behaviour, or internally — that makes this worth addressing now rather than
later. One or two sentences.]

**Why us:** [Why Moodle is the right entity to solve this. One sentence.
"No clear reason" is a valid answer and should be flagged.]

**Evidence:** [The 2-3 strongest pieces of evidence that this problem is real
and significant. Source and certainty-label each one. If evidence is thin or
absent, say so plainly here — do not pad.]

---

## Strategic Alignment

**Goal:** [The company goal or strategic priority this serves]

**Alignment strength:** Strong | Moderate | Weak

**Rationale:** [One sentence connecting the problem directly to the goal. If
alignment is weak, state why we are proceeding anyway — or flag that we should
not proceed yet.]

**Market and competitive context:** [One sentence. Is anyone else solving this?
Does that affect urgency or the approach? "No known competitor is addressing
this" is a valid answer.]

---

## Cost of the Problem

[What is this problem currently costing? Include only what is evidenced. Omit
categories where no data exists rather than filling with estimates. A sparse
section is itself a signal.]

- **Revenue at risk:**
- **Churn / retention impact:**
- **Addressable population:**
- **Support or ops burden:**
- **Competitive exposure:**

[If no quantitative data exists, state that plainly and name what
instrumentation or research would be needed to establish it.]

---

## Solution Hypotheses

[The evidence above points toward the following directions. 2-3 candidate
approaches — not decisions, not scored. Each framed as a testable hypothesis.]

**⭐ Recommended — [Hypothesis name]**
If we [approach], we believe [outcome] because [reasoning].

*Why this over the others:* [1-2 sentences connecting the cost framing and
evidence base to why this direction is the right response. Make the deciding
logic explicit.]

**[Hypothesis name]**
If we [approach], we believe [outcome] because [reasoning].

**[Hypothesis name]**
If we [approach], we believe [outcome] because [reasoning].

---

## Load-Bearing Assumptions

[Things we are proceeding as if true. If any of these are wrong, the
recommended direction changes. Each needs an owner.]

| Assumption | Risk if wrong | Owner | How to validate |
|---|---|---|---|
| We believe [X] | [Consequence] | [Name] | [Action] |

---

## Open Unknowns

[Things we do not yet know and have not assumed either way. Lower urgency than
assumptions but should be tracked.]

| Unknown | Why it matters | Who should resolve it |
|---|---|---|
| [Question] | [Impact on direction or scope] | [Name or role] |

---

## Evidence Quality

| Category | Rating | Notes |
|---|---|---|
| Customer signal | Strong / Thin / Absent | |
| Prior product thinking | Strong / Thin / Absent | |
| Business context | Strong / Thin / Absent | |
| Technical context | Strong / Thin / Absent | |

**Discovery confidence:** High | Medium | Low — [one sentence on why]

[If any category is Absent, this should already be reflected in the Bottom Line
confidence flag above.]
