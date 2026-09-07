/* Reviewer script 8. Every empty state, drawn, with the way out of it. */
module.exports = async ({ page, shot, wait, text, errors, log }) => {
  const ev = f => page.evaluate(f);
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: process.env.SCHEME || 'light' }]
    .concat(process.env.RM === '1' ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []));
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(250);
  await ev(() => { Store.onboarded(true); document.getElementById('onboard').hidden = true; App.show('journal'); });
  await wait(400);
  const states = [
    ['journal', () => App.show('journal')],
    ['shelf', () => App.show('shelf')],
    ['lexicon-mine', () => { App.show('lexicon'); document.getElementById('lexMode').click(); }],
    ['skill', () => { App.show('train'); App.show('skill', true); }],
    ['search-nothing', () => { App.show('journal'); Store.addEntry({ text: 'One entry so search exists' }); Store.addEntry({ text: 'Two' }); Store.addEntry({ text: 'Three' }); Store.addEntry({ text: 'Four' }); App.show('journal'); document.getElementById('entrySearch').value = 'zzzzz'; document.getElementById('entrySearch').dispatchEvent(new Event('input', { bubbles: true })); }],
    ['lex-nothing', () => { App.show('lexicon'); document.getElementById('lexSearch').value = 'zzzzz'; document.getElementById('lexSearch').dispatchEvent(new Event('input', { bubbles: true })); }]
  ];
  let i = 0;
  for (const [name, fn] of states) {
    await page.evaluate(`(${fn.toString()})()`);
    await wait(450);
    await shot((process.env.TAG || '') + String(++i).padStart(2, '0') + '-' + name);
    const drawn = await ev(() => {
      const b = document.querySelector('.screen.view:not([hidden]) .blank');
      if (!b) return null;
      const svg = b.querySelector('svg.scene');
      return { svg: !!svg, paths: svg ? svg.querySelectorAll('path,circle,rect').length : 0,
               head: (b.querySelector('h3') || {}).textContent, action: (b.querySelector('button') || {}).textContent || null,
               h: Math.round(b.getBoundingClientRect().height) };
    });
    log(name + ': ' + JSON.stringify(drawn));
  }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
