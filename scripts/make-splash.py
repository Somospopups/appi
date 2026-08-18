#!/usr/bin/env python3
"""Splash nativo de APPI v255: el logo APPI sobre vidrio esmerilado.

Mismo fondo degradé de la app, con un cartel de vidrio esmerilado
(panel translúcido con reflejo superior) que sostiene el wordmark APPI
en letras con brillo helado, sombra suave y borde de luz.
"""
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


def paint_glass_wordmark(base):
    w, h = base.size
    size = max(56, int(min(w, h) * 0.085))
    font = ImageFont.truetype(FONT, size)
    text = "APPI"

    # --- medidas del texto ---
    probe = ImageDraw.Draw(base)
    bbox = probe.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx = w // 2
    ty = int(h * 0.46) - th // 2 - bbox[1]
    tx = (w - tw) // 2 - bbox[0]

    # --- cartel de vidrio (panel translúcido redondeado) ---
    pad_x = int(tw * 0.16)
    pad_top = int(th * 0.62)
    pad_bot = int(th * 0.70)
    x0 = cx - tw // 2 - pad_x
    x1 = cx + tw // 2 + pad_x
    y0 = ty + bbox[1] - pad_top
    y1 = ty + bbox[1] + th + pad_bot
    chip_w, chip_h = x1 - x0, y1 - y0
    radius = int(chip_h * 0.34)

    chip = Image.new("RGBA", (chip_w, chip_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(chip)
    for y in range(chip_h):
        t = y / max(chip_h - 1, 1)
        r = int(255)
        g = int(255 - t * 26)
        b = int(255 - t * 32)
        a = int(168 - t * 44)
        cd.line([(0, y), (chip_w, y)], fill=(r, g, b, a))
    border_w = max(2, int(chip_w * 0.004))
    cd.rounded_rectangle([0, 0, chip_w - 1, chip_h - 1], radius=radius,
                         outline=(255, 255, 255, 215), width=border_w)
    # reflejo superior del vidrio
    cd.line([(int(chip_w * 0.07), 1), (int(chip_w * 0.93), 1)],
            fill=(255, 255, 255, 205), width=max(1, int(chip_h * 0.03)))

    glass = Image.new("RGBA", base.size, (0, 0, 0, 0))
    glass.paste(chip, (x0, y0))

    # --- reflejo diagonal que cruza el vidrio ---
    sheen = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheen)
    band = int(chip_w * 0.34)
    pts = [(x0 - int(chip_h * 0.15), y0 + int(chip_h * 0.30)),
           (x0 + band, y0 - int(chip_h * 0.05)),
           (x0 + band, y0 - int(chip_h * 0.05) - int(chip_h * 0.30)),
           (x0 - int(chip_h * 0.15), y0 + int(chip_h * 0.30) - int(chip_h * 0.30))]
    sd.polygon(pts, fill=(255, 255, 255, 60))

    # --- wordmark APPI en letras de vidrio esmerilado ---
    text_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    # sombra suave detrás de las letras
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sh = ImageDraw.Draw(shadow)
    sh.text((tx, ty), text, font=font, fill=(70, 78, 130, 255),
            stroke_width=max(1, int(size * 0.04)), stroke_fill=(70, 78, 130, 255))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(size * 0.05))))
    text_layer.alpha_composite(shadow, (0, int(size * 0.05)))

    # cuerpo esmerilado: blanco translúcido
    fill_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(fill_mask).text((tx, ty), text, font=font, fill=255,
                                   stroke_width=max(1, int(size * 0.045)), stroke_fill=255)
    white = Image.new("RGBA", base.size, (235, 241, 255, 200))
    text_layer.paste(white, (0, 0), fill_mask)
    # borde de luz
    edge = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).text((tx, ty), text, font=font, fill=(255, 255, 255, 235),
                              stroke_width=max(1, int(size * 0.055)), stroke_fill=(255, 255, 255, 235))
    text_layer.alpha_composite(edge)

    result = Image.alpha_composite(base, glass)
    result = Image.alpha_composite(result, sheen)
    result = Image.alpha_composite(result, text_layer)
    return result


def main():
    OUT.mkdir(exist_ok=True)
    for w, h in SIZES:
        frame = paint_glass_wordmark(paint_background(w, h))
        dest = OUT / f"apple-splash-{w}x{h}.png"
        frame.convert("RGB").save(dest, "PNG", optimize=True)
        print(dest.name)


if __name__ == "__main__":
    main()
