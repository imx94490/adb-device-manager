import { contextBridge, ipcRenderer } from 'electron'
import { DeviceInfo, AppConfig, LogFile, LogcatOptions, SavedDevice, KeyCode } from '../renderer/types'

export interface ElectronAPI {
  device: {
    getDevices: () => Promise<{ success: boolean; data: DeviceInfo[]; error?: string }>
    connect: (ip: string, port: number) => Promise<{ success: boolean; data?: string; error?: string }>
    disconnect: (ip: string, port: number) => Promise<{ success: boolean; data?: string; error?: string }>
    getSavedDevices: () => Promise<{ success: boolean; data: SavedDevice[]; error?: string }>
    removeSavedDevice: (ip: string, port: number) => Promise<{ success: boolean; error?: string }>
  }
  screen: {
    capture: (serial: string) => Promise<{ success: boolean; data?: string; error?: string }>
    startStream: (serial: string, fps?: number) => void
    stopStream: (serial: string) => void
    onFrame: (callback: (serial: string, frame: string) => void) => () => void
    onStreamError: (callback: (serial: string, error: string) => void) => () => void
    tap: (serial: string, x: number, y: number) => Promise<{ success: boolean; error?: string }>
    swipe: (serial: string, x1: number, y1: number, x2: number, y2: number, duration?: number) => Promise<{ success: boolean; error?: string }>
    keyEvent: (serial: string, keyCode: KeyCode | number) => Promise<{ success: boolean; error?: string }>
  }
  apk: {
    install: (serial: string, filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
    chooseFile: () => Promise<{ success: boolean; canceled?: boolean; data?: { path: string; name: string; size: number }; error?: string }>
    onProgress: (callback: (serial: string, message: string) => void) => () => void
  }
  log: {
    start: (serial: string, options?: LogcatOptions) => Promise<{ success: boolean; data?: { outputPath: string; fileName: string }; error?: string }>
    stop: (serial: string) => Promise<{ success: boolean; error?: string }>
    onData: (callback: (serial: string, data: string) => void) => () => void
    onError: (callback: (serial: string, error: string) => void) => () => void
    onClose: (callback: (serial: string) => void) => () => void
    getFiles: () => Promise<{ success: boolean; data: LogFile[]; error?: string }>
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
    openFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>
    choosePath: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
  }
  config: {
    get: () => Promise<{ success: boolean; data: AppConfig; error?: string }>
    set: (config: Partial<AppConfig>) => Promise<{ success: boolean; error?: string }>
    checkAdb: () => Promise<{ success: boolean; data: boolean; error?: string }>
    chooseAdbPath: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>
    chooseLogPath: () => Promise<{ success: boolean; canceled?: boolean; data?: string; error?: string }>
  }
}

const electronAPI: ElectronAPI = {
  device: {
    getDevices: () => ipcRenderer.invoke('device:list'),
    connect: (ip, port) => ipcRenderer.invoke('device:connect', ip, port),
    disconnect: (ip, port) => ipcRenderer.invoke('device:disconnect', ip, port),
    getSavedDevices: () => ipcRenderer.invoke('device:saved-list'),
    removeSavedDevice: (ip, port) => ipcRenderer.invoke('device:saved-remove', ip, port),
  },
  screen: {
    capture: (serial) => ipcRenderer.invoke('screen:capture', serial),
    startStream: (serial, fps) => ipcRenderer.send('screen:stream-start', serial, fps),
    stopStream: (serial) => ipcRenderer.send('screen:stream-stop', serial),
    onFrame: (callback) => {
      const handler = (_event: any, serial: string, frame: string) => callback(serial, frame)
      ipcRenderer.on('screen:stream-data', handler)
      return () => ipcRenderer.removeListener('screen:stream-data', handler)
    },
    onStreamError: (callback) => {
      const handler = (_event: any, serial: string, error: string) => callback(serial, error)
      ipcRenderer.on('screen:stream-error', handler)
      return () => ipcRenderer.removeListener('screen:stream-error', handler)
    },
    tap: (serial, x, y) => ipcRenderer.invoke('screen:tap', serial, x, y),
    swipe: (serial, x1, y1, x2, y2, duration) =>
      ipcRenderer.invoke('screen:swipe', serial, x1, y1, x2, y2, duration),
    keyEvent: (serial, keyCode) => ipcRenderer.invoke('screen:key', serial, keyCode),
  },
  apk: {
    install: (serial, filePath) => ipcRenderer.invoke('apk:install', serial, filePath),
    chooseFile: () => ipcRenderer.invoke('apk:choose-file'),
    onProgress: (callback) => {
      const handler = (_event: any, serial: string, message: string) => callback(serial, message)
      ipcRenderer.on('apk:progress', handler)
      return () => ipcRenderer.removeListener('apk:progress', handler)
    },
  },
  log: {
    start: (serial, options) => ipcRenderer.invoke('log:start', serial, options),
    stop: (serial) => ipcRenderer.invoke('log:stop', serial),
    onData: (callback) => {
      const handler = (_event: any, serial: string, data: string) => callback(serial, data)
      ipcRenderer.on('log:data', handler)
      return () => ipcRenderer.removeListener('log:data', handler)
    },
    onError: (callback) => {
      const handler = (_event: any, serial: string, error: string) => callback(serial, error)
      ipcRenderer.on('log:error', handler)
      return () => ipcRenderer.removeListener('log:error', handler)
    },
    onClose: (callback) => {
      const handler = (_event: any, serial: string) => callback(serial)
      ipcRenderer.on('log:close', handler)
      return () => ipcRenderer.removeListener('log:close', handler)
    },
    getFiles: () => ipcRenderer.invoke('log:files'),
    deleteFile: (filePath) => ipcRenderer.invoke('log:delete', filePath),
    openFolder: (filePath) => ipcRenderer.invoke('log:open-folder', filePath),
    choosePath: () => ipcRenderer.invoke('log:choose-path'),
    readFile: (filePath) => ipcRenderer.invoke('log:read', filePath),
  },
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    set: (config) => ipcRenderer.invoke('config:set', config),
    checkAdb: () => ipcRenderer.invoke('config:check-adb'),
    chooseAdbPath: () => ipcRenderer.invoke('config:choose-adb-path'),
    chooseLogPath: () => ipcRenderer.invoke('config:choose-log-path'),
  },
}

contextBridge.exposeInMainWorld('api', electronAPI)
