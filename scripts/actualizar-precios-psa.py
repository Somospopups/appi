#!/usr/bin/env python3
"""Lee precios de lista en tienda.psa.com.ar y escribe psa-precios.json."""
import json
import re
import ssl
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "psa-precios.json"
GQL = "https://tienda.psa.com.ar/graphql"
UA = "APPI-precios/1.0"

# Un SKU representativo por modelo (mismo precio en todos los colores).
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


def graphql_precios():
    parts = []
    for i, sku in enumerate(SKUS.values()):
        parts.append(
            f'p{i}: products(filter: {{sku: {{eq: "{sku}"}}}}, pageSize: 1) '
            "{ items { sku name price_range { minimum_price { final_price { value } } } } }"
        )
    body = json.dumps({"query": "{ " + " ".join(parts) + " }"}).encode("utf-8")
    raw = json.loads(get(GQL, data=body, headers={"Content-Type": "application/json"}))
    precios = {}
    nombres = {}
    by_sku = {}
    for block in (raw.get("data") or {}).values():
        for it in (block or {}).get("items") or []:
            sku = str(it.get("sku") or "")
            val = (((it.get("price_range") or {}).get("minimum_price") or {}).get("final_price") or {}).get("value")
            if sku and val:
                by_sku[sku] = (int(round(float(val))), it.get("name") or "")
    for pid, sku in SKUS.items():
        if sku in by_sku:
            precios[pid], nombres[pid] = by_sku[sku]
    return precios, nombres


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


def main():
    prev = {}
    if OUT.exists():
        try:
            prev = json.loads(OUT.read_text(encoding="utf-8"))
        except Exception:
            prev = {}
    precios = {}
    nombres = {}
    try:
        precios, nombres = graphql_precios()
        print(f"graphql {len(precios)}/{len(SKUS)}")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"graphql no disponible: {e}")
    faltan = [pid for pid in SKUS if pid not in precios]
    if faltan:
        extra, extra_n = scrape_precios(faltan)
        precios.update(extra)
        nombres.update(extra_n)
        print(f"scrape +{len(extra)} · total {len(precios)}")
    if not precios:
        raise SystemExit("la tienda no devolvió precios")
    viejos = (prev.get("precios") or {}) if isinstance(prev, dict) else {}
    for pid, val in viejos.items():
        if pid not in precios and val:
            precios[pid] = val
    out = {
        "actualizado": fecha_ar(),
        "fuente": "https://tienda.psa.com.ar/",
        "precios": precios,
        "nombres": nombres,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"ok {len(precios)} precios · {out['actualizado']}")
    for pid in SKUS:
        print(f"  {pid}: ${precios.get(pid, '—')}")


if __name__ == "__main__":
    main()
