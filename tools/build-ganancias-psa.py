#!/usr/bin/env python3
"""Genera psa-ganancias.json: por producto, precio público (lista Sugeridos
con Acuerdo) + las 6 columnas de costo (lista Contado Unificado) + líneas
Plan canje + PB. Fuente: los dos PDFs oficiales públicos de PSA.

Uso: python3 tools/build-ganancias-psa.py
     (baja los PDFs sola; usa psa-catalogo.json del repo para los SKUs)

Columnas de costo (Contado Unificado):
  ri_j = Responsable Inscripto/Monotributista · Dist. Junior
  ri_d = RI/Mono · Distrib.
  ri_c = RI/Mono · DC/CE/LE
  nc_j = Sujeto No Categorizado · Dist. Junior
  nc_d = No Categorizado · Distrib.
  nc_c = No Categorizado · DC/CE/LE
"""
import io
import json
import re
import ssl
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "psa-ganancias.json"
CAT = ROOT / "psa-catalogo.json"

URL_CONTADO = "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/listas-precios/vigente/argentina/argentina-contado-unificado.pdf"
URL_SUGER = "https://dip.psa.com.ar/adjuntos/Image/promociones/exterior/listas-precios/vigente/argentina/argentina-sugeridos-con-acuerdo.pdf"
CTX = ssl.create_default_context()
UA = "APPI-ganancias/1.0"

MES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
ROMANOS = {"ii": "2", "iii": "3", "iv": "4", "vi": "6", "ix": "9"}
OPCIONALES = {"kit", "posv", "k"}


def bajar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60, context=CTX) as r:
        return r.read()


def texto_pdf(raw):
    r = PdfReader(io.BytesIO(raw))
    return "\n".join((p.extract_text() or "") for p in r.pages)


def num(s):
    s = (s or "").replace("$", "").replace(" ", "").strip()
    m = re.fullmatch(r"(\d+(?:\.\d+)*),(\d{2})", s)
    if not m:
        return None
    return float(m.group(1).replace(".", "") + "." + m.group(2))


def tokens(name):
    """Misma identidad de producto que tools/build-catalogo-psa.mjs."""
    t = unicodedata_nfd(name).lower()
    t = re.sub(r"[^a-z0-9]+", " ", t).split()
    out = []
    for w in t:
        w = ROMANOS.get(w, w)
        if out and out[-1][-1:].isalpha() and w.isdigit():
            out[-1] += w
        else:
            out.append(w)
    t2 = [w for w in out if w not in OPCIONALES]
    if "bm" in t2:
        t2.remove("bm")
        t2.append("bajomesada")
    if "bajo" in t2 and "mesada" in t2:
        t2.remove("bajo")
        t2.remove("mesada")
        t2.append("bajomesada")
    if "sm" in t2:
        t2.remove("sm")
    return frozenset(t2)


def unicodedata_nfd(s):
    import unicodedata
    return unicodedata.normalize("NFD", str(s or "").replace("\u00b7", ""))


def es_canje(name):
    return "plan canje" in re.sub(r"[^a-z ]", " ", unicodedata_nfd(name).lower())


def nombre_base(name):
    n = re.sub(r"\s*plan canje\.?\s*$", "", str(name or ""), flags=re.I)
    return re.sub(r"\s+", " ", n).strip()


def parsear_contado(texto):
    """Devuelve {tokenset: {pb, lista, cols[6], canje: {...}}}."""
    out = {}
    for ln in texto.split("\n"):
        if "$" not in ln:
            continue
        parts = ln.split("$")
        if len(parts) < 8:
            continue
        nums = [num(p) for p in parts[1:8]]
        if any(n is None for n in nums):
            continue
        head = parts[0].strip()
        if not head or len(head) < 4:
            continue
        if re.match(r"^(pb|pcio|vigencia|contado)", head, re.I):
            continue
        pb = None
        m = re.search(r"\s(\d+\.\d{1,2})\s*$", head)
        if m:
            try:
                pb = float(m.group(1))
                head = head[: m.start()].strip()
            except ValueError:
                pass
        if not head:
            continue
        tk = tokens(nombre_base(head))
        if not tk:
            continue
        registro = {"pb": pb, "lista": nums[0], "cols": nums[1:7]}
        if es_canje(head):
            prev = out.get(tk)
            if prev is None:
                prev = out[tk] = {"pb": pb, "lista": nums[0], "cols": nums[1:7], "canje": None}
            prev.setdefault("canje", None)
            if prev["canje"] is None:
                prev["canje"] = registro
        else:
            if tk not in out:
                out[tk] = {"pb": pb, "lista": nums[0], "cols": nums[1:7], "canje": None}
    return out


def parsear_sugeridos(texto):
    """Devuelve {tokenset: {publico, publico_canje}}."""
    out = {}
    for ln in texto.split("\n"):
        if "$" not in ln:
            continue
        parts = ln.split("$")
        head = parts[0].strip()
        m = re.match(r"^(.*?)\s*(\d[\d.]*(?:,\d{2})?)\s*$", head)
        if not m:
            continue
        nombre, pub0 = m.group(1).strip(), num(m.group(2))
        nums = [pub0] + [num(p) for p in parts[1:5]]
        if any(n is None for n in nums) or len(nums) != 5:
            continue
        if len(nombre) < 4 or re.match(r"^(precio|val\.?|vigencia|sugeridos)", nombre, re.I):
            continue
        tk = tokens(nombre_base(nombre))
        if not tk:
            continue
        if es_canje(nombre):
            prev = out.setdefault(tk, {"publico": None, "publico_canje": None})
            if prev["publico_canje"] is None:
                prev["publico_canje"] = nums[0]
        else:
            prev = out.setdefault(tk, {"publico": None, "publico_canje": None})
            if prev["publico"] is None:
                prev["publico"] = nums[0]
    return out


def mes_nombre(texto):
    m = re.search(r"Desde el (\d{1,2}) de ([a-záéíóú]+) de (\d{4})", texto, re.I)
    if not m:
        return ""
    meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
    mm = meses.index(m.group(2).lower())
    return f"{int(m.group(1))}-{MES[mm]}-{m.group(3)}"


def main():
    contado_raw = bajar(URL_CONTADO)
    suger_raw = bajar(URL_SUGER)
    tc = texto_pdf(contado_raw)
    ts = texto_pdf(suger_raw)
    vigencia = mes_nombre(tc) or mes_nombre(ts)
    costo = parsear_contado(tc)
    pub = parsear_sugeridos(ts)

    cat = json.loads(CAT.read_text(encoding="utf-8"))
    productos_out = {}
    usados = set()
    stats = {"con_sku": 0, "sin_sku": 0, "con_costo": 0, "con_publico": 0, "sin_nada": 0}

    for p in cat.get("productos", []):
        nombre = p.get("nombre") or ""
        if not nombre:
            continue
        tk = tokens(nombre_base(nombre))
        c = costo.get(tk)
        s = pub.get(tk)
        entry = {
            "nombre": nombre,
            "pb": (c or {}).get("pb"),
            "publico": (s or {}).get("publico"),
            "costos": None,
            "publico_canje": (s or {}).get("publico_canje"),
            "costos_canje": None,
        }
        if c:
            entry["costos"] = {
                "ri_j": c["cols"][0], "ri_d": c["cols"][1], "ri_c": c["cols"][2],
                "nc_j": c["cols"][3], "nc_d": c["cols"][4], "nc_c": c["cols"][5],
            }
            if c.get("canje"):
                entry["costos_canje"] = {
                    "ri_j": c["canje"]["cols"][0], "ri_d": c["canje"]["cols"][1], "ri_c": c["canje"]["cols"][2],
                    "nc_j": c["canje"]["cols"][3], "nc_d": c["canje"]["cols"][4], "nc_c": c["canje"]["cols"][5],
                }
        clave = p.get("sku") or ("n:" + nombre.lower().strip())
        productos_out[clave] = entry
        if p.get("sku"):
            stats["con_sku"] += 1
        else:
            stats["sin_sku"] += 1
        if entry["costos"]:
            stats["con_costo"] += 1
        if entry["publico"]:
            stats["con_publico"] += 1
        if not entry["costos"] and not entry["publico"]:
            stats["sin_nada"] += 1

    # Productos que están en las listas y no en el catálogo (se agregan por nombre).
    for tk, c in costo.items():
        match = None
        for clave, e in productos_out.items():
            if tokens(e["nombre"]) == tk:
                match = clave
                break
        if match:
            continue
        s = pub.get(tk)
        nombre = ""
        for ln in ts.split("\n"):
            if "$" not in ln:
                continue
            head = ln.split("$")[0].strip()
            m = re.match(r"^(.*?)\s*\d", head)
            if not m:
                continue
            if tokens(nombre_base(m.group(1))) == tk:
                nombre = nombre_base(m.group(1))
                break
        if not nombre:
            continue
        entry = {
            "nombre": nombre, "pb": c.get("pb"),
            "publico": (s or {}).get("publico"),
            "costos": None, "publico_canje": (s or {}).get("publico_canje"), "costos_canje": None,
        }
        entry["costos"] = {
            "ri_j": c["cols"][0], "ri_d": c["cols"][1], "ri_c": c["cols"][2],
            "nc_j": c["cols"][3], "nc_d": c["cols"][4], "nc_c": c["cols"][5],
        }
        productos_out["n:" + nombre.lower()] = entry
        stats["sin_sku"] += 1

    out = {
        "actualizado": f"{datetime.now(ZoneInfo('America/Argentina/Buenos_Aires')).day}-{MES[datetime.now().month - 1]}-{datetime.now().year}",
        "vigencia": vigencia,
        "fuente": {"contado": URL_CONTADO, "sugeridos": URL_SUGER},
        "columnas": {
            "ri_j": "RI/Mono · Dist. Junior", "ri_d": "RI/Mono · Distrib.", "ri_c": "RI/Mono · DC/CE/LE",
            "nc_j": "No Cat. · Junior", "nc_d": "No Cat. · Distrib.", "nc_c": "No Cat. · DC/CE/LE",
        },
        "productos": productos_out,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"vigencia: {vigencia}")
    print(f"productos: {len(productos_out)} · {stats}")

    # Verificación contra números confirmados a mano (las listas 9-Sept-2026).
    def buscar(nombre_parte, clave=None):
        if clave and clave in productos_out:
            return productos_out[clave]
        for e in productos_out.values():
            if nombre_parte in (e["nombre"] or "").upper():
                return e
        return None

    checks = [
        (buscar("SENIOR BIANCO", "611010580"), 781000.0, 466999.50, 702900.0),
        (buscar("VERO BIANCO", "611030420"), 549000.0, 303831.00, 494100.0),
        (buscar("ABLANDADOR PSA DOMUS"), 2782000.0, 2214300.00, None),
        (buscar("S-1000 2 SM BIANCO", "611120200"), 1100000.0, 723567.90, 990000.0),
        (buscar("SENIK SM BIANCO", "611030540"), 1298000.0, 848476.20, None),
    ]
    fallos = 0
    for e, pub_exp, costo_exp, canje_exp in checks:
        if not e:
            print("FALLO: no encontrado", pub_exp, costo_exp)
            fallos += 1
            continue
        ok = e.get("publico") == pub_exp and e.get("costos") and abs(e["costos"]["ri_c"] - costo_exp) < 0.01
        if canje_exp is not None:
            ok = ok and e.get("publico_canje") == canje_exp
        print(("OK  " if ok else "FALLO"), e["nombre"], "| público", e.get("publico"), "| ri_c", (e.get("costos") or {}).get("ri_c"), "| canje", e.get("publico_canje"))
        fallos += 0 if ok else 1
    if fallos:
        print(f"{fallos} verificaciones fallidas")
        sys.exit(1)
    print("verificación completa ✓")


if __name__ == "__main__":
    main()
