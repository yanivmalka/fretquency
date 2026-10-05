import { chromium } from 'playwright';

const URL = 'http://localhost:5173/fretquency/';

function log(label, msg) {
  console.log(`[${label}] ${msg}`);
}

async function openTab(browser, label) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') log(label, `console error: ${m.text()}`);
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // Wait for the app shell to render.
  await page.waitForTimeout(1500);
  return { context, page };
}

async function navigateToAbout(page, label) {
  // Try to find and click through to Settings -> Account, where AboutCard lives.
  // Best-effort: look for common nav text; fall back gracefully.
  const tryClick = async (selectorOrText) => {
    try {
      const el = page.locator(selectorOrText).first();
      if (await el.count() > 0) {
        await el.click({ timeout: 3000 });
        return true;
      }
    } catch {}
    return false;
  };

  await tryClick('text=Settings');
  await page.waitForTimeout(500);
  await tryClick('text=Account');
  await page.waitForTimeout(1000);
  log(label, 'attempted navigation to Account/About screen');
}

async function getPresenceCounts(page) {
  return page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('.sp2-tile'));
    return tiles.map((t) => ({
      label: t.querySelector('.sp2-tile-l')?.textContent,
      value: t.querySelector('.sp2-tile-v')?.textContent,
    }));
  });
}

async function getDebugLog(page) {
  return page.evaluate(() => {
    try {
      const raw = localStorage.getItem('debugLog.entries');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  log('main', 'opening tab A');
  const a = await openTab(browser, 'A');
  await navigateToAbout(a.page, 'A');
  await a.page.waitForTimeout(3000);

  log('main', 'reading tab A presence tiles (before B opens)');
  console.log(JSON.stringify(await getPresenceCounts(a.page), null, 2));

  log('main', 'opening tab B');
  const b = await openTab(browser, 'B');
  await navigateToAbout(b.page, 'B');

  // Give the presence channel time to sync across tabs.
  await a.page.waitForTimeout(4000);
  await b.page.waitForTimeout(1000);

  log('main', 'reading tab A presence tiles (after B opened)');
  console.log(JSON.stringify(await getPresenceCounts(a.page), null, 2));
  log('main', 'reading tab B presence tiles (after B opened)');
  console.log(JSON.stringify(await getPresenceCounts(b.page), null, 2));

  log('main', 'closing tab B, checking tab A decrements');
  await b.context.close();
  await a.page.waitForTimeout(4000);
  console.log(JSON.stringify(await getPresenceCounts(a.page), null, 2));

  log('main', 'tab A debug log ([presence] entries)');
  const entriesA = await getDebugLog(a.page);
  const presenceEntriesA = entriesA.filter((e) => e.tag.startsWith('[presence]'));
  console.log(JSON.stringify(presenceEntriesA, null, 2));

  await a.context.close();
  await browser.close();
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
