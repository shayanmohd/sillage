/* The shell contract: window.App.back() on every nested screen and every sheet, onPause and
   onResume, and what happens to a running drill timer when the app goes to the background.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/03-back-lifecycle.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, errors, log }) => {
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);

  const view = () => page.evaluate(() => { const v = document.querySelector('.view:not([hidden])'); return v ? v.id : null; });
  const back = () => page.evaluate(() => window.App.back());
  const fail = [];

  // 1. root
  if (await back() !== false) fail.push('back() at the journal root returned true');
  log('root back ->', 'false');

  // 2. every pushed page
  const pushes = [
    ['settings', () => page.evaluate(() => window.App.show('settings', true))],
    ['skill', () => page.evaluate(() => window.App.show('skill', true))],
    ['bottle', () => page.evaluate(() => window.App.openBottle(JSON.parse(localStorage.getItem('sillage.v1')).bottles[0].id))],
    ['card', () => page.evaluate(() => window.App.openCard('indolic'))],
    ['entry', () => page.evaluate(() => window.App.openEntry(null))],
    ['drill', () => page.evaluate(() => window.App.startDrill('f4'))]
  ];
  for (const [name, open] of pushes) {
    await page.evaluate(() => window.App.show('journal'));
    await wait(120);
    await open();
    await wait(220);
    const at = await view();
    const r = await back();
    const to = await view();
    log(name, 'opened as', at, '| back ->', r, '| landed on', to);
    if (at !== 'v-' + name) fail.push(name + ' did not open (' + at + ')');
    if (r !== true) fail.push('back() on ' + name + ' returned ' + r);
  }

  // 3. a page pushed from a tab that is not the journal returns to that tab
  await page.evaluate(() => window.App.show('shelf'));
  await wait(150);
  await page.evaluate(() => window.App.openBottle(JSON.parse(localStorage.getItem('sillage.v1')).bottles[2].id));
  await wait(200);
  await back();
  await wait(150);
  if (await view() !== 'v-shelf') fail.push('back from a bottle did not return to the shelf');
  log('bottle -> back ->', await view());

  // 4. two levels deep: shelf, bottle, lexicon card
  await page.evaluate(() => window.App.openBottle(JSON.parse(localStorage.getItem('sillage.v1')).bottles[2].id));
  await wait(200);
  await page.evaluate(() => window.App.openCard('vetiver'));
  await wait(200);
  await back(); await wait(150);
  const mid = await view();
  await back(); await wait(150);
  const end = await view();
  log('shelf > bottle > card, back twice ->', mid, end);
  if (mid !== 'v-bottle' || end !== 'v-shelf') fail.push('two level back went ' + mid + ' then ' + end);

  // 5. sheets
  await page.evaluate(() => window.App.show('shelf'));
  await wait(120);
  await page.evaluate(() => document.querySelector('#addBottle').click());
  await wait(250);
  if (await back() !== true) fail.push('back() with the bottle sheet open returned false');
  if (await page.evaluate(() => !document.querySelector('#sheetBottle').hidden)) fail.push('back did not close the bottle sheet');
  log('sheet closes on back');

  // the note picker stacked on the bottle editor
  await page.evaluate(() => document.querySelector('#addBottle').click());
  await wait(200);
  await page.evaluate(() => document.querySelector('#bAddNote').click());
  await wait(250);
  await shot('50-stacked-sheets');
  await back(); await wait(150);
  const open = await page.evaluate(() => Array.from(document.querySelectorAll('.sheet')).filter(s => !s.hidden).length);
  log('sheets open after one back:', open);

  // 6. a running drill timer must stop on pause and the drill must not resume mid round
  await page.evaluate(() => window.App.show('train'));
  await wait(150);
  await page.evaluate(() => window.App.startDrill('f1'));
  await wait(200);
  await page.evaluate(() => document.querySelector('[data-drill="go"]').click());
  await wait(1300);
  const t1 = await page.evaluate(() => { const el = document.querySelector('#drillClock'); return el ? el.textContent : null; });
  await page.evaluate(() => window.App.onPause());
  await wait(2500);
  const t2 = await page.evaluate(() => { const el = document.querySelector('#drillClock'); return el ? el.textContent : null; });
  log('clock at pause', t1, 'after 2.5s paused', t2);
  if (t1 !== t2) fail.push('the drill clock kept running after onPause (' + t1 + ' -> ' + t2 + ')');
  await page.evaluate(() => window.App.onResume());
  await wait(1600);
  const t3 = await page.evaluate(() => { const el = document.querySelector('#drillClock'); return el ? el.textContent : null; });
  log('view after resume:', await view(), '| clock ticking again at', t3);
  if (await view() !== 'v-drill') fail.push('onResume threw away a round in progress');
  if (Number(t3) >= Number(t2)) fail.push('the drill clock did not restart after onResume (' + t2 + ' -> ' + t3 + ')');
  await shot('51-after-resume');
  await page.evaluate(() => { window.App.back(); });
  await wait(200);

  // 7. onPause and onResume from every screen, twice, must not throw
  for (const v of ['journal', 'train', 'shelf', 'lexicon', 'settings', 'skill']) {
    await page.evaluate(n => window.App.show(n), v);
    await wait(80);
    await page.evaluate(() => { window.App.onPause(); window.App.onPause(); window.App.onResume(); window.App.onResume(); });
    await wait(80);
  }
  log('onPause/onResume survived every screen');

  if (fail.length) { for (const f of fail) console.error('  FAIL: ' + f); throw new Error(fail.length + ' back/lifecycle failures'); }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
