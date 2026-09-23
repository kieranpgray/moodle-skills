#!/usr/bin/env node
/* proto-lint — deterministic quality gate for moodle-prototype HTML files.
 *
 * Dependency-free. Checks the defects that actually recurred across the
 * existing prototypes (see SKILL.md > "What a prototype file looks like").
 * It measures presence, not truth: a vacuous Answer line passes. Pair it
 * with the design pass and a human read for the rest.
 *
 * Usage:
 *   node proto-lint.js <file.html>            lint one file
 *   node proto-lint.js --all <dir>            lint every PROTOTYPE-*.html and TEMPLATE-*.html in dir
 *   a file named *-test.html is a usability-test export (see proto-export.js) and gets the
 *   clean-mode checks instead: no dev scaffolding, no annotations, no comments, neutral title
 *   add --json for machine output; --template <path> to override the reference template;
 *   --mds <dir> to point at lib/bundles/design-system/scss/tokens/ (auto-found in a checkout)
 *
 * Exit 1 if any FAIL. Suppress a check for a region with a reason:
 *   /* proto-lint-disable hex: dev scaffolding *​/  ...  /* proto-lint-enable *​/
 */
"use strict";
const fs = require("fs");
const path = require("path");

const CDN_ALLOW = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
// Dialect markers are COLOUR/SPACING/RADIUS tokens only. Layout tokens (--nav-h,
// --shell-*, --ci-*, --cb-*, --btn) predate the colour split and exist in both
// dialects, so they say nothing about which one a file speaks.
const TEMPLATE_PREFIXES = ["--sp-", "--text-", "--bg-", "--border-", "--r-", "--primary", "--surface", "--page-bg"];
const PLACEHOLDER = /fill in|todo|tbd|^\s*<[^>]*>\s*$|^\s*\([^)]*\)\s*$/i;
const CHECK_ALIASES = { hex: "hex-outside-root", mds: "mds-values" };

// Moodle Design System (MDS). Live source is lib/bundles/design-system/scss/tokens/ in a
// Moodle checkout (found by walking up from the linted file, or --mds <dir>). The snapshot
// below is the fallback for a bare HTML file outside any checkout; it was taken from
// _primitives.scss + _colors.scss + _spacing.scss + _borders.scss + _typography.scss at
// 2026-06-26 (last commit touching those files at the time). Live files always win.
const MDS_SNAPSHOT = {
  colours: "#000000 #001a1e #00343c #004d5a #006778 #008196 #031626 #06281e #062b4c #094173 #0b180a #0c5699 #0d503c #0f6cbf #130c19 #13795b #140330 #153114 #1aa179 #1d2125 #20491e #20c997 #271832 #280a06 #290661 #2a6228 #2c0517 #302310 #331705 #339aab #343a40 #357a32 #3a254a #3d0a91 #3f89cc #495057 #4dd4ac #4e3163 #51140d #520dc2 #580a2e #5d955b #60451f #613d7c #6610f2 #662f0a #66b3c0 #6a737b #6fa7d9 #791d13 #79dfc1 #816496 #831046 #8540f5 #86af84 #8f959e #90682f #99460e #99cdd5 #9fc4e5 #a08bb0 #a2271a #a370f7 #a6e9d5 #aecaad #af155d #c08a3e #c0b1cb #c29ffa #ca3120 #cc5e13 #cce6ea #ced4da #cfe2f2 #d2f4ea #d55a4d #d7e4d6 #db1a74 #dee2e6 #df8379 #dfd8e5 #e0cffc #e24890 #e5f2f4 #e7f0f9 #e976ac #e9ecef #eaada6 #ebf2ea #f0ad4e #f1a3c7 #f3bd71 #f4d6d2 #f6ce95 #f8d1e3 #f8f9fa #f9deb8 #faeae9 #fcefdc #fdf7ed #ff7518 #ff9146 #ffac74 #ffc8a3 #ffe3d1 #ffffff".split(" "),
  spacingPx: [0, 1, 4, 8, 12, 16, 20, 32, 48],        // none offset xxs xs sm md lg xl xxl
  radiusPx: [0, 4, 6, 8, 12, 16, 32, 800],            // none xs sm md lg xl xxl pill
  fontSizePx: [14, 16, 20, 24, 28, 32, 40],           // paragraph-small/default/lead, headings 4..1
  fontFamily: "Noto Sans",
};
function loadMds(fileDir, override) {
  const rel = path.join("lib", "bundles", "design-system", "scss", "tokens");
  let dir = override || null;
  if (!dir) { let d = path.resolve(fileDir); for (let i = 0; i < 8; i++) { const c = path.join(d, rel); if (fs.existsSync(path.join(c, "_index.scss"))) { dir = c; break; } const up = path.dirname(d); if (up === d) break; d = up; } }
  if (!dir) return Object.assign({ source: "snapshot" }, MDS_SNAPSHOT);
  // Read every .scss in the tokens dir: the split into _colors/_spacing/... arrived mid-2026,
  // older checkouts keep everything in _index.scss / _light.scss.
  let all = ""; try { for (const f of fs.readdirSync(dir)) if (/\.scss$/.test(f)) all += fs.readFileSync(path.join(dir, f), "utf8") + "\n"; } catch { /* fall through to snapshot */ }
  // $name: value !default; — older layouts alias through $mds-scale-*/$mds-typography-*, so resolve a few hops.
  const vars = new Map();
  for (const m of all.matchAll(/^\$([\w-]+):\s*([^;]*?)\s*!default;/gm)) vars.set(m[1], m[2].trim());
  const resolve = (v) => { for (let i = 0; i < 4 && /\$[\w-]+/.test(v); i++) v = v.replace(/\$([\w-]+)/g, (_, n) => vars.has(n) ? vars.get(n) : _); return v; };
  const val = (re) => [...vars.keys()].filter(k => re.test(k)).map(k => resolve(vars.get(k)));
  const toPx = (v) => { const m = v.match(/^([\d.]+)(rem|px)$/); return m ? Math.round(parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1) * 100) / 100 : null; };
  const pxOf = (re) => [...new Set(val(re).map(toPx).filter(v => v !== null))];
  const colours = [...new Set([...vars.values()].map(resolve).join(" ").match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [])].map(s => s.toLowerCase());
  const fam = vars.has("mds-font-family-base") ? resolve(vars.get("mds-font-family-base")).split(",")[0].trim() : MDS_SNAPSHOT.fontFamily;
  const spacing = pxOf(/^mds-spacing-/), radius = pxOf(/^mds-border-radius-/), fsz = pxOf(/^mds-font-size-(paragraph|headings)-/).map(Math.round);
  return {
    source: dir,
    colours: colours.length ? colours : MDS_SNAPSHOT.colours,
    spacingPx: spacing.length ? spacing : MDS_SNAPSHOT.spacingPx,
    radiusPx: radius.length ? radius : MDS_SNAPSHOT.radiusPx,
    fontSizePx: fsz.length ? [...new Set(fsz)] : MDS_SNAPSHOT.fontSizePx,
    fontFamily: fam.replace(/^["']|["']$/g, ""),
  };
}

// ---------- helpers ----------
function lineOf(src, idx) { let n = 1; for (let i = 0; i < idx; i++) if (src.charCodeAt(i) === 10) n++; return n; }

function stripCssComments(css) {
  // replace comments with same-length whitespace so offsets/lines survive
  return css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));
}

/** Parse CSS into flat rules {selector, decls:[{prop,value}], start(offset into css), media}. One level of @media/@supports nesting. */
function parseCss(css) {
  const out = [];
  const clean = stripCssComments(css);
  let i = 0;
  const N = clean.length;
  function readBlock(from) { // from = index of '{'; returns index of matching '}'
    let depth = 0;
    for (let k = from; k < N; k++) { const c = clean[k]; if (c === "{") depth++; else if (c === "}") { depth--; if (depth === 0) return k; } }
    return N - 1;
  }
  function parseDecls(body) {
    const decls = [];
    for (const part of body.split(";")) {
      const j = part.indexOf(":");
      if (j < 0) continue;
      const prop = part.slice(0, j).trim(); const value = part.slice(j + 1).trim();
      if (prop) decls.push({ prop, value });
    }
    return decls;
  }
  function walk(from, to, media) {
    let p = from;
    while (p < to) {
      const ob = clean.indexOf("{", p); if (ob < 0 || ob >= to) break;
      const selector = clean.slice(p, ob).trim();
      const cb = readBlock(ob);
      if (/^@(media|supports|container)/.test(selector)) {
        walk(ob + 1, cb, selector);
      } else if (/^@/.test(selector)) {
        // @keyframes, @font-face etc. — treat body as decls for hex scanning
        out.push({ selector, decls: parseDecls(clean.slice(ob + 1, cb)), start: ob, media: media || null, at: true });
      } else {
        out.push({ selector, decls: parseDecls(clean.slice(ob + 1, cb)), start: ob, media: media || null });
      }
      p = cb + 1;
    }
  }
  walk(0, N, null);
  return out;
}

function extractStyles(html) {
  const blocks = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi; let m;
  while ((m = re.exec(html))) blocks.push({ css: m[1], offset: m.index + m[0].indexOf(m[1]) });
  return blocks;
}

function extractHtmlComments(html) {
  const out = []; const re = /<!--([\s\S]*?)-->/g; let m;
  while ((m = re.exec(html))) out.push({ text: m[1], offset: m.index });
  return out;
}

/** Fences: [{check, fromLine, toLine, reason}] */
function parseFences(css, cssOffset, html) {
  const fences = []; const bad = [];
  const re = /\/\*\s*proto-lint-(disable|enable)(?:\s+([a-z-]+))?\s*(?::\s*([^*]*?))?\s*\*\//g; let m; let open = null;
  while ((m = re.exec(css))) {
    const line = lineOf(html, cssOffset + m.index);
    if (m[1] === "disable") {
      const check = CHECK_ALIASES[m[2]] || m[2] || "*"; const reason = (m[3] || "").trim();
      if (!reason) { bad.push({ line, check }); continue; }
      open = { check, fromLine: line, reason };
    } else if (open) { open.toLine = line; fences.push(open); open = null; }
  }
  if (open) { open.toLine = Infinity; fences.push(open); }
  return { fences, bad };
}
function fenced(fences, check, line) { return fences.some(f => (f.check === "*" || f.check === check) && line >= f.fromLine && line <= f.toLine); }

/** innerHTML of the element with the given id, via a naive depth counter on div tags. */
function innerOfId(html, id) {
  const open = html.search(new RegExp(`<(\\w+)[^>]*\\bid=["']${id}["'][^>]*>`));
  if (open < 0) return null;
  const tagM = html.slice(open).match(/^<(\w+)/); const tag = tagM[1];
  const startInner = html.indexOf(">", open) + 1;
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"); re.lastIndex = startInner;
  let depth = 1; let m;
  while ((m = re.exec(html))) { if (m[0][1] === "/") { depth--; if (depth === 0) return html.slice(startInner, m.index); } else if (!/\/>$/.test(m[0])) depth++; }
  return html.slice(startInner);
}
function textNodes(fragment) {
  const noScript = fragment.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  return noScript.split(/<[^>]+>/).map(s => s.replace(/&[a-z#0-9]+;/gi, "x").replace(/\s+/g, " ").trim()).filter(Boolean);
}

// ---------- the checks ----------
function lint(file, opts) {
  const html = fs.readFileSync(file, "utf8");
  const results = [];
  const add = (id, status, msg, evidence) => results.push({ id, status, msg, evidence: evidence || [] });
  const styles = extractStyles(html);
  const comments = extractHtmlComments(html);
  const commentText = comments.map(c => c.text).join("\n");

  // reference template (optional)
  let tpl = null;
  const tplPath = opts.template || path.resolve(__dirname, "..", "templates", "course-page", "TEMPLATE-shell.html");
  if (fs.existsSync(tplPath) && path.resolve(tplPath) !== path.resolve(file)) tpl = fs.readFileSync(tplPath, "utf8");
  const isTemplate = /TEMPLATE-/.test(path.basename(file));
  const isClean = /-test\.html$/i.test(path.basename(file));

  // parse all css
  const allRules = []; const allFences = []; const badFences = [];
  for (const b of styles) {
    const { fences, bad } = parseFences(b.css, b.offset, html);
    allFences.push(...fences); badFences.push(...bad);
    for (const r of parseCss(b.css)) allRules.push(Object.assign(r, { line: lineOf(html, b.offset + r.start) }));
  }
  for (const f of badFences) add("fence-reason", "WARN", `proto-lint-disable at :${f.line} has no reason — not honoured`, [{ line: f.line }]);

  // --- D1: no research intent in the file; title; export markers ---
  // The question a prototype answers and what the review concluded live in the
  // conversation and the ticket, never here: a usability-test participant can
  // View Source. Any file, reviewer or clean, fails on a Question:/Answer: line.
  const fieldLines = (name) => { const out = []; const re = new RegExp(`^[ \\t]*${name}:[ \\t]*(.*)$`, "gmi"); let m; while ((m = re.exec(html))) out.push({ line: lineOf(html, m.index), value: m[1].trim() }); return out; };
  const leaks = [...fieldLines("Question"), ...fieldLines("Answer")];
  if (leaks.length) add("intent-leak", "FAIL", `${leaks.length} Question:/Answer: line(s) in the file — research intent belongs in the conversation and the ticket, not in something a participant can View Source on`, leaks.slice(0, 4));
  else add("intent-leak", "PASS", "no research question or conclusion in the file");
  const t1 = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim();
  if (isClean) {
    if (/prototype|throwaway|template|\bproto\b|not for merge/i.test(t1)) add("clean-title", "FAIL", `title still says what this is: "${t1.slice(0, 60)}"`, [{ line: lineOf(html, html.search(/<title>/i)) }]);
    else add("clean-title", "PASS", `title "${t1.slice(0, 50)}"`);
    const devLeft = [];
    for (const id of ["devPanel", "devMin", "guidesBtn", "annotBtn", "measureBar", "debug", "annotLayer"]) if (new RegExp(`id="${id}"`).test(html)) devLeft.push({ snippet: `#${id}` });
    if (/\bdata-annot(-side)?=/.test(html)) devLeft.push({ snippet: "data-annot attribute" });
    if (/class="[^"]*\b(devpanel|devswitch|guide|measure-bar|annot-layer)\b/.test(html)) devLeft.push({ snippet: "dev scaffolding class" });
    if (/dev:(start|end)/.test(html)) devLeft.push({ snippet: "stray dev:start/dev:end marker" });
    if (devLeft.length) add("clean-no-dev", "FAIL", `${devLeft.length} piece(s) of reviewer scaffolding survived the export`, devLeft.slice(0, 6));
    else add("clean-no-dev", "PASS", "no State panel, annotations, guides or debug strip");
    const cm = html.match(/<!--/g) || [];
    if (cm.length) add("clean-no-comments", "FAIL", `${cm.length} HTML comment(s) remain — NOTES and headers tell a participant what you're studying`, [{ line: lineOf(html, html.indexOf("<!--")) }]);
    else add("clean-no-comments", "PASS", "no HTML comments");
  } else {
    if (!isTemplate && tpl) {
      const t2 = (tpl.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim();
      if (t1 && t2 && t1 === t2) add("title-changed", "FAIL", "<title> still the template's", [{ line: lineOf(html, html.search(/<title>/i)) }]);
      else add("title-changed", "PASS", "title changed");
    }
    // The export script needs balanced markers to know what to cut, and a clean title to swap in.
    const count = (re) => (html.match(re) || []).length;
    const pairs = [["css", /^[ \t]*\/\* dev:start \*\//gm, /^[ \t]*\/\* dev:end \*\//gm], ["markup", /^[ \t]*<!-- dev:start -->/gm, /^[ \t]*<!-- dev:end -->/gm], ["js", /^[ \t]*\/\/ dev:start[ \t]*$/gm, /^[ \t]*\/\/ dev:end[ \t]*$/gm]];
    const unbalanced = pairs.filter(([, a, b]) => count(a) !== count(b)).map(([k]) => k);
    const present = pairs.filter(([, a]) => count(a) > 0).map(([k]) => k);
    if (unbalanced.length) add("dev-markers", "FAIL", `unbalanced dev:start/dev:end in ${unbalanced.join(", ")} — proto-export.js can't make a clean copy`);
    else if (present.length < 3) add("dev-markers", "WARN", `dev markers missing for ${["css", "markup", "js"].filter(k => !present.includes(k)).join(", ")} — the usability-test export will leave that scaffolding in`);
    else add("dev-markers", "PASS", "dev regions marked for export");
    const cmeta = html.match(/<meta\s+name="clean-title"\s+content="([^"]*)"/i);
    if (!cmeta || !cmeta[1].trim()) add("clean-title", "WARN", 'no <meta name="clean-title"> — proto-export.js will refuse to make a usability-test copy');
    else if (/prototype|throwaway|template|\bproto\b/i.test(cmeta[1])) add("clean-title", "WARN", `clean-title "${cmeta[1].slice(0, 40)}" still says what this is`);
    else add("clean-title", "PASS", `clean-title "${cmeta[1].slice(0, 40)}"`);
  }
  // notes size + shell-notes integrity
  const notesM = isClean ? null : html.match(/<!--\s*NOTES\b([\s\S]*?)-->/);
  if (notesM) {
    const lines = notesM[1].split("\n").length;
    if (lines > 120) add("notes-size", "WARN", `own NOTES is ${lines} lines (>120) — accretion`, [{ line: lineOf(html, notesM.index) }]);
    else add("notes-size", "PASS", `NOTES ${lines} lines`);
  } else if (!isTemplate && !isClean) add("notes-size", "WARN", "no `<!-- NOTES` block found");
  if (tpl && !isTemplate && !isClean) {
    const mine = html.match(/<!--\s*SHELL-NOTES\b[\s\S]*?-->/); const theirs = tpl.match(/<!--\s*SHELL-NOTES\b[\s\S]*?-->/);
    if (theirs) { if (!mine) add("shell-notes", "WARN", "SHELL-NOTES block missing (inherited traps lost)"); else if (mine[0] !== theirs[0]) add("shell-notes", "WARN", "SHELL-NOTES differs from template (edited or stale)"); else add("shell-notes", "PASS", "SHELL-NOTES intact"); }
  }

  // --- D2: hex outside :root, dialect, undefined tokens ---
  const hexEv = []; let hexCount = 0; const svgFill = [];
  const declared = new Set(); const referenced = new Map();
  for (const r of allRules) {
    const isRoot = /(^|,)\s*:root\s*(,|$)/.test(r.selector);
    for (const d of r.decls) {
      if (d.prop.startsWith("--")) declared.add(d.prop);
      const vm = d.value.matchAll(/var\(\s*(--[\w-]+)/g); for (const v of vm) if (!referenced.has(v[1])) referenced.set(v[1], r.line);
      if (!isRoot && !d.prop.startsWith("--") && !fenced(allFences, "hex-outside-root", r.line)) {
        const hits = d.value.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g);
        if (hits) { hexCount += hits.length; if (hexEv.length < 6) hexEv.push({ line: r.line, snippet: `${r.selector.slice(0, 40)} { ${d.prop}: ${d.value.slice(0, 40)} }` }); }
      }
    }
  }
  // inline style attributes
  for (const m of html.matchAll(/style="([^"]*)"/g)) { const hits = m[1].match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g); if (hits) { hexCount += hits.length; if (hexEv.length < 6) hexEv.push({ line: lineOf(html, m.index), snippet: `style="${m[1].slice(0, 50)}"` }); } }
  for (const m of html.matchAll(/\bfill="(#[0-9a-fA-F]{3,8})"/g)) svgFill.push({ line: lineOf(html, m.index), value: m[1] });
  if (hexCount > 0) add("hex-outside-root", "FAIL", `${hexCount} colour literal(s) outside :root`, hexEv); else add("hex-outside-root", "PASS", "no colour literals outside :root");
  if (svgFill.length) add("svg-fill", "INFO", `${svgFill.length} inline SVG fill="#…" (reported, not failed)`, svgFill.slice(0, 3));
  const usesMds = [...referenced.keys()].some(k => k.startsWith("--mds-"));
  const usesTpl = [...referenced.keys()].some(k => TEMPLATE_PREFIXES.some(p => k.startsWith(p)));
  if (usesMds && usesTpl) add("token-dialect", "FAIL", "mixes var(--mds-*) with template tokens — two dialects in one file");
  else add("token-dialect", "PASS", usesMds ? "single dialect (--mds-*)" : "single dialect (template tokens)");
  const undef = [...referenced.entries()].filter(([k]) => !declared.has(k));
  if (undef.length) add("undefined-token", "FAIL", `${undef.length} var() never declared (silent fallback)`, undef.slice(0, 6).map(([k, line]) => ({ line, snippet: k })));
  else add("undefined-token", "PASS", "all var() declared");

  // --- MDS: the design system is the source of every value, Noto Sans is the only face ---
  const mds = loadMds(path.dirname(file), opts.mds);
  const famOk = (v) => { const fams = v.split(",").map(s => s.trim().replace(/^["']|["']$/g, "").toLowerCase()); const first = fams[0]; return first === mds.fontFamily.toLowerCase() || first === "inherit" || /^(menlo|monaco|consolas|ui-monospace|monospace|sfmono-regular)$/.test(first) || /^font ?awesome/.test(first); };
  const bodyFam = allRules.filter(r => /(^|,)\s*(html|body)\s*(,|$)/.test(r.selector) && !r.media).flatMap(r => r.decls.filter(d => d.prop === "font-family").map(d => ({ line: r.line, value: d.value }))).pop();
  const famDecls = allRules.filter(r => !fenced(allFences, "font-noto", r.line)).flatMap(r => r.decls.filter(d => d.prop === "font-family").map(d => ({ line: r.line, selector: r.selector, value: d.value })));
  // var(--x, fallback): declared → its value; --mds-font-family-base → the MDS face by definition; else the fallback.
  const fontResolved = (v) => { for (let i = 0; i < 4; i++) { const m = v.match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/); if (!m) break; const t = allRules.flatMap(r => r.decls).find(d => d.prop === m[1]); const rep = m[1] === "--mds-font-family-base" ? mds.fontFamily : t ? t.value : (m[2] || "?undeclared"); v = v.replace(m[0], rep); } return v; };
  // An empty or undeclared var() resolves to inherit at computed-value time; only a positive switch fails.
  const badFam = famDecls.filter(d => { const r = fontResolved(d.value).trim(); return r && !/\?undeclared/.test(r) && !famOk(r); });
  const fontLink = /fonts\.googleapis\.com\/css2?\?[^"']*Noto\+Sans/i.test(html);
  if (!bodyFam) add("font-noto", "FAIL", "no font-family on html/body — MDS base face is Noto Sans");
  else if (!famOk(fontResolved(bodyFam.value))) add("font-noto", "FAIL", `body font-family is not Noto Sans first: ${fontResolved(bodyFam.value).slice(0, 50)}`, [bodyFam]);
  else if (badFam.length) add("font-noto", "FAIL", `${badFam.length} rule(s) switch away from Noto Sans (only inherit or a monospace stack for code is allowed)`, badFam.slice(0, 4).map(d => ({ line: d.line, snippet: `${d.selector.slice(0, 30)} { font-family: ${d.value.slice(0, 30)} }` })));
  else if (!fontLink) add("font-noto", "WARN", "Noto Sans declared but no Google Fonts link loads it — falls back to system-ui on machines without it");
  else add("font-noto", "PASS", "Noto Sans loaded and used throughout");

  const rootDecls = allRules.filter(r => /(^|,)\s*:root\s*(,|$)/.test(r.selector)).flatMap(r => r.decls.map(d => { const at = html.indexOf(d.prop + ":", html.split("\n").slice(0, r.line - 1).join("\n").length); return { line: at >= 0 ? lineOf(html, at) : r.line, prop: d.prop, value: d.value }; }));
  const offMds = [];
  const mdsCol = new Set(mds.colours);
  for (const d of rootDecls) {
    if (fenced(allFences, "mds-values", d.line)) continue;
    for (const h of d.value.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []) {
      const full = h.length === 4 ? "#" + h.slice(1).split("").map(c => c + c).join("") : h;
      if (!mdsCol.has(full.toLowerCase())) offMds.push({ line: d.line, snippet: `${d.prop}: ${h}` });
    }
    const px = d.value.match(/^([\d.]+)(px|rem)$/);
    if (px) { const n = Math.round(parseFloat(px[1]) * (px[2] === "rem" ? 16 : 1) * 100) / 100; if (/^--sp-/.test(d.prop) && !mds.spacingPx.includes(n)) offMds.push({ line: d.line, snippet: `${d.prop}: ${d.value} (MDS spacing: ${mds.spacingPx.join("/")})` }); if (/^--r-/.test(d.prop) && !mds.radiusPx.includes(n)) offMds.push({ line: d.line, snippet: `${d.prop}: ${d.value} (MDS radius: ${mds.radiusPx.join("/")})` }); }
  }
  const mdsSrc = mds.source === "snapshot" ? "snapshot" : "live";
  // A clean export has lost its lint fences with its comments; the reviewer file it came from was the gate.
  if (offMds.length) add("mds-values", isClean ? "INFO" : "WARN", `${offMds.length} :root value(s) are not in the Moodle Design System (${mdsSrc} tokens) — invented colour/spacing/radius`, offMds.slice(0, 6));
  else add("mds-values", "PASS", `every :root colour/spacing/radius is an MDS value (${mdsSrc})`);
  // Type scale is INFO here: icon glyphs share font-size with text and a static parse can't
  // tell them apart. ui-audit.js measures real text elements — read typography.offMdsScale there.
  const offType = [];
  for (const r of allRules) { if (fenced(allFences, "type-scale", r.line) || fenced(allFences, "hex-outside-root", r.line)) continue; for (const d of r.decls) { if (d.prop !== "font-size") continue; const m = d.value.match(/^([\d.]+)(px|rem)$/); if (!m) continue; const n = Math.round(parseFloat(m[1]) * (m[2] === "rem" ? 16 : 1)); if (!mds.fontSizePx.includes(n)) offType.push({ line: r.line, snippet: `${r.selector.slice(0, 30)} { font-size: ${d.value} }` }); } }
  if (offType.length) add("type-scale", "INFO", `${offType.length} font-size literal(s) off the MDS scale (${mds.fontSizePx.join("/")}px) — icons are fine, text is not; confirm with ui-audit.js`, offType.slice(0, 4));

  // --- wireframe: the greyscale build must actually be grey, and must land in it ---
  // Contrast is deliberately NOT checked on a wireframe: it is for structure and flow,
  // not for WCAG. What IS checked is that the mode exists, is reachable, and is honest.
  const fidLine = fieldLines("Fidelity")[0];
  const isWireframe = !!(fidLine && /^wireframe\b/i.test(fidLine.value));
  const wfRule = allRules.find(r => /(^|,)\s*body\.wireframe\s*(,|$)/.test(r.selector));
  if (!isClean) {
    if (!wfRule) add("wireframe-mode", isWireframe ? "FAIL" : "WARN", "no `body.wireframe` token override block — the Wireframe toggle will do nothing");
    else {
      // every colour it sets must be greyscale (R=G=B) or transparent-ish rgba white/black
      const bad = [];
      for (const d of wfRule.decls) {
        if (!d.prop.startsWith("--")) continue;
        if (fenced(allFences, "mds-values", d.line || wfRule.line)) continue;
        // MDS greys are cool-tinted, not pure R=G=B (#1d2125 has chroma 8, #6a737b has 17),
        // so test near-neutrality rather than equality. Every MDS grey is <= 17; the least
        // saturated MDS colour that isn't a grey is far above 24.
        for (const h of d.value.match(/#[0-9a-fA-F]{6}\b/g) || []) {
          const ch = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
          const chroma = Math.max(...ch) - Math.min(...ch);
          if (chroma > 24) bad.push({ line: wfRule.line, snippet: `${d.prop}: ${h} (chroma ${chroma}, needs <= 24)` });
        }
      }
      if (bad.length) add("wireframe-mode", "FAIL", `${bad.length} non-grey value(s) in body.wireframe — a wireframe with colour in it isn't one`, bad.slice(0, 5));
      else add("wireframe-mode", "PASS", `body.wireframe sets ${wfRule.decls.filter(d => d.prop.startsWith("--")).length} tokens, all greyscale`);
    }
    // A wireframe build has to LAND in wireframe, not need a click to get there.
    if (isWireframe) {
      const bodyCls2 = (html.match(/<body[^>]*class="([^"]*)"/) || [, ""])[1];
      const dflt = html.match(/^[ \t]*(\/\/)?[ \t]*body\.classList\.add\("wireframe"\)/m);
      if (/\bwireframe\b/.test(bodyCls2) || (dflt && !dflt[1])) add("wireframe-default", "PASS", "lands in wireframe");
      else add("wireframe-default", "FAIL", "Fidelity is wireframe but nothing turns it on: un-comment `body.classList.add(\"wireframe\")` in DEFAULTS");
    }
  }

  // --- D3: scroll trap ---
  let finalHeight = null; let hLine = null;
  for (const r of allRules) {
    if (!/(^|,)\s*(html|body)\s*(,|$)/.test(r.selector) || r.media) continue;
    for (const d of r.decls) if (d.prop === "height") { finalHeight = d.value; hLine = r.line; }
  }
  if (finalHeight && /^100%/.test(finalHeight)) add("scroll-trap", "FAIL", "html/body height:100% with no override — page can be silently unscrollable", [{ line: hLine }]);
  else add("scroll-trap", "PASS", finalHeight ? `html/body height ${finalHeight}` : "no fixed html/body height");

  // --- D4: dev panel, ids, annotations, guides ---
  const dp = isClean ? null : html.match(/<div[^>]*class="([^"]*\b(?:devpanel|devswitch)\b[^"]*)"[^>]*>/);
  if (dp) {
    // Effective state after load = static `min` class XOR an un-commented devMin.click()
    // in DEFAULTS. Old convention: no class + click → minimised. New convention (template
    // ships class="min"): class + no click → minimised; class + click → EXPANDED.
    const staticMin = /\bmin\b/.test(dp[1]);
    const clickLine = html.match(/^[ \t]*(\/\/)?[ \t]*document\.getElementById\("devMin"\)\.click\(\)/m);
    const clicked = !!(clickLine && !clickLine[1]);
    const effectiveMin = staticMin !== clicked;
    if (effectiveMin) add("devpanel-min", "PASS", `State panel starts minimised (${staticMin ? "min class" : "devMin.click()"})`);
    else add("devpanel-min", "FAIL", staticMin ? "min class present but DEFAULTS un-comments devMin.click() — that now EXPANDS it" : "State panel starts expanded (no `min` class, no devMin.click())", [{ line: lineOf(html, (clicked && clickLine) ? clickLine.index : dp.index) }]);
    const want = ["devPanel", "devMin", "guidesBtn", "annotBtn", "wireframeBtn"]; const missing = want.filter(id => !new RegExp(`id="${id}"`).test(html));
    if (missing.length) add("dev-ids", "WARN", `dev scaffolding ids not on convention: missing ${missing.join(", ")}`); else add("dev-ids", "PASS", "dev ids on convention");
  } else if (!isClean) add("devpanel-min", "FAIL", "no State panel (.devpanel) found");
  const bodyTag = html.match(/<body[^>]*>/); const bodyCls = bodyTag ? (bodyTag[0].match(/class="([^"]*)"/) || [, ""])[1] : "";
  if (isClean) { /* annotations are meant to be gone */ }
  else if (/\bannot-on\b/.test(bodyCls)) add("annotations-off-on-load", "WARN", "annotations are ON in the static body class — decide this in DEFAULTS, not markup");
  else add("annotations-off-on-load", "PASS", "annotations off on load");
  const guideCount = (html.match(/class="guide\b/g) || []).length;
  if (isClean) { /* guides are meant to be gone */ }
  else if (guideCount >= 8 && /id="measureBar"/.test(html)) add("guides-present", "PASS", "alignment guides + measure bar present"); else add("guides-present", "WARN", `alignment guides incomplete (${guideCount}/8 guides${/id="measureBar"/.test(html) ? "" : ", no measureBar"})`);

  // --- D5: top nav position ---
  const topbar = allRules.find(r => /(^|,)\s*\.topbar\s*(,|$)/.test(r.selector));
  if (topbar) {
    const pos = (topbar.decls.find(d => d.prop === "position") || {}).value;
    if (pos === "fixed" && !/Decisions:[\s\S]*fixed/i.test(commentText)) add("topnav-position", "WARN", ".topbar is position:fixed but NOTES > Decisions doesn't say why", [{ line: topbar.line }]);
    else add("topnav-position", "PASS", `.topbar position:${pos || "static"}`);
  }

  // --- D6: a11y ---
  const globalFV = allRules.some(r => r.selector.split(",").some(s => /^\s*\*?:focus-visible\s*$/.test(s)));
  if (globalFV) add("focus-visible", "PASS", "global :focus-visible rule present"); else add("focus-visible", "FAIL", "no global :focus-visible rule (only element-specific or none)");
  if (/pointerdown|draggable=|col-resize/.test(html)) {
    const ta = /touch-action\s*:/.test(html); const coarse = /pointer\s*:\s*coarse/.test(html);
    if (ta && coarse) add("touch-drag", "PASS", "drag has touch-action + pointer:coarse");
    else add("touch-drag", "FAIL", `drag present but missing ${[!ta && "touch-action", !coarse && "@media (pointer:coarse)"].filter(Boolean).join(" and ")} — each alone is a silent failure on iPad`);
  }
  const iconOnly = [...html.matchAll(/<button\b([^>]*)>\s*(?:<i class="fa[^"]*"[^>]*><\/i>|<svg[\s\S]*?<\/svg>)\s*<\/button>/g)].filter(m => !/aria-label=|title=/.test(m[1]));
  const imgNoAlt = [...html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)];
  const genericAlt = [...html.matchAll(/<img\b[^>]*\balt="(image|icon|photo|picture)"[^>]*>/gi)];
  if (iconOnly.length || imgNoAlt.length) add("aria-basics", "FAIL", `${iconOnly.length} icon-only button(s) without aria-label, ${imgNoAlt.length} img without alt`, [...iconOnly, ...imgNoAlt].slice(0, 5).map(m => ({ line: lineOf(html, m.index) })));
  else add("aria-basics", "PASS", "icon buttons labelled, imgs have alt");
  if (genericAlt.length) add("aria-basics", "WARN", `${genericAlt.length} generic alt text (passes axe, means nothing)`, genericAlt.slice(0, 3).map(m => ({ line: lineOf(html, m.index) })));
  if (!isTemplate && !isClean) {
    const fn = fieldLines("Figma nodes")[0];
    if (!fn || (PLACEHOLDER.test(fn.value) && !/none/i.test(fn.value))) add("figma-nodes", "WARN", fn ? "Figma nodes is a placeholder" : "no `Figma nodes:` field (write `none (Boost-loose)` if there are none)");
    else add("figma-nodes", "PASS", `Figma nodes: ${fn.value.slice(0, 40)}`);
    const fid = fieldLines("Fidelity")[0];
    if (!fid || !/^(wireframe|rough|considered)\b/i.test(fid.value)) add("fidelity-field", "WARN", fid ? `Fidelity should be wireframe|rough|considered, got "${fid.value.slice(0, 20)}"` : "no `Fidelity:` field");
    else add("fidelity-field", "PASS", `Fidelity: ${fid.value}`);
  }

  // --- D7: awkward data (scoped to #prototype-content) ---
  const slot = innerOfId(html, "prototype-content") ?? innerOfId(html, "page-content"); // clean exports rename the slot
  if (slot !== null) {
    const nodes = textNodes(slot); const longest = nodes.reduce((a, b) => (b.length > a.length ? b : a), "");
    const jsData = (html.split(/\/\*\s*PROTOTYPE DATA\s*\*\//)[1] || ""); const jsLong = [...jsData.matchAll(/["'`]([^"'`\n]{60,})["'`]/g)].length;
    if (longest.length >= 60 || jsLong) add("awkward-data", "PASS", `longest content string ${Math.max(longest.length, jsLong ? 60 : 0)} chars`);
    else add("awkward-data", (isTemplate || isClean) ? "INFO" : "FAIL", `longest text in the content slot is ${longest.length} chars (<60) — data is too tidy to stress the layout`);
    if (!/\b\d{4,}\b/.test(slot) && !/\b\d{4,}\b/.test(jsData)) add("awkward-data", (isTemplate || isClean) ? "INFO" : "WARN", "no ≥4-digit number in content — high-volume state untested");
  } else if (!isTemplate) add("awkward-data", "WARN", "no #prototype-content element — cannot scope the data check");

  // --- method: self-contained, size ---
  const loads = [...html.matchAll(/<(?:script|link|img)\b[^>]*\b(?:src|href)="([^"]+)"/g), ...html.matchAll(/@import\s+(?:url\()?["']?([^"')\s]+)/g), ...html.matchAll(/fetch\(\s*["']([^"']+)["']/g)];
  const badLoads = [];
  for (const m of loads) {
    const u = m[1];
    if (/^https?:\/\//.test(u)) { const host = u.replace(/^https?:\/\//, "").split("/")[0]; if (!CDN_ALLOW.includes(host)) badLoads.push({ line: lineOf(html, m.index), snippet: u.slice(0, 60) }); }
    else if (!/^(data:|#)/.test(u)) badLoads.push({ line: lineOf(html, m.index), snippet: u.slice(0, 60) });
  }
  if (badLoads.length) add("self-contained", "FAIL", `${badLoads.length} load(s) outside the allowlisted CDNs or relative — file won't survive being emailed`, badLoads.slice(0, 5)); else add("self-contained", "PASS", "self-contained");
  const kb = Buffer.byteLength(html, "utf8") / 1024;
  if (kb > 500) add("size-sanity", "WARN", `${Math.round(kb)} KB (>500) — accretion?`); else add("size-sanity", "PASS", `${Math.round(kb)} KB`);

  return { file: path.basename(file), path: file, checks: results, summary: { fail: results.filter(r => r.status === "FAIL").length, warn: results.filter(r => r.status === "WARN").length, pass: results.filter(r => r.status === "PASS").length } };
}

// ---------- cli ----------
(function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json"); const all = args.includes("--all");
  const ti = args.indexOf("--template"); const template = ti >= 0 ? args[ti + 1] : null;
  const mi = args.indexOf("--mds"); const mdsDir = mi >= 0 ? args[mi + 1] : null;
  const targets = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--template" && args[i - 1] !== "--mds");
  if (!targets.length) { console.error("usage: proto-lint.js <file.html> | --all <dir> [--json] [--template <path>] [--mds <tokens dir>]"); process.exit(2); }
  let files = [];
  if (all) { for (const dir of targets) for (const f of fs.readdirSync(dir)) if (/^(PROTOTYPE|TEMPLATE)-.*\.html$/.test(f)) files.push(path.join(dir, f)); }
  else files = targets;
  const reports = files.map(f => { try { return lint(f, { template, mds: mdsDir }); } catch (e) { return { file: path.basename(f), path: f, error: e.message, checks: [], summary: { fail: 1, warn: 0, pass: 0 } }; } });
  if (json) { console.log(JSON.stringify(reports, null, 2)); }
  else {
    for (const r of reports) {
      if (r.error) { console.log(`${r.file}  ERROR ${r.error}`); continue; }
      console.log(`${r.file.padEnd(40)} FAIL ${r.summary.fail}  WARN ${r.summary.warn}  PASS ${r.summary.pass}`);
      for (const c of r.checks) if (c.status !== "PASS") {
        console.log(`  ${c.status.padEnd(4)} ${c.id.padEnd(22)} ${c.msg}`);
        for (const e of c.evidence.slice(0, 4)) console.log(`       :${e.line}${e.snippet ? "  " + e.snippet : e.value !== undefined ? "  " + JSON.stringify(e.value).slice(0, 60) : ""}`);
      }
    }
    if (reports.length > 1) {
      const agg = {}; for (const r of reports) for (const c of r.checks) { agg[c.id] = agg[c.id] || { FAIL: 0, WARN: 0, PASS: 0, INFO: 0 }; agg[c.id][c.status]++; }
      console.log("\nper-check totals across " + reports.length + " files:");
      for (const [id, v] of Object.entries(agg)) console.log(`  ${id.padEnd(24)} FAIL ${String(v.FAIL).padStart(2)}  WARN ${String(v.WARN).padStart(2)}  PASS ${String(v.PASS).padStart(2)}`);
    }
  }
  // exitCode, not exit(): exit() can truncate a large --json payload on a pipe
  process.exitCode = reports.some(r => r.summary.fail > 0) ? 1 : 0;
})();
