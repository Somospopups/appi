import { chromium } from 'playwright';
import fs from 'node:fs';

const b64 = fs.readFileSync('/home/user/uploads/IMG_20260914_084055331.jpg').toString('base64');
const zxing = fs.readFileSync('vendor/zxing.min.js', 'utf8');

const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
await page.addScriptTag({ content: zxing });
const resultado = await page.evaluate(async (b64) => {
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/jpeg;base64,' + b64; });
  const out = document.createElement('canvas');
  // probar a tamaños descendentes (la app lo hace a 1000 px)
  for (const W of [1600, 1200, 1000, 800, 640]) {
    out.width = W; out.height = Math.round(img.naturalHeight * W / img.naturalWidth);
    const ctx = out.getContext('2d');
    ctx.drawImage(img, 0, 0, out.width, out.height);
    const { data } = ctx.getImageData(0, 0, out.width, out.height);
    const lum = new Uint8ClampedArray(out.width * out.height);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = Math.round(0.299 * data[i*4] + 0.587 * data[i*4+1] + 0.114 * data[i*4+2]);
    }
    const src = new ZXing.RGBLuminanceSource(lum, out.width, out.height);
    const bm = new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(src));
    const reader = new ZXing.MultiFormatReader();
    reader.setHints(new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.QR_CODE]]]));
    for (const rot of [0, 90, 180, 270]) {
      try {
        const r = reader.decode(bm, { tryRotations: rot === 0 });
        return { W, rot, texto: r.getText() };
      } catch (e) {}
    }
    // rotaciones manuales del canvas
    for (const rot of [90, 180, 270]) {
      const c2 = document.createElement('canvas');
      c2.width = rot % 180 ? out.height : out.width;
      c2.height = rot % 180 ? out.width : out.height;
      const x2 = c2.getContext('2d');
      x2.translate(c2.width / 2, c2.height / 2);
      x2.rotate(rot * Math.PI / 180);
      x2.drawImage(out, -out.width / 2, -out.height / 2);
      const d2 = x2.getImageData(0, 0, c2.width, c2.height).data;
      const l2 = new Uint8ClampedArray(c2.width * c2.height);
      for (let i = 0; i < l2.length; i++) l2[i] = Math.round(0.299*d2[i*4] + 0.587*d2[i*4+1] + 0.114*d2[i*4+2]);
      const s2 = new ZXing.RGBLuminanceSource(l2, c2.width, c2.height);
      const b2 = new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(s2));
      try {
        const r = reader.decode(b2);
        return { W, rot, texto: r.getText() };
      } catch (e) {}
    }
    break;
  }
  return null;
}, b64);
console.log(JSON.stringify(resultado));
await browser.close();
