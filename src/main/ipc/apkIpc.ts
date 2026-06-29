import { ipcMain, BrowserWindow, dialog } from 'electron'
import { adbDevice } from '../adb/AdbDevice'
import * as fs from 'fs'

export function initApkIpc() {
  ipcMain.handle('apk:install', async (event, serial: string, filePath: string) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)

      const result = await adbDevice.installApk(serial, filePath, (msg) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('apk:progress', serial, msg)
        }
      })

      return { success: true, data: result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('apk:choose-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'APK Files', extensions: ['apk'] }],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      const filePath = result.filePaths[0]
      const stats = fs.statSync(filePath)

      return {
        success: true,
        data: {
          path: filePath,
          name: filePath.split('\\').pop() || filePath,
          size: stats.size,
        },
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
