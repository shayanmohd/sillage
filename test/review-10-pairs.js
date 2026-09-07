/* Reviewer script 10. The pairs the sweep cannot see: placeholders (no text node), the
   faded-in and semi-transparent runs the sweep skips, and the two chips whose colour is a
   token rather than the body ink. Each is measured against the pixel actually behind it. */
module.exports = async ({ page, wait, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const scheme = process.env.SCHEME || 'light';
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  await ev(() => {
    const D = 86400000, now = Date.now();
    Store.onboarded(true);
    const b = Store.addBottle({ name: 'Salt Ledger', house: 'Fenwick and Grieve', sizeMl: 100, price: 128,
      acquiredAt: now - 400*D, notes: ['sea-salt'], sillage: 'room', seasons: ['autumn'],
      take: { opening: 'Grapefruit over flint', heart: 'Pepper', drydown: 'Cedar' } });
    for (let i = 0; i < 6; i++) Store.logWear(b.id, { at: now - i*11*D, contexts: ['work'], sprays: 2 });
    Store.addEntry({ text: 'Rain on the pavement', anchor: 'Like a hot tin roof', tags: ['petrichor'], feeling: 'calm', bottleId: b.id });
    Store.addSession({ at: now - 2*D, track: 'foundations', sessionId: 'f4', kind: 'id',
      results: [{mat:'coffee-ground',ok:true},{mat:'lemon-peel',ok:false,guess:'lime-peel'}], correct: 1, total: 2, durationS: 200, note: 'A note.' });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(400);

  const cases = [
    ['entry placeholder',  () => App.openEntry(null), '#eText', 'ph'],
    ['anchor placeholder', () => App.openEntry(null), '#eAnchor', 'ph'],
    ['place placeholder',  () => App.openEntry(null), '#ePlace', 'ph'],
    ['search placeholder', () => App.show('lexicon'), '#lexSearch', 'ph'],
    ['bottle name ph',     () => { App.show('shelf'); document.getElementById('addBottle').click(); }, '#bName', 'ph'],
    ['price ph',           () => { App.show('shelf'); document.getElementById('addBottle').click(); }, '#bPrice', 'ph'],
    ['week line',          () => App.show('journal'), '.effort', 'fg'],
    ['entry tag chip',     () => App.show('journal'), '.etag', 'fg'],
    ['entry meta',         () => App.show('journal'), '.em', 'fg'],
    ['drill teach line',   () => { App.show('train'); App.startDrill('f4'); document.querySelector('[data-drill="go"]').click(); }, '.teachline', 'fg'],
    ['miss mark',          () => { App.show('train'); App.show('skill', true); }, '.missrow .wc', 'fg'],
    ['shelf bar label',    () => { App.show('train'); App.show('skill', true); }, '.sbrow .sbval', 'fg'],
    ['take label',         () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); }, '.take p span', 'fg'],
    ['wear row context',   () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); }, '.wearrow .wc', 'fg'],
    ['danger button',      () => App.show('settings', true), '#eraseBtn', 'fg'],
    ['tab label off',      () => App.show('journal'), '.tab:not(.is-on) .tlab', 'fg'],
    ['colophon',           () => App.show('settings', true), '.colophon', 'fg']
  ];

  const lum = c => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4); });
    return 0.2126*v[0] + 0.7152*v[1] + 0.0722*v[2]; };
  let bad = 0;
  for (const [name, fn, sel, kind] of cases) {
    await ev(() => { for (const s of document.querySelectorAll('.sheet')) s.hidden = true; document.getElementById('toast').hidden = true; });
    await page.evaluate(`(${fn.toString()})()`);
    await wait(420);
    /* Bring it into the viewport first: a point below the fold samples off the screenshot
       and comes back as black, which reads as a failure that is not there. */
    await page.evaluate(s => { const n = document.querySelector(s); if (n) n.scrollIntoView({ block: 'center' }); }, sel);
    await wait(260);
    const got = await page.evaluate((s, k) => {
      const n = document.querySelector(s);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      if (r.top < 2 || r.bottom > innerHeight - 2) return null;
      if (r.width < 4 || r.height < 4) return null;
      const cs = getComputedStyle(n, k === 'ph' ? '::placeholder' : null);
      const m = String(cs.color).match(/[\d.]+/g);
      const px = parseFloat(cs.fontSize);
      const x = Math.round(r.left + Math.min(r.width / 2, 26));
      const y = Math.round(r.top + r.height / 2);
      return { fg: [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1], px, bold: +cs.fontWeight >= 700, x, y,
               op: Number(getComputedStyle(n).opacity) };
    }, sel, kind);
    if (!got) { log('SKIP ' + name + ' (' + sel + ' not on screen)'); continue; }
    await ev(() => { const s = document.createElement('style'); s.id = '__b';
      s.textContent = '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}' +
        '*::placeholder{color:transparent!important;-webkit-text-fill-color:transparent!important}text{fill:transparent!important}';
      document.head.appendChild(s); });
    await wait(70);
    const png = await page.screenshot({ encoding: 'base64' });
    await ev(() => { const s = document.getElementById('__b'); if (s) s.remove(); });
    const bg = await page.evaluate(async (b64, p) => {
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const s = img.width / window.innerWidth;
      return Array.from(g.getImageData(Math.round(p.x*s), Math.round(p.y*s), 1, 1).data).slice(0, 3);
    }, png, { x: got.x, y: got.y });
    const a = got.fg[3] * (isFinite(got.op) ? got.op : 1);
    const f = [0,1,2].map(k2 => Math.round(a * got.fg[k2] + (1 - a) * bg[k2]));
    const ratio = (Math.max(lum(f), lum(bg)) + 0.05) / (Math.min(lum(f), lum(bg)) + 0.05);
    const need = (got.px >= 24 || (got.px >= 18.66 && got.bold)) ? 3 : 4.5;
    const ok = ratio >= need;
    if (!ok) bad++;
    log((ok ? 'ok   ' : 'FAIL ') + scheme + ' ' + name + ' ' + got.px + 'px fg=' + f + ' bg=' + bg +
        ' ratio=' + ratio.toFixed(2) + ' need ' + need);
  }
  if (errors.length) throw new Error(errors.length + ' page errors');
  if (bad) throw new Error(bad + ' AA failures in ' + scheme);
  log('=== every measured pair passes AA in ' + scheme + ' ===');
};
