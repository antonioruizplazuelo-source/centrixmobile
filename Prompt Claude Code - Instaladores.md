# Encargo: instaladores de CentrixMobile para Windows y Android

## Contexto

`CentrixMobile.html` es una app completa de gestión de preventivos de energía y PCI. Todo va en un solo archivo HTML (~6 MB): lógica, estilos, base de datos de nodos, un PDF incrustado y la ayuda. Hoy funciona abierta en Edge o Chrome.

Hay que convertirla en **dos aplicaciones instalables e independientes del navegador**:

- **Windows:** un instalador `.exe` (Electron + electron-builder, NSIS).
- **Android:** un `.apk` firmado (Capacitor 6).

Las dos tienen que:
- abrirse a pantalla completa, sin barra de direcciones ni ningún rastro de navegador;
- llevar su propio icono en el instalador, el menú Inicio, el escritorio, la barra de tareas y el lanzador de Android;
- guardar los datos en su propio almacenamiento, de forma que borrar la caché o el historial del navegador no les afecte;
- funcionar sin conexión, salvo Google Drive, que necesita internet.

## Regla número uno: no romper ni quitar nada

1. **No reescribir, reorganizar, «limpiar» ni «mejorar» `CentrixMobile.html`.** Guardar el original intacto como `original/CentrixMobile.html` y comparar siempre contra él.
2. En el HTML solo se permiten dos cambios:
   - sustituir los recursos de CDN por copias locales (ver «Offline» más abajo);
   - añadir **una única línea** justo antes de `</body>`: `<script src="native-bridge.js"></script>`.
3. Toda la adaptación nativa va en `native-bridge.js`. Tiene que:
   - detectar la plataforma (`window.electronAPI`, `window.Capacitor?.isNativePlatform()`);
   - **no hacer nada** si la app se abre en un navegador normal;
   - sustituir funciones globales de la app solo envolviéndolas, igual que ya hace la app (`const orig = fn; fn = function(){…}`), y llamar a la original siempre que sea posible.
4. La app tiene que seguir funcionando exactamente igual abierta como archivo en Edge o Chrome.
5. Antes de entregar, pasar la **lista de comprobación** del final en las dos plataformas. Si algo no se puede hacer, dejarlo documentado; nunca quitarlo en silencio.

## Qué hace la app (todo debe seguir funcionando)

- Buscar un nodo (KRT / MM / CX / alias). Datos del nodo y enlace a Google Maps. Nodos personalizados.
- Pestañas General / Pruebas de campo / Evidencias.
- Equipos con icono (emoji), marca y modelo por tipo de equipo, y fecha de instalación.
- Pantalla «Llenado de pruebas» con módulos, pruebas, campos adicionales y leyendas (ⓘ). Tipos de campo:
  - tipo0: Sí/No;
  - tipo1: OK / No OK / N/A / Corregido, con descripción en No OK y Corregido;
  - tipo2: lista con opción «Otro»;
  - tipo3: número;
  - tipo4: texto largo;
  - tipo5, tipo6, tipo7: fechas, escritas o con calendario.
- Guardado automático en `localStorage`, con fotos reducidas en IndexedDB (`centrixMobile` / `fotos`).
- Barra inferior propia con Atrás, Inicio, ruta y Guardar. Botón Atrás de Android. Diálogo de salida con Guardar y salir / No guardar / Cancelar.
- Fotos por categoría con cámara (`<input type="file" accept="image/*" capture="environment" multiple>`), renombradas en orden («Cuadro eléctrico 01.jpg»…).
- **Carpeta local** (File System Access API: `showDirectoryPicker`, `getDirectoryHandle`, `getFileHandle`, `createWritable`, `entries`, `removeEntry`, `queryPermission` / `requestPermission`). El handle se guarda en IndexedDB `centrixMobileAjustes` / `kv`, clave `carpeta`.
  - Estructura: `NODO alias-CX-MM / NN - fecha / NODO alias - dd-mm-aaaa.html + preventivo.json + fotos`.
  - Hay además una función para leer preventivos desde una carpeta, y Histórico la usa sola.
- Histórico en tarjetas o filas: Ver todo, Modificar, Editar con fecha de hoy, Borrar.
- Informes:
  - «Descargar como HTML» genera el informe con las fotos dentro;
  - «Exportar PDF» hace `window.open` y después `print()`.
- Compartir:
  - en móvil, `navigator.share` con archivos;
  - en Windows, un diálogo con un ZIP que la app genera ella misma.
- Copia de seguridad `.json` completa (descarga y restauración con `<input type="file">`).
- **Google Drive** con Google Identity Services (`accounts.google.com/gsi/client`, scope `drive.file`). Copia automática al pulsar Guardar, con la misma ruta que en local. Nunca borra nada en Drive.
- Ayuda con procedimientos, un PDF incrustado (`<script type="text/plain" id="cxPdf_olt">` en base64) que se abre con `window.open(blobURL)` o se descarga, y el manual de la app.
- Temas claro/oscuro con color configurable.

Las funciones globales que hay que envolver están en los bloques `v4`…`v9` del final del HTML:
- `cxDescargar(blob, nombre)`;
- `cxCompartir` / `shareTelegram`;
- `exportPDF`;
- `cxPdfAbrir`;
- `cxElegirCarpeta`;
- `cxDirInit`;
- `cxDrvToken`;
- `cxPerformExit`;
- `cxRequestExit`.

Constantes que hay que tener en cuenta: `CX_FS`, `CX_MOVIL` y `CX_DRV_OK_ORIGEN`. Están declaradas con `const`: no redefinirlas; envolver las funciones que las usan.

## Offline: quitar dependencias de CDN

Descargar y servir en local:
- Font Awesome 6.4.0: css y webfonts;
- fuentes Google «Atkinson Hyperlegible Next» y «Atkinson Hyperlegible Mono».

Cambiar solo las URL de los `<link>` correspondientes.

`accounts.google.com/gsi/client` se queda remoto, porque Drive necesita conexión igualmente.

## Icono

Crear `assets/icon.svg` y `assets/icon-1024.png`: cuadrado redondeado (radio de un 22 %) en azul `#2563eb` con un rayo (glifo «bolt» de Font Awesome) blanco centrado. Es el mismo logotipo que se ve en la cabecera del menú de la app.

A partir de ahí, generar:
- `icon.ico` multitamaño (16, 24, 32, 48, 64, 128 y 256) para Windows;
- los iconos adaptativos y la pantalla de inicio de Android con `@capacitor/assets`.

## Windows: Electron + electron-builder

- **Servidor local.** Servir la carpeta de la app con un servidor HTTP interno en `http://localhost:47831`. El puerto es fijo para que el origen no cambie y los datos se conserven siempre. Hace falta porque:
  - Google solo acepta orígenes http(s) para OAuth;
  - File System Access necesita un contexto seguro (localhost lo es).

  Si el puerto está ocupado, avisar; no cambiarlo en silencio, porque se perderían los datos.
- **Ventana:**
  - `BrowserWindow` maximizada, `autoHideMenuBar: true`, sin menú y con el título «CentrixMobile»;
  - F11 activa y desactiva la pantalla completa;
  - una sola instancia (`requestSingleInstanceLock`);
  - `contextIsolation: true` y un `preload.js` que exponga `window.electronAPI`.
- **Datos:** `app.setName('CentrixMobile')`. Todo va en `userData` (`%APPDATA%\CentrixMobile`). No borrarlo nunca al actualizar.
- **Permisos:** en `session.setPermissionRequestHandler` / `setPermissionCheckHandler`, conceder `fileSystem`, `clipboard-sanitized-write` y `notifications`. Comprobar que la carpeta elegida sigue disponible tras reiniciar la app; es decir, que `cxDirInit` no pide reconectar cada vez. Si Electron no mantiene el permiso, guardarlo mediante el preload.
- **Cerrar ventana (✕ de Windows):** interceptar `close`, cancelarlo y ejecutar `window.centrixRequestExit()` en la página. Así sale el diálogo propio de la app. Cuando la app llame a `window.close()` (desde `cxPerformExit`), cerrar de verdad.
- **Descargas** (`cxDescargar`, copia de seguridad, ZIP, informe HTML y PDF): gestionar `will-download` guardando en la carpeta Descargas del usuario, con el nombre sugerido y sin diálogo. Añadir un aviso de sistema con la opción «Mostrar en carpeta».
- **`window.open`:** con `setWindowOpenHandler`:
  - los `blob:` de PDF abren una ventana hija que usa el visor de PDF de Chromium;
  - la ventana de «Exportar PDF» (sin URL) abre una ventana hija donde `print()` funcione, y «Guardar como PDF» tiene que estar disponible;
  - los enlaces http externos (Google Maps…) se abren en el navegador del sistema con `shell.openExternal`.
- **Compartir (mejora nativa, opcional y detectable).** Si `window.electronAPI` existe, envolver `cxCompartir` para ofrecer además:
  - «Abrir en Outlook»: escribir el informe y las fotos en una carpeta temporal y lanzar `outlook.exe /a <archivo>` (una llamada por adjunto, o solo el ZIP) si Outlook clásico está instalado;
  - «Mostrar archivos en carpeta»: `shell.showItemInFolder` para arrastrarlos a Telegram Desktop.

  Mantener siempre las opciones actuales («Descargar ZIP» y «Menú Compartir de Windows»).
- **Instalador (electron-builder, NSIS):**
  - appId `com.aruiz.centrixmobile`, productName `CentrixMobile`;
  - instalación por usuario y opción de elegir carpeta;
  - accesos directos en el escritorio y en el menú Inicio;
  - icono en el instalador, la app y el desinstalador;
  - el desinstalador **no** borra los datos del usuario.

  Generar `CentrixMobile-Setup-x.y.z.exe`. Firmarlo con certificado si lo hay; si no, documentar el aviso de SmartScreen.

## Android: Capacitor 6

- Proyecto Capacitor con `webDir` en la carpeta de la app (`index.html` = CentrixMobile.html). Configuración:
  - `server.androidScheme: 'https'`: el origen es `https://localhost` y los datos se conservan entre versiones;
  - `appId: 'com.aruiz.centrixmobile'` y `appName: 'CentrixMobile'`.
- **Pantalla completa:**
  - sin barra de navegador;
  - `@capacitor/status-bar` con el color del tema (la app lo expone en `<meta name="theme-color" id="cxThemeColor">`);
  - `windowSoftInputMode="adjustResize"` para que el teclado no tape los campos;
  - la app ya usa `env(safe-area-inset-*)`.
- **Botón Atrás:** instalar `@capacitor/app`. La app ya escucha `Capacitor.Plugins.App.addListener('backButton', …)` y usa `exitApp()`. Comprobar que en la pantalla principal sale el diálogo de salida y que la app no se cierra sin preguntar.
- **Cámara y galería:** el `<input type="file" capture>` tiene que abrir la cámara y la galería. Permisos: `CAMERA`, y lectura de imágenes (`READ_MEDIA_IMAGES`).
- **Carpeta en Android.** La app desactiva la carpeta cuando `showDirectoryPicker` no existe (`CX_FS`). En `native-bridge.js`:
  - crear un **polyfill** de `window.showDirectoryPicker` y de los handles sobre `@capacitor/filesystem`, en `Directory.Documents`, raíz `CentrixMobile/`. Opcionalmente, Storage Access Framework para elegir otra carpeta;
  - implementar exactamente los métodos que usa la app: `name`, `kind`, `getDirectoryHandle(n,{create})`, `getFileHandle(n,{create})`, `createWritable()`→`write(blob|string)`/`close()`, `getFile()`, `entries()` (async iterator), `removeEntry(n,{recursive})`, `queryPermission` y `requestPermission` (que devuelven `'granted'`);
  - como `CX_FS` es `const` y se evalúa al cargar, el bridge debe cargarse **antes** que los scripts de la app. En ese caso, colocarlo en `<head>` en lugar de antes de `</body>`, y dejarlo documentado;
  - el handle se guarda en IndexedDB y las funciones no se pueden clonar: guardar en su lugar un objeto serializable (`{__cxNative:true, path}`) y rehidratarlo. Para ello, envolver `cxAjGet` / `cxAjSet`, que son `const` flecha: hacerlo por el mismo método, cargando antes y parcheando `indexedDB`, o sustituyendo `cxDirInit` / `cxElegirCarpeta`.

  Elegir la solución menos invasiva y documentarla.
- **Descargas en Android.** En WebView, `<a download>` no funciona. Envolver `cxDescargar` para escribir el blob en `Documents/CentrixMobile/Descargas/` con `@capacitor/filesystem`, y después:
  - mostrar el aviso que ya da la app;
  - ofrecer abrirlo con `@capacitor-community/file-opener` (sobre todo el PDF de ayuda y el informe HTML).
- **Compartir en Android.** En WebView, `navigator.share` con archivos no existe. Envolver `cxCompartir` en nativo:
  - escribir el informe y las fotos en `Directory.Cache`;
  - llamar a `@capacitor/share` con `files: [uri…]`, con el mismo texto y los mismos nombres de archivo que ya genera la app (`cxPaquete(p)` devuelve `{ fotos, nombre, informe }`).
- **Exportar PDF en Android.** El WebView no tiene `print()`. Usar un plugin de impresión, por ejemplo `@capgo/capacitor-printer` o equivalente, con el HTML del informe. Si no, compartir el informe HTML.
- **Copia de seguridad:** la restauración usa `<input type="file" accept=".json">`, que tiene que abrir el selector de archivos.
- **Google Drive en Android.** Google bloquea el inicio de sesión OAuth dentro de un WebView, así que GSI no sirve. Envolver `cxDrvToken` para que, en nativo:
  - obtenga el token de acceso con un plugin nativo de Google Sign-In (por ejemplo `@capgo/capacitor-social-login`), con el scope `https://www.googleapis.com/auth/drive.file`;
  - devuelva ese token.

  El resto del código de Drive (`fetch` a la API REST) se queda igual. Documentar qué hay que crear en Google Cloud: un ID de cliente **Android** con el package name y el SHA-1 de la clave de firma, más el ID de cliente web como `serverClientId`.
- **Firma:** crear un keystore de release, documentar dónde se guarda y avisar de que no se debe perder. Generar `CentrixMobile-x.y.z.apk` firmado, e indicar cómo instalarlo desde el móvil («orígenes desconocidos»). Añadir un `.aab` si se quiere publicar en Play.

## Google Drive en Windows

En Google Cloud, al ID de cliente de tipo **Aplicación web** hay que añadirle el origen `http://localhost:47831`. La tarjeta de Drive de la app ya muestra una guía; comprobar que en la app instalada muestra ese origen.

## Datos existentes

Los datos que hay ahora en el navegador **no pasan solos** a las apps instaladas, porque cada una tiene su propio almacenamiento. Documentar en un `LEEME.md` el paso a paso:
1. En la versión de navegador: Configuración › Copia de seguridad › Crear copia.
2. En la app instalada: Configuración › Copia de seguridad › Restaurar › Combinar.

## Entregables

```
centrixmobile-apps/
  original/CentrixMobile.html        (sin tocar)
  app/index.html                     (CentrixMobile.html con los dos únicos cambios permitidos)
  app/native-bridge.js
  app/vendor/…                       (Font Awesome y fuentes en local)
  assets/icon.svg, icon-1024.png, icon.ico
  windows/  (Electron: main.js, preload.js, package.json con electron-builder)
  android/  (proyecto Capacitor)
  LEEME.md  (cómo compilar, instalar, actualizar, pasar datos, configurar Drive)
  CAMBIOS.md (lista exacta de lo modificado en el HTML, con diff)
```

Scripts: `npm run build:win` → `.exe`; `npm run build:android` → `.apk`.

Para **actualizar la app** en el futuro, bastará con sustituir `app/index.html` por la nueva `CentrixMobile.html`, volver a aplicar los dos cambios (dejar un script `scripts/preparar-html.mjs` que lo haga solo) y recompilar.

## Lista de comprobación (en las dos plataformas)

- [ ] Abre a pantalla completa, con el icono correcto en la barra de tareas o el lanzador y en el instalador.
- [ ] Funciona sin conexión: iconos y fuentes se ven bien.
- [ ] Buscar un nodo, agregar equipos, rellenar todos los tipos de campo (0 a 7) y ver las leyendas ⓘ.
- [ ] Cerrar y volver a abrir: todo sigue ahí, fotos incluidas. Borrar la caché de Edge o Chrome no afecta.
- [ ] Fotos con cámara y galería, renombradas por categoría.
- [ ] Guardar en carpeta. En Windows, la carpeta se recuerda tras reiniciar. En Android, polyfill en Documents. Informe, JSON y fotos en su sitio.
- [ ] Histórico: tarjetas y filas, Ver todo, Modificar, Editar con fecha de hoy, Borrar, Buscar en carpeta.
- [ ] Descargar como HTML y Exportar PDF.
- [ ] Compartir: en Windows ZIP, menú y (si se añadió) Outlook; en Android, la hoja de compartir con Telegram.
- [ ] Copia de seguridad: crear y restaurar (combinar y reemplazar).
- [ ] Google Drive: conectar, crear carpeta, Guardar sube el preventivo, Subir todos.
- [ ] Ayuda: PDF de la cabina OLT abre (Windows) o se descarga y abre (Android).
- [ ] Atrás en Android y ✕ en Windows muestran el diálogo de salida; Cancelar deja seguir en la app.
- [ ] Tema claro y oscuro, y cambio de color.
- [ ] La misma `CentrixMobile.html` sigue funcionando igual abierta en el navegador.
