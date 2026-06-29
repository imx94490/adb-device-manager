import { ipcMain, dialog } from 'electron'
import { getConfig, saveConfig } from '../utils/config'
import { AdbService } from '../adb/AdbService'
import { AppConfig } from '../../renderer/types'

export function initConfigIpc() {
  ipcMain.handle('config:get', async () => {
    try {
      const config = await getConfig()
      return { success: true, data: config }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('config:set', async (_event, config: Partial<AppConfig>) => {
    try {
      await saveConfig(config)
      if (config.adbPath) {
        AdbService.getInstance().setAdbPath(config.adbPath)
      }
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('config:check-adb', async () => {
    try {
      const available = await AdbService.getInstance().checkAdbAvailable()
      return { success: true, data: available }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('config:choose-adb-path', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Executable', extensions: ['exe'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      return { success: true, data: result.filePaths[0] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('config:choose-log-path', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      return { success: true, data: result.filePaths[0] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
