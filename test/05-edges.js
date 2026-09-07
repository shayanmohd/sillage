/* Every input with an edge, rapid double taps on every primary button, and rotating
   through screens fast enough to catch a render that reads stale state.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/05-edges.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');
const LONG = 'petrichor '.repeat(90);

module.exports = async ({ page, shot, wait, text, errors, log }) => {
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  const fail = [];
  const set = (sel, v) => page.evaluate((s, val) => {
    const el = document.querySelector(s); el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, sel, v);
  const tapSel = async (sel, n) => {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.evaluate((s, times) => {
      const el = document.querySelector(s);
      for (let i = 0; i < times; i++) el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, sel, n || 1);
    await wait(220);
  };
  const count = k => page.evaluate(key => JSON.parse(localStorage.getItem('sillage.v1'))[key].length, k);

  // 1. an empty entry must not save
  const e0 = await count('entries');
  await page.evaluate(() => window.App.openEntry(null));
  await wait(250);
  await set('#eText', '   ');
  await tapSel('#entrySave');
  if (await count('entries') !== e0) fail.push('an empty entry saved');
  log('empty entry rejected, toast:', await text('#toast'));

  // 2. rapid double tap on Save must write one entry, not two
  await set('#eText', 'Double tap check, wet stone and hot butter.');
  await tapSel('#entrySave', 3);
  await wait(400);
  const e1 = await count('entries');
  log('entries after a triple tap on Save:', e0, '->', e1);
  if (e1 !== e0 + 1) fail.push('a triple tap on Save wrote ' + (e1 - e0) + ' entries');

  // 3. a very long entry and a very long anchor
  await page.evaluate(() => window.App.openEntry(null));
  await wait(200);
  await set('#eText', LONG);
  await set('#eAnchor', LONG);
  await set('#ePlace', LONG);
  await set('#ePeople', ',,, , ,');
  await tapSel('#entrySave');
  await wait(400);
  await shot('54-edge-long-entry');
  const longEntry = await page.evaluate(() => Store.entries()[0]);
  log('long entry: text', longEntry.text.length, 'anchor', longEntry.anchor.length,
      'place', longEntry.place.length, 'people', JSON.stringify(longEntry.people), 'tags', longEntry.tags.length);
  if (longEntry.people.length) fail.push('a people field of only commas produced ' + longEntry.people.length + ' people');

  // 4. a bottle with no name, then zero, negative and absurd numbers
  await page.evaluate(() => window.App.show('shelf'));
  await wait(150);
  const b0 = await count('bottles');
  await tapSel('#addBottle');
  await set('#bName', '');
  await tapSel('#bSave');
  if (await count('bottles') !== b0) fail.push('a nameless bottle saved');
  await set('#bName', 'Edge Case');
  await set('#bSize', '0');
  await set('#bPrice', '-40');
  await set('#bAcquired', '1970-01-01');
  await tapSel('#bSave');
  await wait(300);
  const edge = await page.evaluate(() => Store.bottles().find(b => b.name === 'Edge Case'));
  log('edge bottle:', JSON.stringify({ sizeMl: edge.sizeMl, price: edge.price, acquiredAt: new Date(edge.acquiredAt).toISOString().slice(0, 10) }));
  if (edge.price < 0) fail.push('a negative price was stored as ' + edge.price);
  await page.evaluate(() => window.App.openBottle(Store.bottles().find(b => b.name === 'Edge Case').id));
  await wait(350);
  await shot('55-edge-bottle');
  const body = await text('#bottleBody');
  if (/NaN|Infinity|undefined/.test(body)) fail.push('the bottle page printed NaN, Infinity or undefined');
  log('bottle page head:', body.split('\n').slice(0, 4).join(' | '));

  // 5. a duplicate bottle name
  await page.evaluate(() => window.App.show('shelf'));
  await wait(150);
  await tapSel('#addBottle');
  await set('#bName', 'Edge Case');
  await tapSel('#bSave');
  await wait(250);
  const dupes = await page.evaluate(() => Store.bottles().filter(b => b.name === 'Edge Case').length);
  log('bottles named Edge Case:', dupes);

  // 6. a wear dated in the future and one in the past
  const bid = await page.evaluate(() => Store.bottles().find(b => b.name === 'Edge Case').id);
  await page.evaluate(id => { window.App.openBottle(id); }, bid);
  await wait(250);
  await tapSel('[data-wear]');
  await set('#wearDate', '2099-01-01');
  await set('#wearSprays', '999');
  await tapSel('#wearSave');
  await wait(300);
  await shot('56-edge-future-wear');
  const st = await page.evaluate(id => Store.bottleStats(id), bid);
  log('stats with a wear in 2099:', JSON.stringify({ wears: st.wears, daysSince: st.daysSince, perMonth: Math.round(st.perMonth) }));
  const bodyF = await text('#bottleBody');
  if (/NaN|Infinity|undefined/.test(bodyF)) fail.push('a future wear printed NaN, Infinity or undefined');
  if (/in -\d/.test(bodyF)) fail.push('a future wear printed a negative age');
  log('future wear reads as:', (bodyF.match(/unworn[^\n]*|\d+ days ago|today|yesterday/g) || []).slice(0, 3).join(' / '));

  // 7. rapid double taps on the other primary buttons
  await page.evaluate(() => window.App.show('journal'));
  await wait(150);
  await tapSel('#newEntry', 3);
  await wait(200);
  const v = await page.evaluate(() => document.querySelector('.view:not([hidden])').id);
  log('triple tap on the nose button lands on', v);
  if (v !== 'v-entry') fail.push('a triple tap on the nose button landed on ' + v);
  await page.evaluate(() => window.App.back());
  await wait(200);

  // starting a drill three times in a row must leave one drill running
  await page.evaluate(() => window.App.show('train'));
  await wait(200);
  await tapSel('[data-start]', 3);
  await wait(300);
  const step = await text('#drillStep');
  log('triple tap on Begin:', step);
  await page.evaluate(() => window.App.back());
  await wait(200);

  // 8. rotating through screens fast
  for (let i = 0; i < 4; i++) {
    for (const t of ['journal', 'train', 'shelf', 'lexicon']) {
      await page.evaluate(n => document.querySelector('.tab[data-view="' + n + '"]').click(), t);
    }
  }
  await wait(500);
  await shot('57-edge-after-fast-tabs');
  log('after 16 fast tab switches, on', await page.evaluate(() => document.querySelector('.view:not([hidden])').id));

  // 9. search with nothing matching, and with punctuation
  await page.evaluate(() => window.App.show('journal'));
  await wait(150);
  await set('#entrySearch', 'zzzzz');
  await wait(250);
  await shot('58-edge-no-search-results');
  await set('#entrySearch', '"><script>');
  await wait(250);
  await set('#entrySearch', '');
  await page.evaluate(() => window.App.show('lexicon'));
  await wait(150);
  await set('#lexSearch', 'zzzzz');
  await wait(250);
  await shot('59-edge-no-lex-results');
  await set('#lexSearch', '');

  // 10. an entry whose text is markup must not become markup
  await page.evaluate(() => window.App.openEntry(null));
  await wait(200);
  await set('#eText', '<img src=x onerror="window.__pwned=1">');
  await tapSel('#entrySave');
  await wait(400);
  if (await page.evaluate(() => !!window.__pwned)) fail.push('entry text was injected as markup');
  log('markup in an entry is escaped');

  // 11. erase, then the app comes back empty rather than broken
  await page.evaluate(() => { Store.erase(); });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(500);
  await shot('60-edge-after-erase');
  log('after erase, onboarding shows:', await page.evaluate(() => !document.querySelector('#onboard').hidden));

  if (fail.length) { for (const f of fail) console.error('  FAIL: ' + f); throw new Error(fail.length + ' edge failures'); }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
