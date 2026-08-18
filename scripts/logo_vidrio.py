#!/usr/bin/env python3
"""Logo de vidrio de APPI (v256).

Un único módulo dibuja el mismo logo en todos los arranques:

- las imágenes de inicio de iPhone y iPad (`splash/`),
- los íconos del manifiesto, que Android usa para su pantalla de arranque,
- el ícono de la pantalla de inicio de iOS.

Así el logo de vidrio es idéntico en todos los dispositivos.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TEXT = "APPI"

# Degradé claro de la app: el mismo de `background_color` del manifiesto.
TOP = (234, 241, 255)
MID = (245, 236, 255)
BOT = (255, 233, 242)


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def paint_background(w, h):
    """Fondo pastel con brillos suaves, sin ciclos por píxel."""
    steps = 256
    column = Image.new("RGB", (1, steps))
    px = column.load()
    for y in range(steps):
        t = y / (steps - 1)
        px[0, y] = lerp(TOP, MID, t / 0.45) if t < 0.45 else lerp(MID, BOT, (t - 0.45) / 0.55)
    img = column.resize((w, h), Image.BICUBIC)

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


def paint_glass_wordmark(base, *, font_ratio=0.085, center_y=0.46, ratio_base="min"):
    """Cartel de vidrio esmerilado con el wordmark APPI en letras heladas."""
    w, h = base.size
    reference = min(w, h) if ratio_base == "min" else max(w, h)
    size = max(24, int(reference * font_ratio))
    font = ImageFont.truetype(FONT_PATH, size)

    probe = ImageDraw.Draw(base)
    bbox = probe.textbbox((0, 0), TEXT, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx = w // 2
    ty = int(h * center_y) - th // 2 - bbox[1]
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
        cd.line([(0, y), (chip_w, y)],
                fill=(255, int(255 - t * 26), int(255 - t * 32), int(168 - t * 44)))
    border_w = max(2, int(chip_w * 0.004))
    cd.rounded_rectangle([0, 0, chip_w - 1, chip_h - 1], radius=radius,
                         outline=(255, 255, 255, 215), width=border_w)
    # reflejo superior del vidrio
    cd.line([(int(chip_w * 0.07), 1), (int(chip_w * 0.93), 1)],
            fill=(255, 255, 255, 205), width=max(1, int(chip_h * 0.03)))

    # el panel se recorta con sus esquinas redondeadas
    corner = Image.new("L", (chip_w, chip_h), 0)
    ImageDraw.Draw(corner).rounded_rectangle([0, 0, chip_w - 1, chip_h - 1], radius=radius, fill=255)
    chip.putalpha(Image.composite(chip.getchannel("A"), Image.new("L", (chip_w, chip_h), 0), corner))

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
    sheen_mask = Image.new("L", base.size, 0)
    sheen_mask.paste(corner, (x0, y0))
    sheen.putalpha(Image.composite(sheen.getchannel("A"), Image.new("L", base.size, 0), sheen_mask))

    # --- wordmark APPI en letras de vidrio esmerilado ---
    text_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    sh = ImageDraw.Draw(shadow)
    sh.text((tx, ty), TEXT, font=font, fill=(70, 78, 130, 255),
            stroke_width=max(1, int(size * 0.04)), stroke_fill=(70, 78, 130, 255))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, int(size * 0.05))))
    text_layer.alpha_composite(shadow, (0, int(size * 0.05)))

    fill_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(fill_mask).text((tx, ty), TEXT, font=font, fill=255,
                                   stroke_width=max(1, int(size * 0.045)), stroke_fill=255)
    white = Image.new("RGBA", base.size, (235, 241, 255, 200))
    text_layer.paste(white, (0, 0), fill_mask)

    edge = Image.new("RGBA", base.size, (0, 0, 0, 0))
    ImageDraw.Draw(edge).text((tx, ty), TEXT, font=font, fill=(255, 255, 255, 235),
                              stroke_width=max(1, int(size * 0.055)), stroke_fill=(255, 255, 255, 235))
    text_layer.alpha_composite(edge)

    result = Image.alpha_composite(base, glass)
    result = Image.alpha_composite(result, sheen)
    result = Image.alpha_composite(result, text_layer)
    return result


def glass_frame(w, h, *, font_ratio=0.085, center_y=0.46, ratio_base="min"):
    """Imagen completa: fondo pastel + logo de vidrio."""
    return paint_glass_wordmark(paint_background(w, h), font_ratio=font_ratio,
                                center_y=center_y, ratio_base=ratio_base)


def save_png(image, path):
    image.convert("RGB").save(path, "PNG", optimize=True)
    return path
