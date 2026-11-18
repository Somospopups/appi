#!/usr/bin/env python3
"""Tests de guardia para scripts/actualizar-precios-psa.py.

Verifica la lógica que NO depende de red: parseo de fechas, frescura de
ganancias/ingreso, y que la edición de financiación auditada esté ligada al
PDF oficial. Se ejecuta con python3 directo (sin framework) y también desde
tests/e2e/precios-psa-guardia.spec.js via execFileSync.

    $ python3 tests/actualizar-precios-psa.test.py
"""
import importlib.util
import json
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def cargar_updater():
    spec = importlib.util.spec_from_file_location(
        "upd", ROOT / "scripts" / "actualizar-precios-psa.py"
    )
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def falla(label, fn):
    try:
        fn()
    except SystemExit:
        return
    except Exception:
        return
    raise AssertionError(f"{label}: se esperaba SystemExit y no ocurrió")


def main():
    m = cargar_updater()
    fallas = []

    # 1. Parseo de fechas DD-Mes-YYYY.
    if m.dias_desde_fecha("17-Nov-2026") != 1:
        fallas.append("dias_desde_fecha(17-Nov-2026) != 1")
    if m.dias_desde_fecha("23-Sep-2026") is None:
        fallas.append("dias_desde_fecha no parsea 23-Sep-2026")
    if m.dias_desde_fecha("nada") is not None:
        fallas.append("dias_desde_fecha no debe parsear texto inválido")

    # 2. verificar_frescura: un archivo vencido debe fallar de calle.
    with tempfile.TemporaryDirectory() as tmp:
        vencido = Path(tmp) / "vencido.json"
        vencido.write_text(json.dumps({"actualizado": "1-Ene-2026"}), encoding="utf-8")
        falla("frescura vencida", lambda: m.verificar_frescura(vencido, etiqueta="vencido"))

        fresco = Path(tmp) / "fresco.json"
        fresco.write_text(json.dumps({"actualizado": m.fecha_ar()}), encoding="utf-8")
        m.verificar_frescura(fresco, etiqueta="fresco")  # no debe elevar

    # 3. verificar_ingreso: sin grupo 'ingreso' debe fallar.
    falla("ingreso ausente", lambda: m.verificar_ingreso([{"grupo": "equipos"}]))
    m.verificar_ingreso([{"grupo": "ingreso"}, {"grupo": "ingreso"}])  # no debe elevar

    # 4. La edición de financiación auditada debe estar ligada al PDF oficial
    #    y estar presente en planes-psa-verificados.json.
    verificadas = json.loads(
        (ROOT / "scripts" / "planes-psa-verificados.json").read_text(encoding="utf-8")
    )
    if "legales-financiacion-vigencia_16-11-2026.pdf" not in verificadas:
        fallas.append("falta la edición 16-11-2026 en planes-psa-verificados.json")
    else:
        edicion = verificadas["legales-financiacion-vigencia_16-11-2026.pdf"]
        ids = {b["id"] for b in edicion.get("bancos", [])}
        if ids != {"cuota-simple", "tarjeta-naranja", "banco-galicia", "banco-provincia", "cabal"}:
            fallas.append(f"bancos inesperados en la edición auditada: {sorted(ids)}")
        for b in edicion.get("bancos", []):
            if not b.get("cuotas"):
                fallas.append(f"banco {b['id']} sin cuotas en la edición auditada")

    # 5. El updater debe contener la guarda de hard-fail (no publicar en
    #    silencio una edición no auditada).
    src = (ROOT / "scripts" / "actualizar-precios-psa.py").read_text(encoding="utf-8")
    if "financiación no auditable" not in src:
        fallas.append("el updater no contiene la guarda de financiación no auditable")

    if fallas:
        print("FALLOS:")
        for f in fallas:
            print(" -", f)
        sys.exit(1)
    print("ok: guardas de frescura y financiación auditada en condiciones")


if __name__ == "__main__":
    main()
