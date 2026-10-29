# Confluence elements

How to write each part of a PRD page. Every element is given in two formats:

- **HTML** for the official Atlassian connector (`createConfluencePage`,
  `updateConfluencePage` with `contentFormat: "html"`). Before the first write
  in a session, call its `getContentFormatGuide` tool for the page tool you are
  using, and follow it. HTML keeps inline comments and existing IDs when a page
  is read and written back. Never send storage XML (`<ac:structured-macro>`)
  to this connector: it shows as raw text.
- **Storage** (Confluence's XML format) for connectors that accept it, such as
  the community `mcp-atlassian` server (`content_format: "storage"`).

Both produce the same page. The section order, headings, emoji and panel
colours are in `prd-template.md`; this file only says how to write them.

Rules for both formats:

- Emoji go in the heading text as plain characters (🧭, not `:compass:`).
  Atlassian's own emoji (IDs starting `atlassian-`) show as text like
  `:rocket:` in some views.
- Never send guidance, budgets or gates. They are instructions for the writer.
- Never send placeholders on a real PRD. Placeholders belong to the blank
  template only.
- Tables stay at the page's reading width (760px). Never put a table inside a
  panel.
- Create pages with the default (narrow) page width.
- Mention a person only with their real Atlassian account ID. Never invent
  one: write their name as plain text instead. If a user search shows the
  account as inactive, write the name as plain text and tell the user: the
  person may have left, or have a second account.

---

## Section heading in a panel

Every H2 except Overview. The panel holds the heading only; the section's
content follows the panel.

**HTML**

```html
<div data-type="panel-custom" data-color="#E6FCFF"><h2>🔎 The Problem</h2></div>
```

**Storage**

```xml
<ac:structured-macro ac:name="panel" ac:schema-version="1"><ac:parameter ac:name="bgColor">#E6FCFF</ac:parameter><ac:rich-text-body><h2>🔎 The Problem</h2></ac:rich-text-body></ac:structured-macro>
```

## Plain heading

The Overview H2, and every H3 sub-heading. The same in both formats:

```html
<h3>❓ Open questions</h3>
```

## Divider

Between sections: after the Overview, and after each section's content. Never
inside a section.

**HTML:** `<hr>` · **Storage:** `<hr />`

## Paragraph, bold, link and list

The same in both formats:

```html
<p><strong>It repeats My Courses.</strong> See the <a href="https://example.com">research</a>.</p>
<ul><li><p>First point</p></li></ul>
```

## Table

Header row in bold, then one row per item.

**HTML**

```html
<table data-width="760"><thead><tr><th><p><strong>Risk</strong></p></th><th><p><strong>Mitigation</strong></p></th></tr></thead><tbody><tr><td><p>A migration bug empties a dashboard</p></td><td><p>Test against real dashboards from large sites</p></td></tr></tbody></table>
```

**Storage**

```xml
<table data-table-width="760" data-layout="default"><tbody><tr><th><p><strong>Risk</strong></p></th><th><p><strong>Mitigation</strong></p></th></tr><tr><td><p>A migration bug empties a dashboard</p></td><td><p>Test against real dashboards from large sites</p></td></tr></tbody></table>
```

## Overview table

Two columns, no header row. The label cells are bold and shaded `#F4F5F7`.
Rows and values are in `prd-template.md`. One row:

**HTML**

```html
<tr><td data-background="#f4f5f7" data-colwidth="188"><p><strong>Target release</strong></p></td><td data-colwidth="572"><p>Moodle LMS 6.0</p></td></tr>
```

**Storage**

```xml
<tr><td data-highlight-colour="#f4f5f7"><p><strong>Target release</strong></p></td><td><p>Moodle LMS 6.0</p></td></tr>
```

## Status lozenge

Show only the current status and phase, not every option. DRAFT grey, IN
REVIEW yellow, APPROVED green; DEFINITION grey, DISCOVERY purple, DESIGN
yellow, BUILD blue.

**HTML.** Colours are `neutral`, `purple`, `blue`, `red`, `yellow`, `green`.

```html
<span data-type="status" data-color="neutral">DRAFT</span>
```

**Storage.** Colours are `Grey`, `Purple`, `Blue`, `Red`, `Yellow`, `Green`.

```xml
<ac:structured-macro ac:name="status" ac:schema-version="1"><ac:parameter ac:name="title">DRAFT</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro>
```

## Person

**HTML:** `<span data-type="mention" data-user-id="<account id>">@Name</span>`

**Storage:** `<ac:link><ri:user ri:account-id="<account id>" /></ac:link>`

## Gate override line

When the user overrides a gate, put this directly under the section's panel,
before the section's other content. The same in both formats:

```html
<p><strong>⚠️ Not yet met: </strong>no evidence that teachers meet this problem.</p>
```

## Quote

Appendix only. Verbatim, with a link to the source. The same in both formats:

```html
<blockquote><p><em>"I can't find my course."</em> Educational technology consultant, <a href="https://example.com">7 Apr 2026</a></p></blockquote>
```

---

## Writing one section at a time

A section runs from its panel (or plain heading) to the divider just before
the next section's heading. Older pages sometimes have dividers inside a
section, so find the next section's heading first, not the next divider.

Pages edited in Confluence's editor often wrap everything in layout sections
(`<ac:layout-section>` in storage, `<section data-type="layout-...">` in
HTML), and one PRD section can span several of them. Keep every layout
open and close tag balanced when you cut or move content, and move images and
other media rather than dropping them: count them before and after a write.

1. Read the live page right before every write, in the format you will write
   back (HTML for the official connector, storage for the community one).
2. Find the section. On a page built from this template, match the heading
   text exactly. On an older page, match by meaning (for example
   "1. The Problem" is The Problem) and confirm the mapping with the user once.
3. Replace only the markup between that section's heading and the next
   divider. Copy everything else exactly as you read it, including
   `data-local-id` attributes, layouts, images, column widths and inline
   comment markers (`<span class="annotation" ...>` in HTML).
4. Write the whole body back. If the page changed since you read it, read it
   again and redo the change on the new version. Never write an old copy over
   a newer one.

Inline comments are anchored to the text they sit on. Rewriting that text
detaches the comment, so warn the user before replacing text that has one.
Comments elsewhere on the page stay anchored: tested on 27 Oct 2026 with the
official connector, where an inline comment stayed open and anchored after
another section was rewritten.

Do not use a tool that updates "the section under a heading" (such as the
community server's `confluence_update_page_section`). Section headings sit
inside panels, so those tools write into the panel and leave the old section
content in place. Tested on 27 Oct 2026.
