/* The notification plan: recomputed on every open, never over 64 entries, never in the past,
   cancelled when reminders are off, and never scheduled without permission.
   node _shiptools/drive.js http://127.0.0.1:8823/index.html sillage/test/07-notifications.js --out sillage/test/shots */
const SEED = require('./seed-1.0.0.js');

module.exports = async ({ page, shot, wait, errors, log }) => {
  await page.evaluateOnNewDocument(() => {
    window.__calls = [];
    window.__allowed = true;
    window.Native = {
      isNative: () => true, vibrate: () => {}, vibratePattern: () => {},
      hasAmplitudeControl: () => true, cancelVibration: () => {}, keepAwake: () => {},
      saveFile: () => 'content://x', shareText: () => {}, shareUri: () => {},
      scheduleNotifications: json => { window.__calls.push({ kind: 'schedule', list: JSON.parse(json) }); },
      cancelNotifications: () => { window.__calls.push({ kind: 'cancel' }); },
      notificationsAllowed: () => window.__allowed,
      requestNotificationPermission: () => { window.__calls.push({ kind: 'request' }); }
    };
  });
  await page.evaluate(SEED);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  const fail = [];

  const last = () => page.evaluate(() => {
    const s = window.__calls.filter(c => c.kind === 'schedule');
    return s.length ? s[s.length - 1].list : null;
  });

  let list = await last();
  if (!list) throw new Error('nothing was scheduled on open, with reminders on');
  log('scheduled on open:', list.length, 'entries');
  if (list.length > 64) fail.push('scheduled ' + list.length + ' notifications, over the 64 cap');
  const now = Date.now();
  const past = list.filter(n => n.at <= now);
  if (past.length) fail.push(past.length + ' notifications scheduled in the past');
  const ids = new Set(list.map(n => n.id));
  if (ids.size !== list.length) fail.push('duplicate notification ids');
  const sorted = list.every((n, i) => i === 0 || n.at >= list[i - 1].at);
  if (!sorted) fail.push('the schedule is not in time order');
  log('first three:', list.slice(0, 3).map(n => new Date(n.at).toISOString().slice(0, 16) + ' ' + n.title + ' / ' + n.body.slice(0, 50)).join('  |  '));
  const longest = list.reduce((m, n) => Math.max(m, n.body.length), 0);
  log('longest body', longest, 'chars; ids', Math.min(...list.map(n => n.id)), 'to', Math.max(...list.map(n => n.id)));

  // Reopening must replace the schedule, not grow it.
  await page.evaluate(() => { window.__calls = []; window.App.onResume(); });
  await wait(400);
  const again = await last();
  log('after onResume:', again.length, 'entries');
  if (again.length !== list.length) fail.push('the schedule changed length across a resume: ' + list.length + ' then ' + again.length);

  // Turning reminders off cancels everything.
  await page.evaluate(() => {
    window.__calls = [];
    window.App.show('settings', true);
    const c = document.querySelector('#setRemind'); c.checked = false;
    c.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(400);
  const kinds = await page.evaluate(() => window.__calls.map(c => c.kind));
  log('turning reminders off ->', JSON.stringify(kinds));
  if (!kinds.includes('cancel')) fail.push('turning reminders off did not cancel the schedule');
  if (kinds.includes('schedule')) fail.push('a schedule was sent after reminders were turned off');

  // Back on, with permission refused: nothing may be scheduled.
  await page.evaluate(() => {
    window.__calls = []; window.__allowed = false;
    const c = document.querySelector('#setRemind'); c.checked = true;
    c.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(400);
  const kinds2 = await page.evaluate(() => window.__calls.map(c => c.kind));
  log('reminders on with permission refused ->', JSON.stringify(kinds2));
  if (kinds2.includes('schedule')) fail.push('scheduled notifications without permission');
  if (!kinds2.includes('request')) fail.push('did not ask for the notification permission');

  // Permission granted, every day, at a time already past today.
  await page.evaluate(() => {
    window.__allowed = true; window.__calls = [];
    const t = document.querySelector('#setTime'); t.value = '00:01';
    t.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(400);
  const early = await last();
  log('with a 00:01 reminder time:', early.length, 'entries, first at', new Date(early[0].at).toISOString().slice(0, 16));
  if (early.some(n => n.at <= Date.now())) fail.push('a 00:01 reminder was scheduled in the past');

  // Once a week: fewer, still in the future.
  await page.evaluate(() => {
    window.__calls = [];
    const e = document.querySelector('#setEvery'); e.value = '7';
    e.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await wait(400);
  const weekly = await last();
  log('every seven days:', weekly.length, 'entries, last at', new Date(weekly[weekly.length - 1].at).toISOString().slice(0, 10));
  if (weekly.some(n => n.at <= Date.now())) fail.push('a weekly reminder was scheduled in the past');

  await shot('73-notifications-settings');
  if (fail.length) { for (const f of fail) console.error('  FAIL: ' + f); throw new Error(fail.length + ' notification failures'); }
  if (errors.length) throw new Error(errors.length + ' page errors');
};
