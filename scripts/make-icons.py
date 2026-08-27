#!/usr/bin/env python3
"""Íconos de la pantalla de inicio (v400).

El dibujo vive en brand/icono-app.png: vidrio oscuro con APPI al centro,
dentro de la zona que recortan Android (círculo) e iOS (esquinas).
La pantalla de arranque de iPhone sigue saliendo de logo_vidrio.py.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "brand" / "icono-app.png"


def resize(size):
    im = Image.open(MASTER).convert("RGB")
    return im.resize((size, size), Image.Resampling.LANCZOS)


def main():
    if not MASTER.exists():
        raise SystemExit(f"Falta el original: {MASTER}")
    pares = [
        (512, ROOT / "icon-512.png"),
        (192, ROOT / "icon-192.png"),
        # El original ya deja APPI en la zona segura: maskable usa el mismo recorte.
        (512, ROOT / "icon-512-maskable.png"),
        (192, ROOT / "icon-192-maskable.png"),
        (180, ROOT / "apple-touch-icon.png"),
    ]
    for size, dest in pares:
        resize(size).save(dest, optimize=True)
        print(dest.name)


if __name__ == "__main__":
    main()
