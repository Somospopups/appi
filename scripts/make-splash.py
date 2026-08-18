#!/usr/bin/env python3
"""Splash nativo de APPI: mismo fondo de la app, wordmark sin recuadro."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "splash"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SIZES = [
    (750, 1334),
    (828, 1792),
    (1125, 2436),
    (1170, 2532),
    (1179, 2556),
    (1242, 2208),
    (1242, 2688),
    (1284, 2778),
    (1290, 2796),
    (1536, 2048),
    (1620, 2160),
    (1640, 2360),
    (1668, 2388),
    (2048, 2732),
]


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def paint_background(w, h):
    img = Image.new("RGB", (w, h))
    px = img.load()
    top, mid, bot = (234, 241, 255), (245, 236, 255), (255, 233, 242)
    for y in range(h):
        t = y / max(h - 1, 1)
        color = lerp(top, mid, t / 0.45) if t < 0.45 else lerp(mid, bot, (t - 0.45) / 0.55)
        for x in range(w):
            px[x, y] = color
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    blobs = [
        (int(w * 0.05), int(h * -0.02), int(w * 0.55), int(h * 0.38), (120, 170, 255, 90)),
        (int(w * 0.50), int(h * 0.08), int(w * 1.08), int(h * 0.48), (200, 150, 255, 78)),
        (int(w * 0.10), int(h * 0.68), int(w * 0.90), int(h * 1.12), (255, 170, 210, 80)),
    ]
    for box in blobs:
        g.ellipse(box[:4], fill=box[4])
    glow = glow.filter(ImageFilter.GaussianBlur(radius=max(w, h) * 0.06))
    return Image.alpha_composite(img.convert("RGBA"), glow)


def paint_wordmark(img):
    w, h = img.size
    size = max(56, int(min(w, h) * 0.085))
    font = ImageFont.truetype(FONT, size)
    text = "APPI"
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (w - tw) // 2 - bbox[0]
    y = int(h * 0.46) - th // 2 - bbox[1]
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text((x, y), text, font=font, fill=255)
    grad = Image.new("RGBA", (w, h))
    gp = grad.load()
    c1, c2, c3 = (91, 141, 239, 255), (160, 107, 255, 255), (255, 107, 157, 255)
    for i in range(w):
        t = i / max(w - 1, 1)
        color = lerp(c1[:3], c2[:3], t / 0.5) + (255,) if t < 0.5 else lerp(c2[:3], c3[:3], (t - 0.5) / 0.5) + (255,)
        for j in range(h):
            gp[i, j] = color
    colored = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    colored.paste(grad, mask=mask)
    return Image.alpha_composite(img, colored)


def main():
    OUT.mkdir(exist_ok=True)
    for w, h in SIZES:
        frame = paint_wordmark(paint_background(w, h))
        dest = OUT / f"apple-splash-{w}x{h}.png"
        frame.convert("RGB").save(dest, "PNG", optimize=True)
        print(dest.name)


if __name__ == "__main__":
    main()
