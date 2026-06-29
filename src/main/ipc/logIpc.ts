import { ipcMain, BrowserWindow, dialog, shell } from 'electron'
import { adbDevice } from '../adb/AdbDevice'
import { LogcatOptions, LogFile } from '../../renderer/types'
import * as fs from 'fs'
import * as path from 'path'
import { getConfig, saveConfig } from '../utils/config'

const activeLogcatEmitters: Map<string, any> = new Map()

export function initLogIpc() {
  ipcMain.handle('log:start', async (event, serial: string, options: LogcatOptions = {}) => {
    try {
      const config = await getConfig()
      const win = BrowserWindow.fromWebContents(event.sender)

      const logOptions: LogcatOptions = {
        ...options,
        outputPath: options.outputPath || config.logOutputPath,
        outputFileName:
          options.outputFileName ||
          `logcat_${serial.replace(/[:.]/g, '_')}_${Date.now()}.txt`,
      }

      const outputDir = logOptions.outputPath!
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const emitter = adbDevice.startLogcat(serial, logOptions)

      emitter.on('data', (data: string) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('log:data', serial, data)
        }
      })

      emitter.on('error', (error: string) => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('log:error', serial, error)
        }
      })

      emitter.on('close', () => {
        if (win && !win.isDestroyed()) {
          win.webContents.send('log:close', serial)
        }
        activeLogcatEmitters.delete(serial)
      })

      activeLogcatEmitters.set(serial, emitter)

      const outputFilePath = path.join(outputDir, logOptions.outputFileName!)

      return {
        success: true,
        data: {
          outputPath: outputFilePath,
          fileName: logOptions.outputFileName,
        },
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('log:stop', async (_event, serial: string) => {
    try {
      adbDevice.stopLogcat(serial)
      activeLogcatEmitters.delete(serial)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('log:files', async () => {
    try {
      const config = await getConfig()
      const logDir = config.logOutputPath

      if (!fs.existsSync(logDir)) {
        return { success: true, data: [] }
      }

      const files = fs.readdirSync(logDir)
      const logFiles: LogFile[] = []

      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.log')) {
          const filePath = path.join(logDir, file)
          const stats = fs.statSync(filePath)
          logFiles.push({
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtimeMs,
          })
        }
      }

      logFiles.sort((a, b) => b.createdAt - a.createdAt)

      return { success: true, data: logFiles }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('log:delete', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: true }
      }

      let lastError: any = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          fs.unlinkSync(filePath)
          return { success: true }
        } catch (e: any) {
          lastError = e
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
          }
        }
      }

      throw lastError || new Error('Failed to delete file')
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('log:open-folder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('log:choose-path', async () => {
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

  ipcMain.handle('log:read', async (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
