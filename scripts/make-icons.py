#!/usr/bin/env python3
"""Íconos de APPI v256 con el logo de vidrio.

Android dibuja su pantalla de arranque con el ícono del manifiesto sobre
`background_color`; iOS usa `apple-touch-icon.png`. Al generarlos con el mismo
logo de vidrio del splash, el arranque se ve igual en todos los dispositivos.
"""
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from logo_vidrio import glass_frame, save_png  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def icono(size, font_ratio):
    return glass_frame(size, size, font_ratio=font_ratio, center_y=0.5)


def main():
    # `any`: el cartel de vidrio ocupa casi todo el ícono.
    save_png(icono(512, 0.215), ROOT / "icon-512.png")
    save_png(icono(192, 0.215), ROOT / "icon-192.png")
    # `maskable`: más chico, dentro de la zona segura que recorta Android.
    save_png(icono(512, 0.155), ROOT / "icon-512-maskable.png")
    save_png(icono(192, 0.155), ROOT / "icon-192-maskable.png")
    # iOS recorta las esquinas del ícono de la pantalla de inicio.
    save_png(icono(180, 0.205), ROOT / "apple-touch-icon.png")
    for nombre in ["icon-512.png", "icon-192.png", "icon-512-maskable.png",
                   "icon-192-maskable.png", "apple-touch-icon.png"]:
        print(nombre)


if __name__ == "__main__":
    main()
