/* Reviewer script 6. Every input with an edge, rapid double taps on each primary write,
   export and import round trips through both paths, and the notification schedule. */
module.exports = async ({ page, shot, wait, text, click, type, errors, log }) => {
  const ev = (f, a) => page.evaluate(f, a);
  const must = (c, m) => { if (!c) throw new Error('FAIL: ' + m); };
  const fails = [];
  const check = (c, m) => { if (!c) { fails.push(m); log('DEFECT: ' + m); } };

  await page.evaluateOnNewDocument(() => {
    window.__notif = [];
    window.Native = {
      isNative: () => true,
      vibrate: () => {}, vibratePattern: () => {}, hasAmplitudeControl: () => true, cancelVibration: () => {},
      keepAwake: () => {},
      saveFile: (n, m, b64) => { window.__saved = { n, m, text: decodeURIComponent(escape(atob(b64))) }; return 'content://downloads/' + n; },
      shareText: () => {}, shareUri: () => {},
      scheduleNotifications: j => { window.__notif = JSON.parse(j); },
      cancelNotifications: () => { window.__notif = []; },
      notificationsAllowed: () => true,
      requestNotificationPermission: () => {}
    };
  });
  await ev(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(300);
  await ev(() => { Store.onboarded(true); document.getElementById('onboard').hidden = true; App.show('journal'); });
  await wait(300);

  // ---- empty save is refused, and refusing does not latch the button
  await ev(() => App.openEntry(null));
  await wait(300);
  await ev(() => document.getElementById('entrySave').click());
  await wait(200);
  check(await ev(() => Store.counts().entries) === 0, 'an empty entry was saved');
  await ev(() => { document.getElementById('eText').value = 'x'; document.getElementById('eText').dispatchEvent(new Event('input', {bubbles:true})); });
  await ev(() => document.getElementById('entrySave').click());
  await wait(900);
  check(await ev(() => Store.counts().entries) === 1, 'a refusal latched the save button');

  // ---- rapid triple tap on save
  await ev(() => App.openEntry(null));
  await wait(250);
  await wait(800);
  await ev(() => { document.getElementById('eText').value = 'A very fast double tap'; });
  await ev(() => { const b = document.getElementById('entrySave'); b.click(); b.click(); b.click(); });
  await wait(500);
  check(await ev(() => Store.counts().entries) === 2, 'a triple tap on Save wrote ' + (await ev(() => Store.counts().entries) - 1) + ' entries');

  // ---- very long, empty and whitespace inputs
  await ev(() => App.openEntry(null));
  await wait(250);
  await ev(() => {
    document.getElementById('eText').value = 'x'.repeat(600);
    document.getElementById('eAnchor').value = ' '.repeat(40);
    document.getElementById('ePlace').value = 'A place name that goes on and on and on and refuses to stop, ninety characters at least';
    document.getElementById('ePeople').value = ' , , Ines , , Marco , ';
  });
  await wait(800);
  await ev(() => document.getElementById('entrySave').click());
  await wait(500);
  const e = await ev(() => Store.entries()[0]);
  check(e.anchor === '', 'a whitespace anchor was stored as text');
  check(JSON.stringify(e.people) === JSON.stringify(['Ines','Marco']), 'people not cleaned: ' + JSON.stringify(e.people));
  await ev(() => App.show('journal'));
  await wait(400);
  await shot('01-long-entry');
  const metaW = await ev(() => { const m = document.querySelector('.ecard .em'); return { w: Math.round(m.getBoundingClientRect().width), t: m.textContent, sw: m.scrollWidth }; });
  check(metaW.sw <= metaW.w + 1, 'the meta line overflows its card: ' + JSON.stringify(metaW));

  // ---- bottle edges: negative price, zero, NaN, 5000 ml, a duplicate name, a future acquired date
  const bad = [
    { name: 'Neg', price: '-40', size: '100', acq: null },
    { name: 'Zero', price: '0', size: '0', acq: null },
    { name: 'Huge', price: '99999999', size: '5000', acq: null },
    { name: 'Future', price: '', size: '', acq: '2099-01-01' }
  ];
  for (const b of bad) {
    await ev(() => { App.show('shelf'); document.getElementById('addBottle').click(); });
    await wait(300);
    await ev((v) => {
      document.getElementById('bName').value = v.name;
      document.getElementById('bPrice').value = v.price;
      document.getElementById('bSize').value = v.size;
      if (v.acq) document.getElementById('bAcquired').value = v.acq;
    }, b);
    await ev(() => document.getElementById('bSave').click());
    await wait(900);
  }
  const bs = await ev(() => Store.bottles().map(b => ({ n: b.name, p: b.price, s: b.sizeMl, a: b.acquiredAt })));
  log('bottles: ' + JSON.stringify(bs));
  for (const b of bs) {
    check(b.p === null || b.p >= 0, b.n + ' kept a negative price ' + b.p);
    check(b.s === null || (b.s >= 1 && b.s <= 1000), b.n + ' kept an out of range size ' + b.s);
    check(b.a <= Date.now() + 86400000, b.n + ' was acquired in the future: ' + new Date(b.a).toISOString());
  }
  // duplicate name is allowed but must not merge or crash
  await ev(() => { App.show('shelf'); document.getElementById('addBottle').click(); });
  await wait(250);
  await ev(() => { document.getElementById('bName').value = 'Neg'; });
  await ev(() => document.getElementById('bSave').click());
  await wait(900);
  check(await ev(() => Store.bottles().filter(b => b.name === 'Neg').length) === 2, 'a duplicate bottle name was silently merged');
  await ev(() => App.show('shelf'));
  await wait(400);
  await shot('02-shelf-edges');

  // ---- rapid double tap on the bottle save and the wear save
  const nb = await ev(() => Store.counts().bottles);
  await wait(800);
  await ev(() => { App.show('shelf'); document.getElementById('addBottle').click(); });
  await wait(250);
  await ev(() => { document.getElementById('bName').value = 'Doubletap'; const b = document.getElementById('bSave'); b.click(); b.click(); b.click(); });
  await wait(500);
  check(await ev(() => Store.counts().bottles) === nb + 1, 'a triple tap on the bottle save wrote more than one bottle');

  await ev(() => { App.show('shelf'); App.openBottle(Store.bottles()[0].id); });
  await wait(300);
  await ev(() => document.querySelector('[data-wear]').click());
  await wait(300);
  await wait(800);
  await ev(() => { const b = document.getElementById('wearSave'); b.click(); b.click(); b.click(); });
  await wait(500);
  check(await ev(() => Store.counts().wears) === 1, 'a triple tap on the wear save logged ' + await ev(() => Store.counts().wears) + ' wears');

  // ---- a wear dated in the future, and zero sprays
  await wait(700);
  await ev(() => document.querySelector('[data-wear]').click());
  await wait(300);
  await ev(() => { document.getElementById('wearDate').value = '2099-06-01'; document.getElementById('wearSprays').value = '0'; });
  await ev(() => document.getElementById('wearSave').click());
  await wait(400);
  const ws = await ev(() => Store.wearsFor(Store.bottles()[0].id).map(w => ({ at: w.at, s: w.sprays })));
  check(ws.every(w => w.at <= Date.now() + 1000), 'a wear was stored in the future: ' + JSON.stringify(ws));
  check(ws.every(w => w.s === null || w.s >= 1), 'zero sprays stored: ' + JSON.stringify(ws));
  check(await ev(() => document.getElementById('wearDate').max) === await ev(() => Store.ymd(Date.now())), 'the wear date picker has no max');

  // ---- export through Native.saveFile, then a full erase, then import it back
  await ev(() => App.show('settings', true));
  await wait(300);
  await ev(() => document.getElementById('exJson').click());
  await wait(400);
  const saved = await ev(() => window.__saved);
  check(!!saved && saved.n === 'sillage-export.json', 'Native.saveFile was not used for the export');
  await ev(() => document.getElementById('exCsv').click());
  await wait(300);
  const csv = await ev(() => window.__saved.text);
  check(csv.split('\n').length > 1 && csv.indexOf('date,what,anchor') === 0, 'the entries CSV is malformed');
  await ev(() => document.getElementById('exShelf').click());
  await wait(300);
  check((await ev(() => window.__saved.text)).indexOf('name,house,size ml') === 0, 'the shelf CSV is malformed');

  const before = await ev(() => Store.counts());
  const links = await ev(() => Store.entries().filter(e => e.bottleId).length);
  const json = saved.text;
  await ev(() => { Store.erase(); });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(400);
  const res = await ev(t => Store.importJson(t), json);
  log('import: ' + JSON.stringify(res));
  const after = await ev(() => Store.counts());
  check(JSON.stringify(before) === JSON.stringify(after), 'the round trip lost data: ' + JSON.stringify(before) + ' -> ' + JSON.stringify(after));
  const links2 = await ev(() => Store.entries().filter(e => e.bottleId).length);
  check(links === links2, 'entry to bottle links lost on import: ' + links + ' in, ' + links2 + ' out');
  // importing the same file twice must add nothing
  const res2 = await ev(t => Store.importJson(t), json);
  const after2 = await ev(() => Store.counts());
  check(JSON.stringify(after) === JSON.stringify(after2), 'a second import of the same file duplicated records');
  log('second import: ' + JSON.stringify(res2));
  // a file that is not ours
  const junk = await ev(() => Store.importJson('{"app":"something-else"}'));
  check(junk.ok === false, 'a foreign file was accepted');
  const notjson = await ev(() => Store.importJson('<<<not json'));
  check(notjson.ok === false, 'a non-JSON file was accepted');

  // ---- notifications
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(400);
  await ev(() => { Store.settings({ remindOn: true, remindTime: '07:00', remindEvery: 1, resurfaceOn: true }); App.plan(); });
  await wait(300);
  const n = await ev(() => window.__notif);
  log('scheduled ' + n.length + ' notifications');
  check(n.length <= 64, 'more than 64 notifications scheduled: ' + n.length);
  check(n.every(x => x.at > Date.now()), 'a notification was scheduled in the past');
  check(new Set(n.map(x => x.id)).size === n.length, 'duplicate notification ids');
  check(n.every(x => x.title && x.body && !/[!–—]/.test(x.title + x.body)), 'a notification carries an exclamation mark or a dash');
  await ev(() => { Store.settings({ remindOn: false }); App.plan(); });
  await wait(200);
  check((await ev(() => window.__notif)).length === 0, 'turning reminders off left a schedule behind');

  // ---- rotating through screens fast
  await ev(() => {
    Store.onboarded(true);
    for (let i = 0; i < 40; i++) { App.show(['journal','train','shelf','lexicon'][i % 4]); }
    App.show('journal');
  });
  await wait(400);
  await shot('03-after-rotation');
  check(await ev(() => document.querySelectorAll('.screen.view:not([hidden])').length) === 1, 'more than one screen visible after fast rotation');

  if (fails.length) log('=== ' + fails.length + ' defects ===\n' + fails.join('\n'));
  else log('=== edges clean ===');
  if (errors.length) throw new Error(errors.length + ' page errors');
  if (fails.length) throw new Error(fails.length + ' defects');
};
