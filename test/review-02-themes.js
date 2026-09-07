/* Reviewer script 2. Seeds a populated notebook, then tours every screen. The theme is
   whatever the run was launched with, so the same script covers light, dark and reduced
   motion. Also drops --sat and --sab in so the safe areas are proved on every screen. */
module.exports = async ({ page, shot, wait, js, click, text, errors, log }) => {
  const ev = f => page.evaluate(f);
  const safe = process.env.SAFE === '1';
  const tag = process.env.TAG || '';

  const scheme = process.env.SCHEME || 'light';
  const feats = [{ name: 'prefers-color-scheme', value: scheme }];
  if (process.env.RM === '1') feats.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await page.emulateMediaFeatures(feats);
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  if (safe) await ev(() => {
    const s = document.createElement('style');
    s.textContent = ':root{--sat:48px;--sab:34px}';
    document.head.appendChild(s);
  });
  await ev(() => {
    const D = 86400000, now = Date.now();
    Store.settings({ remindOn: false });
    Store.onboarded(true);
    const b1 = Store.addBottle({ name: "Terre d'Hermes", house: 'Hermes', sizeMl: 100, price: 128,
      acquiredAt: now - 400*D, notes: ['grapefruit','vetiver','flint-mineral'], sillage: 'room',
      seasons: ['autumn','winter'], story: 'Bought in Rome, the day it rained.',
      take: { opening: 'Grapefruit peel over hot flint', heart: 'Pepper and dry earth', drydown: 'Cedar, quiet' } });
    const b2 = Store.addBottle({ name: 'Philosykos', house: 'Diptyque', sizeMl: 50, price: 96,
      acquiredAt: now - 700*D, notes: ['fig','green-sap','coconut'], sillage: 'intimate', seasons: ['summer'] });
    const b3 = Store.addBottle({ name: 'Bois d Argent', house: 'Dior', sizeMl: 125, price: 240,
      acquiredAt: now - 900*D, notes: ['orris','iris-root'], sillage: 'arm', seasons: ['spring'] });
    for (let i = 0; i < 22; i++) Store.logWear(b1.id, { at: now - (i*11)*D, contexts: ['work'], sprays: 2 });
    for (let i = 0; i < 9; i++) Store.logWear(b2.id, { at: now - (i*23)*D, contexts: ['evening','travel'], sprays: 1 });
    const texts = [
      ['Rain hitting the hot pavement outside the bakery', 'It is like a hot tin roof and a cut grapefruit in the same room', 'Rua da Bica, Lisbon', 'longing', ['petrichor','bergamot'], b1.id, 0],
      ['The fig tree in the courtyard at four in the afternoon', 'Nine parts green sap, one part warm milk', 'Alfama', 'calm', ['fig','green-sap'], b2.id, 3],
      ['My grandmother s wardrobe, opened after a decade', 'Somewhere between orris and old paper', 'Porto', 'melancholy', ['orris','vanilla'], null, 12],
      ['Coffee ground at the counter while the door stood open', 'It arrives like toast and leaves like ash', 'Cafe Brasileira', 'joy', ['coffee','burnt-sugar'], null, 26],
      ['Wet slate on the terrace after the storm', 'The temperature of it is cold iron', '', 'alert', ['flint-mineral'], b1.id, 40],
      ['A stranger s vetiver on the tram', 'A drier version of damp earth', 'Tram 28', 'desire', ['vetiver'], null, 58],
      ['Bread proving in the flat below', 'Warmer than milk, drier than beer', '', 'comfort', ['yeast'], null, 96],
      ['The chemist on the corner, all camphor and paper', 'Closest thing: menthol. Wrong because it is dusty', '', 'unease', ['camphor'], null, 380]
    ];
    for (const [t, a, p, f, tags, bid, age] of texts) {
      Store.addEntry({ text: t, anchor: a, place: p, feeling: f, tags, bottleId: bid, at: now - age*D, people: [] });
    }
    for (const e of Store.entries()) { const r = Store.entry(e.id); }
    // sessions, oldest first, so the curve and the growth chart both have something to draw
    const sess = [['f4','id',3,4,55],['f6','recall',1,1,60],['f8','id',4,5,48],['f10','recall',1,1,90],
                  ['f12','id',5,6,42],['cpeel1','id',3,4,38],['cherb1','id',4,4,30],['f14','id',7,8,21]];
    sess.forEach(([id, kind, got, tot, age], i) => {
      const mats = (Content.TRACKS.flatMap(t => t.sessions).find(s => s.id === id) || {}).mats || [];
      const results = mats.slice(0, tot).map((m, k) => ({ mat: m, ok: k < got, guess: k < got ? null : mats[(k+1) % mats.length] }));
      Store.addSession({ at: now - age*D, track: id[0] === 'f' ? 'foundations' : 'conservatory',
        sessionId: id, kind, results, correct: got, total: tot,
        durationS: kind === 'recall' ? (age > 70 ? 60 : 90) : 240,
        note: i === 7 ? 'The rosemary read as camphor, not as herb.' : '' });
    });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(500);

  const screens = [
    ['journal', () => App.show('journal')],
    ['entry',   () => App.openEntry(Store.entries()[0].id)],
    ['train',   () => App.show('train')],
    ['drill',   () => App.startDrill('f8')],
    ['shelf',   () => App.show('shelf')],
    ['bottle',  () => App.openBottle(Store.bottles().find(b => b.name.indexOf('Terre') === 0).id)],
    ['lexicon', () => App.show('lexicon')],
    ['card',    () => App.openCard('vetiver')],
    ['skill',   () => { App.show('train'); App.show('skill', true); }],
    ['settings',() => App.show('settings', true)]
  ];
  let i = 0;
  for (const [name, fn] of screens) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(520);
    await shot(tag + String(++i).padStart(2, '0') + '-' + name);
    if (safe) {
      const under = await ev(() => {
        const sat = 48, sab = 34, out = [];
        const vis = document.querySelector('.screen.view:not([hidden])');
        const nodes = vis ? vis.querySelectorAll('*') : [];
        for (const n of nodes) {
          if (!n.textContent.trim() && !n.matches('svg,button,input,select,textarea')) continue;
          const r = n.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          const cs = getComputedStyle(n);
          if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
          if (r.top < sat && r.bottom > 2) out.push('TOP ' + n.tagName + '.' + n.className + ' top=' + Math.round(r.top));
          if (r.bottom > innerHeight - sab && r.top < innerHeight - 2) out.push('BOT ' + n.tagName + '.' + n.className + ' bottom=' + Math.round(r.bottom));
        }
        const tabs = document.getElementById('tabs');
        if (tabs && !tabs.hidden) {
          for (const t of tabs.querySelectorAll('.tab')) {
            const r = t.getBoundingClientRect();
            if (r.bottom > innerHeight - sab) out.push('BOT tab bottom=' + Math.round(r.bottom));
          }
        }
        const fab = document.getElementById('newEntry');
        if (fab && !fab.hidden) { const r = fab.getBoundingClientRect();
          if (r.bottom > innerHeight - sab - (document.body.classList.contains('has-tabs') ? 60 : 0)) out.push('BOT fab bottom=' + Math.round(r.bottom)); }
        return out;
      });
      if (under.length) log('SAFE-AREA ' + name + ': ' + JSON.stringify(under));
    }
  }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
