// Browser walkthrough that checks the main flows and records a video plus screenshots.
// Usage: npm run dev, then: node scripts/demo.mjs <outDir>
import { chromium } from 'playwright';
import { mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'demo-output';
const base = process.env.URL ?? 'http://localhost:5173';
const size = { width: 1440, height: 900 };
const videoDir = '/tmp/mc-video';
mkdirSync(out, { recursive: true });

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = new Date();
const plus = (n) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: size, locale: 'nl-BE', recordVideo: { dir: videoDir, size } });
await context.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.id = 'demo-cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:rgba(96,64,204,.35);border:2px solid #6040cc;z-index:99999;pointer-events:none;transition:transform .08s';
    document.body.appendChild(c);
    const move = (e) => { c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; };
    document.addEventListener('mousemove', move, true);
    document.addEventListener('dragover', move, true);
    document.addEventListener('mousedown', () => (c.style.transform = 'scale(.7)'), true);
    document.addEventListener('mouseup', () => (c.style.transform = ''), true);
  });
});
const page = await context.newPage();
const nav = page.getByRole('navigation');
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const pause = (ms = 900) => page.waitForTimeout(ms);
const check = (cond, msg) => { if (!cond) throw new Error(`Check failed: ${msg}`); console.log(`ok  ${msg}`); };
const shot = async (name, opts = {}) => {
  await page.evaluate(() => { const c = document.getElementById('demo-cursor'); if (c) c.style.visibility = 'hidden'; });
  await page.screenshot({ path: join(out, name), ...opts });
  await page.evaluate(() => { const c = document.getElementById('demo-cursor'); if (c) c.style.visibility = ''; });
};
const hoverClick = async (loc) => { await loc.hover(); await pause(350); await loc.click(); };

// Dashboard
await page.goto(`${base}/#/dashboard`);
await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
await pause(1500);
const lateCount = await page.locator('.mc-dash-late .mc-todo[data-late]').count();
check(lateCount > 0, `dashboard lists ${lateCount} overdue to-dos`);
await page.locator('.mc-dash-late .mc-todo').first().hover();
await pause();
await shot('01-dashboard.png');

// Calendar: overdue to-dos rolled forward to today
await hoverClick(nav.getByRole('link', { name: 'Kalender' }));
await page.getByRole('heading', { name: 'Kalender' }).waitFor();
await pause(1200);
const todayCell = page.locator(`.mc-cell[data-day="${plus(0)}"]`);
check(await todayCell.locator('.mc-todo[data-late]').count() > 0, 'overdue to-dos show on today with a late badge');
await page.evaluate(() => window.scrollTo(0, document.querySelector('.mc-cal-toolbar').getBoundingClientRect().top + window.scrollY - 16));
await pause(400);
await shot('02-kalender-maand.png');
await page.evaluate(() => window.scrollTo(0, 0));

// Drag an item two days later; its open to-dos move along
const chip = page.locator('.mc-item-chip', { hasText: 'Klantverhaal Apotheek De Linde' }).first();
const from = await chip.evaluate((el) => el.closest('.mc-cell').dataset.day);
const toDay = iso(new Date(new Date(`${from}T12:00`).getTime() + 2 * 864e5));
let targetCell = page.locator(`.mc-cell[data-day="${toDay}"]`);
if (!(await targetCell.count())) {
  await hoverClick(page.getByRole('button', { name: 'Volgende' }));
  targetCell = page.locator(`.mc-cell[data-day="${toDay}"]`);
}
await chip.hover();
await pause(500);
await chip.dragTo(targetCell, { steps: 20 });
await page.locator('.mc-toast[data-open]').waitFor();
const toast = await page.locator('.mc-toast').innerText();
check(/schoven mee/.test(toast), `drag-and-drop toast: "${toast}"`);
check(await targetCell.locator('.mc-item-chip', { hasText: 'Klantverhaal' }).count() === 1, `item moved ${from} → ${toDay}`);
await pause(1500);
await hoverClick(page.getByRole('button', { name: 'Vandaag', exact: true }));
await pause(600);

// Tick off a late to-do in the "Vandaag / Deze week" panel
const lateCol = page.locator('.mc-today-col[data-urgency="late"]');
const before = await lateCol.locator('.mc-todo').count();
await hoverClick(lateCol.locator('.mc-check').first());
await pause(800);
check(await lateCol.locator('.mc-todo').count() === before - 1, 'ticking a late to-do removes it from "Te laat"');

// Filters and views
await hoverClick(page.getByRole('button', { name: 'E-mailings' }));
await pause(1000);
const types = await page.locator('.mc-grid .mc-item-chip').evaluateAll((els) => [...new Set(els.map((e) => e.dataset.accent))]);
check(types.length === 1 && types[0] === '6', 'type filter leaves only e-mailings');
await hoverClick(page.getByRole('button', { name: 'E-mailings' }));
await hoverClick(page.getByRole('radio', { name: 'Week' }));
await pause(1200);
await shot('03-kalender-week.png');
await hoverClick(page.getByRole('radio', { name: 'Agenda' }));
await pause(1200);
await hoverClick(page.getByRole('radio', { name: 'Maand' }));
await pause(600);

// New item with template to-dos
await hoverClick(page.getByRole('button', { name: 'Nieuw item', exact: true }));
await page.getByRole('dialog').waitFor();
await hoverClick(page.getByRole('radio', { name: 'E-mailing' }));
await page.getByLabel('Titel').pressSequentially('Eindejaarsmailing apothekers', { delay: 40 });
await page.getByLabel('Datum', { exact: true }).fill(plus(21));
await pause(700);
check(await page.locator('.mc-template-list li').count() === 5, 'e-mailing template proposes 5 to-dos');
await shot('04-nieuw-item.png');
await hoverClick(page.getByRole('button', { name: 'Toevoegen', exact: true }));
await page.locator('.mc-toast[data-open]').waitFor();
check((await page.locator('.mc-toast').innerText()).includes('toegevoegd'), 'new item saved');
await pause(1200);

// Events timeline and checklist
await hoverClick(nav.getByRole('link', { name: 'Beurzen & conferenties' }));
await page.getByRole('heading', { name: 'Beurzen en conferenties' }).waitFor();
await pause(1200);
const firstEvent = page.locator('.mc-event-card').first();
const doneBefore = await firstEvent.locator('.mc-checklist li[data-done]').count();
await hoverClick(firstEvent.locator('.mc-checklist li:not([data-done]) .mc-check').first());
await pause(800);
check(await firstEvent.locator('.mc-checklist li[data-done]').count() === doneBefore + 1, 'event checklist item ticked');
await shot('05-beurzen.png');

// Persistence: reload keeps the new item (IndexedDB)
await page.reload();
await hoverClick(nav.getByRole('link', { name: 'Dashboard' }));
await pause(800);
await hoverClick(nav.getByRole('link', { name: 'Kalender' }));
await pause(600);
await hoverClick(page.getByRole('radio', { name: 'Agenda' }));
await pause(400);
if (!(await page.getByText('Eindejaarsmailing apothekers').count())) await hoverClick(page.getByRole('button', { name: 'Volgende' }));
check(await page.getByText('Eindejaarsmailing apothekers').count() > 0, 'new item survives a reload');
await pause(1200);
await hoverClick(page.getByRole('radio', { name: 'Maand' }));
await pause(800);

check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join('; ')}` : ''}`);
const video = page.video();
await context.close();
copyFileSync(await video.path(), join(out, 'demo.webm'));
await browser.close();
console.log(`saved to ${out}`);
