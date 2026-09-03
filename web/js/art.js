/* Sillage. Everything drawn rather than photographed: the emotion wheel, the
   bottle silhouettes on the shelf, and the four charts on the skill page.
   All SVG built in JavaScript so it inherits the theme, and so the app needs
   no camera permission and no image files to look like something. */
const Art = (() => {

  const esc = s => String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }

  /* ---------- the emotion wheel ----------
     Eight wedges around a still centre. The selected wedge grows a little and
     takes its full hue; the rest sit at a third of it. */
  function wheel(selected, size) {
    const S = size || 240, c = S / 2;
    const F = Content.FEELINGS, n = F.length;
    const step = 360 / n;
    let out = '<svg class="wheel" viewBox="0 0 ' + S + ' ' + S + '" width="' + S + '" height="' + S + '" role="radiogroup" aria-label="How it felt">';
    F.forEach((f, i) => {
      const on = f.id === selected;
      const a0 = (i * step - 90 - step / 2) * Math.PI / 180;
      const a1 = ((i + 1) * step - 90 - step / 2) * Math.PI / 180;
      const rIn = S * 0.20, rOut = on ? S * 0.475 : S * 0.435;
      const p = (r, a) => (c + r * Math.cos(a)).toFixed(2) + ',' + (c + r * Math.sin(a)).toFixed(2);
      const d = 'M' + p(rIn, a0) + ' L' + p(rOut, a0) +
                ' A' + rOut + ',' + rOut + ' 0 0 1 ' + p(rOut, a1) +
                ' L' + p(rIn, a1) + ' A' + rIn + ',' + rIn + ' 0 0 0 ' + p(rIn, a0) + ' Z';
      const am = (a0 + a1) / 2;
      const tr = (rIn + rOut) / 2;
      out += '<g class="wedge' + (on ? ' on' : '') + '" data-feel="' + f.id + '" role="radio" tabindex="0"' +
             ' aria-checked="' + (on ? 'true' : 'false') + '" aria-label="' + esc(f.label) + '">' +
             '<path d="' + d + '" fill="' + f.hue + '" fill-opacity="' + (on ? 1 : 0.26) + '"/>' +
             '<text x="' + (c + tr * Math.cos(am)).toFixed(1) + '" y="' + (c + tr * Math.sin(am) + 4).toFixed(1) + '"' +
             ' text-anchor="middle" class="wlab' + (on ? ' won' : '') + '">' + esc(f.label) + '</text></g>';
    });
    const sel = Content.feeling(selected);
    out += '<circle cx="' + c + '" cy="' + c + '" r="' + (S * 0.185) + '" class="whub"/>';
    out += '<text x="' + c + '" y="' + (c + 5) + '" text-anchor="middle" class="whubtext">' +
           esc(sel ? sel.label : 'Feel') + '</text>';
    out += '</svg>';
    return out;
  }

  /* ---------- bottles ----------
     Six silhouettes and two stoppers, chosen from a hash of the name so a bottle
     always looks like itself. The glass takes the hue of its dominant note family.
     Nothing here is a photograph, which is why the app asks for no camera. */
  const SHAPES = [
    'M11,97 L11,42 Q11,31 19,27 L41,27 Q49,31 49,42 L49,97 Z',
    'M15,97 L15,31 Q15,28 18,28 L42,28 Q45,28 45,31 L45,97 Z',
    'M7,97 L7,52 Q7,43 16,41 L44,41 Q53,43 53,52 L53,97 Z',
    'M13,97 L19,33 L41,33 L47,97 Z',
    'M8,68 C8,45 18,32 30,32 C42,32 52,45 52,68 L52,97 L8,97 Z',
    'M10,97 L10,46 L18,29 L42,29 L50,46 L50,97 Z'
  ];
  const TOPS = [
    '<rect x="23" y="5" width="14" height="13" rx="2"/><rect x="25.5" y="17" width="9" height="11"/>',
    '<circle cx="30" cy="12" r="7.5"/><rect x="25.5" y="17" width="9" height="12"/>'
  ];

  function bottleHue(b) {
    const fams = {};
    for (const t of (b.notes || [])) {
      const n = Lexicon.get(t); if (!n) continue;
      fams[n.f] = (fams[n.f] || 0) + 1;
    }
    const top = Object.keys(fams).sort((a, b2) => fams[b2] - fams[a])[0];
    if (top) return (Lexicon.family(top) || {}).hue || '#8A6A34';
    const pool = ['#9C6427', '#7A6242', '#8A5A24', '#6B6250', '#4B7666', '#A0423A'];
    return pool[hash(b.name + b.house) % pool.length];
  }

  /** level 0..1 of glass filled. Sample and decant are drawn small on purpose. */
  function bottleMark(b, opts) {
    const o = opts || {};
    const h = hash((b.name || '') + '|' + (b.house || ''));
    const shape = SHAPES[h % SHAPES.length];
    const top = TOPS[(h >> 3) % TOPS.length];
    const hue = bottleHue(b);
    const small = b.status === 'decant' || b.status === 'sample';
    const empty = b.status === 'empty' || b.status === 'rehomed';
    const level = empty ? 0 : (b.status === 'sample' ? 0.55 : b.status === 'decant' ? 0.7 : 0.86);
    const cid = 'bc' + h.toString(36) + (o.tag || '');
    const y = 97 - level * (97 - 30);
    const sc = small ? 0.66 : 1;
    let s = '<svg class="bottle" viewBox="0 0 60 104" preserveAspectRatio="xMidYMax meet" aria-hidden="true">';
    s += '<defs><clipPath id="' + cid + '"><path d="' + shape + '"/></clipPath></defs>';
    s += '<g transform="translate(' + (30 - 30 * sc) + ',' + (104 - 104 * sc) + ') scale(' + sc + ')">';
    s += '<g class="bcap">' + top + '</g>';
    s += '<path d="' + shape + '" class="bglass"/>';
    if (level > 0) s += '<rect x="0" y="' + y.toFixed(1) + '" width="60" height="' + (97 - y).toFixed(1) +
                        '" fill="' + hue + '" clip-path="url(#' + cid + ')" opacity="0.62"/>';
    s += '<path d="' + shape + '" class="bline"/>';
    s += '</g></svg>';
    return s;
  }

  /* ---------- charts ---------- */
  function chartShell(w, h, inner, label) {
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' +
           esc(label || '') + '">' + inner + '</svg>';
  }

  /** Accuracy per scored session, oldest left. A naturalist's chart, not a HUD. */
  function accuracyCurve(series) {
    const W = 320, H = 132, P = 10, B = 16;
    if (!series.length) return '';
    const n = series.length;
    const x = i => n === 1 ? W / 2 : P + i * (W - 2 * P) / (n - 1);
    const y = p => (H - B) - (p / 100) * (H - B - P);
    let g = '';
    for (const p of [0, 50, 100]) {
      g += '<line x1="0" x2="' + W + '" y1="' + y(p) + '" y2="' + y(p) + '" class="grid"/>';
    }
    let d = '';
    series.forEach((s, i) => { d += (i ? ' L' : 'M') + x(i).toFixed(1) + ',' + y(s.pct).toFixed(1); });
    let area = d + ' L' + x(n - 1).toFixed(1) + ',' + (H - B) + ' L' + x(0).toFixed(1) + ',' + (H - B) + ' Z';
    let dots = '';
    series.forEach((s, i) => {
      dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(s.pct).toFixed(1) + '" r="3" class="dot"/>';
    });
    return chartShell(W, H, g + '<path d="' + area + '" class="area"/><path d="' + d + '" class="line"/>' + dots,
      'Accuracy across ' + n + ' scored sessions');
  }

  /** Cumulative distinct terms, one step per week. */
  function growthChart(series) {
    const W = 320, H = 132, P = 10, B = 16;
    if (series.length < 2) return '';
    const max = Math.max(8, series[series.length - 1].n);
    const x = i => P + i * (W - 2 * P) / (series.length - 1);
    const y = v => (H - B) - (v / max) * (H - B - P);
    let d = '';
    series.forEach((s, i) => {
      if (i === 0) d += 'M' + x(i).toFixed(1) + ',' + y(s.n).toFixed(1);
      else d += ' L' + x(i).toFixed(1) + ',' + y(series[i - 1].n).toFixed(1) + ' L' + x(i).toFixed(1) + ',' + y(s.n).toFixed(1);
    });
    const area = d + ' L' + x(series.length - 1).toFixed(1) + ',' + (H - B) + ' L' + x(0).toFixed(1) + ',' + (H - B) + ' Z';
    return chartShell(W, H,
      '<line x1="0" x2="' + W + '" y1="' + (H - B) + '" y2="' + (H - B) + '" class="grid"/>' +
      '<path d="' + area + '" class="area"/><path d="' + d + '" class="line"/>',
      'Vocabulary growth to ' + max + ' terms');
  }

  /** Twelve months of wears, for the shelf and for a bottle page. */
  function monthStrip(months, label) {
    const W = 320, H = 60, B = 14;
    const max = Math.max(1, ...months);
    const bw = (W - 11 * 4) / 12;
    let s = '';
    months.forEach((v, i) => {
      const h = Math.max(v ? 3 : 1, (v / max) * (H - B - 4));
      s += '<rect x="' + (i * (bw + 4)).toFixed(1) + '" y="' + (H - B - h).toFixed(1) +
           '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" class="' + (v ? 'bar' : 'bar off') + '"/>';
    });
    ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].forEach((m, i) => {
      s += '<text x="' + (i * (bw + 4) + bw / 2).toFixed(1) + '" y="' + (H - 2) + '" text-anchor="middle" class="tick">' + m + '</text>';
    });
    return chartShell(W, H, s, label || 'Wears by month');
  }

  /** Per shelf accuracy, as rows rather than a bar chart with an axis. */
  function shelfBars(rows) {
    let s = '';
    for (const r of rows) {
      const pct = r.pct === null ? 0 : r.pct;
      s += '<div class="sbrow"><span class="sbname">' + esc(r.name) + '</span>' +
           '<span class="sbtrack"><span class="sbfill" style="width:' + pct + '%"></span></span>' +
           '<span class="sbval">' + (r.pct === null ? 'not yet' : r.pct + '%') + '</span></div>';
    }
    return s;
  }

  /** A single wedge of the lexicon atlas, used as the family badge. */
  function familyBadge(fam, filled, total) {
    const S = 44, c = S / 2, r = 17;
    const pct = total ? filled / total : 0;
    const a = pct * Math.PI * 2 - Math.PI / 2;
    const large = pct > 0.5 ? 1 : 0;
    let d = '';
    if (pct > 0.999) d = 'M' + c + ',' + (c - r) + ' A' + r + ',' + r + ' 0 1 1 ' + (c - 0.01) + ',' + (c - r) + ' Z';
    else if (pct > 0) d = 'M' + c + ',' + c + ' L' + c + ',' + (c - r) +
      ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + (c + r * Math.cos(a)).toFixed(2) + ',' + (c + r * Math.sin(a)).toFixed(2) + ' Z';
    return '<svg class="fbadge" viewBox="0 0 ' + S + ' ' + S + '" aria-hidden="true">' +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="' + fam.hue + '" fill-opacity="0.16"/>' +
      (d ? '<path d="' + d + '" fill="' + fam.hue + '" fill-opacity="0.85"/>' : '') +
      '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + fam.hue + '" stroke-opacity="0.5" stroke-width="1.2"/>' +
      '</svg>';
  }

  return { esc, hash, wheel, bottleMark, bottleHue, accuracyCurve, growthChart, monthStrip, shelfBars, familyBadge };
})();
