const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function swipe(page, locator, direction) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const client = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const start = direction < 0 ? .85 : .15;
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width * start, y }] });
  for (let step = 1; step <= 12; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width * (start + direction * .7 * step / 12), y }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await client.detach();
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const base = process.env.BASE_URL || 'http://localhost:4174';
  try {
    for (const width of [320, 390, 768, 900, 1280, 1800]) {
      const mobile = width <= 850;
      const page = await browser.newPage({ viewport: { width, height: 1080 }, hasTouch: mobile, isMobile: mobile });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const path of ['index.html', 'projects.html', 'project.html', 'about.html']) {
        await page.goto(`${base}/${path}`);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path}: overflow at ${width}`);
        assert.equal(await page.locator('img').evaluateAll(images => images.some(img => !img.hasAttribute('alt'))), false);
      }
      await page.goto(`${base}/index.html#project-yandex`);
      await page.waitForLoadState('networkidle');
      if (mobile) {
        const track = page.locator('.mobile-case-images');
        assert.equal(await track.locator('img').count(), 3);
        await swipe(page, track, -1);
        await page.waitForFunction(() => document.querySelector('[data-image-index="1"]').getAttribute('aria-current') === 'true');
        await page.waitForTimeout(500);
        await swipe(page, track, 1);
        await page.waitForFunction(() => document.querySelector('[data-image-index="0"]').getAttribute('aria-current') === 'true');
        await track.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('[data-image-index="1"]').getAttribute('aria-current') === 'true');
        await page.locator('[data-next-project]').click();
        await page.waitForSelector('.mobile-case[data-project="everypin"]');
        await page.locator('.mobile-case-actions a').click();
        await page.waitForURL('**#contacts');
        await page.locator('.mobile-menu-toggle').click();
        await page.locator('[data-mobile-menu-view="projects"]').click();
        await page.locator('[data-mobile-menu-projects] a', { hasText: 'Samolet' }).click();
        await page.waitForSelector('.mobile-case[data-project="samolet"]');
        assert.equal(await page.locator('#mobile-menu').isVisible(), false);
      } else {
        const alignment = await page.locator('[data-hero-projects] button').evaluateAll(buttons => buttons.map(button => getComputedStyle(button).textAlign));
        assert.ok(alignment.every(value => value === 'left'));
        await page.goto(`${base}/projects.html`);
        await page.waitForLoadState('networkidle');
        const geometry = await page.evaluate(() => {
          const copy = document.querySelector('.project-panel-copy').getBoundingClientRect();
          const metrics = [...document.querySelectorAll('.project-achievements > div')];
          return { within: metrics.every(el => el.getBoundingClientRect().right <= innerWidth / 2 + 1), signs: metrics.every(el => Math.abs(el.querySelector('strong').getBoundingClientRect().left - el.querySelector('p').getBoundingClientRect().left) < 1), copyRight: copy.right };
        });
        assert.ok(geometry.within && geometry.signs);
        assert.ok(geometry.copyRight <= width / 2 + 1);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: layout, navigation, ${mobile ? 'touch and keyboard carousel' : 'column alignment'}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
