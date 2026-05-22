---
name: moodleprd
description: >
  Draft a PRD for a Moodle initiative. Use this skill whenever the user expresses
  intent to write, create, draft, start, or spec out a PRD for any Moodle product
  or platform initiative — even if they do not use the word "PRD". Trigger phrases
  include "let's draft a PRD for", "I want to write a PRD for", "can you help me
  spec out", "let's write up the spec for", "I want to start a PRD on", "help me
  think through the spec for", or any similar expression of intent to produce a
  product requirements document for a Moodle initiative. Also triggered by
  /moodleprd.
---

# moodleprd

A skill for drafting PRDs for Moodle initiatives. It harvests context from primary
sources (Confluence, Google Drive, Granola), fills gaps through targeted questions,
and renders output against the standard Moodle PRD template — with Moodle-specific
patterns around source attribution, open decisions, and certainty labelling built
in. Saves to the current project workspace and pushes to Confluence on approval.
Optionally produces a backlog ticket file that can be pushed to Confluence or Jira.

---

## Mode detection — do this before anything else

Detect which mode applies. This changes which steps to skip.

**Orchestrated mode** — pm-orchestrator has invoked this skill and has already
passed an initiative name and a discovery handoff summary (produced by
moodledisco) in context. In orchestrated mode:
- Skip the clarifying question in Step 1 — use the initiative name already
  in context
- Skip Step 4 source gathering for areas already covered by the moodledisco
  synthesis doc (customer signal, prior product thinking, business context) —
  search only for PRD-specific detail not covered there (e.g. prior PRD drafts,
  Jira epics, stakeholder decisions not in the synthesis)
- Skip Step 6 gap questions about problem framing, solution direction, and
  evidence quality — these are already resolved in the discovery handoff; only
  ask about PRD-specific gaps (non-goals, success metric targets, dependency
  owners)
- Skip Step 9 follow-on artifact offers — pm-orchestrator owns the next-step
  decision

**Standalone mode** — the user has called this skill directly with no prior
orchestration context. Run all steps in full.

**Detection rule:** if the invoking message contains an initiative name and a
discovery handoff summary, or references a `disco-[slug].md` file, treat as
orchestrated. If the user is initiating cold, treat as standalone.

---

## Step 1: Identify the initiative

Extract the initiative name or topic from the user's message. If the scope is
genuinely ambiguous, ask one question to pin it down before doing anything else.
Do not proceed with a scope you cannot name.

In orchestrated mode, skip the clarifying question — use the initiative name and
problem statement provided in context.

---

## Step 2: Read the PRD template

The PRD template is embedded in this skill file. Use the content in the
**## PRD Template** section at the bottom of this document. Do not look for
an external file.

The six main section headings are fixed and must appear verbatim in every PRD:

1. `## 1. The Problem (The "Why")`
2. `## 2. Strategy & Success Metrics (The "Goal")`
3. `## 3. The Hypothesis`
4. `## 4. Proposed Solution & User Stories (The "What")`
5. `## 5. Product Non-Goals (The "Not Now")`
6. `## 6. Impacts & Dependencies (The "Who")`

Subsections can be added where the initiative warrants them. A PRD that uses
different headings, merges sections, or omits any of these six is wrong.

---

## Step 3: Read workspace context

Before searching external sources, check the current project workspace for these
files and read any that exist:

- `context/projects.md` — active initiative status
- `decision-log.md` — open and closed decisions
- `context/people.md` — team and stakeholder context

Note anything directly relevant to the initiative. Any open decisions in
`decision-log.md` that relate to this initiative must be carried into the PRD's
blocking open questions list — do not summarise them away. Reference the
decision-log entry by ID or title.

---

## Step 4: Harvest from external sources

Search all four sources. Use the Confluence MCP, Google Drive MCP, and Granola
MCP tools. Do not fabricate results — if a source returns nothing, note the gap.

1. **Confluence** — search for initiative briefs, discovery docs, OKRs, kick-off
   pages, design decisions, and meeting notes related to the initiative name.
2. **Google Drive** — search for strategy docs, research, partner requirements,
   slide decks, and Miro board exports.
3. **Granola** — search for meeting notes related to the initiative. Granola is
   reliable for what was discussed, intended, and agreed in principle in
   conversations — decisions, blockers, open questions, and context that often
   predates formal documentation. It is not a confirmation source. A decision
   mentioned in a Granola note is intent, not fact, until it is reflected in a
   Jira ticket, Confluence page, or partner communication. Claims drawn solely
   from Granola are labelled ⚠️ Intent — pending confirmation when drafting.
4. If the user asks to search Jira or another source, do so. Do not proactively
   search Jira without being asked.

In orchestrated mode, limit this step to sources not already covered by the
moodledisco synthesis doc. Look specifically for: prior PRD drafts, Jira epics or
existing tickets, stakeholder alignment decisions, and any Confluence pages that
post-date the discovery synthesis. Do not re-search for customer signal or general
business context — moodledisco has already done this and its synthesis doc is
the source of record.

**Relevance check — apply before rating any source as high confidence.**

Before treating a Confluence page, Drive document, or Granola note as grounding
for any section of the PRD, write one sentence in your working notes connecting
it to the specific initiative and claim: "This source covers [topic] and is
relevant to [section/claim] because [direct connection]."

If you cannot write that sentence — because the source covers a related feature,
a different user segment, or the initiative only in passing — rate the source as
thin, not strong, for that section. Do not allow existence of a source to imply
relevance to a specific claim.

**Assessing confidence per template section:**

After applying the relevance check, rate each section as high or low confidence.

High confidence means: multiple consistent, directly relevant sources; specific
data; named owners; clear scope; or direct quotes. Populate the section directly
without asking.

Low confidence means: a single vague or tangentially related source,
contradictory signals, no source material found, or a claim that cannot be
traced to a primary source. Flag for questioning.

When two sources conflict on the same claim, do not silently choose one. Surface
the conflict and ask the user to resolve it.

**Document-level confidence assessment — write this before moving to Step 5.**

After assessing all sources, produce a one-paragraph confidence summary:

> "Document confidence: [high / medium / low]. Grounded in: [what directly
> relevant evidence exists and which sections it supports]. Resting on
> assumptions: [which sections lack primary source grounding and why]. This
> will appear in the PRD header [or Section 0 for mid-initiative PRDs] so
> readers understand the epistemic state of the document before investing in
> the detail."

---

## Step 5: Determine document type

Before drafting, assess whether this is a new initiative or a mid-initiative PRD.

A mid-initiative PRD exists when the workspace or source material reveals:
active Jira tickets, prior milestone slippage, open architectural decisions,
partner dependencies already in flight, or a team that has been working on this
for some time without a governing document.

If it is mid-initiative, add a Section 0 before the template's Section 1. This
is a Moodle-standard pattern used in practice (see the LTI Platform Integration
and UI Uplift PRDs). Section 0 covers: where the work currently sits, what has
shipped or is in progress, and what decisions are needed before the PRD can bind.
Include the document-level confidence summary here rather than in a separate
header block.

---

## Step 6: Ask adaptive gap-filling questions

Only ask questions where confidence is low or source material is absent. Where
confidence is high, populate the section and move on.

Ask all questions in a single grouped message, organised by template section.
Do not drip-feed questions one at a time. Keep each question short and in plain
language.

In orchestrated mode, skip questions about: problem framing, customer evidence,
solution direction, and evidence quality — these are resolved in the moodledisco
handoff. Only ask about PRD-specific gaps: non-goals (always ask), success metric
targets and baseline owners, and dependency or risk owners not named in the
synthesis doc.

**Non-goals (Section 5) are always asked.** Even when you have source material
on scope, the boundary of what is explicitly not being built is a deliberate PM
judgment call. Do not infer it. Ask what is out of scope and why.

**Success metrics (Section 2) require care.** If a baseline exists in the
sources, ask for a specific target and time window. If no baseline exists,
do not ask for a target — ask who owns establishing the baseline and when. A
metric without a baseline is an assumption, not a goal, and should be labelled
as such.

**Guiding questions by section (use when confidence is low):**

Section 1 — The Problem
- What is the core problem, and for whom is it most acute?
- What is the clearest evidence that this problem is real and worth solving now?
- What is driving this initiative at this point in time?

Section 2 — Strategy and Success Metrics
- Which Moodle business goal or increment goal does this connect to?
- What is the primary metric you want to move?
- What should not break (guardrail metric)?
- Does a baseline exist today, and if not, who owns creating one?

Section 3 — The Hypothesis
- Complete this: if we build X for Y users, we expect Z outcome because of W reason.

Section 4 — Proposed Solution
- What is the high-level approach?
- Who are the primary users and what do they need to be able to do?
- Is there a phasing question — what is Phase 1 versus later?
- Are there Figma, Miro, or Jira links that should be included?

Section 5 — Non-Goals (always ask)
- What are you explicitly not building in this initiative, and why?

Section 6 — Impacts and Dependencies
- Which teams need to be involved or consulted?
- Who are the stakeholders affected by this change?
- What are the main risks — technical, partner, or delivery?
- Are there open decisions that must be resolved before work can begin?

---

## Step 7: Draft the PRD

Draft using the exact structure and headings of the template. Apply these
standards throughout.

**Section 1 — always state the evidence basis for the problem framing.**

Regardless of confidence rating, Section 1 must include a one-line note on the
basis for the problem framing. Place it directly under the section heading:

- "Problem basis: customer research ([source])" — if grounded in Dovetail,
  interview synthesis, support ticket analysis, or direct user evidence
- "Problem basis: partner communication ([source, date])" — if grounded in
  documented partner requirements or escalation
- "Problem basis: internal input ([type: PM hypothesis / strategy brief /
  stakeholder alignment])" — if the framing comes from internal sources without
  direct customer evidence

In orchestrated mode, use the evidence basis already established in the
moodledisco synthesis doc. Reference the synthesis doc: "Problem basis: discovery
synthesis `disco-[slug].md` — [customer research / internal input / etc.]"

**Certainty labelling.** Label every material claim inline:

- Confirmed — traceable to a named primary source (Jira ticket, partner
  communication, Confluence page, Granola meeting note, direct user quote)
- Assumption — believed but not verified; note what verification looks like
- Inference — reasonable conclusion from related evidence; note the chain
- Unresolved — genuinely open; note who should resolve it

Claims drawn solely from Granola are labelled ⚠️ Intent — pending confirmation
in Jira, Confluence, or partner communication.

**Non-goals format.** Render as a table with three columns: Non-goal, Rationale,
Source or confidence. A non-goal without a rationale will be ignored or reversed
under pressure.

**Success metrics format.** Where a baseline exists: state the metric, the
current baseline, the target, and the measurement method. Where no baseline
exists: state the metric, note the baseline is not yet established, and name
who owns establishing it before launch. Do not invent a number. Do not write a
range when no data supports it.

**Document confidence block.** Include the document-level confidence summary
from Step 4 either in Section 0 (for mid-initiative PRDs) or as a "Document
confidence" block immediately after the PRD metadata (Status, Owner, Date).

**Solution section for complex initiatives.** Where the solution covers many
stories or work items, organise by experience area and indicate priority using
P0 (must have for launch), P1 (important but not launch-blocking), P2 (future
consideration).

**Open questions.** Split into two groups: decisions needed before this PRD can
bind (blocking), and decisions to track during delivery (non-blocking). For each,
name a suggested owner. Any open decisions from `decision-log.md` identified in
Step 3 must appear in the blocking list with their decision-log reference.

**Writing standards:**
- Plain language throughout. No jargon, no nominalisations, no em dashes.
- Australian English spelling.
- Direct and specific. No padding or throat-clearing.
- Do not invent ticket numbers, people, dates, or architectural details.
- Keep each section within the word and length guidance in the template.
- Metadata: Status as "Draft", Owner as [the user's name — ask if unknown],
  Target Increment/Date as unknown unless the user provided it.

---

## Step 8: Save to workspace

Save the completed draft to the current project workspace under:

```
docs/prd/PRD_[InitiativeName].md
```

If that directory does not exist, save to the working directory as
`PRD_[InitiativeName].md` and note where the file was saved.

Use title case for the initiative name in the filename, with underscores for
spaces.

Tell the user the file path and ask them to review it. Also note which context
files should be updated once decisions are taken — typically
`context/projects.md`, `decision-log.md`, or `docs/recommendations.md`.

---

## Step 9: Offer follow-on artifacts

In orchestrated mode, skip this step — pm-orchestrator owns the next-step
decision and will proceed to Checkpoint 2 independently.

In standalone mode, after presenting the draft, offer these three options:

1. Pre-mortem — stress-test the PRD by identifying what is most likely to go
   wrong before it goes anywhere near engineering.
2. Backlog breakdown — break Section 4 into tickets for engineering (see the
   full workflow below).
3. Stakeholder update — draft a brief for leadership to socialise the PRD and
   surface the decisions they need to make.

---

## Backlog breakdown workflow

When the user asks for a backlog breakdown, follow this process.

### Choosing the right ticket structure

Use judgment to decide what structure fits the work — not format for its own sake.

**User stories** work well when the unit of work is defined by a user outcome.
New features, changes to user-facing flows, anything where acceptance is "does
the user experience change in the intended way?"

**Implementation tasks** work better when the work is primarily technical — a
migration, a refactor, an API change, a data model update — and forcing it into
user story format would be artificial and unhelpful.

Most initiatives will have both types. Write each ticket in whichever format
makes it clearest.

### Ticket structure

For each ticket, write:

- **Title** — short, imperative, specific (e.g. "Add course progress indicator
  to course card" or "Migrate mod_lti registration data to core_ltix schema")
- **Type** — User Story or Task
- **Priority** — P0, P1, or P2, consistent with the PRD's solution section
- **Description** — 2-4 sentences explaining what this is and why it matters.
  For user stories, use the standard format. For tasks, describe what needs to
  be built and why. Do not just restate the title.
- **Acceptance criteria** — 3-5 bullet points stating what done looks like as
  observable, testable outcomes. For user stories, write from the user's
  perspective. For tasks, write as technical outcomes. Avoid vague criteria like
  "works correctly" or "is performant" — be specific about observable system
  behaviour.
- **Dependencies** — note any tickets or external decisions this depends on.
- **Open questions** — any unresolved items that will affect implementation.
  Do not invent answers. Name who should resolve each one.

Group tickets by experience area or phase, consistent with how Section 4 of
the PRD is structured.

### Saving the backlog file

Save the ticket breakdown to the current project workspace under:

```
docs/prd/BACKLOG_[InitiativeName].md
```

If that directory does not exist, save to the working directory as
`BACKLOG_[InitiativeName].md` and note where the file was saved.

Present the file path to the user and ask them to review it.

### Publishing options

After the user reviews, offer two publishing paths:

**Option A — Confluence.** Ask the user for the Confluence destination: which
space to publish to, and optionally which parent page to nest under. Create the
page there. Title: "[Initiative Name] — Backlog". Do not push until the user
approves and has provided the destination.

**Option B — Jira.** Use the Jira MCP to create each ticket in the relevant
Jira project. Before doing this, confirm the target project key with the user.
Create tickets one at a time and report each Jira ID as it is created. If a
ticket has a dependency on another ticket in the same batch, create the
dependency ticket first and link them. Do not push to Jira until the user
explicitly approves.

The user may choose one, both, or neither. Do not push anywhere without
explicit approval.

---

## Step 10: Push PRD to Confluence (on user approval only)

When the user confirms the PRD is ready to publish:

1. Ask the user for the Confluence destination: which space to publish to, and
   optionally which parent page to nest under.
2. Use the Confluence MCP to create the page at the specified location.
3. Page title: the initiative name.
4. Content: the full PRD converted to Confluence-compatible formatting.
5. Confirm the page URL once created.

Do not push to Confluence until the user explicitly approves.

---

## Source handling notes

The source hierarchy for Moodle PRDs:

- Jira is the ground truth for ticket status, fix versions, and acceptance
  criteria. Always note ticket IDs when citing Jira.
- Partner communications are the ground truth for partner requirements. Note
  the date and channel when citing these.
- Confluence pages are primary sources for design decisions, kick-off context,
  and prioritisation calls. Note the page ID or URL.
- Google Drive documents are primary for research, strategy, and partner briefs.
- Granola is reliable for what was discussed, intended, and agreed in principle
  in conversations — it surfaces decisions, blockers, and context that often
  predates formal documentation. It is not a confirmation source. Claims drawn
  solely from Granola are labelled ⚠️ Intent — pending confirmation in Jira,
  Confluence, or partner communication. Note the meeting date when citing Granola.
- MoodleOS workspace context files are synthesis documents — useful for
  navigation and background, not authoritative on their own. Always trace a
  workspace claim back to its original source before citing it as confirmed.
- Documents numbered 09-20 in `docs/lti-project/` are synthesis documents. Use
  them for navigation only, not as primary sources.
- The moodledisco synthesis doc (`disco-[slug].md`) is the source of record for
  customer signal, problem framing, and solution hypotheses when this skill is
  invoked in orchestrated mode. Treat it as primary for those sections.

If a source is not connected or returns an error, note it and proceed with
gap questions for the affected sections.

---

## PRD Template

The following is the standard Moodle PRD template. Use this structure verbatim
when drafting. The six section headings are mandatory and must not be renamed,
merged, or omitted.

---

# [Activity Name]

**Status:** Draft ✍️ / Review 👀 / Approved 💪
**Owner:** [Name]
**Target Increment/Date:** [e.g., 2026-I1]

---

## 1. The Problem (The "Why")

_In 150 words or less, tell us what will be different once you have implemented
this piece of work._

Clearly define the user pain point with a "killer" data point or customer quote
to ensure 85%+ confidence in the problem.

Don't forget to articulate the driver / motivator / source of the 'Why' as part
of this section (e.g., Key priority for Moodle Services, Significant Volume of
Tickets in Tracker, etc).

---

## 2. Strategy & Success Metrics (The "Goal")

_Which of Moodle's business goals does this relate to?_

_Which of your Increment goals does this relate to?_

_How will you measure your progress?_

**Primary Metric**
The main needle you want to move (e.g., Increase conversion by X%).

**Guardrail Metric**
What you don't want to break (e.g., No increase in support tickets).

**Current Baseline**
Can we measure this today? (Yes/No). If no, how will we start?

---

## 3. The Hypothesis

_Instead of stating requirements as facts, frame them as a testable idea._

Use this syntax to document your hypothesis:

> If we build **[X]** for **[User Segment]**, we expect **[Outcome]** because
> of **[Reason]**.

---

## 4. Proposed Solution & User Stories (The "What")

_In 150 words or less, tell us what this piece of work is about._

High-level logic only. Include links to Figma mocks or Miro boards if it helps
tell the story.

Use this syntax to document your user stories:

> As a **[User]**, I want to **[Action]** so that **[Value]**.

---

## 5. Product Non-Goals (The "Not Now")

_Crucial for preventing scope creep and ensuring a "punchy" outcome._

What are we **explicitly not building** to move fast and maintain focus?

| Non-goal | Rationale | Source or confidence |
|---|---|---|
| | | |

---

## 6. Impacts & Dependencies (The "Who")

**Team delivering & help needed from** 💛
List teams across Products and Moodle (e.g., Architecture, UX) that will need
to be involved, consulted, or impacted in the delivery.

**Stakeholders Impacted** 🛠
Who will be affected by this change?

**Risks** ⛔
What could go wrong with this work? Don't forget to call out potential technical
risks (breaking changes, API impacts, etc).

**Open Questions**

Blocking (must be resolved before this PRD can bind):

| Question | Suggested owner |
|---|---|
| | |

Non-blocking (track during delivery):

| Question | Suggested owner |
|---|---|
| | |
