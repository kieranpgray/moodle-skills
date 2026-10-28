# Confluence elements

How to write each part of a PRD page. Every element is given in two formats:

- **ADF** (Atlassian Document Format, JSON): for the official Atlassian
  connector.
- **Storage** (Confluence's XML format): for connectors that accept storage
  format, such as the community `mcp-atlassian` server.

Both produce the same page. The section order, headings, emoji and panel
colours are in `prd-template.md`; this file only says how to write them.

Rules for both formats:

- Emoji go in the heading text as plain characters (🧭, not `:compass:`).
  Atlassian's own emoji show as text like `:direct_hit:` in some views.
- Never send guidance, budgets or gates. They are instructions for the writer.
- Never send placeholders on a real PRD. Placeholders belong to the blank
  template only.
- Tables stay at the page's reading width (760px, layout `default`).
- Create pages with the default (narrow) page width.

---

## Page wrapper

**ADF.** The page body is one document. Every element below goes in `content`,
in order.

```json
{"type": "doc", "version": 1, "content": []}
```

**Storage.** Elements are concatenated with no wrapper and no layout sections.

---

## Section heading in a panel

Every H2 except Overview. Colour and emoji per section are in `prd-template.md`.
The panel holds the heading only; the section's content follows the panel.

**ADF**

```json
{"type": "panel", "attrs": {"panelType": "custom", "panelColor": "#E6FCFF"},
 "content": [{"type": "heading", "attrs": {"level": 2},
              "content": [{"type": "text", "text": "🔎 The Problem"}]}]}
```

**Storage**

```xml
<ac:structured-macro ac:name="panel" ac:schema-version="1"><ac:parameter ac:name="bgColor">#E6FCFF</ac:parameter><ac:rich-text-body><h2>🔎 The Problem</h2></ac:rich-text-body></ac:structured-macro>
```

## Plain heading

The Overview H2, and every H3 sub-heading.

**ADF**

```json
{"type": "heading", "attrs": {"level": 3},
 "content": [{"type": "text", "text": "❓ Open questions"}]}
```

**Storage**

```xml
<h3>❓ Open questions</h3>
```

## Divider

Between sections: after the Overview table and after each section's content,
never inside a section.

**ADF:** `{"type": "rule"}`

**Storage:** `<hr />`

## Paragraph, bold, link and list

**ADF**

```json
{"type": "paragraph", "content": [
  {"type": "text", "text": "It repeats My Courses.", "marks": [{"type": "strong"}]},
  {"type": "text", "text": " See the "},
  {"type": "text", "text": "research", "marks": [{"type": "link", "attrs": {"href": "https://example.com"}}]},
  {"type": "text", "text": "."}]}
```

```json
{"type": "bulletList", "content": [
  {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "First point"}]}]}]}
```

**Storage**

```xml
<p><strong>It repeats My Courses.</strong> See the <a href="https://example.com">research</a>.</p>
<ul><li><p>First point</p></li></ul>
```

## Table

Header row in bold, then one row per item.

**ADF**

```json
{"type": "table", "attrs": {"layout": "default", "width": 760},
 "content": [
  {"type": "tableRow", "content": [
    {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Risk", "marks": [{"type": "strong"}]}]}]},
    {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Mitigation", "marks": [{"type": "strong"}]}]}]}]},
  {"type": "tableRow", "content": [
    {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "A migration bug empties a dashboard"}]}]},
    {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test against real dashboards from large sites"}]}]}]}]}
```

**Storage**

```xml
<table data-table-width="760" data-layout="default"><tbody><tr><th><p><strong>Risk</strong></p></th><th><p><strong>Mitigation</strong></p></th></tr><tr><td><p>A migration bug empties a dashboard</p></td><td><p>Test against real dashboards from large sites</p></td></tr></tbody></table>
```

## Overview table

Two columns. The label cells are bold and shaded `#F4F5F7`. Rows and their
values are in `prd-template.md`.

**ADF** (one row; repeat for each field)

```json
{"type": "tableRow", "content": [
  {"type": "tableCell", "attrs": {"background": "#f4f5f7", "colwidth": [188]},
   "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Target release", "marks": [{"type": "strong"}]}]}]},
  {"type": "tableCell", "attrs": {"colwidth": [572]},
   "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Moodle LMS 6.0"}]}]}]}
```

**Storage**

```xml
<tr><td data-highlight-colour="#f4f5f7"><p><strong>Target release</strong></p></td><td><p>Moodle LMS 6.0</p></td></tr>
```

## Status lozenge

Show only the current status and phase, not every option. Colours: DRAFT grey,
IN REVIEW yellow, APPROVED green; DEFINITION grey, DISCOVERY purple, DESIGN
yellow, BUILD blue.

**ADF.** Colours are `neutral`, `purple`, `blue`, `red`, `yellow`, `green`.

```json
{"type": "status", "attrs": {"text": "DRAFT", "color": "neutral", "style": "mixedCase"}}
```

**Storage.** Colours are `Grey`, `Purple`, `Blue`, `Red`, `Yellow`, `Green`.

```xml
<ac:structured-macro ac:name="status" ac:schema-version="1"><ac:parameter ac:name="title">DRAFT</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro>
```

## Person

Use a mention when you have the person's Atlassian account ID (from a user
search). Otherwise write their name as plain text.

**ADF:** `{"type": "mention", "attrs": {"id": "<account id>"}}`

**Storage:** `<ac:link><ri:user ri:account-id="<account id>" /></ac:link>`

## Gate override line

When the user overrides a gate, put this line directly under the section's
panel, before any other content in the section.

**ADF**

```json
{"type": "paragraph", "content": [
  {"type": "text", "text": "⚠️ Not yet met: ", "marks": [{"type": "strong"}]},
  {"type": "text", "text": "no evidence that teachers meet this problem."}]}
```

**Storage**

```xml
<p><strong>⚠️ Not yet met: </strong>no evidence that teachers meet this problem.</p>
```

## Quote

Appendix only. Verbatim, with a link to the source.

**ADF**

```json
{"type": "blockquote", "content": [{"type": "paragraph", "content": [
  {"type": "text", "text": "\"I can't find my course.\"", "marks": [{"type": "em"}]},
  {"type": "text", "text": " Educational technology consultant, "},
  {"type": "text", "text": "7 Apr 2026", "marks": [{"type": "link", "attrs": {"href": "https://example.com"}}]}]}]}
```

**Storage**

```xml
<blockquote><p><em>"I can't find my course."</em> Educational technology consultant, <a href="https://example.com">7 Apr 2026</a></p></blockquote>
```

---

## Writing one section at a time

A section is everything from its panel (or plain heading) up to the next
divider.

1. Read the live page right before every write, in the format you will write
   back, and note its version number.
2. Find the section by its heading text, exactly as in `prd-template.md`.
3. Replace only the nodes (ADF) or markup (storage) between that heading's
   panel and the next divider. Leave everything else byte for byte as it was,
   including IDs, comments markers and other people's edits.
4. Write the whole body back as the next version. If the write fails because
   the version changed, someone else edited the page: read it again and redo
   the change on the new version. Never write an old copy over a newer one.

Do not use a tool that updates "the section under a heading" (such as
`confluence_update_page_section`). Section headings sit inside panels, so
those tools write the new text into the panel and leave the old section
content where it was. Tested on 27 Oct 2026.

Inline comments are anchored to the text they sit on. Rewriting that text can
detach them, so warn the user before replacing a section that has open inline
comments.
