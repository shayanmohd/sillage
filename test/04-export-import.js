/* Export and import both ways: through a mocked window.Native.saveFile and through the browser
   download path, then a round trip back into an erased app.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/04-export-import.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, text, errors, log }) => {
  // Mock the Android bridge before anything runs, the way the shell injects it.
  await page.evaluateOnNewDocument(() => {
    if (location.search.indexOf('nonative') >= 0) return;   // the browser-download half of the test
    window.__saved = [];
    window.__notifs = null;
    window.Native = {
      isNative: () => true,
      vibrate: () => {}, vibratePattern: () => {}, hasAmplitudeControl: () => true,
      cancelVibration: () => {}, keepAwake: () => {},
      saveFile: (name, mime, b64) => {
        window.__saved.push({ name, mime, text: decodeURIComponent(escape(atob(b64))) });
        return 'content://downloads/' + name;
      },
      shareText: () => {}, shareUri: () => {},
      scheduleNotifications: json => { window.__notifs = JSON.parse(json); },
      cancelNotifications: () => { window.__notifs = []; },
      notificationsAllowed: () => true,
      requestNotificationPermission: () => {}
    };
  });
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(700);

  const tapSel = async sel => {
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.evaluate(s => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), sel);
    await wait(250);
  };

  await page.evaluate(() => window.App.show('settings', true));
  await wait(300);
  await tapSel('#exJson');
  await tapSel('#exCsv');
  await tapSel('#exShelf');
  const saved = await page.evaluate(() => window.__saved.map(s => ({ name: s.name, mime: s.mime, len: s.text.length, head: s.text.slice(0, 90) })));
  for (const s of saved) log('saveFile', s.name, s.mime, s.len + ' chars |', s.head.replace(/\n/g, ' '));
  if (saved.length !== 3) throw new Error('expected 3 Native.saveFile calls, got ' + saved.length);
  await shot('52-export-native');

  // The JSON must round trip into an erased app.
  const json = await page.evaluate(() => window.__saved[0].text);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  await page.evaluate(() => { localStorage.removeItem('sillage.v1'); });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(500);
  const res = await page.evaluate(t => {
    const r = Store.importJson(t);
    return r;
  }, json);
  log('import into an empty app:', res.message);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  log('round trip entries', before.entries.length, '->', after.entries.length,
      '| bottles', before.bottles.length, '->', after.bottles.length,
      '| wears', before.wears.length, '->', after.wears.length,
      '| sessions', before.sessions.length, '->', after.sessions.length);
  for (const k of ['entries', 'bottles', 'wears', 'sessions']) {
    if (after[k].length !== before[k].length) throw new Error('round trip lost ' + k + ': ' + before[k].length + ' -> ' + after[k].length);
  }
  // The entry to bottle link must survive, since import remaps bottle ids.
  const linked = after.entries.filter(e => e.bottleId).length;
  const linkedBefore = before.entries.filter(e => e.bottleId).length;
  log('entries linked to a bottle before', linkedBefore, 'after', linked);

  // Importing the same file twice must add nothing.
  const again = await page.evaluate(t => Store.importJson(t), json);
  log('second import:', again.message);
  const third = await page.evaluate(() => JSON.parse(localStorage.getItem('sillage.v1')));
  if (third.entries.length !== after.entries.length) throw new Error('re-import duplicated entries');

  // A file that is not a Sillage export.
  const bad = await page.evaluate(() => Store.importJson('{"app":"something-else"}'));
  const worse = await page.evaluate(() => Store.importJson('not json at all'));
  log('rejects a foreign file:', bad.message, '|', worse.message);
  if (bad.ok || worse.ok) throw new Error('a bad file was accepted');

  // The browser download path, with no Native present.
  await page.goto(page.url().split('?')[0] + '?nonative=1', { waitUntil: 'networkidle0' });
  await wait(500);
  if (await page.evaluate(() => !!window.Native)) throw new Error('Native still present for the browser path');
  const dl = await page.evaluate(async () => {
    const seen = [];
    const realClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { seen.push({ name: this.download, href: this.href.slice(0, 12) }); };
    window.App.show('settings', true);
    await new Promise(r => setTimeout(r, 200));
    document.querySelector('#exJson').click();
    document.querySelector('#exCsv').click();
    document.querySelector('#exShelf').click();
    HTMLAnchorElement.prototype.click = realClick;
    return seen;
  });
  log('browser download path:', JSON.stringify(dl));
  if (dl.length !== 3 || !dl.every(d => d.href === 'blob:http://')) throw new Error('browser download path did not fire three object URLs');
  await wait(300);
  await shot('53-export-browser');

  if (errors.length) throw new Error(errors.length + ' page errors');
};
