#!/usr/bin/env node
/* proto-export — make the usability-test copy of a prototype.
 *
 * A reviewer file carries a State panel, annotations, alignment guides, a debug
 * strip and NOTES. A usability-test participant must see none of that: it tells
 * them what is being studied, and View Source is one keystroke away. This script
 * REMOVES it (not hides it) and writes a sibling file.
 *
 *   node proto-export.js public/prototypes/PROTOTYPE-forum.html
 *     -> public/prototypes/PROTOTYPE-forum-test.html
 *
 * What it cuts, in order:
 *   1. every region between the template's markers:
 *        CSS     /* dev:start *​/ ... /* dev:end *​/
 *        markup  <!-- dev:start --> ... <!-- dev:end -->
 *        JS      // dev:start ... // dev:end
 *   2. every data-annot / data-annot-side attribute
 *   3. every comment: HTML comments (NOTES, SHELL-NOTES, the header), CSS block
 *      comments, and JS block and whole-line comments. Code comments say what the
 *      file is and how it was built; a participant needs neither.
 *   4. the working <title>, replaced by <meta name="clean-title"> (required;
 *      the script refuses to write a file whose title would still say
 *      "prototype")
 *
 * Then run `node proto-lint.js <the -test.html>`; the lint recognises the
 * suffix and checks that nothing dev-shaped survived. Dependency-free.
 */
"use strict";
const fs = require("fs");
const path = require("path");

function exportClean(src) {
  let html = fs.readFileSync(src, "utf8");
  const before = html.length;
  const cuts = [];

  // 1. marked regions. Anchored to the marker forms the template uses so prose
  //    that merely mentions "dev:start" (inside a comment, say) can't trip it.
  const regions = [
    { kind: "css", re: /^[ \t]*\/\* dev:start \*\/[ \t]*\n[\s\S]*?^[ \t]*\/\* dev:end \*\/[ \t]*\n/gm },
    { kind: "markup", re: /^[ \t]*<!-- dev:start -->[ \t]*\n[\s\S]*?^[ \t]*<!-- dev:end -->[ \t]*\n/gm },
    { kind: "js", re: /^[ \t]*\/\/ dev:start[ \t]*\n[\s\S]*?^[ \t]*\/\/ dev:end[ \t]*\n/gm },
  ];
  for (const r of regions) {
    let n = 0;
    html = html.replace(r.re, () => { n++; return ""; });
    cuts.push(`${n} ${r.kind} region${n === 1 ? "" : "s"}`);
  }

  // 2. annotation attributes
  let annots = 0;
  html = html.replace(/\s+data-annot(?:-side)?="[^"]*"/g, () => { annots++; return ""; });
  cuts.push(`${annots} data-annot attribute${annots === 1 ? "" : "s"}`);

  // 4 (before 3, because the meta tag is what we read). Clean title.
  const meta = html.match(/<meta\s+name="clean-title"\s+content="([^"]*)"\s*\/?>/i);
  const clean = meta && meta[1].trim();
  if (!clean) throw new Error('no <meta name="clean-title" content="..."> in the file; add one that reads like a real Moodle page title');
  if (/prototype|throwaway|template|proto\b/i.test(clean)) throw new Error(`clean-title "${clean}" still says what this is; give it a title a participant would expect`);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${clean.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c])}</title>`);
  html = html.replace(/^[ \t]*<meta\s+name="clean-title"[^>]*>[ \t]*\n?/im, "");

  // 3. every comment
  let comments = 0;
  html = html.replace(/<!--[\s\S]*?-->[ \t]*\n?/g, () => { comments++; return ""; });
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (m, attrs, css) => {
    css = css.replace(/\/\*[\s\S]*?\*\/[ \t]*\n?/g, () => { comments++; return ""; });
    return `<style${attrs}>${css}</style>`;
  });
  html = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, js) => {
    js = js.replace(/\/\*[\s\S]*?\*\/[ \t]*\n?/g, () => { comments++; return ""; });
    js = js.replace(/^[ \t]*\/\/.*\n?/gm, () => { comments++; return ""; }); // whole-line only: "https://" in strings stays
    // refuse to write a file whose script no longer parses (a "/*" inside a string, say)
    try { new Function(js); } catch (e) { throw new Error(`a <script> block no longer parses after comment stripping (${e.message}); check for /* or // inside string literals`); }
    return `<script${attrs}>${js}</script>`;
  });
  cuts.push(`${comments} comment${comments === 1 ? "" : "s"} (HTML, CSS, JS)`);
  const strays = (html.match(/dev:(start|end)/g) || []).length;

  // 5. measurement-guide colour tokens are dev-only; drop them from :root
  let gtok = 0;
  html = html.replace(/^[ \t]*(?:--g-[\w-]+:[^;]*;[ \t]*)+\n/gm, () => { gtok++; return ""; });
  if (gtok) cuts.push(`${gtok} guide-colour token line${gtok === 1 ? "" : "s"}`);

  // 6. the content slot's id says "prototype"; a participant's file shouldn't
  let ids = 0;
  html = html.replace(/\bprototype-content\b/g, () => { ids++; return "page-content"; });
  if (ids) cuts.push(`#prototype-content renamed to #page-content (${ids})`);

  // collapse the blank lines the cuts leave behind
  html = html.replace(/\n{3,}/g, "\n\n");

  const out = src.replace(/\.html?$/i, "") + "-test.html";
  fs.writeFileSync(out, html);
  return { out, before, after: html.length, cuts, strays, title: clean };
}

(function main() {
  const src = process.argv[2];
  if (!src) { console.error("usage: proto-export.js <PROTOTYPE-thing.html>"); process.exitCode = 2; return; }
  if (/-test\.html$/i.test(src)) { console.error("that is already a -test file; export from the reviewer file"); process.exitCode = 2; return; }
  try {
    const r = exportClean(src);
    console.log(`${path.basename(r.out)}  ${Math.round(r.before / 1024)} KB -> ${Math.round(r.after / 1024)} KB`);
    console.log(`  cut: ${r.cuts.join(", ")}`);
    console.log(`  title: "${r.title}"`);
    if (r.strays) console.log(`  WARNING: ${r.strays} stray dev:start/dev:end marker(s) left behind; a region is unbalanced. Lint will fail this file.`);
    console.log(`  next: node ${path.join(path.dirname(process.argv[1]), "proto-lint.js")} ${r.out}`);
  } catch (e) {
    console.error(`export refused: ${e.message}`);
    process.exitCode = 1;
  }
})();
