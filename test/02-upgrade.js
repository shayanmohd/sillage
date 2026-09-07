/* Upgrade from 1.0.0: seed localStorage exactly as the shipped build wrote it, load the new
   build over the top, and prove nothing is lost or misread. Also covers reload persistence,
   a fresh tab, and the drill telemetry surviving the upgrade.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/02-upgrade.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, text, errors, log }) => {
  const tapSel = async sel => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await page.evaluate(s => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
    await wait(170);
  };

  // Write the 1.0.0 record, then reload into the new build.
  await page.evaluate(SEED);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  log('seeded 1.0.0:', before.entries.length, 'entries,', before.bottles.length, 'bottles,',
      before.wears.length, 'wears,', before.sessions.length, 'sessions');
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(700);

  await shot('40-upgrade-journal');
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  const same = ['entries', 'bottles', 'wears', 'sessions']
    .map(k => k + ':' + before[k].length + '->' + after[k].length).join(' ');
  log('after upgrade', same);
  for (const k of ['entries', 'bottles', 'wears', 'sessions']) {
    if (after[k].length !== before[k].length) throw new Error(k + ' changed on upgrade');
  }
  if (JSON.stringify(after.settings) !== JSON.stringify(before.settings)) {
    log('settings before', JSON.stringify(before.settings));
    log('settings after ', JSON.stringify(after.settings));
    throw new Error('settings changed on upgrade');
  }

  // Every screen must render the seeded data, not an empty state.
  await tapSel('.tab[data-view="train"]');
  await wait(300); await shot('41-upgrade-train');
  await tapSel('#toSkill');
  await wait(500); await shot('42-upgrade-skill');
  const skill = await text('#skillBody');
  log('skill dashboard head:', skill.split('\n').slice(0, 6).join(' | '));
  if (!/scored sessions/.test(skill)) throw new Error('drill telemetry did not survive: no accuracy text');
  await page.evaluate(() => { document.querySelector('#v-skill .scroller').scrollTop = 900; });
  await wait(300); await shot('43-upgrade-skill-lower');
  await page.evaluate(() => { document.querySelector('#v-skill .scroller').scrollTop = 2000; });
  await wait(300); await shot('44-upgrade-skill-bottom');
  await tapSel('#skillBack');

  await tapSel('.tab[data-view="shelf"]');
  await wait(400); await shot('45-upgrade-shelf');
  await tapSel('.bcell');
  await wait(400); await shot('46-upgrade-bottle');
  await page.evaluate(() => { document.querySelector('#v-bottle .scroller').scrollTop = 900; });
  await wait(300); await shot('47-upgrade-bottle-lower');
  await tapSel('#bottleBack');

  await tapSel('.tab[data-view="lexicon"]');
  await tapSel('#lexMode');
  await wait(400); await shot('48-upgrade-vocab');

  await tapSel('.tab[data-view="journal"]');
  await tapSel('#toSettings');
  await wait(400);
  const counts = await text('#countLine');
  log('counts line:', counts);
  await tapSel('#settingsBack');

  // Reload again: still there.
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  const third = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  if (third.entries.length !== before.entries.length) throw new Error('lost entries on second reload');
  await shot('49-upgrade-reload');
  log('second reload still holds', third.entries.length, 'entries');

  if (errors.length) throw new Error(errors.length + ' page errors');
};
