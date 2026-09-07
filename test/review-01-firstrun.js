/* Reviewer script 1. First run through onboarding, then every screen, creating real
   data on each, then a reload to prove all of it came back. */
module.exports = async ({ page, shot, wait, text, click, type, errors, log }) => {
  const js = f => page.evaluate(f);
  const must = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };

  await js(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(300);

  // ---- onboarding
  must(await js(() => !document.getElementById('onboard').hidden), 'onboarding did not show on a clean install');
  await shot('01-ob-0');
  await click('#obNext');
  await wait(250);
  await type('#obAnchor', 'It is like wet cardboard and oranges, but warmer');
  await shot('02-ob-1');
  await click('#obNext');
  await wait(250);
  await shot('03-ob-2');
  await click('#obNext');
  await wait(400);
  must(await js(() => document.getElementById('onboard').hidden), 'onboarding did not close');
  must(await js(() => !document.getElementById('v-journal').hidden), 'journal did not open');
  await shot('04-journal-after-ob');
  log('entries after onboarding: ' + await js(() => Store.counts().entries));

  // ---- journal: write a full entry
  await click('#newEntry');
  await wait(300);
  await type('#eText', 'Rain hitting the hot pavement outside the bakery on Rua da Bica');
  await click('#eAddTag');
  await wait(400);
  await shot('05-tagsheet');
  await js(() => {
    const rows = Array.from(document.querySelectorAll('#tagResults .tg'));
    rows[0].click(); rows[1].click(); rows[2].click();
  });
  await click('#tagDone');
  await wait(200);
  await js(() => document.querySelector('[data-feel="longing"]').dispatchEvent(new MouseEvent('click', {bubbles:true})));
  await wait(200);
  await type('#ePlace', 'Rua da Bica, Lisbon');
  await type('#ePeople', 'Ines, Marco');
  await type('#eAnchor', 'It is like a hot tin roof and a cut grapefruit in the same room');
  await wait(150);
  await shot('06-entry-full');
  await click('#entrySave');
  await wait(500);
  await shot('07-journal-one');
  must(await js(() => Store.counts().entries) >= 2, 'entry was not saved');

  // ---- shelf: add a bottle, wear it
  await click('.tab[data-view="shelf"]');
  await wait(300);
  await shot('08-shelf-empty');
  await click('#addBottle');
  await wait(300);
  await type('#bName', "Terre d'Hermes");
  await type('#bHouse', 'Hermes');
  await type('#bSize', '100');
  await type('#bPrice', '128');
  await click('#bAddNote');
  await wait(400);
  await js(() => { const r = Array.from(document.querySelectorAll('#tagResults .tg')); r[0].click(); r[3].click(); });
  await click('#tagDone');
  await wait(200);
  await js(() => { document.querySelector('[data-sil="room"]').click(); document.querySelector('[data-season="autumn"]').click(); });
  await type('#bOpening', 'Grapefruit peel over hot flint');
  await type('#bStory', 'Bought in Rome, the day it rained');
  await wait(120);
  await shot('09-bottlesheet');
  await click('#bSave');
  await wait(400);
  await shot('10-shelf-one');
  must(await js(() => Store.counts().bottles) === 1, 'bottle not saved');

  await click('.bcell');
  await wait(350);
  await shot('11-bottle');
  await click('[data-wear]');
  await wait(300);
  await js(() => { document.querySelector('[data-ctx="work"]').click(); });
  await type('#wearSprays', '3');
  await shot('12-wearsheet');
  await click('#wearSave');
  await wait(400);
  await shot('13-bottle-worn');
  must(await js(() => Store.counts().wears) === 1, 'wear not logged');

  // second and third wear on older dates so the stats block appears
  await js(() => {
    const b = Store.bottles()[0];
    Store.logWear(b.id, { at: Date.now() - 9*86400000, contexts: ['evening'], sprays: 2 });
    Store.logWear(b.id, { at: Date.now() - 40*86400000, contexts: ['travel'], sprays: 4 });
    App.show('bottle');
  });
  await wait(300);
  await shot('14-bottle-stats');

  await click('#bottleBack');
  await wait(300);
  await shot('15-shelf-stats');

  // ---- train: run a full blind identification drill
  await click('.tab[data-view="train"]');
  await wait(300);
  await shot('16-train');
  await js(() => App.startDrill('f4'));
  await wait(300);
  await shot('17-drill-brief');
  await click('[data-drill="go"]');
  await wait(300);
  await shot('18-drill-guess');
  // name all four, get one wrong on purpose
  for (let i = 0; i < 4; i++) {
    const done = await js(() => {
      const g = document.querySelector('.guess:not([disabled])');
      if (!g) return 'noguess';
      g.click();
      return null;
    });
    if (done) throw new Error('drill stuck: ' + done);
    await wait(180);
    if (i === 1) {
      await click('[data-verdict="miss"]');
      await wait(250);
      await js(() => document.querySelector('[data-truth]').click());
    } else {
      await click('[data-verdict="hit"]');
    }
    await wait(250);
  }
  await wait(200);
  await shot('19-drill-done');
  must(await js(() => !!document.querySelector('#drillNote2')), 'drill did not reach the done screen');
  await type('#drillNote2', 'The clove read as medicinal, not as warm.');
  await click('[data-drill="save"]');
  await wait(500);
  await shot('20-train-after');
  must(await js(() => Store.counts().sessions) === 1, 'session not saved');

  // ---- your nose
  await click('#toSkill');
  await wait(400);
  await shot('21-skill');
  await click('#skillBack');
  await wait(250);

  // ---- lexicon
  await click('.tab[data-view="lexicon"]');
  await wait(300);
  await shot('22-lexicon-families');
  await click('#lexMode');
  await wait(300);
  await shot('23-lexicon-mine');
  await click('#lexMode');
  await wait(250);
  await js(() => document.querySelector('.famrow').click());
  await wait(300);
  await shot('24-lexicon-family');
  await js(() => document.querySelector('.lexrow').click());
  await wait(300);
  await shot('25-card');
  await click('#cardBack');
  await wait(250);

  // ---- settings
  await click('.tab[data-view="journal"]');
  await wait(200);
  await click('#toSettings');
  await wait(350);
  await shot('26-settings');
  log(await text('#countLine'));

  const before = await js(() => JSON.parse(localStorage.getItem('sillage.v1')));
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(600);
  const after = await js(() => JSON.parse(localStorage.getItem('sillage.v1')));
  must(JSON.stringify(before) === JSON.stringify(after), 'the record changed across a reload');
  must(await js(() => Store.counts().entries) >= 2 && await js(() => Store.counts().bottles) === 1
       && await js(() => Store.counts().wears) === 3 && await js(() => Store.counts().sessions) === 1,
       'data did not survive the reload');
  await shot('27-after-reload');
  log('counts after reload: ' + JSON.stringify(await js(() => Store.counts())));
  if (errors.length) throw new Error(errors.length + ' page errors');
};
