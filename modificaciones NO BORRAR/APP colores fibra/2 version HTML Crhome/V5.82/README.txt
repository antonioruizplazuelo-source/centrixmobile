# Código Fibras

Aplicación web para consultar/editar códigos de colores de fibra óptica.
Funciona en navegador y se puede **instalar como app** (PWA) en Android.

## 📁 Contenido de la carpeta

```
codigo-fibras/
├── index.html             ← punto de entrada (elegir diseño)
├── fiber-pro.html         ← versión PC / pantalla grande
├── fiber-mobile.html      ← versión móvil
├── fiber-master.html      ← versión "Fiber Master" (alternativa)
├── shared.js              ← lógica común (paleta, helpers, IDB)
├── gallery-data.js        ← metadatos de la galería (sin fotos)
├── fiber-pro.jsx          ← código de la app Pro
├── fiber-mobile.jsx       ← código de la app Móvil
├── fiber-master.jsx       ← código de la app Master
├── manifest.json          ← manifiesto PWA
├── sw.js                  ← service worker (offline)
├── icon-192.png           ← icono PWA 192×192
├── icon-512.png           ← icono PWA 512×512
├── icon-maskable-512.png  ← icono PWA "maskable"
└── assets/
    ├── factory-backup.json   ← datos iniciales (cables, referencia)
    └── photos/               ← 49 fotos CTOs (jpg/png)
```

## 🚀 Cómo usar

### En PC

1. Descomprime la carpeta donde quieras.
2. Doble clic en `index.html`.
3. ¡Listo!

Funciona también sin servidor (abriendo el .html directamente), pero el modo
"Instalar app" NO aparecerá. Para instalarla, sirve la carpeta con cualquier
servidor estático (mira sección "📲 Instalar como app" más abajo).

### En móvil (Android)

1. **Copia la carpeta `codigo-fibras/` al móvil** (cable USB, Drive, etc.).
2. Instala **Cx Explorador de Archivos** (Play Store, gratis).
3. En Cx: ve a la carpeta, mantén pulsado, menú **"Servidor HTTP"** → Iniciar.
   Te dirá una URL tipo `http://127.0.0.1:25333/codigo-fibras/index.html`.
4. Abre esa URL en **Chrome**.
5. En el menú ⋮ → **"Añadir a la pantalla de inicio"** o pulsa el botón
   **"Instalar como app"** que aparece en *Más*.
6. Se instalará como una app más, con icono en el menú de inicio.

> Mientras la URL tenga `127.0.0.1` (o `localhost`), Chrome la considera segura
> y permite instalar la PWA. Después de instalada, la app funciona offline.

## 🗂️ Datos iniciales (factory-backup.json)

Al arrancar la app por primera vez (o al pulsar "Recargar fábrica"), busca
`assets/factory-backup.json` y carga todo:

- **cables**: lista de cables (R CABLE 128, 64, 32, 16, etc.)
- **reference**: tabla de pérdidas (splitters, RISERs, combinaciones no permitidas)
- **galleryCustom**: fotos personalizadas adicionales (vacío por defecto)
- **galleryOverrides**: cambios sobre las 49 fotos de fábrica

### ¿Quieres tu propio juego de cables?

Edita `assets/factory-backup.json` manualmente (es texto JSON) y reemplázalo.
La próxima vez que la app arranque "limpia" (o pulses *Recargar fábrica*),
cargará tus datos.

**O más fácil**: usa la app:
1. Ajusta cables/referencia a tu gusto desde dentro.
2. *Más → Backup (JSON)* → se descarga un archivo.
3. Renombra ese archivo a `factory-backup.json` y reemplaza el de la carpeta.

## 🖼️ Fotos CTOs

Las **49 fotos del catálogo** están en `assets/photos/`. La app las carga por URL,
no las guarda en el navegador (mucho más ligero).

- Para añadir más fotos del catálogo: copia los JPG/PNG a `assets/photos/` y
  añade entradas en `gallery-data.js`.
- Para añadir fotos tuyas desde la app: *Galería CTOs → +* (se guardan dentro
  del navegador). Para que viajen con la app, exporta backup y reemplaza
  `factory-backup.json`.

## 🔒 Candado

La app arranca BLOQUEADA — para evitar cambios accidentales. Pulsa la pastilla
"Bloqueado" arriba a la derecha para editar. Vuelve a pulsarla para bloquear.

## 💾 Backup

**¡Hazlo!** Si borras la caché del navegador, pierdes todo lo que hayas
añadido/modificado dentro de la app (los datos en `assets/` siguen intactos).

*Más → Backup (JSON)* → descarga un archivo con todos tus cables y notas.
*Más → Restaurar (JSON)* → recupéralos.

---

Versión 4 · mayo 2026
