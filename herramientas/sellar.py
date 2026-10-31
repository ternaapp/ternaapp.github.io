#!/usr/bin/env python3
"""Sella los archivos propios que carga cada página con la huella de su contenido: `js/textos.js?v=1a2b3c4d5e`.

Por qué (31/10/2026): GitHub Pages deja que el navegador guarde cada archivo 10 minutos. Sin sello, una persona que entra
justo después de publicar puede recibir un archivo nuevo (preferencias.js) y otro viejo guardado (textos.js), y la página
se rompe ("Algo falló del lado de Terna"); "Probar de nuevo" no lo arregla porque recarga con lo guardado. Con el sello,
el HTML pide cada archivo por una dirección que cambia cuando cambia su contenido, así que nunca se mezclan versiones.
No es un build: los archivos se sirven tal cual; solo cambia el `?v=` de las referencias en los .html.

Uso, desde la raíz del repo, antes de cada commit que toque css/ o js/:
    python3 herramientas/sellar.py              # escribe los sellos
    python3 herramientas/sellar.py --comprobar  # sale con 1 si falta un sello o alguno no corresponde (lo usa el banco)
Solo biblioteca estándar.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
REFERENCIA = re.compile(r'(?P<attr>(?:src|href))="(?P<ruta>(?:css|js)/[A-Za-z0-9_.-]+\.(?:js|css))(?:\?v=(?P<sello>[A-Za-z0-9]*))?"')


def huella(ruta: Path) -> str:
    return hashlib.sha256(ruta.read_bytes()).hexdigest()[:10]


def main() -> int:
    comprobar = "--comprobar" in sys.argv[1:]
    huellas: dict[str, str] = {}
    problemas: list[str] = []
    cambiadas = 0
    for pagina in sorted(RAIZ.glob("*.html")):
        texto = pagina.read_text(encoding="utf-8")

        def sellar(m: re.Match) -> str:
            ruta = m.group("ruta")
            archivo = RAIZ / ruta
            if not archivo.exists():
                problemas.append(f"{pagina.name}: {ruta} no existe")
                return m.group(0)
            h = huellas.setdefault(ruta, huella(archivo))
            if m.group("sello") != h:
                problemas.append(f"{pagina.name}: {ruta} con sello {m.group('sello') or '(ninguno)'}, su contenido es {h}")
            return f'{m.group("attr")}="{ruta}?v={h}"'

        nuevo = REFERENCIA.sub(sellar, texto)
        if not comprobar and nuevo != texto:
            pagina.write_text(nuevo, encoding="utf-8")
            cambiadas += 1
    if comprobar:
        for p in problemas:
            print(p)
        print("sellos al día" if not problemas else f"{len(problemas)} referencias sin sellar o con sello viejo: correr herramientas/sellar.py")
        return 1 if problemas else 0
    faltan = [p for p in problemas if "no existe" in p]
    for p in faltan:
        print(p)
    print(f"{cambiadas} páginas selladas, {len(huellas)} archivos")
    return 1 if faltan else 0


if __name__ == "__main__":
    sys.exit(main())
