const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  const base = process.env.BASE_URL || 'http://localhost:4174';
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const name of ['index', 'about', 'projects', 'project']) {
        await page.goto(`${base}/${name}.html`);
        await page.waitForLoadState('networkidle');
        // Scrub the actual CSS entrance, without relying on network timing.
        const frames = await page.locator('main').evaluate(main => {
          main.style.animation = 'none';
          void main.offsetWidth;
          main.style.removeProperty('animation');
          const animation = main.getAnimations().find(item => item.animationName === 'page-arrive');
          animation.pause();
          const samples = [0, 80, 320, 640].map(time => {
            animation.currentTime = time;
            const rect = main.getBoundingClientRect();
            return { opacity: Number(getComputedStyle(main).opacity), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
          });
          animation.finish();
          return samples;
        });
        assert.equal(frames[0].opacity, 0);
        assert.equal(frames.at(-1).opacity, 1);
        assert.ok(frames[1].opacity > 0 && frames[1].opacity < frames[2].opacity);
        assert.ok(frames.every(frame => ['x', 'y', 'width', 'height'].every(key => frame[key] === frames[0][key])));
        if (name === 'index') await page.screenshot({ path: `/tmp/portfolio-motion-${width}.png` });
      }
      if (width === 390) {
        const toggle = page.locator('.mobile-menu-toggle');
        const menu = page.locator('#mobile-menu');
        await toggle.click();
        await page.waitForTimeout(350);
        await toggle.click();
        // Pause halfway through closing and reverse from that visible value.
        const continuity = await menu.evaluate(el => {
          const animation = el.getAnimations()[0];
          animation.pause();
          animation.currentTime = animation.effect.getTiming().duration / 2;
          const before = Number(getComputedStyle(el).opacity);
          document.querySelector('.mobile-menu-toggle').click();
          const after = Number(getComputedStyle(el).opacity);
          return { before, after };
        });
        assert.ok(Math.abs(continuity.before - continuity.after) < .01);
        await page.waitForTimeout(350);
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
        assert.ok(await menu.isVisible());
        assert.ok(await page.locator('main').evaluate(el => el.inert));
        await page.locator('[data-mobile-menu-view="projects"]').click();
        assert.ok(await page.locator('[data-mobile-menu-panel="projects"]').isVisible());
        await page.keyboard.press('Escape');
        await menu.waitFor({ state: 'hidden' });
        assert.equal(await page.locator('main').evaluate(el => el.inert), false);
        assert.ok(await toggle.evaluate(el => el === document.activeElement));
        await toggle.click();
        await page.setViewportSize({ width: 1200, height: 900 });
        await menu.waitFor({ state: 'hidden' });
        assert.equal(await page.locator('main').evaluate(el => el.inert), false);
        await page.setViewportSize({ width, height: 900 });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.reload();
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).animationName), 'none');
      if (width === 390) {
        await page.locator('.mobile-menu-toggle').click();
        assert.equal(await page.locator('#mobile-menu').evaluate(el => el.getAnimations().length), 0);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobile-menu').isVisible(), false);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: entrance opacity, stable geometry, menu reversal, reduced motion`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
