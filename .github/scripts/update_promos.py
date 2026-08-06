#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Actualizador automático de promociones PSA.

Flujo:
  1. Descarga la página de promociones vigentes
  2. Extrae el link del PDF de legales (cambia con la fecha: legales-*.pdf)
  3. Descarga el PDF y extrae su texto
  4. Parsea las promociones (nombre, cuotas sin interés, vigencia, MODO)
  5. Genera promociones.json y lo escribe SOLO si cambió respecto al actual
  6. Sale con código 0 (sin cambios) o 2 (hubo cambios) o 1 (error)
"""
import hashlib
import io
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

PAGINA = "https://tienda.psa.com.ar/promociones_vigentes"
JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "promociones.json")
JSON_PATH = os.path.abspath(JSON_PATH)

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}


def descargar(url, timeout=45):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def extraer_link_pdf(html):
    """Busca el href del PDF de legales aunque el nombre cambie."""
    m = re.search(
        r'href="(https://contenidos\.psa\.com\.ar/uploads/legales[^"]*\.pdf)"',
        html,
    )
    return m.group(1) if m else None


def extraer_texto_pdf(pdf_bytes):
    from pypdf import PdfReader
    r = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join((p.extract_text() or "") for p in r.pages)


def parsear_cuotas(bloque):
    """Extrae la lista de cuotas sin interés: '3, 6, 9, 12, 15, 18 y 24 cuotas sin interés'."""
    m = re.search(r"([\d,\s]+(?:\s+y\s+)?\d*)\s*cuotas?\s+sin\s+inter[ée]s", bloque, re.I)
    if not m:
        return []
    nums = re.findall(r"\d+", m.group(1))
    return [int(n) for n in nums]


def normalizar_vigencia(bloque):
    """Intenta extraer un rango de fechas legible. Devuelve (corto, texto) o (None, texto)."""
    # Caso 1: 'Válido todos los días del 1/8/2026 al 11/8/2026' / 'del 1/8/2026 al 11/8/2026'
    m = re.search(r"del\s+(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{4}))?\s+al\s+(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{4}))?", bloque, re.I)
    if m:
        d1, m1, a1, d2, m2, a2 = m.groups()
        a1 = a1 or a2 or str(datetime.now().year)
        return f"{d1}/{m1}/{a1} al {d2}/{m2}/{a2}", None
    # Caso 2: 'desde el sábado 1° hasta el jueves 6 de agosto de 2026' / 'entre el 1° y el 11 de agosto'
    for patron in (
        r"desde\s+el\s+[^\d]*?(\d{1,2})[°º]?\s+hasta\s+el\s+[^\d]*?(\d{1,2})[°º]?\s+de\s+(\w+)\s+de\s+(\d{4})",
        r"entre\s+el\s+[^\d]*?(\d{1,2})[°º]?\s+y\s+el\s+[^\d]*?(\d{1,2})[°º]?\s+de\s+(\w+)\s+de\s+(\d{4})",
        r"desde\s+el\s+[^\d]*?(\d{1,2})[°º]?\s+al\s+[^\d]*?(\d{1,2})[°º]?\s+de\s+(\w+)\s+de\s+(\d{4})",
    ):
        m = re.search(patron, bloque, re.I)
        if m:
            d1, d2, mes, anio = m.groups()
            mesn = MESES.get(mes.lower())
            if mesn:
                return f"{d1}/{mesn}/{anio} al {d2}/{mesn}/{anio}", None
    # Caso 3: 'hasta el 11-8-2026'
    m = re.search(r"hasta\s+el\s+(\d{1,2})[/\-](\d{1,2})(?:[/\-](\d{4}))?", bloque, re.I)
    if m:
        d, mm, aa = m.groups()
        aa = aa or str(datetime.now().year)
        return f"hasta el {d}/{mm}/{aa}", None
    # Caso 4: texto libre con fecha suelta
    m = re.search(r"hasta\s+el\s+([\d\-/]+)", bloque, re.I)
    if m:
        return f"hasta el {m.group(1)}", None
    return None, None


def detectar_solo_modo(bloque):
    """True si la promoción es EXCLUSIVA de MODO."""
    if re.search(r"operaciones\s+v[áa]lidas\s+(?:solo\s+)?a\s+trav[ée]s\s+de\s+modo", bloque, re.I):
        return True
    if re.search(r"(?:solo|únicamente)\s+a\s+trav[ée]s\s+de\s+modo", bloque, re.I):
        return True
    return False


PALABRAS_PROHIBIDAS = {
    "beneficio", "válido", "valido", "válida", "valida", "cartera", "promoción",
    "promocion", "operaciones", "tasa", "participan", "participa", "las", "los",
    "para", "desde", "hasta", "con", "por", "solo", "sólo", "única", "unica",
    "exclusivo", "información", "informacion", "imágenes", "imagenes", "click",
    "consulta", "legales", "vigencia", "psa", "reserva", "derecho", "modificar",
}


def es_titulo_promo(linea):
    """Heurística para detectar títulos de promoción en el PDF."""
    l = linea.strip()
    if not l or len(l) > 60 or l.endswith("."):
        return False
    # Todo mayúsculas (con símbolos) → título
    if l.isupper() and len(l) > 2:
        return True
    if re.match(r"^[A-ZÁÉÍÓÚÑÜ /0-9]+$", l) and len(l) > 3:
        return True
    # Empieza con mayúscula, pocas palabras y sin palabras de texto legal
    if re.match(r"^[A-ZÁÉÍÓÚÑÜ]", l):
        palabras = l.split()
        if len(palabras) <= 5:
            if not any(p.lower().strip(".,/") in PALABRAS_PROHIBIDAS for p in palabras):
                return True
    return False


def parsear_promociones(texto):
    lineas = [l.strip() for l in texto.split("\n")]
    lineas = [l for l in lineas if l]

    titulos = []
    for i, l in enumerate(lineas):
        if es_titulo_promo(l):
            titulos.append((i, l))

    promos = []
    for idx, (i, titulo) in enumerate(titulos):
        fin = titulos[idx + 1][0] if idx + 1 < len(titulos) else len(lineas)
        bloque = " ".join(lineas[i + 1:fin])
        cuotas = parsear_cuotas(bloque)
        vig, vig_texto = normalizar_vigencia(bloque)
        promo = {
            "nombre": titulo,
            "cuotas": cuotas,
            "vigencia": vig or (vig_texto or ""),
            "soloModo": detectar_solo_modo(bloque),
            "detalle": re.sub(r"\s+", " ", bloque)[:600],
        }
        promos.append(promo)
    return promos


def main():
    try:
        html = descargar(PAGINA).decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"ERROR: no se pudo descargar la página: {e}")
        return 1

    link_pdf = extraer_link_pdf(html)
    if not link_pdf:
        print("ERROR: no se encontró el link del PDF de legales en la página")
        return 1
    print(f"PDF de legales encontrado: {link_pdf}")

    try:
        pdf_bytes = descargar(link_pdf)
    except Exception as e:
        print(f"ERROR: no se pudo descargar el PDF: {e}")
        return 1

    hash_pdf = hashlib.sha256(pdf_bytes).hexdigest()[:16]

    try:
        texto = extraer_texto_pdf(pdf_bytes)
    except Exception as e:
        print(f"ERROR: no se pudo leer el PDF: {e}")
        return 1

    promos = parsear_promociones(texto)
    if not promos:
        print("ERROR: el parseo no encontró promociones; no se actualiza nada")
        return 1

    nuevo = {
        "version": 2,
        "actualizado": datetime.now(timezone(timedelta(hours=-3))).isoformat(timespec="minutes"),
        "fuente": link_pdf,
        "hashPdf": hash_pdf,
        "promociones": promos,
    }

    # Comparar con el existente (ignorando 'actualizado' para no generar commits falsos)
    anterior = None
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, encoding="utf-8") as f:
                anterior = json.load(f)
        except Exception:
            anterior = None

    def esencial(d):
        if not d:
            return None
        return {k: d[k] for k in ("version", "fuente", "hashPdf", "promociones")}

    if esencial(anterior) == esencial(nuevo):
        print("SIN_CAMBIOS: las promociones no cambiaron")
        return 0

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(nuevo, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"CAMBIOS_DETECTADOS: {len(promos)} promociones escritas en promociones.json")
    return 2


if __name__ == "__main__":
    sys.exit(main())
