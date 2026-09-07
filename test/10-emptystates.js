/* The drawn empty states are not decoration: their buttons have to work, and the screens
   have to survive the first tap on each of them.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/10-emptystates.js --out sillage/test/shots */
module.exports = async ({ page, shot, wait, text, errors, log }) => {
  const tapSel = async sel => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await page.evaluate(s => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
    await wait(250);
  };
  const view = () => page.evaluate(() => document.querySelector('.view:not([hidden])').id);
  const fail = [];

  await page.evaluate(() => { Store.onboarded(true); document.getElementById('onboard').hidden = true; window.App.show('journal'); });
  await wait(400);
  await shot('80-blank-journal');
  await tapSel('#journalEmpty [data-newentry]');
  if (await view() !== 'v-entry') fail.push('the empty journal button did not open an entry');
  log('empty journal button ->', await view());
  await page.evaluate(() => window.App.back());
  await wait(200);

  await page.evaluate(() => window.App.show('shelf'));
  await wait(300);
  await shot('81-blank-shelf');
  await tapSel('#shelfEmpty [data-addbottle]');
  const sheetOpen = await page.evaluate(() => !document.querySelector('#sheetBottle').hidden);
  if (!sheetOpen) fail.push('the empty shelf button did not open the bottle editor');
  log('empty shelf button opens the editor:', sheetOpen);
  await page.evaluate(() => window.App.back());
  await wait(200);

  await page.evaluate(() => { window.App.show('lexicon'); document.querySelector('#lexMode').click(); });
  await wait(350);
  await shot('82-blank-vocab');
  await tapSel('#lexBody [data-lexall]');
  const fams = await page.evaluate(() => document.querySelectorAll('#lexBody .famrow').length);
  if (fams !== 15) fail.push('browse all cards showed ' + fams + ' families');
  log('browse all cards ->', fams, 'families');

  await page.evaluate(() => { window.App.show('train'); window.App.show('skill', true); });
  await wait(400);
  await shot('83-blank-skill');
  await tapSel('#skillBody [data-goto]');
  if (await view() !== 'v-train') fail.push('the empty dashboard button did not go to Train');
  log('empty dashboard button ->', await view());

  // and the search miss state
  await page.evaluate(() => { Store.addEntry({ text: 'A first entry, so the stream is not empty.', anchor: '', tags: [], feeling: null, place: '', people: [] }); window.App.show('journal'); });
  await wait(300);
  await page.evaluate(() => { const s = document.querySelector('#entrySearch'); s.value = 'zzzz'; s.dispatchEvent(new Event('input', { bubbles: true })); });
  await wait(300);
  await shot('84-blank-search');
  log('search miss:', (await text('#entryStream')).split('\n')[0]);

  if (fail.length) { for (const f of fail) console.error('  FAIL: ' + f); throw new Error(fail.length + ' empty-state failures'); }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
