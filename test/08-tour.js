/* A tour of every populated screen, for running under --dark, --reduced-motion and neither.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/08-tour.js --out sillage/test/shots-light
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/08-tour.js --out sillage/test/shots-rm --reduced-motion */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, errors, log }) => {
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  const stops = [
    ['journal', () => window.App.show('journal')],
    ['train', () => window.App.show('train')],
    ['shelf', () => window.App.show('shelf')],
    ['lexicon', () => window.App.show('lexicon')],
    ['entry', () => { window.App.openEntry(Store.entries()[0].id); }],
    ['bottle', () => window.App.openBottle(Store.bottles().find(b => b.name === 'Vetiver Bureau').id)],
    ['card', () => window.App.openCard('indolic')],
    ['skill', () => window.App.show('skill', true)],
    ['settings', () => window.App.show('settings', true)],
    ['drill', () => { window.App.startDrill('cwarm3'); }]
  ];
  let i = 0;
  for (const [name, fn] of stops) {
    await page.evaluate(() => window.App.show('journal'));
    await wait(120);
    await page.evaluate(fn);
    await wait(650);
    await page.evaluate(() => { const t = document.querySelector('#toast'); if (t) t.hidden = true; });
    await shot(String(++i).padStart(2, '0') + '-' + name);
  }
  // one deeper stop: the emotion wheel and the note picker
  await page.evaluate(() => { window.App.openEntry(null); });
  await wait(300);
  await page.evaluate(() => { document.querySelector('#eAddTag').click(); });
  await wait(500);
  await shot(String(++i).padStart(2, '0') + '-tagsheet');
  await page.evaluate(() => window.App.back());
  await wait(200);
  await page.evaluate(() => { document.querySelector('#v-entry .scroller').scrollTop = 420; });
  await wait(300);
  await shot(String(++i).padStart(2, '0') + '-wheel');
  // the drill mid round
  await page.evaluate(() => { window.App.startDrill('cwarm3'); });
  await wait(250);
  await page.evaluate(() => document.querySelector('[data-drill="go"]').click());
  await wait(400);
  await shot(String(++i).padStart(2, '0') + '-drill-guess');
  // the empty app
  await page.evaluate(() => { localStorage.removeItem('sillage.v1'); });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  await shot(String(++i).padStart(2, '0') + '-onboard');
  await page.evaluate(() => { Store.onboarded(true); document.getElementById('onboard').hidden = true; window.App.show('journal'); });
  await wait(400);
  await shot(String(++i).padStart(2, '0') + '-empty-journal');
  await page.evaluate(() => window.App.show('shelf'));
  await wait(300);
  await shot(String(++i).padStart(2, '0') + '-empty-shelf');
  await page.evaluate(() => window.App.show('lexicon'));
  await wait(300);
  await shot(String(++i).padStart(2, '0') + '-empty-lexicon');
  await page.evaluate(() => { window.App.show('train'); window.App.show('skill', true); });
  await wait(400);
  await shot(String(++i).padStart(2, '0') + '-empty-skill');
  if (errors.length) throw new Error(errors.length + ' page errors');
};
