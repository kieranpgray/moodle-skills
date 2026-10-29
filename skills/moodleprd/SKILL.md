---
name: moodleprd
description: >
  Coach a product manager through writing a PRD for a Moodle initiative, one
  section at a time, and publish it to Confluence as it is written. Use this
  skill whenever someone wants to write, draft, start, continue, update or
  review a PRD for a Moodle product or platform initiative, even if they do
  not say "PRD". Trigger phrases include "let's draft a PRD for", "I want to
  write a PRD for", "help me spec out", "let's write up the spec for", "pick up
  my PRD on", "review this PRD", or a link to a Confluence PRD page. Also
  triggered by /moodleprd.
---

# moodleprd

This skill helps a product manager write a PRD that a busy reader understands
in a minute. It is a coach, not a scribe. The PM does the thinking; the skill
asks one section at a time, pushes back when the thinking is thin, tightens
the wording, and publishes each section to Confluence once the PM approves it.

Three rules run through every step:

1. **The PM writes first.** For each section, ask for the PM's own words before
   drafting anything. Sources inform the questions; they never replace the
   PM's answer. Never fill a section from research alone.
2. **One section at a time.** Ask, test, tighten, show, approve, publish. Then
   move on. Never draft the whole PRD in one go.
3. **Confluence is the master copy.** The page is created early and filled in
   as sections are approved. A local markdown file is a backup only.

---

## Before you start

**Read the three reference files** in this skill's `references/` folder:

- `prd-template.md`: the sections in order, each with its word budget, gate
  and guidance. Headings are used exactly as written there.
- `writing-standard.md`: the two tests for every sentence, banned words and
  their swaps, patterns to cut, and examples of good writing.
- `confluence-elements.md`: how to write each part of the page for each
  Confluence connector, and how to update one section safely.

**Check which tools are connected.** Search the available tools before telling
the user something is unavailable. Some connectors take a while to start.

- **Confluence.** Use whichever is connected:
  - the official Atlassian connector: write pages as ADF;
  - a connector that accepts storage format (such as the community
    `mcp-atlassian` server): write pages as storage format;
  - neither: save the PRD locally as markdown, and tell the user it is not in
    Confluence yet and how to publish it.
  If both are connected, prefer the one the user names; otherwise use the
  official connector.
- **Research sources.** Note which of these are connected: Dovetail, Confluence
  search, Miro, Google Drive, meeting notes (such as Granola), Jira, and any
  usage-data or analytics tool. None is required. Missing ones change what you
  can search for the user, not what you ask them.

---

## Mode detection

Decide the mode before asking anything.

- **Orchestrated.** `pm-orchestrator` invoked this skill and passed an
  initiative name and a discovery handoff summary from `moodledisco` (or a
  `disco-[slug].md` file). The discovery synthesis is the source of record for
  the problem, evidence and solution direction. Use it to answer the gates for
  The Problem and The Hypothesis, then show those sections to the user for
  approval rather than re-asking. Still ask for scope (always), measures, and
  impacts. Skip the follow-on offers at the end: pm-orchestrator owns the next
  step.
- **Review.** The user asks for a review, or Step 0 finds a PRD the user does
  not own. Run the review in "Review mode" below. Do not edit the page.
- **Standalone.** Everything else. Run every step.

---

## Step 0: Check for an existing PRD

Do this before asking any questions about the content.

1. **Search.** In Confluence, search for pages whose title contains "PRD" and
   the initiative's keywords. Include personal spaces: live PRDs often sit in
   them. Then check the working folder for local PRD files. If the user gave a
   link, use that page and skip the search.
2. **Ask, never pick.** Show the candidates with their owner and last-edited
   date, and ask: "Is it one of these, or is this a new PRD?" Leave out pages
   marked superseded or deprecated. Never choose a match yourself.
3. **Read the live page.** If the user picks one, read the current page and its
   open comments, both footer and inline. Confluence is the master copy. Use a
   local file only if the page cannot be read, and say so.
4. **Find where to resume.** Test each existing section against its gate in
   `prd-template.md` and against the writing standard. Keep the sections that
   pass and skip their questions. Resume at the first section that fails.
   Treat open comments as input to that section. A section is skipped only
   because it passes its gate, never just because it has text.
5. **Check ownership.** If the user is not the page's owner or listed Product
   Manager, switch to Review mode and leave comments instead of editing,
   unless the user says the owner has asked them to edit.
6. **Edit safely.** Change one section at a time, following "Writing one
   section at a time" in `confluence-elements.md`. Warn the user before
   rewriting a section that has open inline comments, because rewriting can
   detach them.

A page label such as `prd-stage-solution` can hint at where the PM left off.
Treat it as a hint only: labels go stale, so the gate tests decide.

If there is no existing PRD, go to Step 1.

---

## Step 1: Set up the page

1. **Name the change** in plain words. If the scope is unclear, ask one
   question to pin it down. The page title is `PRD: [plain name of the change]`.
2. **Fill the Overview** from what the user tells you: product idea link,
   people, target release, related links. Status starts as DRAFT. Ask for the
   phase. Leave a field blank rather than guess.
3. **Choose where the page goes.** By default, create it in the user's
   personal Confluence space. Tell the user before creating it: "I'll create a
   draft page in your personal space and fill it in as we go." If they have no
   personal space, or would rather use a team space, ask which space and
   parent page.
4. **Create the page** once The Problem passes its gate (Step 3). Until then
   there is nothing worth publishing. From then on, publish each section when
   the user approves it.
5. **Keep a local backup.** After every publish, save the whole PRD as
   markdown in the working folder as `PRD_[Plain_Name].md`, with the page link
   at the top. Tell the user where it is once. Never treat it as the master.

---

## Step 2: Gather what already exists

Before asking about the problem, search the connected sources for the
initiative: Confluence (including personal spaces), Dovetail, Miro, Google
Drive, meeting notes, and the project's working folder (for example a decision
log or project status file). Search Jira only when the user names an epic or
ticket, or asks.

For each source, write one sentence in your working notes: "This covers
[topic] and is relevant to [section] because [direct connection]." If you
cannot write that sentence, the source is background, not evidence.

Use what you find to sharpen your questions and to offer evidence the PM may
have missed. Do not use it to write sections for them.

**Source rules:**

- Jira is the ground truth for ticket status. Cite ticket keys.
- Partner communications are the ground truth for partner requirements. Cite
  the date.
- Confluence and Drive documents are primary for decisions, research and
  strategy. Link them.
- Meeting notes show what was discussed and intended, not what was decided.
  A claim that rests only on meeting notes is marked as pending confirmation.
- Summaries written by AI are navigation, not evidence. Trace them back to
  their source before citing.
- When two sources disagree, show the user both. Never pick one silently.

---

## Step 3: Work through the sections

Go through the sections in `prd-template.md` in order, except the Summary,
which is written last (Step 4) but sits at the top of the page.

For each section:

1. **Ask.** Use the section's questions below. Ask two or three at most at a
   time, not the whole list.
2. **Get the PM's words first.** For The Problem and The Hypothesis, the PM
   must answer in their own words before you suggest any wording. For other
   sections, you may offer a draft from what they have told you, but say what
   it is based on.
3. **Test it.** Check the answer against the section's gate and the writing
   standard's two tests.
4. **Push back if it fails.** Say exactly what is missing and ask for it. Do
   not soften this, and do not fill the gap yourself. See "Pushing back" below.
5. **Tighten.** Rewrite to the writing standard and the section's word budget.
   Keep the PM's meaning and their concrete details.
6. **Show and approve.** Show the section as it will appear. Ask: "Publish
   this, or change something?"
7. **Publish.** Write the section to Confluence (Step 1 explains when the page
   is created), then update the local backup.

Do not move to Proposed Solution until The Problem, Strategy & Success Metrics
and The Hypothesis have each passed or been overridden.

### Pushing back

Gates are soft. When a section fails its gate:

1. Name what is missing in one sentence.
2. Suggest where it could come from (see "Finding evidence").
3. Ask again.

If the PM still wants to move on, let them, but put a gate override line under
the section's heading saying what is not yet met (see `confluence-elements.md`).
Readers then see it. Remove the line once the gap is filled.

Never let these through without either an answer or an override line:

- a problem with no named person, or described as a missing feature;
- a measure that cannot fail;
- a solution with no out-of-scope list;
- a risk with no mitigation;
- an open question with no owner.

### Section questions

**The Problem**
- Who has this problem? Name the role: teacher, student, site administrator,
  developer.
- What happens to them today? Describe something you could photograph.
- How many people meet it, and which population is that figure from?
- What is your evidence: research, usage data, support tickets, a quote?
- What don't we know yet? These go in the section's open questions table.

**Strategy & Success Metrics**
- Which business or increment goal does this serve?
- What will change for people that we can measure?
- What is the figure today? If nobody knows, who will find out, and by when?
- What figure do we expect, by when?
- What must not get worse?

**The Hypothesis**
- Complete this in your own words: "If we [change] for [people], we expect
  [result] because [reason]."

**Proposed Solution**
- In a few sentences, what is the approach?
- What will people get, and how will it work? One row per change.
- What are you deliberately not doing, and why? Always ask this. Never infer
  it.
- Is there a phasing question: what comes first, what comes later?
- What can't the solution answer yet? These go in its open questions table.
- Is there a prototype, Figma file or Miro board to link?

**Impacts & Dependencies**
- Which teams do we need help from?
- Who else is affected: users, partners, support, developers of plugins and
  themes?
- What could go wrong, and what will we do about it?

**Appendix**
- Is there research or a verbatim quote that backs a claim above? If not,
  leave the Appendix out.

### Finding evidence

When The Problem has no evidence, or the measures have no baseline, ask
whether the PM has looked in these places, and offer to search the ones that
are connected:

- **Dovetail.** Research studies, interview synthesis and insights. Use
  full-text search: some projects and insight hubs do not appear when
  browsing.
- **Confluence.** Discovery pages, research write-ups and earlier PRDs,
  including in personal spaces.
- **Miro.** Workshop boards, journey maps and research boards.
- **Usage data.** How many sites or users meet the problem, from Moodle's
  registered-site data, product analytics or support tickets. If a usage-data
  tool is connected, offer to run the query. If not, help the PM write the
  exact question to send to the data team. Every figure names its population
  and date: the same figure can differ widely depending on which sites are
  counted.

If the PM proceeds without evidence, The Problem gets a gate override line.

---

## Step 4: Write the Summary

Write the Summary last, because it depends on everything else. The PM approves
it like any other section. It follows its gate in `prd-template.md`: someone
outside the team can say who has the problem and what we are asking for, in
under a minute. The ask names the open question it settles.

---

## Step 5: Read it as an outsider

Before the PM moves the status to IN REVIEW, read the whole page as someone
outside the team and check:

- **The 60-second test:** can they say who has the problem and what we are
  asking for?
- **Contradictions:** does any section contradict another (scope in one place,
  out of scope in another; two different dates)?
- **Repetition:** is any fact or measure stated in two sections?
- **Budgets:** is any section over its word budget?
- **Words:** any banned word, pattern to cut, or unexplained acronym?
- **Leftovers:** any placeholder, empty table or guidance text?

Report what you find in a short list, and fix each item with the PM's
approval, one section at a time. Then ask whether to change the status.

---

## Review mode

Use this for a PRD the user does not own, or when they ask for a review.

1. Read the live page and its comments.
2. Test each section against its gate in `prd-template.md`, and the page
   against Step 5.
3. Report the results to the user, worst first: the gate each section fails
   and the most important writing problems, quoting the sentence.
4. Offer to leave the findings as comments on the page. Prefer inline comments
   on the exact sentence. Post nothing until the user approves the wording.
5. Never edit a page in review mode.

---

## Writing rules

- Follow `writing-standard.md` for every sentence. Australian English. No em
  dashes.
- Never invent ticket numbers, people, dates, figures or technical detail.
  Leave a blank or ask.
- **Certainty.** Track how certain each claim is in your working notes:
  confirmed (traceable to a named primary source), assumption, inference, or
  unresolved. On the page, mark a claim ⚠️ only if the scope or the ask rests
  on it. Link the rest to their source inline.
- Use names only where a role matters (owners, people to mention). Never write
  about anyone's performance or personal situation.

---

## Follow-on work

In standalone mode, once the PRD is approved, offer:

1. **Pre-mortem:** what is most likely to go wrong, before engineering starts.
2. **Backlog breakdown:** turn the In scope table into tickets (below).
3. **Stakeholder update:** a short brief that surfaces the decisions leadership
   needs to make.

### Backlog breakdown

Write each ticket as a user story when the work changes what someone
experiences, or as a task when it is purely technical. For each ticket:

- **Title:** short, imperative, specific.
- **Type:** User Story or Task.
- **Priority:** P0 (needed for launch), P1 (important, not launch-blocking),
  P2 (later).
- **Description:** two to four sentences on what it is and why it matters.
- **Acceptance criteria:** three to five observable, testable outcomes. Not
  "works correctly".
- **Dependencies** and **open questions**, each question with an owner.

Group tickets the way the In scope table is grouped. Save them locally as
`BACKLOG_[Plain_Name].md` and ask the user to review. Then offer to publish them
as a Confluence page under the PRD, or as Jira tickets in a project the user
confirms. Create Jira tickets one at a time, dependencies first, and report
each key. Publish nothing without the user's approval.
