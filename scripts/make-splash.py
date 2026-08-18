#!/usr/bin/env python3
"""Imágenes de arranque de APPI v256: el logo de vidrio en todos los iPhone y iPad.

Genera el juego completo de `apple-touch-startup-image` en vertical y, para las
tablets, también en horizontal, de modo que ningún dispositivo arranque con un
recuadro blanco en lugar del logo.
"""
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from logo_vidrio import glass_frame, save_png  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "splash"

# Verticales: iPhone SE hasta iPhone 16 Pro Max y toda la línea de iPad.
PORTRAIT = [
    (640, 1136),
    (750, 1334),
    (828, 1792),
    (1125, 2436),
    (1170, 2532),
    (1179, 2556),
    (1206, 2622),
    (1242, 2208),
    (1242, 2688),
    (1284, 2778),
    (1290, 2796),
    (1320, 2868),
    (1488, 2266),
    (1536, 2048),
    (1620, 2160),
    (1640, 2360),
    (1668, 2224),
    (1668, 2388),
    (2048, 2732),
]

# Horizontales: las tablets arrancan apaisadas y también necesitan su logo.
LANDSCAPE = [
    (2266, 1488),
    (2048, 1536),
    (2160, 1620),
    (2360, 1640),
    (2224, 1668),
    (2388, 1668),
    (2732, 2048),
]


def main():
    OUT.mkdir(exist_ok=True)
    generados = set()
    for w, h in PORTRAIT:
        frame = glass_frame(w, h, font_ratio=0.085, center_y=0.46)
        dest = save_png(frame, OUT / f"apple-splash-{w}x{h}.png")
        generados.add(Path(dest).name)
        print(Path(dest).name)
    for w, h in LANDSCAPE:
        # En apaisado el logo se mide contra el alto para no quedar gigante.
        frame = glass_frame(w, h, font_ratio=0.115, center_y=0.46)
        dest = save_png(frame, OUT / f"apple-splash-{w}x{h}.png")
        generados.add(Path(dest).name)
        print(Path(dest).name)

    for viejo in sorted(OUT.glob("apple-splash-*.png")):
        if viejo.name not in generados:
            viejo.unlink()
            print(f"eliminado {viejo.name}")


if __name__ == "__main__":
    main()
