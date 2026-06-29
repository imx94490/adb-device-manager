import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import { initDeviceIpc } from './ipc/deviceIpc'
import { initScreenIpc } from './ipc/screenIpc'
import { initApkIpc } from './ipc/apkIpc'
import { initLogIpc } from './ipc/logIpc'
import { initConfigIpc } from './ipc/configIpc'
import { AdbService } from './adb/AdbService'
import { loadConfig } from './utils/config'

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0a0e17',
    frame: true,
    title: 'ADB Device Manager',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  try {
    await loadConfig()
    await AdbService.getInstance().init()
    await AdbService.getInstance().checkAdbAvailable()
  } catch (e) {
    console.warn('ADB init warning:', e)
  }

  initDeviceIpc()
  initScreenIpc()
  initApkIpc()
  initLogIpc()
  initConfigIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
