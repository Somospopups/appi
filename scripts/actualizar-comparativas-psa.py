#!/usr/bin/env python3
"""Descarga y rasteriza las comparativas oficiales de PSA para las fichas APPI.

Los enlaces de DIP no llevan fecha. Por eso se compara el SHA-256 del PDF:
si PSA reemplaza el archivo manteniendo la URL, la imagen y su vigencia se
actualizan. Si un enlace deja de responder, se conserva la última copia válida.
"""
from __future__ import annotations

import hashlib
import io
import json
import re
import ssl
import urllib.request
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "comparativas-img"
OUT = ROOT / "psa-comparativas.json"
UA = "APPI-comparativas/1.0"
CTX = ssl.create_default_context()

COMPARATIVAS = (
    {
        "id": "senior4",
        "producto": "PSA Senior4 + Kit Posventa",
        "url": "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/argentina/comparativas/comparativo-senior-4-kit.pdf",
    },
    {
        "id": "senior",
        "producto": "PSA Senior Bianco + Kit Posventa",
        "url": "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/argentina/comparativas/comparativo-senior-kit.pdf",
    },
    {
        "id": "s1000",
        "producto": "PSA S-1000-2",
        "url": "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/argentina/comparativas/comparativo-S1000-II.pdf",
    },
    {
        "id": "senik",
        "producto": "PSA Senik + Kit Posventa",
        "url": "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/argentina/comparativas/comparativo-senik.pdf",
    },
    {
        "id": "burby",
        "producto": "PSA SodaBurby",
        "url": "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/argentina/comparativas/comparativo-burby.pdf",
    },
)


def descargar(url: str, timeout: int = 40) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/pdf"})
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
        raw = res.read()
    if not raw.startswith(b"%PDF"):
        raise ValueError("la respuesta no es un PDF")
    return raw


def vigencia_de(texto: str) -> str:
    texto = texto.replace("\u00a0", " ")
    match = re.search(r"Vigencia\s*:\s*([^\n\r]+)", texto, re.IGNORECASE)
    vigencia = re.sub(r"\s+", " ", match.group(1)).strip(" .|-_") if match else ""
    # En algunos PDF de Corel la palabra «Vigencia» queda codificada, pero la
    # fecha sí es extraíble. La toma como respaldo en todo el documento.
    fecha = re.search(r"\d{1,2}\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+,?\s+\d{4}", vigencia or texto)
    return fecha.group(0) if fecha else vigencia[:60]


def leer_vigencia(raw: bytes) -> str:
    doc = fitz.open(stream=raw, filetype="pdf")
    texto = "\n".join(p.get_text("text") for p in doc)
    return vigencia_de(texto)


def rasterizar(raw: bytes, destino: Path) -> tuple[int, int, str]:
    doc = fitz.open(stream=raw, filetype="pdf")
    if len(doc) != 1:
        raise ValueError(f"se esperaba una página y llegaron {len(doc)}")
    page = doc[0]
    ancho_objetivo = 1800
    zoom = ancho_objetivo / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    mode = "RGB" if pix.n == 3 else "CMYK" if pix.n == 4 else "RGB"
    image = Image.frombytes(mode, (pix.width, pix.height), pix.samples)
    if image.mode != "RGB":
        image = image.convert("RGB")
    destino.parent.mkdir(parents=True, exist_ok=True)
    image.save(destino, "JPEG", quality=88, optimize=True, progressive=True)
    texto = "\n".join(p.get_text("text") for p in doc)
    return image.width, image.height, vigencia_de(texto)


def cargar_anterior() -> dict[str, dict]:
    try:
        data = json.loads(OUT.read_text(encoding="utf-8"))
        return {str(x.get("id")): x for x in data.get("comparativas", []) if x.get("id")}
    except Exception:
        return {}


def main() -> int:
    IMG_DIR.mkdir(exist_ok=True)
    anteriores = cargar_anterior()
    salida = []
    errores = []

    for cfg in COMPARATIVAS:
        cid = cfg["id"]
        destino = IMG_DIR / f"{cid}.jpg"
        previo = anteriores.get(cid, {})
        try:
            raw = descargar(cfg["url"])
            sha = hashlib.sha256(raw).hexdigest()
            cambio = sha != previo.get("sha256") or not destino.exists()
            if cambio:
                ancho, alto, vigencia = rasterizar(raw, destino)
                print(f"  {cid}: actualizado ({vigencia or 'vigencia no detectada'})")
            else:
                ancho = int(previo.get("ancho") or 0)
                alto = int(previo.get("alto") or 0)
                vigencia = str(previo.get("vigencia") or "") or leer_vigencia(raw)
                print(f"  {cid}: sin cambios")
            salida.append({
                "id": cid,
                "producto": cfg["producto"],
                "url": cfg["url"],
                "imagen": f"comparativas-img/{cid}.jpg",
                "vigencia": vigencia,
                "sha256": sha,
                "ancho": ancho,
                "alto": alto,
            })
        except Exception as exc:
            errores.append(f"{cid}: {exc}")
            # Una caída temporal de DIP no borra la última comparativa válida.
            if previo and destino.exists():
                salida.append(previo)
                print(f"  {cid}: no disponible; se conserva la última copia ({exc})")
            else:
                print(f"  {cid}: ERROR sin copia local ({exc})")

    if len(salida) != len(COMPARATIVAS):
        raise SystemExit("No se pudieron preparar las cinco comparativas oficiales")

    salida.sort(key=lambda x: [c["id"] for c in COMPARATIVAS].index(x["id"]))
    data = {
        "fuente": "PSA DIP · Comparativas de costos Argentina",
        "comparativas": salida,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if errores:
        print("Avisos: " + " | ".join(errores))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
