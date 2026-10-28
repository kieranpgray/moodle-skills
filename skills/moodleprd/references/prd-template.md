# PRD template

The skill builds every PRD from this file. Use the headings exactly as written
here, in this order. Each H2 sits in a custom panel with the background colour
shown, and the emoji is part of the heading text. A divider separates the
sections.

Each section lists:
- **Budget:** the most words the section should take.
- **Gate:** what must be true before the skill moves on. If the section fails,
  the skill asks for what is missing. The user can move on anyway, and the
  section is then published with a DRAFT marker saying, in plain words, what
  it still needs.
- **Guidance:** what goes in. Guidance is for the writer and never appears on
  the page.

Open questions stay in the section they belong to, in that section's own
table, and get resolved there. They are never collected at the bottom of the
page.

---

# PRD: [Plain name of the change]

## 📋 Overview

Not in a panel. A two-column table, the label column shaded `#F4F5F7`:

| Field | Value |
|---|---|
| JPD Link | Link to the product idea |
| Status | Status lozenge: DRAFT (grey), IN REVIEW (yellow), APPROVED (green) |
| Project Phase | Status lozenge: DEFINITION (grey), DISCOVERY (purple), DESIGN (yellow), BUILD (blue) |
| Product Manager | @ mention |
| UX Designer | @ mention |
| Technical Lead | @ mention |
| Other stakeholders | @ mentions |
| Target release | The increment or release version |
| Related links | Prototype, Figma, Miro, epic |

---

## 🧭 Summary

Panel `#DEEBFF`.

- **Budget:** 80 words.
- **Gate:** someone outside the team can say who has the problem and what we
  are asking for, in under a minute.
- **Guidance:** one or two bold sentences on the goal, what changes and for
  whom. Up to three bullets on why it matters. End with the ask: the decision
  or commitment needed, from whom, by when, and which open question it
  settles. It is the document's TL;DR.

---

## 🔎 The Problem

Panel `#E6FCFF`.

- **Budget:** 150 words, plus at most one image.
- **Gate:**
  - names the person who has the problem;
  - says what they experience today, in a way you could photograph;
  - has at least one piece of evidence (research, usage data, support tickets,
    a quote), or says plainly that there is none yet.
- **Guidance:** use H3 sub-headings for short claims ("It repeats My
  Courses"). Lead with how many people meet the problem, with the population
  named. Link to evidence rather than append it.

### ❓ Open questions

- **Budget:** table only.
- **Gate:** every question has an owner and a date to answer it by.
- **Guidance:** questions this section cannot answer yet. Resolve them here as
  the section firms up, and delete the table once it is empty.

| Question | Owner | Answer by |
|---|---|---|

---

## 🎯 Strategy & Success Metrics

Panel `#E3FCEF`.

- **Budget:** 150 words.
- **Gate:**
  - names the business or increment goal it serves;
  - every measure can fail: it has a baseline, a target and a date, or names
    who will set the baseline and by when;
  - has at least one guardrail (what must not get worse).

| Measure | Baseline | Target and date | How we measure |
|---|---|---|---|

---

## 🧪 The Hypothesis

Panel `#FFFAE6`.

- **Budget:** 60 words.
- **Gate:** one testable bet in the form "If we [change] for [people], we
  expect [result] because [reason]". It refers to the measures in Strategy &
  Success Metrics rather than repeating them.

---

## 🏗️ Proposed Solution

Panel `#EAE6FF`.

- **Budget:** 250 words of prose above the sub-headings, plus the tables.
- **Gate:** The Problem, Strategy & Success Metrics and The Hypothesis have
  passed or been overridden. Each In scope row traces back to the problem.
- **Guidance:** three H3 sub-headings, each with a table.

### ✅ In scope

- **Budget:** table only.
- **Gate:** the user has named what is in scope. The skill always asks; it
  never infers this.
- **Guidance:** one row per change, grouped by phase if there is more than
  one. Link to the prototype rather than describing screens step by step.

| What people get | How it works |
|---|---|

### 🚫 Out of scope

- **Budget:** table only.
- **Gate:** the user has named what is out of scope, with a reason for each.
  The skill always asks; it never infers this.

| Not doing | Why |
|---|---|

### ❓ Open questions

- **Budget:** table only.
- **Gate:** every question has an owner and a date to answer it by.
- **Guidance:** as for The Problem.

| Question | Owner | Answer by |
|---|---|---|

---

## 🤝 Impacts & Dependencies

Panel `#FFEBE6`.

- **Budget:** tables only.
- **Gate:** every risk has a mitigation.
- **Guidance:** in this order:
  - teams we need help from (dependencies);
  - who is affected (users, partners, support, developers of plugins and
    themes);
  - risks and mitigations.

| Risk | Mitigation |
|---|---|

---

## 📚 Appendix

Panel `#F4F5F7`.

- **Budget:** a research table and quotes only.
- **Gate:** every item backs a claim made above.
- **Guidance:** research links and verbatim quotes only. Not a dumping ground:
  if it does not support a claim in the body, cut it. If there is nothing,
  delete the section.
