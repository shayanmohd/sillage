/* Reviewer script 9. With --sat 48 and --sab 34, scroll every scrollable region to its very
   end and prove the last thing in it still sits clear of the navigation bar, and that no
   fixed chrome (top bar, tab bar, the button) lands inside either inset. The blanket check
   in review-03 flags mid-list content that merely happens to be under the bar right now,
   which is what scrolling is for; this one asks the question that actually matters. */
module.exports = async ({ page, shot, wait, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.SCHEME || 'dark' }]);
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  await ev(() => { const s = document.createElement('style'); s.textContent = ':root{--sat:48px;--sab:34px}'; document.head.appendChild(s); });
  await ev(() => {
    const D = 86400000, now = Date.now();
    Store.onboarded(true);
    const b = Store.addBottle({ name: "Salt Ledger", house: 'Fenwick and Grieve', sizeMl: 100, price: 128,
      acquiredAt: now - 400*D, notes: ['sea-salt','vetiver','ambroxan'], sillage: 'room', seasons: ['autumn','winter'],
      story: 'Bought in a shop in Rome on the day it rained.',
      take: { opening: 'Grapefruit peel over hot flint', heart: 'Pepper and dry earth', drydown: 'Cedar, quiet' } });
    for (let i = 0; i < 16; i++) Store.logWear(b.id, { at: now - i*9*D, contexts: ['work'], sprays: 2 });
    for (let i = 0; i < 8; i++) Store.addEntry({ text: 'Rain on the hot pavement outside the bakery, entry ' + i,
      anchor: 'It is like a hot tin roof and a cut grapefruit', place: 'Lisbon', feeling: 'longing',
      tags: ['petrichor','bergamot'], bottleId: b.id, at: now - i*4*D, people: [] });
    Store.addSession({ at: now - 3*D, track: 'foundations', sessionId: 'f4', kind: 'id',
      results: [{mat:'coffee-ground',ok:true},{mat:'lemon-peel',ok:false,guess:'lime-peel'}], correct: 1, total: 2,
      durationS: 200, note: 'The clove read as medicinal.' });
    Store.addSession({ at: now - 1*D, track: 'foundations', sessionId: 'f6', kind: 'recall',
      results: [{mat:'lemon-peel',ok:true}], correct: 1, total: 1, durationS: 60, note: '' });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(400);

  const screens = [
    ['journal',  () => App.show('journal')],
    ['entry',    () => App.openEntry(Store.entries()[0].id)],
    ['train',    () => App.show('train')],
    ['drill',    () => { App.show('train'); App.startDrill('f8'); }],
    ['shelf',    () => App.show('shelf')],
    ['bottle',   () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); }],
    ['lexicon',  () => App.show('lexicon')],
    ['card',     () => { App.show('lexicon'); App.openCard('vetiver'); }],
    ['skill',    () => { App.show('train'); App.show('skill', true); }],
    ['settings', () => App.show('settings', true)]
  ];
  const fails = [];
  let i = 0;
  for (const [name, fn] of screens) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(400);
    await ev(() => { const s = document.querySelector('.screen.view:not([hidden]) .scroller'); if (s) s.scrollTop = s.scrollHeight; });
    await wait(350);
    await shot(String(++i).padStart(2, '0') + '-' + name + '-end');
    const r = await ev(() => {
      const out = [];
      const SAT = 48, SAB = 34;
      const paint = n => {
        const cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.06) return false;
        if (n.querySelector('*') && !n.matches('button,input,select,textarea')) return false;
        if (!n.textContent.trim() && !n.matches('svg,path,circle,rect,input,button')) return false;
        return true;
      };
      /* A scroller clips: a paragraph that has been scrolled up past the top bar has a
         negative rect but is not painted there. Only the part of a node that survives its
         scroll container's own box counts as being on the screen. */
      const clip = n => {
        let box = n.getBoundingClientRect();
        for (let p = n.parentElement; p; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflowY === 'hidden') {
            const c = p.getBoundingClientRect();
            box = { top: Math.max(box.top, c.top), bottom: Math.min(box.bottom, c.bottom),
                    left: box.left, right: box.right, width: box.width, height: 0 };
            box.height = box.bottom - box.top;
          }
        }
        return box;
      };
      const roots = [document.querySelector('.screen.view:not([hidden])'),
                     document.getElementById('tabs'), document.getElementById('newEntry')];
      for (const root of roots) {
        if (!root || root.hidden) continue;
        for (const n of [root].concat(Array.from(root.querySelectorAll('*')))) {
          if (!paint(n)) continue;
          const b = clip(n);
          if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > innerHeight) continue;
          const id = n.tagName + '.' + (typeof n.className === 'string' ? n.className : n.className.baseVal).split(' ')[0] +
                     ' "' + n.textContent.trim().slice(0, 22) + '"';
          if (b.top < SAT) out.push('TOP ' + id + ' top=' + Math.round(b.top));
          if (b.bottom > innerHeight - SAB) out.push('BOT ' + id + ' bottom=' + Math.round(b.bottom) + '/' + innerHeight);
        }
      }
      return out;
    });
    if (r.length) { fails.push(name + ' ' + JSON.stringify(r)); log('BAR ' + name + ': ' + JSON.stringify(r)); }
    else log(name + ': scrolled to the end, clear of both bars');
  }

  // the sheets, each scrolled to its own end
  const sheets = [
    ['sheet-bottle', () => { App.show('shelf'); document.getElementById('addBottle').click(); }],
    ['sheet-wear',   () => { App.show('shelf'); document.querySelector('[data-bottle]').click(); setTimeout(() => document.querySelector('[data-wear]').click(), 100); }],
    ['sheet-tags',   () => { App.openEntry(null); setTimeout(() => document.getElementById('eAddTag').click(), 100); }]
  ];
  for (const [name, fn] of sheets) {
    await ev(() => { for (const s of document.querySelectorAll('.sheet')) s.hidden = true; });
    await page.evaluate(`(${fn.toString()})()`);
    await wait(600);
    await ev(() => { const p = document.querySelector('.sheet:not([hidden]) .sheet-panel'); if (p) p.scrollTop = p.scrollHeight; });
    await wait(300);
    await shot(String(++i).padStart(2, '0') + '-' + name + '-end');
    const r = await ev(() => {
      const p = document.querySelector('.sheet:not([hidden]) .sheet-panel');
      if (!p) return ['no sheet open'];
      const out = [];
      const box = p.getBoundingClientRect();
      out.push('panel top=' + Math.round(box.top) + ' bottom=' + Math.round(box.bottom) + ' vh=' + innerHeight +
               ' scroll=' + p.scrollHeight + '/' + Math.round(p.clientHeight));
      for (const n of p.querySelectorAll('button,input,select,textarea')) {
        const r = n.getBoundingClientRect();
        const b = { top: Math.max(r.top, box.top), bottom: Math.min(r.bottom, box.bottom), height: 0 };
        b.height = b.bottom - b.top;
        if (b.height < 2) continue;
        if (b.bottom > innerHeight - 34 && b.top < innerHeight)
          out.push('BOT ' + n.tagName + ' "' + (n.textContent || n.placeholder || '').trim().slice(0, 20) + '" bottom=' + Math.round(b.bottom));
      }
      return out;
    });
    log(name + ': ' + JSON.stringify(r));
    if (r.some(x => x.indexOf('BOT ') === 0)) fails.push(name + ' ' + JSON.stringify(r));
  }

  if (errors.length) throw new Error(errors.length + ' page errors');
  if (fails.length) throw new Error('content under a bar: ' + fails.join(' ;; '));
  log('=== every scroller and sheet reaches its end clear of both bars ===');
};
