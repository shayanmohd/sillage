/* Reviewer script 11. An export is a plain text file in the user's Downloads folder, so the
   file that comes back in is not always the file that went out. Import one that has been
   edited by hand: a status no screen knows, a context that is not on the wheel, a note id
   that is not a card. Nothing may throw, and every screen must still draw. */
module.exports = async ({ page, shot, wait, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const must = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);

  const file = JSON.stringify({
    app: 'sillage', version: 1, exportedAt: new Date().toISOString(),
    bottles: [{ id: 'b1', name: 'Hand edited', house: 'Nobody', sizeMl: 100, status: 'flagon',
                acquiredAt: Date.now() - 5e8, addedAt: Date.now() - 5e8, price: 40,
                notes: ['sea-salt', 'not-a-card'], take: { opening: 'A', heart: 'B', drydown: 'C' },
                sillage: 'enormous', seasons: ['monsoon'], story: '' }],
    entries: [{ id: 'e1', at: Date.now() - 4e8, text: 'An entry that came back in',
                anchor: 'Like something else', tags: ['sea-salt', 'not-a-card'], feeling: 'nostalgia',
                place: 'Nowhere', people: [], bottleId: 'b1' }],
    wears: [{ id: 'w1', bottleId: 'b1', at: Date.now() - 3e8, contexts: ['moonlight'], sprays: 2 },
            { id: 'w2', bottleId: 'b1', at: Date.now() - 2e8, contexts: ['work'], sprays: 1 }],
    sessions: [{ id: 's1', at: Date.now() - 1e8, track: 'foundations', sessionId: 'f4', kind: 'id',
                 results: [{ mat: 'not-a-material', ok: false, guess: 'coffee-ground' }],
                 correct: 0, total: 1, durationS: 120, note: 'A note.' }],
    settings: { hemisphere: 'north', currency: '$', showPrices: true }
  });
  const res = await ev(t => { Store.onboarded(true); return Store.importJson(t); }, file);
  log('import: ' + JSON.stringify(res));
  must(res.ok, 'the file was refused');

  await ev(() => { document.getElementById('onboard').hidden = true; App.show('journal'); });
  await wait(400);
  const views = [
    ['journal', () => App.show('journal')],
    ['shelf',   () => App.show('shelf')],
    ['bottle',  () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); }],
    ['entry',   () => App.openEntry(Store.entries()[0].id)],
    ['skill',   () => { App.show('train'); App.show('skill', true); }],
    ['lexicon', () => { App.show('lexicon'); document.getElementById('lexMode').click(); }],
    ['settings',() => App.show('settings', true)]
  ];
  let i = 0;
  for (const [name, fn] of views) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(420);
    await shot(String(++i).padStart(2, '0') + '-' + name);
    const t = await page.evaluate(() => {
      const v = document.querySelector('.screen.view:not([hidden])');
      return v ? v.innerText.replace(/\n+/g, ' | ').slice(0, 140) : 'NO VIEW';
    });
    log(name + ': ' + t);
    if (errors.length) throw new Error(name + ' threw: ' + errors.join(' ;; '));
  }
  // and again after a reload, so the repair pass sees the same file
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(500);
  await ev(() => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); });
  await wait(450);
  await shot('08-bottle-after-reload');
  if (errors.length) throw new Error(errors.length + ' page errors: ' + errors.join(' ;; '));
  log('=== a hand edited file imports and every screen still draws ===');
};
