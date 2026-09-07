/* Reviewer script 5. window.App.back() on every nested screen and sheet, plus onPause and
   onResume, including a drill in progress and a drill that has been thrown away. */
module.exports = async ({ page, shot, wait, text, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const must = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
  const view = () => ev(() => { const v = document.querySelector('.screen.view:not([hidden])'); return v ? v.id : null; });
  const sheets = () => ev(() => Array.from(document.querySelectorAll('.sheet')).filter(s => !s.hidden).map(s => s.id));

  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(200);
  await ev(() => {
    Store.onboarded(true);
    const b = Store.addBottle({ name: "Terre d'Hermes", house: 'Hermes', price: 128, sizeMl: 100, notes: ['vetiver'] });
    Store.logWear(b.id, {});
    Store.addEntry({ text: 'Rain on the pavement', anchor: 'Like a hot tin roof', tags: ['petrichor'], bottleId: b.id });
    document.getElementById('onboard').hidden = true;
    App.show('journal');
  });
  await wait(300);

  must(await ev(() => typeof window.App === 'object' && typeof window.App.back === 'function'), 'window.App.back missing');
  must(await ev(() => App.back()) === false, 'back() at the journal root did not return false');
  log('root back(): false, correct');

  const nested = [
    ['entry',    () => App.openEntry(Store.entries()[0].id), 'v-journal'],
    ['bottle',   () => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); }, 'v-shelf'],
    ['card',     () => { App.show('lexicon'); App.openCard('vetiver'); }, 'v-lexicon'],
    ['skill',    () => { App.show('train'); App.show('skill', true); }, 'v-train'],
    ['settings', () => { App.show('journal'); App.show('settings', true); }, 'v-journal'],
    ['drill',    () => { App.show('train'); App.startDrill('f1'); }, 'v-train']
  ];
  for (const [name, fn, expect] of nested) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(300);
    must(await view() === 'v-' + name, name + ' did not open (saw ' + await view() + ')');
    const r = await ev(() => App.back());
    await wait(250);
    must(r === true, 'back() from ' + name + ' returned ' + r);
    must(await view() === expect, 'back() from ' + name + ' landed on ' + await view() + ', expected ' + expect);
    log('back from ' + name + ' -> ' + expect + ' ok');
  }

  // deep: shelf -> bottle -> card -> back -> bottle -> back -> shelf
  await ev(() => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); App.openCard('vetiver'); });
  await wait(300);
  must(await view() === 'v-card', 'deep push failed');
  must(await ev(() => App.back()) === true, 'deep back 1');
  await wait(200);
  must(await view() === 'v-bottle', 'deep back 1 landed on ' + await view());
  must(await ev(() => App.back()) === true, 'deep back 2');
  await wait(200);
  must(await view() === 'v-shelf', 'deep back 2 landed on ' + await view());
  log('deep stack unwinds one screen at a time');

  // lexicon sub-state
  await ev(() => { App.show('lexicon'); document.querySelector('.famrow').click(); });
  await wait(300);
  must(await ev(() => !!document.querySelector('[data-fam=""]')), 'family view did not open');
  must(await ev(() => App.back()) === true, 'back from a lexicon family');
  await wait(200);
  must(await ev(() => !document.querySelector('[data-fam=""]')), 'back did not leave the family view');
  log('lexicon family back ok');

  // sheets, one at a time, topmost first
  await ev(() => { App.show('shelf'); document.getElementById('addBottle').click(); });
  await wait(300);
  await ev(() => document.getElementById('bAddNote').click());
  await wait(400);
  must(JSON.stringify(await sheets()) === JSON.stringify(['sheetTags', 'sheetBottle']) ||
       JSON.stringify(await sheets()) === JSON.stringify(['sheetBottle', 'sheetTags']), 'both sheets not open: ' + JSON.stringify(await sheets()));
  await shot('01-two-sheets');
  must(await ev(() => App.back()) === true, 'back with two sheets');
  await wait(200);
  must(JSON.stringify(await sheets()) === JSON.stringify(['sheetBottle']), 'back closed the wrong sheet: ' + JSON.stringify(await sheets()));
  must(await ev(() => App.back()) === true, 'back with one sheet');
  await wait(200);
  must((await sheets()).length === 0, 'the bottle sheet stayed open');
  log('back peels one sheet at a time');

  // wear sheet
  await ev(() => { App.show('shelf'); document.querySelector('[data-bottle]').click(); });
  await wait(300);
  await ev(() => document.querySelector('[data-wear]').click());
  await wait(300);
  must((await sheets()).length === 1, 'wear sheet did not open');
  must(await ev(() => App.back()) === true, 'back from the wear sheet');
  await wait(200);
  must((await sheets()).length === 0, 'wear sheet stayed open');

  // ---- lifecycle
  must(await ev(() => { App.onPause(); return true; }), 'onPause threw');
  must(await ev(() => { App.onResume(); return true; }), 'onResume threw');
  log('onPause / onResume on a plain screen: no throw');

  // a timed drill in progress: pause must stop the clock, resume must keep the round
  await ev(() => { App.show('train'); App.startDrill('f1'); document.querySelector('[data-drill="go"]').click(); });
  await wait(2400);
  const c1 = await text('#drillClock');
  await ev(() => App.onPause());
  await wait(2500);
  const c2 = await text('#drillClock');
  must(c1 === c2, 'the drill clock kept running after onPause (' + c1 + ' -> ' + c2 + ')');
  await ev(() => App.onResume());
  await wait(2400);
  const c3 = await text('#drillClock');
  must(Number(c3) < Number(c2), 'the clock did not restart after onResume (' + c2 + ' -> ' + c3 + ')');
  must(await view() === 'v-drill', 'onResume threw the round away');
  log('drill clock: ' + c1 + ' -> paused ' + c2 + ' -> resumed ' + c3);
  await shot('02-drill-resumed');

  // a scored round in progress, then pause/resume, then finish: the telemetry must survive
  await ev(() => { App.show('train'); App.startDrill('f4'); document.querySelector('[data-drill="go"]').click(); });
  await wait(300);
  await ev(() => { document.querySelector('.guess').click(); });
  await wait(200);
  await ev(() => { document.querySelector('[data-verdict="hit"]').click(); });
  await wait(250);
  await ev(() => { document.querySelector('.guess').click(); });
  await wait(200);
  await ev(() => { document.querySelector('[data-verdict="hit"]').click(); });
  await wait(250);
  await ev(() => { App.onPause(); App.onResume(); });
  await wait(400);
  must(await view() === 'v-drill', 'the round was thrown away by a pause');
  await shot('03-round-kept');
  await ev(() => { document.querySelector('.guess').click(); });
  await wait(200);
  await ev(() => document.querySelector('[data-verdict="hit"]').click());
  await wait(250);
  await ev(() => { document.querySelector('.guess').click(); });
  await wait(200);
  await ev(() => document.querySelector('[data-verdict="hit"]').click());
  await wait(400);
  must(await ev(() => !!document.querySelector('[data-drill="save"]')), 'round did not finish');
  await ev(() => document.querySelector('[data-drill="save"]').click());
  await wait(500);
  const s = await ev(() => Store.sessions()[0]);
  log('session after a paused round: ' + JSON.stringify({ correct: s.correct, total: s.total, results: s.results.length }));
  must(s.total === 4 && s.correct === 4 && s.results.length === 4, 'drill telemetry did not survive the pause: ' + JSON.stringify(s));

  // a stale drill button after the round is gone
  await ev(() => { App.show('train'); App.startDrill('f1'); });
  await wait(300);
  await ev(() => { const b = document.querySelector('[data-drill="go"]'); App.back(); document.body.appendChild(b); b.click(); });
  await wait(300);
  log('stale drill button: no throw');

  must(await ev(() => { App.onPause(); App.onResume(); return true; }), 'lifecycle threw after the drill');
  if (errors.length) throw new Error(errors.length + ' page errors');
  log('=== back and lifecycle clean ===');
};
