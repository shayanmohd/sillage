/* Safe areas: the shell injects --sat and --sab, and nothing may sit under either bar.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/06-safearea.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, errors, log }) => {
  await page.evaluateOnNewDocument(() => {
    const s = document.createElement('style');
    s.textContent = ':root{--sat:48px;--sab:34px}' +
      /* draw the two system bars so a screenshot shows anything hiding under them */
      'body::before,body::after{content:"";position:fixed;left:0;right:0;z-index:999;pointer-events:none;background:rgba(255,0,90,.30)}' +
      'body::before{top:0;height:48px}body::after{bottom:0;height:34px}';
    document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  });
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(700);

  const screens = [
    ['journal', () => window.App.show('journal')],
    ['train', () => window.App.show('train')],
    ['shelf', () => window.App.show('shelf')],
    ['lexicon', () => window.App.show('lexicon')],
    ['settings', () => window.App.show('settings', true)],
    ['skill', () => window.App.show('skill', true)],
    ['entry', () => window.App.openEntry(null)],
    ['card', () => window.App.openCard('indolic')],
    ['bottle', () => window.App.openBottle(Store.bottles()[0].id)],
    ['drill', () => window.App.startDrill('f4')]
  ];
  let i = 60;
  for (const [name, fn] of screens) {
    await page.evaluate(() => window.App.show('journal'));
    await wait(100);
    await page.evaluate(fn);
    await wait(400);
    await shot((++i) + '-safe-' + name);
  }
  // the two sheets and the onboarding
  await page.evaluate(() => { window.App.show('shelf'); document.querySelector('#addBottle').click(); });
  await wait(400);
  await shot((++i) + '-safe-sheet');
  await page.evaluate(() => { localStorage.removeItem('sillage.v1'); });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  await shot((++i) + '-safe-onboard');

  // measure: nothing interactive may start above --sat or end below the nav bar
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  const bad = await page.evaluate(() => {
    const out = [];
    const H = window.innerHeight;
    for (const v of ['journal', 'train', 'shelf', 'lexicon']) {
      window.App.show(v);
      for (const el of document.querySelectorAll('.view:not([hidden]) .topbar *, #tabs button, .fab')) {
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        if (r.top < 48) out.push(v + ' ' + el.className + ' top ' + Math.round(r.top));
        if (r.bottom > H - 34) out.push(v + ' ' + el.className + ' bottom ' + Math.round(H - r.bottom));
      }
    }
    return out;
  });
  log('elements under a system bar:', bad.length ? bad.join(' | ') : 'none');
  if (bad.length) throw new Error('content under a system bar');
  if (errors.length) throw new Error(errors.length + ' page errors');
};
