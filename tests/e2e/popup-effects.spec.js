import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const effects = readFileSync('appi-popup-effects.js', 'utf8');

test('rebote y gota al abrir, una vez por apertura y sin afectar repintados', async ({ page }) => {
  await page.setContent('<button id="gesture">Abrir</button><div id="modalOverlay" class="modal-overlay" style="display:none"><div class="modal">Contenido</div></div>');
  await page.evaluate(() => {
    window.animaciones = 0; window.gotas = 0;
    Element.prototype.animate = function () { window.animaciones++; return {}; };
    class AudioFake {
      constructor() { this.state='running'; this.currentTime=1; this.destination={}; }
      createOscillator() { return { frequency: { setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){}, start(){window.gotas++}, stop(){} }; }
      createGain() { return { gain: { setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){} }; }
    }
    window.AudioContext = AudioFake;
  });
  await page.addScriptTag({ content: effects });
  await page.click('#gesture');
  await page.evaluate(() => { document.querySelector('#modalOverlay').style.display='block'; });
  await expect.poll(() => page.evaluate(() => window.animaciones)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.gotas)).toBe(1);
  await page.evaluate(() => { document.querySelector('.modal').textContent = 'Actualizado'; });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.animaciones)).toBe(1);
  expect(await page.evaluate(() => window.gotas)).toBe(1);
  await page.evaluate(() => { document.querySelector('#modalOverlay').style.display='none'; });
  await page.waitForTimeout(100);
  await page.evaluate(() => { document.querySelector('#modalOverlay').style.display='block'; });
  await expect.poll(() => page.evaluate(() => window.animaciones)).toBe(2);
  await expect.poll(() => page.evaluate(() => window.gotas)).toBe(2);
});

test('se respeta movimiento reducido en dialogos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setContent('<button id="gesture">Abrir</button><div class="appi-dialog-overlay" hidden><div class="appi-dialog-card" role="dialog" aria-modal="true">Hola</div></div>');
  await page.evaluate(() => { window.animaciones = 0; Element.prototype.animate = function () { window.animaciones++; return {}; }; });
  await page.addScriptTag({ content: effects });
  await page.click('#gesture');
  await page.evaluate(() => { document.querySelector('.appi-dialog-overlay').hidden=false; });
  await expect(page.locator('.appi-dialog-overlay')).toBeVisible();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.animaciones)).toBe(0);
});
