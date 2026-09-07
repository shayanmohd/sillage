/* Reviewer script 7. Real measured contrast, not a guess at the cascade: every screen is
   photographed twice, once as it is and once with every glyph painted transparent, and the
   second photograph is sampled under each text run to get the colour actually behind it. */
module.exports = async ({ page, shot, wait, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const scheme = process.env.SCHEME || 'light';
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]
    .concat(process.env.RM === '1' ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []));
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  await ev(() => {
    const D = 86400000, now = Date.now();
    Store.onboarded(true);
    const b = Store.addBottle({ name: "Terre d'Hermes", house: 'Hermes', sizeMl: 100, price: 128, acquiredAt: now - 400*D, notes: ['grapefruit','vetiver'], sillage: 'room', seasons: ['autumn'], story: 'Bought in Rome.', take: { opening: 'Grapefruit over flint', heart: 'Pepper', drydown: 'Cedar' } });
    Store.addBottle({ name: 'Philosykos', house: 'Diptyque', sizeMl: 50, price: 96, acquiredAt: now - 900*D, notes: ['fig'] });
    for (let i = 0; i < 14; i++) Store.logWear(b.id, { at: now - i*11*D, contexts: ['work'], sprays: 2 });
    ['longing','calm','joy','melancholy','desire','alert','comfort','unease'].forEach((f, i) =>
      Store.addEntry({ text: 'An entry about the smell of rain number ' + i, anchor: 'Like a hot tin roof', place: 'Lisbon', feeling: f, tags: ['petrichor'], bottleId: i % 2 ? b.id : null, at: now - i*3*D, people: ['Ines'] }));
    Store.addSession({ at: now - 20*D, track: 'foundations', sessionId: 'f4', kind: 'id', results: [{mat:'coffee-ground',ok:true},{mat:'lemon-peel',ok:false,guess:'lime-peel'}], correct: 1, total: 2, durationS: 200, note: 'A note.' });
    Store.addSession({ at: now - 2*D, track: 'foundations', sessionId: 'f6', kind: 'recall', results: [{mat:'lemon-peel',ok:true}], correct: 1, total: 1, durationS: 60, note: '' });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(400);

  const collect = () => page.evaluate(() => {
    const out = [];
    const seen = new Set();
    const nodes = document.querySelectorAll('.screen:not([hidden]) *, #tabs:not([hidden]) *, .sheet:not([hidden]) *, #newEntry:not([hidden]) *, #toast:not([hidden])');
    for (const n of nodes) {
      const r = n.getBoundingClientRect();
      if (r.width < 6 || r.height < 6 || r.bottom < 1 || r.top > innerHeight - 1) continue;
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.99) continue;
      const own = Array.from(n.childNodes).filter(c => c.nodeType === 3 && c.textContent.trim()).map(c => c.textContent.trim()).join(' ');
      if (!own) continue;
      // SVG text paints with fill, not color, and the blanking sheet has to blank that too
      const isSvgText = n.tagName.toLowerCase() === 'text';
      const paint = isSvgText ? cs.fill : cs.color;
      const m = String(paint).match(/[\d.]+/g); if (!m) continue;
      const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
      const key = n.tagName + '|' + paint + '|' + cs.fontSize + '|' + own.slice(0, 18);
      if (seen.has(key)) continue;
      const sx = Math.round(Math.min(Math.max(r.left + Math.min(r.width/2, 30), 2), innerWidth - 3));
      const sy = Math.round(Math.min(Math.max(r.top + r.height/2, 2), innerHeight - 3));
      // only measure a point this element actually owns: anything covered by a sheet or a
      // floating button is being measured against the wrong background
      const hit = document.elementFromPoint(sx, sy);
      if (!hit || !(hit === n || n.contains(hit) || hit.contains(n))) continue;
      seen.add(key);
      out.push({ tag: n.tagName + '.' + (typeof n.className === 'string' ? n.className : ''), text: own.slice(0, 32),
                 fg: [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1], px, bold,
                 x: sx, y: sy });
    }
    return out;
  });

  const screens = [
    ['journal', () => App.show('journal')],
    ['entry',   () => App.openEntry(Store.entries()[0].id)],
    ['train',   () => App.show('train')],
    ['drill-brief', () => { App.show('train'); App.startDrill('f8'); }],
    ['drill-guess', () => { App.show('train'); App.startDrill('f8'); document.querySelector('[data-drill="go"]').click(); }],
    ['drill-verdict', () => { App.show('train'); App.startDrill('f8'); document.querySelector('[data-drill="go"]').click(); setTimeout(() => document.querySelector('.guess').click(), 60); }],
    ['drill-done', () => { App.show('train'); App.startDrill('f5'); document.querySelector('[data-drill="go"]').click();
                           setTimeout(() => { document.querySelectorAll('[data-ladder]').forEach(b => b.click()); setTimeout(() => { const f = document.querySelector('[data-drill="finish"]'); if (f) f.click(); }, 120); }, 60); }],
    ['shelf',   () => App.show('shelf')],
    ['bottle',  () => App.openBottle(Store.bottles()[0].id)],
    ['lexicon', () => App.show('lexicon')],
    ['lexicon-mine', () => { App.show('lexicon'); document.getElementById('lexMode').click(); }],
    ['card',    () => App.openCard('vetiver')],
    ['skill',   () => { App.show('train'); App.show('skill', true); }],
    ['settings',() => App.show('settings', true)],
    ['sheet-wear', () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); setTimeout(() => document.querySelector('[data-wear]').click(), 60); }],
    ['sheet-bottle', () => { App.show('shelf'); document.getElementById('addBottle').click(); }],
    ['sheet-tags', () => { App.openEntry(null); setTimeout(() => document.getElementById('eAddTag').click(), 60); }],
    ['toast', () => { App.show('journal'); App.toast('Kept, with the anchor.'); }],
    ['empty-journal', () => { Store.erase(); App.show('journal'); }],
    ['empty-shelf', () => App.show('shelf')],
    ['empty-lexicon', () => { App.show('lexicon'); document.getElementById('lexMode').click(); }],
    ['empty-skill', () => { App.show('train'); App.show('skill', true); }],
    ['onboard', () => { document.getElementById('onboard').hidden = false; }]
  ];
  let bad = 0, worst = [];
  for (const [name, fn] of screens) {
    /* A toast left over from an earlier screen can hide itself between the measuring pass
       and the blanked screenshot, which reads as white-on-white. Clear it first; the toast
       screen below raises its own and measures that. */
    await ev(() => { for (const s of document.querySelectorAll('.sheet')) s.hidden = true;
                     document.getElementById('onboard').hidden = true;
                     document.getElementById('toast').hidden = true; });
    await page.evaluate(`(${fn.toString()})()`);
    await wait(450);
    const items = await collect();
    if (!items.length) continue;
    await ev(() => { const s = document.createElement('style'); s.id = '__blank';
      s.textContent = '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}' +
        'text{fill:transparent!important;stroke:none!important}';
      document.head.appendChild(s); });
    await wait(80);
    const png = await page.screenshot({ encoding: 'base64' });
    await ev(() => { const s = document.getElementById('__blank'); if (s) s.remove(); });
    const bgs = await page.evaluate(async (b64, pts) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const s = img.width / window.innerWidth;
      return pts.map(p => Array.from(g.getImageData(Math.round(p.x*s), Math.round(p.y*s), 1, 1).data).slice(0, 3));
    }, png, items.map(i => ({ x: i.x, y: i.y })));
    const lum = c => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); });
      return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]; };
    items.forEach((it, i) => {
      const bg = bgs[i];
      const a = it.fg[3];
      const f = [0,1,2].map(k => Math.round(a * it.fg[k] + (1-a) * bg[k]));
      const ratio = (Math.max(lum(f), lum(bg)) + 0.05) / (Math.min(lum(f), lum(bg)) + 0.05);
      const large = it.px >= 24 || (it.px >= 18.66 && it.bold);
      const need = large ? 3 : 4.5;
      if (ratio < need) { bad++; log('  ' + scheme + ' ' + name + ' ' + it.tag + ' "' + it.text + '" ' + it.px + 'px fg=' + f + ' bg=' + bg + ' ratio=' + ratio.toFixed(2) + ' need ' + need); }
      else worst.push({ r: ratio, s: name, t: it.text, need });
    });
  }
  worst.sort((a, b) => a.r - b.r);
  log('closest passes: ' + worst.slice(0, 6).map(w => w.t.slice(0, 18) + ' ' + w.r.toFixed(2)).join(' | '));
  log(bad ? '=== ' + bad + ' contrast failures in ' + scheme + ' ===' : '=== contrast clean in ' + scheme + ' ===');
  if (errors.length) throw new Error(errors.length + ' page errors');
  if (bad) throw new Error(bad + ' contrast failures');
};
