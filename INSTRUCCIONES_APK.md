# 📱 Guía: Convertir CentrixMobile a APK

## Opción recomendada: GitHub Pages + PWABuilder

### PASO 1: Crear repositorio en GitHub

1. Ve a [github.com](https://github.com) y **crea una cuenta** (si no tienes)
2. Haz clic en **"+"** (arriba a la derecha) → **"New repository"**
3. Nombre: `centrixmobile` (o cualquier nombre)
4. Descripción: `Gestor de preventivos de energía & PCI`
5. Selecciona **"Public"** (necesario para GitHub Pages)
6. Haz clic en **"Create repository"**

### PASO 2: Subir los archivos a GitHub

**Opción A: Usar GitHub Web (más fácil)**

1. En tu repositorio nuevo, haz clic en **"Add file"** → **"Upload files"**
2. Arrastra estos archivos:
   - `centrixmobile.html`
   - `manifest.json`
3. En "Commit message" escribe: `Agregar archivos iniciales`
4. Haz clic en **"Commit changes"**

**Opción B: Usar Git (más avanzado)**

```bash
git clone https://github.com/TU_USUARIO/centrixmobile.git
cd centrixmobile
# Copia centrixmobile.html y manifest.json aquí
git add .
git commit -m "Agregar archivos iniciales"
git push origin main
```

### PASO 3: Habilitar GitHub Pages

1. En tu repositorio, ve a **Settings** (engranaje)
2. En el menú de la izquierda, busca **"Pages"**
3. Bajo "Source", selecciona **"Deploy from a branch"**
4. Selecciona rama: **"main"** y carpeta: **"/ (root)"**
5. Haz clic en **"Save"**

**Tu app estará en:** `https://TU_USUARIO.github.io/centrixmobile/centrixmobile.html`

---

## PASO 4: Generar el APK con PWABuilder

1. Ve a [pwabuilder.com](https://www.pwabuilder.com/)
2. En el recuadro arriba, pega: `https://TU_USUARIO.github.io/centrixmobile/centrixmobile.html`
3. Haz clic en **"Start"**
4. Espera a que analice la URL (2-3 segundos)
5. Haz clic en **"Android"** (en la esquina inferior)
6. Rellena los datos:
   - **Package ID**: `com.centrix.mobile` (o similar)
   - **App Name**: `CentrixMobile`
   - **Signing key**: Puedes dejar "Create new" (generará automáticamente)
7. Haz clic en **"Generate Download"**
8. Se descargará un archivo `.zip` con tu APK

---

## PASO 5: Instalar el APK en Android

1. Descarga el archivo `.zip` en tu PC
2. Extrae el contenido
3. Busca el archivo terminado en `.apk`
4. Copia el `.apk` a tu Android (por USB o nube)
5. En Android:
   - Abre el archivo `.apk`
   - Android te pedirá permisos → **"Instalar"**
   - ¡Listo! Ya tendrás CentrixMobile como app nativa

---

## ¿Qué ganas con el APK?

✅ **Sin caché de navegador** - Nunca tendrás problemas de versiones antiguas
✅ **Acceso a almacenamiento** - Puede acceder a carpetas y documentos
✅ **Acceso a cámara** - Funciona correctamente
✅ **Modo offline** - Algunos datos se guardan en el dispositivo
✅ **Icono en el escritorio** - Como app nativa

---

## Notas importantes

- **GitHub Pages es gratis pero público** - Tu app es accesible en internet
- **El APK funciona offline** - Los datos se sincronizan cuando hay conexión
- **Actualizaciones** - Subes nuevos archivos a GitHub y el APK descarga automáticamente la versión nueva

---

**¿Preguntas? Avísame en qué paso estás y te ayudo**
