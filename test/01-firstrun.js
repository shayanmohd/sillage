/* First run: onboarding, then the full happy path that creates real data on every screen,
   including one drill of every kind. Timers are shortened in the page so a five minute
   session runs in five seconds; nothing else about the run is faked.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/01-firstrun.js --out sillage/test/shots */
module.exports = async ({ page, shot, wait, text, errors, log }) => {
  const tapSel = async sel => {
    await page.waitForSelector(sel, { visible: true, timeout: 8000 });
    await page.evaluate(s => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
    await wait(170);
  };
  const has = sel => page.evaluate(s => !!document.querySelector(s), sel);

  // ---- onboarding
  await wait(300);
  await shot('01-onboard-1');
  await tapSel('#obNext');
  await page.type('#obAnchor', 'It is like wet cardboard and oranges, but warmer');
  await shot('02-onboard-2');
  await tapSel('#obNext');
  await shot('03-onboard-3');
  await tapSel('#obNext');
  await wait(400);
  await shot('04-journal-firstrun');

  // ---- empty states on every tab
  for (const t of ['train', 'shelf', 'lexicon']) {
    await tapSel('.tab[data-view="' + t + '"]');
    await wait(300);
    await shot('05-empty-' + t);
  }

  // ---- write a real entry
  await tapSel('.tab[data-view="journal"]');
  await tapSel('#newEntry');
  await wait(250);
  await page.type('#eText', 'Rain hitting the hot pavement outside the bakery, butter and yeast under it.');
  await page.type('#eAnchor', 'Wet concrete and hot butter, about four seconds apart.');
  await page.type('#ePlace', 'Rua da Bica, Lisbon');
  await page.type('#ePeople', 'Ines, Tom');
  await tapSel('#eAddTag');
  await wait(300);
  await shot('06-tagsheet');
  await page.type('#tagSearch', 'petrichor');
  await wait(250);
  await tapSel('#tagResults .tg');
  await tapSel('#tagDone');
  await wait(200);
  await tapSel('[data-feel="joy"]');
  await wait(200);
  await page.evaluate(() => { document.querySelector('#v-entry .scroller').scrollTop = 0; });
  await shot('07-entry-filled');
  await tapSel('#entrySave');
  await wait(500);
  await shot('08-journal-one-entry');

  // ---- add a bottle
  await tapSel('.tab[data-view="shelf"]');
  await tapSel('#addBottle');
  await wait(250);
  await page.type('#bName', 'Salt Ledger');
  await page.type('#bHouse', 'Fenwick and Grieve');
  await page.type('#bSize', '100');
  await page.type('#bPrice', '96');
  await tapSel('#bAddNote');
  await wait(250);
  await page.type('#tagSearch', 'sea salt');
  await wait(250);
  await tapSel('#tagResults .tg');
  await tapSel('#tagDone');
  await wait(200);
  await tapSel('[data-sil="arm"]');
  await tapSel('[data-season="summer"]');
  await page.type('#bOpening', 'Grapefruit peel and a wet stone, cold for four minutes.');
  await shot('09-bottle-sheet');
  await tapSel('#bSave');
  await wait(400);
  await shot('10-shelf-one');

  // ---- log a wear, from the bottle page
  await tapSel('.bcell');
  await wait(350);
  await shot('11-bottle-page');
  await tapSel('[data-wear]');
  await wait(300);
  await tapSel('[data-ctx="everyday"]');
  await shot('12-wear-sheet');
  await tapSel('#wearSave');
  await wait(400);
  await shot('13-bottle-after-wear');
  await tapSel('#bottleBack');
  await wait(300);

  // ---- drills. Shorten the clocks in the page so the run is not five real minutes.
  await page.evaluate(() => {
    for (const t of Content.TRACKS) for (const s of t.sessions) { if (s.hold) s.hold = 1; if (s.wait) s.wait = 1; }
  });

  await tapSel('.tab[data-view="train"]');
  await wait(300);
  await shot('14-train');

  // f1 attend
  await tapSel('[data-start="f1"]');
  await wait(250);
  await shot('15-drill-brief');
  await tapSel('[data-drill="go"]');
  await wait(400);
  await shot('16-drill-attend');
  await wait(5000);
  await shot('17-drill-attend-done');
  await tapSel('[data-drill="save"]');
  await wait(400);

  // f2 describe
  await tapSel('[data-start="f2"]');
  await tapSel('[data-drill="go"]');
  await wait(300);
  await shot('18-drill-describe');
  for (let i = 0; i < 4; i++) {
    if (await has('#drillNote')) await page.type('#drillNote', 'Sour first, then burnt, then close to cocoa.');
    await tapSel('[data-drill="nextdesc"]');
    await wait(200);
  }
  await shot('19-drill-describe-done');
  await tapSel('[data-drill="save"]');
  await wait(400);

  // f3 describe, f4 blind id
  await tapSel('[data-start="f3"]');
  await tapSel('[data-drill="go"]');
  for (let i = 0; i < 4; i++) { await tapSel('[data-drill="nextdesc"]'); await wait(150); }
  await tapSel('[data-drill="save"]');
  await wait(400);

  await tapSel('[data-start="f4"]');
  await tapSel('[data-drill="go"]');
  await wait(300);
  await shot('20-drill-id-guess');
  // four jars: get two right, miss one, then the forced last one
  for (let i = 0; i < 4; i++) {
    const guesses = await page.evaluate(() => Array.from(document.querySelectorAll('[data-guess]')).map(b => b.dataset.guess));
    if (!guesses.length) break;
    await tapSel('[data-guess="' + guesses[0] + '"]');
    await wait(150);
    if (i === 1 && guesses.length > 1) {
      await shot('21-drill-id-verdict');
      await tapSel('[data-verdict="miss"]');
      await wait(250);
      await shot('22-drill-id-truth');
      const truth = await page.evaluate(() => { const b = document.querySelector('[data-truth]'); return b ? b.dataset.truth : null; });
      if (truth) await tapSel('[data-truth="' + truth + '"]');
    } else {
      await tapSel('[data-verdict="hit"]');
    }
    await wait(250);
  }
  await shot('23-drill-done');
  await page.type('#drillNote2', 'The rosemary read as camphor, not as herb.');
  await tapSel('[data-drill="save"]');
  await wait(400);

  // f5 ladder
  await tapSel('[data-start="f5"]');
  await tapSel('[data-drill="go"]');
  await wait(250);
  for (let i = 0; i < 4; i++) {
    const l = await page.evaluate(() => { const b = document.querySelector('[data-ladder]:not([disabled])'); return b ? b.dataset.ladder : null; });
    if (!l) break;
    await tapSel('[data-ladder="' + l + '"]');
  }
  await shot('24-drill-ladder');
  await tapSel('[data-drill="finish"]');
  await wait(250);
  await tapSel('[data-drill="save"]');
  await wait(400);

  // f6 recall
  await tapSel('[data-start="f6"]');
  await tapSel('[data-drill="go"]');
  await wait(250);
  await shot('25-drill-recall-smell');
  await tapSel('[data-drill="wait"]');
  await wait(300);
  await shot('26-drill-recall-wait');
  await wait(2200);
  const g = await page.evaluate(() => { const b = document.querySelector('[data-guess]'); return b ? b.dataset.guess : null; });
  if (g) { await tapSel('[data-guess="' + g + '"]'); await tapSel('[data-verdict="hit"]'); }
  await wait(300);
  await shot('27-drill-recall-done');
  await tapSel('[data-drill="save"]');
  await wait(400);

  // ---- the dashboard now has data
  await tapSel('#toSkill');
  await wait(500);
  await shot('28-skill');
  await page.evaluate(() => { document.querySelector('#v-skill .scroller').scrollTop = 1200; });
  await wait(300);
  await shot('29-skill-lower');
  await tapSel('#skillBack');
  await wait(300);

  // ---- lexicon
  await tapSel('.tab[data-view="lexicon"]');
  await wait(300);
  await shot('30-lexicon-families');
  await tapSel('[data-fam="citrus"]');
  await wait(300);
  await shot('31-lexicon-family');
  await tapSel('.lexrow');
  await wait(400);
  await shot('32-lexicon-card');
  await tapSel('#cardBack');
  await wait(250);
  await tapSel('#lexMode');
  await wait(300);
  await shot('33-lexicon-mine');

  // ---- settings
  await tapSel('.tab[data-view="journal"]');
  await tapSel('#toSettings');
  await wait(400);
  await shot('34-settings');
  await page.evaluate(() => { document.querySelector('#v-settings .scroller').scrollTop = 1400; });
  await wait(250);
  await shot('35-settings-lower');

  const counts = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  log('entries', counts.entries.length, 'bottles', counts.bottles.length,
      'wears', counts.wears.length, 'sessions', counts.sessions.length);
  if (errors.length) throw new Error(errors.length + ' page errors');
};
