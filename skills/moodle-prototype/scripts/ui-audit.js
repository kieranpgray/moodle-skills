/*
 * ui-audit.js — measure the things Refactoring UI asks you to eyeball.
 *
 * Paste the whole file as the `text` argument of javascript_tool (Browser pane or
 * claude-in-chrome) with the prototype open. Returns JSON; nothing is mutated.
 *
 * Feeds these refactoring-ui-skills:
 *   02-apply-typography-scale     <- typography.distinctSizeWeightPairs / .top / .offMdsScale (text not on the MDS scale)
 *   (Rule 0: MDS wins)            <- typography.fontFamilies — anything but Noto Sans is a defect
 *   04-apply-consistent-spacing   <- spacing.offScale / .top
 *   06-eliminate-visual-clutter   <- borders / shadows / color.distinct*
 *   08-use-shadows-appropriately  <- shadows.top
 *   09-manage-color-contrast      <- contrast.worst
 *   (not a skill)                 <- scroll.trapped — true means content below the fold is unreachable
 *
 * It measures; it does not judge. Feed the numbers into each skill's PASS/FAIL criteria.
 * Known blind spots, reported rather than guessed at:
 *   - text over a gradient/image background lands in contrast.unmeasured (screenshot it instead)
 *   - visually-hidden (.sr-only) text is skipped, so it can't inflate the type census
 *   - only the current viewport/route is measured: re-run per breakpoint and per screen
 */
(() => {
  const SCALE = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96];
  // Moodle Design System type scale, px: paragraph-small/default/lead, headings 4..1.
  const MDS_TYPE = [14, 16, 20, 24, 28, 32, 40];
  const MDS_FACE = 'Noto Sans';
  const MAXEL = 4000;

  const parse = (c) => {
    const m = (c || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((s) => parseFloat(s));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const blend = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  // Walks up compositing background layers. Returns null if a gradient/image
  // intervenes before an opaque colour — a ratio there would be fiction.
  const bgOf = (el) => {
    let n = el;
    const acc = [];
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { acc.push(c); if (c.a >= 0.99) break; }
      n = n.parentElement;
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = acc.length - 1; i >= 0; i--) out = blend(acc[i], out);
    return out;
  };
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    const cls = (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || '';
    const parts = String(cls).trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (parts.length) s += '.' + parts.join('.');
    return s;
  };
  const ownText = (el) => {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.trim();
  };
  // Screen-reader-only text is not part of the visual design; counting it would
  // inflate the type scale and invent contrast failures nobody can see.
  const srOnly = (cs, r) =>
    (cs.position === 'absolute' && (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)')) ||
    (r.width <= 1 && r.height <= 1);
  const bump = (map, k, extra) => {
    if (!map[k]) map[k] = { count: 0, where: [] };
    map[k].count++;
    if (extra && map[k].where.length < 3) map[k].where.push(extra);
  };

  const type = {}, spacing = {}, radii = {}, shadows = {}, textColors = {}, bgColors = {}, faces = {}, offType = {};
  const contrastFails = [], unmeasured = [];
  let borders = 0, elements = 0, textNodes = 0;

  // Scope: set window.__uiAuditRoot = '#prototype-content' before running to measure only
  // what the prototype built, not the shell around it. Unset = whole page (the shell's own
  // known conflicts, e.g. --text-muted on --bg-strong at 4.07:1, will then show up too).
  const rootSel = (typeof window !== 'undefined' && window.__uiAuditRoot) || null;
  const rootEl = rootSel ? document.querySelector(rootSel) : null;
  const scope = rootEl ? rootEl.querySelectorAll('*') : document.querySelectorAll('body *');

  for (const el of Array.from(scope).slice(0, MAXEL)) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) <= 0.05) continue;
    if (srOnly(cs, rect)) continue;
    elements++;

    for (const p of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight',
                     'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
                     'rowGap', 'columnGap']) {
      const v = parseFloat(cs[p]);
      if (!v || Number.isNaN(v) || v < 0) continue;
      bump(spacing, String(Math.round(v * 100) / 100), sel(el) + ':' + p);
    }

    const r = parseFloat(cs.borderTopLeftRadius);
    if (r) bump(radii, String(Math.round(r * 100) / 100), sel(el));
    if (cs.boxShadow && cs.boxShadow !== 'none') bump(shadows, cs.boxShadow, sel(el));
    for (const s of ['borderTopWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderRightWidth']) {
      if (parseFloat(cs[s]) > 0 && cs.borderTopStyle !== 'none') { borders++; break; }
    }
    const bgc = parse(cs.backgroundColor);
    if (bgc && bgc.a > 0) bump(bgColors, hex(bgc) + (bgc.a < 1 ? '@' + bgc.a : ''), sel(el));

    const txt = ownText(el);
    if (!txt) continue;
    textNodes++;

    const size = Math.round(parseFloat(cs.fontSize) * 10) / 10;
    const weight = cs.fontWeight;
    bump(type, size + 'px/' + weight, sel(el));
    if (!MDS_TYPE.includes(Math.round(size))) bump(offType, size + 'px', sel(el) + ' "' + txt.slice(0, 24) + '"');
    const face = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim();
    bump(faces, face, sel(el));

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    bump(textColors, hex(fgRaw), sel(el));
    const bg = bgOf(el);
    if (!bg) { if (unmeasured.length < 20) unmeasured.push({ selector: sel(el), text: txt.slice(0, 40), reason: 'gradient or image background' }); continue; }
    const fg = fgRaw.a < 1 ? blend(fgRaw, bg) : fgRaw;
    const cr = Math.round(ratio(fg, bg) * 100) / 100;
    const large = size >= 24 || (size >= 18.66 && parseInt(weight, 10) >= 700);
    const need = large ? 3 : 4.5;
    if (cr < need) {
      contrastFails.push({
        selector: sel(el), text: txt.slice(0, 60), ratio: cr, needs: need,
        color: hex(fg), background: hex(bg), fontSize: size + 'px', weight,
      });
    }
  }

  const top = (map, n) => Object.entries(map)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, n)
    .map(([k, v]) => ({ value: k, count: v.count, examples: v.where }));

  const offScale = Object.entries(spacing)
    .filter(([k, v]) => !SCALE.includes(Math.round(parseFloat(k))) && v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([k, v]) => ({ value: k + 'px', count: v.count, examples: v.where }));

  const bodyRect = document.body.getBoundingClientRect();
  const vw = innerWidth || document.documentElement.clientWidth || Math.round(bodyRect.width) || 0;
  const vh = innerHeight || document.documentElement.clientHeight || Math.round(bodyRect.height) || 0;

  // Scroll trap (runtime check for the html,body{height:100%} class of bug).
  // The documented symptom was "document height stuck at 900px against 4402px
  // of content": the scrollable extent is capped while in-flow content keeps
  // going below it. So compare the furthest in-flow content bottom against
  // what the page can scroll to. Fixed-position elements are excluded (they
  // are not in flow). `trapped` is the verdict; the numbers are the evidence.
  const scrollable = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  let contentBottom = 0;
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.height === 0) continue;
    contentBottom = Math.max(contentBottom, r.bottom + scrollY);
  }
  const unreachable = Math.round(contentBottom - scrollable);
  const scroll = { scrollableHeight: scrollable, contentBottom: Math.round(contentBottom), viewportHeight: vh, unreachablePx: Math.max(0, unreachable), trapped: unreachable > 8,
    htmlOverflow: getComputedStyle(document.documentElement).overflowY, bodyOverflow: getComputedStyle(document.body).overflowY };

  return {
    page: { url: location.href, viewport: vw + 'x' + vh, scope: rootEl ? rootSel : 'body (whole page)', elementsScanned: elements, textElements: textNodes },
    scroll,
    typography: {
      distinctSizeWeightPairs: Object.keys(type).length, distinctSizes: new Set(Object.keys(type).map((k) => k.split('px/')[0])).size, top: top(type, 15),
      mdsScale: MDS_TYPE, offMdsScale: top(offType, 10),
      fontFamilies: top(faces, 5), nonMdsFaces: Object.keys(faces).filter((f) => f.toLowerCase() !== MDS_FACE.toLowerCase()),
    },
    spacing: { distinctValues: Object.keys(spacing).length, offScale, top: top(spacing, 12) },
    color: { distinctTextColors: Object.keys(textColors).length, distinctBackgrounds: Object.keys(bgColors).length, topText: top(textColors, 10) },
    contrast: { failures: contrastFails.length, worst: contrastFails.sort((a, b) => a.ratio - b.ratio).slice(0, 20), unmeasured },
    shadows: { distinct: Object.keys(shadows).length, top: top(shadows, 8) },
    borders: { visibleBorderedElements: borders },
    radii: { distinct: Object.keys(radii).length, top: top(radii, 8) },
  };
})()
