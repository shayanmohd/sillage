/* Reviewer script 3. --sat 48 and --sab 34, then every screen checked for a *leaf* painted
   element (text, control or svg with no element children) whose box lands inside either bar. */
module.exports = async ({ page, shot, wait, click, errors, log }) => {
  const ev = f => page.evaluate(f);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.SCHEME || 'light' }]);
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  await ev(() => { const s = document.createElement('style'); s.textContent = ':root{--sat:48px;--sab:34px}'; document.head.appendChild(s); });
  await wait(150);
  await shot('00-onboard-safe');
  let bad = await ev(() => {
    const out = [];
    const leaves = Array.from(document.querySelectorAll('#onboard *')).filter(n => !n.querySelector('*'));
    for (const n of leaves) {
      const r = n.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
      if (!n.textContent.trim() && !n.matches('svg,path,input,button,i')) continue;
      if (r.top < 48 && r.bottom > 0) out.push('onboard TOP ' + n.tagName + '.' + (n.className.baseVal || n.className) + ' ' + Math.round(r.top));
      if (r.bottom > innerHeight - 34 && r.top < innerHeight) out.push('onboard BOT ' + n.tagName + '.' + (n.className.baseVal || n.className) + ' ' + Math.round(r.bottom));
    }
    return out;
  });
  if (bad.length) log('SAFE onboard: ' + JSON.stringify(bad));

  await ev(() => {
    const D = 86400000, now = Date.now();
    Store.onboarded(true);
    const b = Store.addBottle({ name: "Terre d'Hermes", house: 'Hermes', sizeMl: 100, price: 128, acquiredAt: now - 400*D, notes: ['grapefruit','vetiver'], sillage: 'room', seasons: ['autumn'], take: { opening: 'Grapefruit peel over hot flint', heart: 'Pepper', drydown: 'Cedar' } });
    for (let i = 0; i < 12; i++) Store.logWear(b.id, { at: now - i*9*D, contexts: ['work'], sprays: 2 });
    for (let i = 0; i < 6; i++) Store.addEntry({ text: 'Rain on the hot pavement outside the bakery, entry ' + i, anchor: 'It is like a hot tin roof and a cut grapefruit', place: 'Lisbon', feeling: 'longing', tags: ['petrichor','bergamot'], bottleId: b.id, at: now - i*4*D, people: [] });
    Store.addSession({ at: now - 3*D, track: 'foundations', sessionId: 'f4', kind: 'id', results: [{mat:'coffee-ground',ok:true},{mat:'lemon-peel',ok:false,guess:'lime-peel'}], correct: 1, total: 2, durationS: 200, note: 'The clove read as medicinal.' });
    Store.addSession({ at: now - 1*D, track: 'foundations', sessionId: 'f6', kind: 'recall', results: [{mat:'lemon-peel',ok:true}], correct: 1, total: 1, durationS: 60, note: '' });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(400);

  const views = [
    ['journal', () => App.show('journal')],
    ['entry', () => App.openEntry(null)],
    ['train', () => App.show('train')],
    ['drill', () => App.startDrill('f8')],
    ['shelf', () => App.show('shelf')],
    ['bottle', () => App.openBottle(Store.bottles()[0].id)],
    ['lexicon', () => App.show('lexicon')],
    ['card', () => App.openCard('vetiver')],
    ['skill', () => { App.show('train'); App.show('skill', true); }],
    ['settings', () => App.show('settings', true)],
    ['sheet-wear', () => { App.show('shelf'); document.querySelector('[data-bottle]').click(); setTimeout(() => document.querySelector('[data-wear]').click(), 80); }],
    ['sheet-bottle', () => { App.show('shelf'); document.getElementById('addBottle').click(); }],
    ['sheet-tags', () => { App.openEntry(null); setTimeout(() => document.getElementById('eAddTag').click(), 80); }]
  ];
  let i = 0, fails = [];
  for (const [name, fn] of views) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(600);
    await shot(String(++i).padStart(2, '0') + '-' + name);
    const res = await ev(() => {
      const out = [];
      const roots = [document.querySelector('.screen.view:not([hidden])'), document.getElementById('tabs'),
                     document.getElementById('newEntry'), document.getElementById('toast')]
        .concat(Array.from(document.querySelectorAll('.sheet:not([hidden])')));
      for (const root of roots) {
        if (!root || root.hidden) continue;
        const nodes = [root].concat(Array.from(root.querySelectorAll('*')));
        for (const n of nodes) {
          if (n.querySelector('*') && !n.matches('button,input,select,textarea')) continue;
          const r = n.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) continue;
          if (r.bottom < 0 || r.top > innerHeight) continue;
          const cs = getComputedStyle(n);
          if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
          if (!n.textContent.trim() && !n.matches('svg,path,circle,rect,input,button')) continue;
          const id = n.tagName + '.' + (typeof n.className === 'string' ? n.className : n.className.baseVal) + ' "' + n.textContent.trim().slice(0, 24) + '"';
          if (r.top < 48) out.push('TOP ' + id + ' top=' + Math.round(r.top));
          if (r.bottom > innerHeight - 34) out.push('BOT ' + id + ' bottom=' + Math.round(r.bottom));
        }
      }
      return out;
    });
    if (res.length) { fails.push(name + ': ' + JSON.stringify(res)); log('SAFE ' + name + ': ' + JSON.stringify(res)); }
  }
  if (errors.length) throw new Error(errors.length + ' page errors');
  if (fails.length) log('=== ' + fails.length + ' screens with content in a bar ===');
  else log('=== safe areas clean on every screen ===');
};
