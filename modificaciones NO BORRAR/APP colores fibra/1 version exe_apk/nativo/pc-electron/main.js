const { app, BrowserWindow, shell, protocol, session } = require('electron')
const path = require('path')
const fs = require('fs')

// Protocolo propio "app://": origen ESTABLE (a diferencia de file:// o de un puerto localhost aleatorio),
// así el almacenamiento de la app (IndexedDB/localStorage con tus datos y fotos) persiste SIEMPRE entre
// arranques y no lo borra nada. Además permite fetch() de los ficheros locales (factory-backup.json, etc.).
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
])

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 900, minHeight: 600,
    icon: path.join(__dirname, 'www', 'icon-512.ico'),
    autoHideMenuBar: true, backgroundColor: '#15171a',
    webPreferences: { spellcheck: false }
  })
  win.loadURL('app://local/index.html')
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' } }
    return { action: 'allow' }
  })
}

app.whenReady().then(async () => {
  // Elimina cualquier Service Worker + su Cache Storage que pudiera haber quedado instalado de una versión
  // previa (rompía la carga bajo app:// -> pantalla en blanco). NO se tocan IndexedDB ni localStorage, así
  // que TODOS tus datos, fotos y backups siguen intactos. En una app de escritorio el SW no aporta nada
  // (todo el contenido ya es local) y solo era una fuente de fallos.
  try {
    await session.defaultSession.clearStorageData({ storages: ['serviceworkers', 'cachestorage'] })
  } catch (e) { /* si no hay nada que limpiar, seguimos */ }

  // CRÍTICO: Electron inserta el nombre de la app ("Código Fibras", con la "ó" no-ASCII) en el User-Agent.
  // Al servir ficheros por el protocolo app://, Electron construye una petición (undici Headers) con ese
  // User-Agent y falla porque la "ó" no es un carácter ByteString válido -> el handler no se ejecuta y los
  // recursos (react, babel, fonts...) devuelven ERR_UNEXPECTED -> pantalla en blanco. Forzamos un
  // User-Agent 100% ASCII para eliminar cualquier carácter problemático.
  try {
    const cleanUA = session.defaultSession.getUserAgent().replace(/[^\x20-\x7E]/g, '')
    session.defaultSession.setUserAgent(cleanUA)
    app.userAgentFallback = cleanUA
  } catch (e) { /* sin cambios si no se puede leer */ }

  const root = path.join(__dirname, 'www')
  protocol.handle('app', async (req) => {
    let rel = decodeURIComponent(new URL(req.url).pathname)
    if (!rel || rel === '/') rel = '/index.html'
    const filePath = path.normalize(path.join(root, rel))
    if (!filePath.startsWith(root)) return new Response('forbidden', { status: 403 })
    try {
      const data = await fs.promises.readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      return new Response(data, { headers: { 'content-type': MIME[ext] || 'application/octet-stream' } })
    } catch {
      return new Response('not found', { status: 404 })
    }
  })
  createWindow()
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
