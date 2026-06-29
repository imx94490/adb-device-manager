import { ipcMain } from 'electron'
import { adbDevice } from '../adb/AdbDevice'
import { getConfig, addSavedDevice, removeSavedDevice } from '../utils/config'

export function initDeviceIpc() {
  ipcMain.handle('device:list', async () => {
    try {
      const devices = await adbDevice.getDevices()
      const detailedDevices = await Promise.all(
        devices.map(async (device) => {
          if (device.state === 'online') {
            try {
              return await adbDevice.getDeviceInfo(device.serial)
            } catch (e) {
              return device
            }
          }
          return device
        })
      )
      return { success: true, data: detailedDevices }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('device:connect', async (_event, ip: string, port: number) => {
    try {
      const result = await adbDevice.connectDevice(ip, port)
      await addSavedDevice({ ip, port, lastConnected: Date.now() })
      return { success: true, data: result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('device:disconnect', async (_event, ip: string, port: number) => {
    try {
      const result = await adbDevice.disconnectDevice(ip, port)
      return { success: true, data: result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('device:saved-list', async () => {
    try {
      const config = await getConfig()
      return { success: true, data: config.savedDevices }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle('device:saved-remove', async (_event, ip: string, port: number) => {
    try {
      await removeSavedDevice(ip, port)
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  })
}
