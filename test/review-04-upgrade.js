/* Reviewer script 4. Seeds localStorage exactly as the shipped 1.0.0 store module wrote it
   (the module is pulled straight out of the first commit and run in the page), then loads the
   1.0.1 build over it and proves nothing is lost or misread.
   It deliberately includes the records 1.0.0 was happy to write and 1.0.1 now refuses:
   a wear dated in the future, a negative price, a spray count as a string, a huge size. */
const { execSync } = require('child_process');
const path = require('path');

module.exports = async ({ page, shot, wait, text, click, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const must = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
  const repo = path.resolve(__dirname, '..');
  const oldStore = execSync('git -C ' + repo + ' show 988bdaf:web/js/store.js').toString();

  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(200);

  const written = await ev((src) => {
    // run the 1.0.0 store module under its own name and let it write the record
    const mod = src.replace('const Store = (() => {', 'window.OldStore = (() => {');
    (0, eval)(mod);
    const S = window.OldStore;
    const D = 86400000, now = Date.now();
    S.onboarded(true);
    S.settings({ hemisphere: 'south', currency: 'GBP ', showPrices: true, remindOn: true, remindTime: '06:30', remindEvery: 2 });
    const b1 = S.addBottle({ name: "Terre d'Hermes", house: 'Hermes', sizeMl: 100, price: 128,
      acquiredAt: now - 500*D, notes: ['grapefruit','vetiver','flint-mineral'], sillage: 'room',
      seasons: ['autumn','winter'], story: 'Bought in Rome, the day it rained.',
      take: { opening: 'Grapefruit peel over hot flint', heart: 'Pepper and dry earth', drydown: 'Cedar, quiet' } });
    // 1.0.0 happily stored a negative price and a five thousand ml bottle
    const b2 = S.addBottle({ name: 'Philosykos', house: 'Diptyque', sizeMl: 5000, price: -40,
      acquiredAt: now - 300*D, notes: ['fig'], sillage: 'intimate', seasons: ['summer'] });
    const b3 = S.addBottle({ name: 'Bois d Argent', house: 'Dior', sizeMl: 125, price: 240, acquiredAt: now - 900*D, notes: ['orris'] });
    for (let i = 0; i < 14; i++) S.logWear(b1.id, { at: now - i*13*D, contexts: ['work'], sprays: 2 });
    for (let i = 0; i < 5; i++) S.logWear(b2.id, { at: now - i*40*D, contexts: ['evening'], sprays: '3' });
    // and a wear somebody dated in 2099 with the old picker
    S.logWear(b1.id, { at: now + 400*D, contexts: ['occasion'], sprays: 99 });
    const es = [
      ['Rain hitting the hot pavement outside the bakery', 'It is like a hot tin roof and a cut grapefruit', 'Rua da Bica, Lisbon', 'longing', ['petrichor','bergamot'], b1.id, 2],
      ['The fig tree in the courtyard at four', 'Nine parts green sap, one part warm milk', 'Alfama', 'calm', ['fig'], b2.id, 20],
      ['My grandmother wardrobe after a decade', 'Somewhere between orris and old paper', 'Porto', 'melancholy', ['orris'], null, 365],
      ['Coffee ground at the counter', 'It arrives like toast and leaves like ash', '', 'joy', ['coffee'], b3.id, 366]
    ];
    for (const [t, a, p, f, tags, bid, age] of es) S.addEntry({ text: t, anchor: a, place: p, feeling: f, tags, bottleId: bid, at: now - age*D, people: ['Ines'] });
    S.addSession({ at: now - 30*D, track: 'foundations', sessionId: 'f4', kind: 'id',
      results: [{mat:'coffee-ground',ok:true},{mat:'lemon-peel',ok:true},{mat:'clove-whole',ok:false,guess:'mint-dried'},{mat:'mint-dried',ok:true}],
      correct: 3, total: 4, durationS: 260, note: 'The clove read as medicinal, not as warm.' });
    S.addSession({ at: now - 12*D, track: 'foundations', sessionId: 'f6', kind: 'recall',
      results: [{mat:'lemon-peel',ok:true}], correct: 1, total: 1, durationS: 60, note: '' });
    S.addSession({ at: now - 4*D, track: 'conservatory', sessionId: 'cpeel1', kind: 'id',
      results: [{mat:'lemon-peel',ok:true},{mat:'orange-peel',ok:false,guess:'mandarin-peel'},{mat:'lime-peel',ok:true},{mat:'grapefruit-peel',ok:true}],
      correct: 3, total: 4, durationS: 300, note: 'Mandarin and orange are still one smell to me.' });
    return localStorage.getItem('sillage.v1');
  }, oldStore);
  log('1.0.0 record is ' + written.length + ' bytes');
  const old = JSON.parse(written);

  // now load the 1.0.1 build over exactly that record
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  const now = await ev(() => ({ counts: Store.counts(), settings: Store.settings(), onboarded: Store.onboarded() }));
  log('after upgrade: ' + JSON.stringify(now.counts));
  must(now.onboarded === true, 'a 1.0.0 user was shown onboarding again');
  must(now.counts.entries === old.entries.length, 'entries lost: ' + now.counts.entries + ' of ' + old.entries.length);
  must(now.counts.bottles === old.bottles.length, 'bottles lost');
  must(now.counts.wears === old.wears.length, 'wears lost');
  must(now.counts.sessions === old.sessions.length, 'sessions lost');
  must(now.settings.hemisphere === 'south' && now.settings.currency === 'GBP ' && now.settings.remindEvery === 2,
       'settings misread: ' + JSON.stringify(now.settings));
  await shot('01-journal');

  /* The records 1.0.0 was happy to write are still in the file. 1.0.1 clamps on the way in,
     so the question is what it now prints for them. */
  await ev(() => App.show('shelf'));
  await wait(500);
  await shot('02-shelf');
  log('SHELF head: ' + JSON.stringify(await text('#shelfCount')));
  log('SHELF stats: ' + JSON.stringify((await text('#shelfStats')).replace(/\n/g, ' | ')));
  log('NEGLECTED: ' + JSON.stringify((await text('#neglected') || '').replace(/\n/g, ' | ')));
  log('GRID: ' + JSON.stringify((await text('#bottleGrid')).replace(/\n/g, ' | ')));
  let k = 2;
  for (const nm of ['Terre', 'Philosykos']) {
    await page.evaluate((n) => App.openBottle(Store.bottles().find(b => b.name.indexOf(n) === 0).id), nm);
    await wait(500);
    await shot(String(++k).padStart(2, '0') + '-bottle-' + nm);
    log(nm + ': ' + JSON.stringify((await text('#bottleBody')).replace(/\n/g, ' | ').slice(0, 700)));
  }
  await ev(() => { App.show('train'); App.show('skill', true); });
  await wait(500);
  await shot('05-skill');
  await ev(() => App.show('settings', true));
  await wait(400);
  await shot('06-settings');
  log('COUNTS: ' + await text('#countLine'));
  if (errors.length) throw new Error(errors.length + ' page errors');
};
