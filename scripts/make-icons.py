#!/usr/bin/env python3
"""Íconos del mismo color que el splash de Android, para que el recuadro desaparezca."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
BG = (238, 244, 255, 255)  # #eef4ff — igual a background_color del manifest


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))


def wordmark(size, text_ratio=0.22):
    img = Image.new("RGBA", (size, size), BG)
    font = ImageFont.truetype(FONT, max(18, int(size * text_ratio)))
    draw = ImageDraw.Draw(img)
    text = "APPI"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) // 2 - bbox[0]
    y = (size - th) // 2 - bbox[1]
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).text((x, y), text, font=font, fill=255)
    c1, c2, c3 = (91, 141, 239), (160, 107, 255), (255, 107, 157)
    grad = Image.new("RGBA", (size, size))
    px = grad.load()
    for i in range(size):
        t = i / max(size - 1, 1)
        rgb = lerp(c1, c2, t / 0.5) if t < 0.5 else lerp(c2, c3, (t - 0.5) / 0.5)
        for j in range(size):
            px[i, j] = rgb + (255,)
    colored = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    colored.paste(grad, mask=mask)
    return Image.alpha_composite(img, colored)


def save(img, name):
    dest = ROOT / name
    img.convert("RGB").save(dest, "PNG", optimize=True)
    print(dest.name, img.size)


def main():
    icon512 = wordmark(512, 0.20)
    icon192 = wordmark(192, 0.20)
    save(icon512, "icon-512.png")
    save(icon192, "icon-192.png")
    save(wordmark(512, 0.16), "icon-512-maskable.png")
    save(wordmark(192, 0.16), "icon-192-maskable.png")
    save(wordmark(180, 0.20), "apple-touch-icon.png")


if __name__ == "__main__":
    main()
