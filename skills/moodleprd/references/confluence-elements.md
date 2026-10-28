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
- Pages use the narrow (fixed) page width, with no single-column layout
  wrappers. See "Page width and layouts" below.
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

## Draft marker

When the user moves on from a section that has not passed its gate, publish
it with this line directly under its panel, before its other content. A
reader should understand it without knowing about gates: a yellow DRAFT
lozenge, then what the section still needs, in plain words. Never write
"gate", "not yet met" or other skill terms on the page.

**HTML**

```html
<p><span data-type="status" data-color="yellow">DRAFT</span> Still to add: dates for the baseline study and the Phase 1 study.</p>
```

**Storage**

```xml
<p><ac:structured-macro ac:name="status" ac:schema-version="1"><ac:parameter ac:name="title">DRAFT</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro> Still to add: dates for the baseline study and the Phase 1 study.</p>
```

Remove the line once the section passes its gate.

## Quote

Appendix only. Verbatim, with a link to the source. The same in both formats:

```html
<blockquote><p><em>"I can't find my course."</em> Educational technology consultant, <a href="https://example.com">7 Apr 2026</a></p></blockquote>
```

---

## Page width and layouts

Every new PRD page uses the narrow (fixed-width) page layout, and its content
sits directly in the page body.

- **Width.** Site admins can set wide or full width as the default, and that
  default overrides the width asked for at creation. So set the width, then
  check it:
  - Official connector: create with `createConfluenceContent` and
    `contentWidth: "narrow"`, then send a width-only update
    (`updateConfluenceContent` with `contentWidth: "narrow"` and the
    `snapshotToken` from the create). Tested on 28 Oct 2026: a page created
    as narrow came back wide, and the width-only update fixed it.
  - Storage-format connector: create with `page_width: "default"`.
  - Then confirm the page reports narrow (or `fixed-width` / `default`). If it
    does not, tell the user and ask them to switch it in the page's width
    setting.
- **No single-column layout wrappers.** Never wrap content in a one-column
  layout (`<section data-type="layout-section">` with one column in HTML,
  `<ac:layout>` with `ac:type="single"` or `"fixed-width"` in storage). It adds
  nothing on a narrow page and makes the page harder to edit. Use a layout
  only for a genuine multi-column row, such as two images side by side.
- **Existing pages.** Do not add new wrappers when editing. Leave existing
  ones in place unless the user asks to remove them.

If page creation fails with a 403 ("The app is not installed on this
instance"), try the connector's other create tool: the older
`createConfluencePage` failed this way on 28 Oct 2026 while
`createConfluenceContent` worked. If nothing can create the page, ask the user
to create a blank page in their personal space, set it to narrow width, and
paste its link. Then fill that page section by section.

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

### Preferred: edit elements by ID (official connector)

The official connector's `getConfluenceContent` and `updateConfluenceContent`
tools can change single elements without sending the page back. Use this
whenever they are available. Tested on 28 Oct 2026 on a copy of a real PRD
with layouts, images and an inline comment: only the edited section changed,
both images and the comment survived, and a write with an old token was
refused.

1. Read the page with `getConfluenceContent` (`detail: "full"`,
   `content_format: "html"`, `draft: true`). Every element carries a
   `data-local-id`, and the response gives a `snapshotToken`.
2. Find the section and list the IDs of its elements: the heading panel, then
   every element up to the divider before the next section's heading.
3. Send one `updateConfluenceContent` call with `edits` and the
   `snapshotToken`:
   - `replaceNode` (`localId`, `value`: new HTML) for the heading panel and
     the first element;
   - `removeNodes` (`arguments: {"localIds": [...]}`) for the rest of the
     old elements;
   - `insertNodeAfter` (`localId`, `value`) to add elements, such as a new
     table after a paragraph.
   Never touch an ID outside the section.
4. Keep the `snapshot.token` the update returns for the next edit. If an
   update comes back `snapshot_stale`, someone else has edited the page: read
   it again, find the IDs again, and redo the change. Never resend the same
   edits.

`dryRun: true` returns the whole resulting page, which is useful for checking
a first edit but expensive on long pages.

### Fallback: rewrite the whole body

Use this when element edits are not available (a storage-format connector,
or an older official tool without them).

1. Read the live page right before every write, in the format you will write
   back (HTML for the official connector, storage for the community one).
2. Find the section. On a page built from this template, match the heading
   text exactly. On an older page, match by meaning (for example
   "1. The Problem" is The Problem) and confirm the mapping with the user once.
3. Replace only the markup between that section's heading and the divider
   before the next section's heading. Copy everything else exactly as you
   read it, including `data-local-id` attributes, layouts, images, column
   widths and inline comment markers (`<span class="annotation" ...>` in
   HTML, `ac:inline-comment-marker` in storage).
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
