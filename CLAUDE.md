# CLAUDE.md — ternaapp.github.io

La web de Terna: HTML, CSS y JS planos, sin build, publicados con GitHub Pages desde `main` (raíz) en `https://ternaapp.github.io`. Habla solo con Supabase (proyecto `terna`) por supabase-js. El motor, las migraciones, los documentos y el banco de pruebas viven en el repo privado `ternaapp/terna-motor`; las decisiones, en sus `docs/` (`diseno.md`, `brand.md`, `datos.md` §14, `seguridad-y-privacidad.md`, `qa.md`). Si este archivo y un documento se contradicen, manda el documento.

## Qué hay

- Once páginas: `index.html` (Inicio), `avisos.html`, `postulaciones.html`, `perfil.html`, `preferencias.html`, `invitaciones.html`, `admin.html`, `alertas.html` (las guías de alertas por mail, sin pestaña propia: marca Preferencias), y sin sesión `entrar.html`, `crear-cuenta.html`, `contrasena.html`. Cada una trae su esqueleto y carga los scripts con `defer`.
- `css/terna.css`: tokens de diseno.md §12, componentes, y los cortes 768 (contenido de escritorio), 1024 (barra única) y 1200 (cajón en línea).
- `js/textos.js`: todos los textos (copiados de brand.md) y el mapa de claves de error de datos.md §11. El código no escribe textos propios.
- `js/iconos.js`: el sprite de diseno.md §11.2. `js/comun.js`: cliente de Supabase, sesión, barra, bandas, avisos breves, hojas, diálogos, links firmados. `js/aviso.js`: piezas comunes de Avisos y Postulaciones. Un `js/{pagina}.js` por página.

## Reglas que no se negocian

1. **Sin build y sin dependencias nuevas.** supabase-js va por CDN con versión fija y SRI (`@supabase/supabase-js@2.118.0`); cambiar de versión es cambiar la URL y el `integrity` en las once páginas y volver a probar.
2. **CSP en cada página** (meta): scripts solo propios y de jsdelivr; conexiones solo al proyecto; sin `style` en línea (estilos por CSSOM) y sin `innerHTML` con datos: todo dato se escribe con `textContent` (`Terna.h`). La única excepción es el sprite de íconos, que es constante.
3. **Cada usuario ve solo lo suyo y eso lo garantiza RLS en la base**, no este código. La web usa la clave publishable (pública) y la sesión de la persona; nunca una clave de servicio.
4. **Ningún dato de una persona real** en el repo, en ejemplos ni en capturas: las pruebas usan las cuentas y los fixtures sintéticos de `terna-motor` (`@terna.invalid`, "Empresa de Prueba", "(PRUEBA)").
5. **Textos de brand.md, diseño de diseno.md, contrato de datos de datos.md §14.** Un texto, una lectura o una escritura nueva se propone y se agrega primero al documento.
6. **Accesible**: navegable con teclado, foco visible, hojas y diálogos `<dialog>` con el foco adentro y de vuelta al cerrar, textos accesibles para lo que es solo visual, contraste AA (axe-core sin violaciones serias en el banco de pruebas).

## Cómo probar

En `terna-motor/pruebas_web/` (qa.md §2.6; necesita PostgreSQL local, Python con psycopg y Playwright, y Node para `npm pack`; este repo clonado al lado de `terna-motor`, o su carpeta en `TERNA_WEB`):

```
PGHOST=localhost PGPORT=5432 PGUSER=postgres pruebas_web/preparar.sh   # base local terna_web con A, B y un admin
python pruebas_web/probar_web.py        # 37 casos con aserciones (o -k avisos, -k alta…)
python pruebas_web/recorrido.py         # capturas de cada página a 390, 320, 768, 1024 y 1280 px
```

El navegador habla con una pasarela local que imita PostgREST, GoTrue y Storage sobre esa base (`pasarela.py`); nunca con el proyecto real. Lo que solo se puede ver en un teléfono (iOS, Safari) está en la lista de qa.md.

## Publicar

**Antes de cada commit que toque `css/` o `js/`: `python3 herramientas/sellar.py`.** Pone en cada `.html` la huella del contenido de cada archivo (`js/textos.js?v=1a2b3c4d5e`). GitHub Pages deja que el navegador guarde cada archivo 10 minutos; sin el sello, quien entra justo después de publicar puede recibir un archivo nuevo con otro viejo y la página se rompe (le pasó a Preferencias el 31/10/2026; qa.md 0.5.14, observación 59). No es un build: los archivos se sirven tal cual. El banco lo controla (`archivos_sellados`), y si igual una página se rompe al armarse, `comun.js` la recarga sola una vez.

`git push` a `main`: GitHub Pages publica la raíz en un par de minutos. Antes: los sellos al día, las pruebas en verde y las once páginas abiertas en el sitio publicado sin errores de consola ni de CSP.
