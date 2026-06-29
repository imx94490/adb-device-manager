import { ipcMain, BrowserWindow } from 'electron'
import { adbDevice } from '../adb/AdbDevice'
import { KeyCode } from '../../renderer/types'

export function initScreenIpc() {
  ipcMain.handle('screen:capture', async (_event, serial: string) => {
    try {
      const screenshot = await adbDevice.getScreenshot(serial)
      return { success: true, data: screenshot }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.on('screen:stream-start', (event, serial: string, fps: number = 2) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    adbDevice.startScreenStream(serial, fps, (frame) => {
      if (!win.isDestroyed()) {
        win.webContents.send('screen:stream-data', serial, frame)
      }
    }, (error) => {
      if (!win.isDestroyed()) {
        win.webContents.send('screen:stream-error', serial, error)
      }
    })
  })

  ipcMain.on('screen:stream-stop', (_event, serial: string) => {
    adbDevice.stopScreenStream(serial)
  })

  ipcMain.handle('screen:tap', async (_event, serial: string, x: number, y: number) => {
    try {
      await adbDevice.inputTap(serial, x, y)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle(
    'screen:swipe',
    async (
      _event,
      serial: string,
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      duration: number = 300
    ) => {
      try {
        await adbDevice.inputSwipe(serial, x1, y1, x2, y2, duration)
        return { success: true }
      } catch (e: any) {
        return { success: false, error: e.message }
      }
    }
  )

  ipcMain.handle('screen:key', async (_event, serial: string, keyCode: KeyCode | number) => {
    try {
      await adbDevice.inputKeyEvent(serial, keyCode)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
