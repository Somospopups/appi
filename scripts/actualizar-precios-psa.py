#!/usr/bin/env python3
"""Lee tienda.psa.com.ar y escribe psa-catalogo.json + psa-precios.json."""
import html as htmlmod
import json
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT_CAT = ROOT / "psa-catalogo.json"
OUT_PRE = ROOT / "psa-precios.json"
IMG_DIR = ROOT / "catalogo-img"
GQL = "https://tienda.psa.com.ar/graphql"
UA = "APPI-precios/1.0"

SKUS = {
    "mini": "611030410",
    "vero": "611030420",
    "senior": "611010580",
    "senior4": "611010510",
    "s1000": "611120200",
    "senik": "611030540",
    "quantum2": "611030620",
    "c3": "611030430",
    "rinnova": "611100240",
    "rinnova-poli": "611100250",
    "portatil": "611020010",
    "stopper": "611030060",
    "poli2": "612280190",
    "soda": "617110040",
    "iontrix": "611290050",
}

URLS = {
    "mini": "https://tienda.psa.com.ar/psa-mini-bianco.html",
    "vero": "https://tienda.psa.com.ar/psa-vero-bianco.html",
    "senior": "https://tienda.psa.com.ar/psa-senior-bianco.html",
    "senior4": "https://tienda.psa.com.ar/psa-senior-4-bianco.html",
    "s1000": "https://tienda.psa.com.ar/psa-s-1000-ii-bianco.html",
    "senik": "https://tienda.psa.com.ar/psa-senik-bianco.html",
    "quantum2": "https://tienda.psa.com.ar/psa-quantum-2.html",
    "c3": "https://tienda.psa.com.ar/psa-c3-grigio.html",
    "rinnova": "https://tienda.psa.com.ar/ducha-psa-rinnova-bianco-con-kdf.html",
    "rinnova-poli": "https://tienda.psa.com.ar/ducha-psa-rinnova-bianco-con-kdf-y-poli.html",
    "portatil": "https://tienda.psa.com.ar/portatil.html",
    "stopper": "https://tienda.psa.com.ar/stopper.html",
    "poli2": "https://tienda.psa.com.ar/psa-poli-2-bianco.html",
    "soda": "https://tienda.psa.com.ar/psa-gasificador-soda.html",
    "iontrix": "https://tienda.psa.com.ar/psa-iontrix-3.html",
}

MESES = ("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")
CTX = ssl.create_default_context()
GRUPO_ORDEN = {"equipos": 0, "recargas": 1, "griferia": 2, "botellas": 3, "otros": 4}

# Canal @PSAPurificadores. El primero que matchea gana.
VIDEOS = [
    (("SENIOR4", "SENIOR 4"), "ZGPO3UHxzE0", "PSA Senior 4 — La evolución en la purificación del agua"),
    (("SENIK",), "ucPCBNzhCMk", "PSA Senik"),
    (("S-1000", "S·1000", "S•1000"), "kz31j16L_cQ", "Mantenimiento PSA S-1000 II"),
    (("VERO",), "EEXBGZNXAYg", "Purificador de agua PSA Vero"),
    (("MINI",), "kRXtseGEA8M", "PSA Mini"),
    (("RINNOVA", "DUCHA"), "tQV4c9p9TBQ", "PSA Rinnova — Una renovación en tu ducha"),
    (("BICO",), "2qL60kBDUlU", "Nueva Grifería Bicomando PSA"),
    (("SODA", "GASIFICADOR"), "f8Jb7wtu0tw", "SodaBurby — Gasificador de Agua PSA"),
    (("TÉRMICA", "TERMICA"), "lMJQB3PGIeI", "Nuevas botellas térmicas PSA"),
    (("NEO",), "s566uSsra_w", "Botella Neo reutilizable"),
    (("VIDRIO",), "UOTr9jI26Og", "Nueva Botella de vidrio PSA"),
    (("KIT MATERO", "MATE", "TERMO"), "gg_xh3VwuUI", "Nuevo mate y termo PSA"),
    (("SENIOR",), "__ISvWioYow", "Purificador de Agua PSA Senior"),
    (("AIRE",), "VV3CgvUgD78", "Purificador de Aire PSA"),
]


def fecha_ar(now=None):
    d = now or datetime.now(ZoneInfo("America/Argentina/Buenos_Aires"))
    return f"{d.day}-{MESES[d.month - 1]}-{d.year}"


def get(url, data=None, headers=None, timeout=40):
    h = {"User-Agent": UA}
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
        return res.read().decode("utf-8", "replace")


def get_bytes(url, timeout=25):
    h = {"User-Agent": UA}
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as res:
        return res.read()


def bajar_foto(sku, url):
    from io import BytesIO
    from PIL import Image

    IMG_DIR.mkdir(exist_ok=True)
    dest = IMG_DIR / f"{sku}.jpg"
    rel = f"catalogo-img/{sku}.jpg"
    if not url:
        return rel if dest.exists() else ""
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        url = "https://tienda.psa.com.ar" + url
    try:
        raw = get_bytes(url, timeout=25)
        im = Image.open(BytesIO(raw))
        im = im.convert("RGB")
        im.thumbnail((720, 720))
        im.save(dest, "JPEG", quality=74, optimize=True)
        return rel
    except Exception as e:
        print(f"  foto {sku}: {e}")
        return rel if dest.exists() else ""


def limp(s):
    return re.sub(r"\s+", " ", (s or "").replace("\\u00b7", "·")).strip()


def texto_html(raw):
    t = raw or ""
    t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.I)
    t = re.sub(r"<script[\s\S]*?</script>", " ", t, flags=re.I)
    t = re.sub(r"<img[^>]*>", " ", t, flags=re.I)
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.I)
    t = re.sub(r"</p>", "\n", t, flags=re.I)
    t = re.sub(r"</li>", "\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = htmlmod.unescape(t)
    t = t.replace("\xa0", " ").replace("\\u00b7", "·")
    out = []
    malo = (
        "cuotas sin",
        "promociones banc",
        "reintegros",
        "ver todas las promo",
        "precio sin imp",
        "aprovechá los grandes",
        "clic aquí",
        "click aquí",
    )
    for ln in t.split("\n"):
        s = limp(ln)
        if len(s) < 4:
            continue
        low = s.lower()
        if any(b in low for b in malo):
            continue
        out.append(s)
    return "\n".join(out).strip()


def recortar(s, n=720):
    s = (s or "").strip()
    if len(s) <= n:
        return s
    cut = s[:n]
    i = cut.rfind(". ")
    if i > n * 0.45:
        return cut[: i + 1]
    return cut.rsplit(" ", 1)[0] + "…"


def video_de(nombre):
    n = (nombre or "").upper()
    for keys, vid, titulo in VIDEOS:
        if any(k in n for k in keys):
            return "https://www.youtube.com/watch?v=" + vid, titulo
    return "", ""


def grupo(name, cats):
    n = (name or "").upper()
    cl = " ".join((c.get("name") or "") for c in (cats or [])).upper()
    if "GRIFER" in n:
        return "griferia"
    if any(x in n for x in ("BOTELLA", "MATE", "TERMO", "KIT MATERO")):
        return "botellas"
    if any(x in n for x in ("REPUESTO", "CARTUCHO", "KIT POSVENTA")):
        return "recargas"
    if any(
        x in n
        for x in (
            "SENIOR",
            "VERO",
            "MINI",
            "S-1000",
            "SENIK",
            "QUANTUM",
            "IONTRIX",
            "RINNOVA",
            "DUCHA",
            "C3",
            "SODA",
            "POLI 2",
            "STOPPER",
            "PORTÁTIL",
            "PORTATIL",
        )
    ):
        return "equipos"
    if "REPUESTOS" in cl:
        return "recargas"
    return "otros"


def graphql_catalogo():
    query = """query ($p:Int!) {
      products(search:"", pageSize:50, currentPage:$p){
        total_count page_info { current_page total_pages }
        items {
          sku name url_key stock_status
          meta_description
          description { html }
          short_description { html }
          small_image { url }
          price_range { minimum_price { final_price { value } regular_price { value } } }
          categories { name }
        }
      }
    }"""
    items = []
    page = 1
    pages = 1
    while page <= pages:
        body = json.dumps({"query": query, "variables": {"p": page}}).encode("utf-8")
        raw = json.loads(get(GQL, data=body, headers={"Content-Type": "application/json"}))
        prod = ((raw or {}).get("data") or {}).get("products") or {}
        items.extend(prod.get("items") or [])
        pages = int(((prod.get("page_info") or {}).get("total_pages") or 1))
        page += 1
    productos = []
    seen = set()
    for it in items:
        sku = str(it.get("sku") or "").strip()
        if not sku or sku in seen:
            continue
        seen.add(sku)
        pr = (((it.get("price_range") or {}).get("minimum_price") or {}).get("final_price") or {}).get("value")
        rg = (((it.get("price_range") or {}).get("minimum_price") or {}).get("regular_price") or {}).get("value")
        nombre = limp(it.get("name"))
        cats = [limp(c.get("name")) for c in (it.get("categories") or []) if c.get("name")]
        uk = (it.get("url_key") or "").strip()
        desc = recortar(texto_html(((it.get("description") or {}).get("html") or "")))
        short = recortar(texto_html(((it.get("short_description") or {}).get("html") or "")), 280)
        meta = limp(it.get("meta_description") or "")
        if meta and meta.lower() == nombre.lower():
            meta = ""
        para = recortar(meta or short or (desc.split("\n")[0] if desc else ""), 220)
        vurl, vtit = video_de(nombre)
        productos.append(
            {
                "sku": sku,
                "nombre": nombre,
                "precio": int(round(float(pr or 0))),
                "lista": int(round(float(rg or pr or 0))),
                "url": ("https://tienda.psa.com.ar/" + uk + ".html") if uk else "",
                "grupo": grupo(nombre, it.get("categories") or []),
                "stock": it.get("stock_status") or "",
                "cats": cats,
                "para": para,
                "desc": desc,
                "video": vurl,
                "videoTitulo": vtit,
                "foto": bajar_foto(sku, ((it.get("small_image") or {}).get("url") or "").strip()),
            }
        )
    productos.sort(key=lambda p: (GRUPO_ORDEN.get(p["grupo"], 9), p["nombre"].lower()))
    return productos


def scrape_uno(pid, url):
    html = get(url, timeout=25)
    m = re.search(r'"sku"\s*:\s*"(\d+)"', html)
    sku_ok = not m or m.group(1) == SKUS.get(pid)
    price = None
    ld = re.search(r'"offers"[^\}]{0,400}"price"\s*:\s*"?([\d.]+)', html)
    if ld:
        price = int(round(float(ld.group(1))))
    if not price:
        m2 = re.search(r'"price"\s*:\s*"?(\d[\d.]*)', html)
        if m2:
            price = int(round(float(m2.group(1))))
    name = ""
    nm = re.search(r'"name"\s*:\s*"([^"]{3,80})"', html)
    if nm:
        name = nm.group(1)
    if not price or not sku_ok:
        return None, name
    return price, name


def scrape_precios(faltan):
    precios = {}
    nombres = {}
    for pid in faltan:
        url = URLS.get(pid)
        if not url:
            continue
        try:
            price, name = scrape_uno(pid, url)
        except (urllib.error.URLError, TimeoutError) as e:
            print(f"  scrape {pid}: {e}")
            continue
        if price:
            precios[pid] = price
            if name:
                nombres[pid] = name
    return precios, nombres


def leer_prev(path):
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def main():
    prev_cat = leer_prev(OUT_CAT)
    prev_pre = leer_prev(OUT_PRE)
    productos = []
    try:
        productos = graphql_catalogo()
        print(f"graphql catálogo {len(productos)}")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"graphql no disponible: {e}")
    if not productos:
        productos = list((prev_cat.get("productos") or [])) if isinstance(prev_cat, dict) else []
        if not productos:
            raise SystemExit("la tienda no devolvió el catálogo")
        print("catálogo anterior conservado")

    by_sku = {p.get("sku"): p for p in productos if p.get("sku")}
    precios = {}
    nombres = {}
    for pid, sku in SKUS.items():
        row = by_sku.get(sku)
        if row and row.get("precio"):
            precios[pid] = int(row["precio"])
            nombres[pid] = row.get("nombre") or ""

    faltan = [pid for pid in SKUS if pid not in precios]
    if faltan:
        extra, extra_n = scrape_precios(faltan)
        precios.update(extra)
        nombres.update(extra_n)
        print(f"scrape +{len(extra)}")

    viejos = (prev_pre.get("precios") or {}) if isinstance(prev_pre, dict) else {}
    for pid, val in viejos.items():
        if pid not in precios and val:
            precios[pid] = val

    if not precios and not productos:
        raise SystemExit("la tienda no devolvió precios")

    fecha = fecha_ar()
    OUT_CAT.write_text(
        json.dumps({"actualizado": fecha, "fuente": "https://tienda.psa.com.ar/", "productos": productos}, ensure_ascii=False, indent=2)
        + "\n",
        encoding="utf-8",
    )
    OUT_PRE.write_text(
        json.dumps({"actualizado": fecha, "fuente": "https://tienda.psa.com.ar/", "precios": precios, "nombres": nombres}, ensure_ascii=False, indent=2)
        + "\n",
        encoding="utf-8",
    )
    print(f"ok {len(productos)} productos · {len(precios)} cotejo · {fecha}")


if __name__ == "__main__":
    main()
