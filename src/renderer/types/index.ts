export type DeviceState = 'online' | 'offline' | 'unauthorized' | 'disconnected' | 'unknown'

export interface DeviceInfo {
  serial: string
  state: DeviceState
  model?: string
  androidVersion?: string
  resolution?: string
  ip?: string
  port?: number
  connectionType: 'usb' | 'wifi'
  manufacturer?: string
  product?: string
}

export interface SavedDevice {
  ip: string
  port: number
  alias?: string
  lastConnected: number
  serial?: string
}

export interface AppConfig {
  adbPath: string
  defaultPort: number
  autoRefresh: boolean
  refreshInterval: number
  theme: 'dark' | 'light'
  logOutputPath: string
  logFileNamePattern: string
  savedDevices: SavedDevice[]
}

export interface LogFile {
  name: string
  path: string
  size: number
  createdAt: number
  deviceSerial?: string
}

export interface LogcatOptions {
  level?: 'V' | 'D' | 'I' | 'W' | 'E' | 'F'
  tag?: string
  outputPath?: string
  outputFileName?: string
}

export interface ApkInstallProgress {
  status: 'pending' | 'installing' | 'success' | 'failed'
  progress: number
  message?: string
  error?: string
}

export type KeyCode =
  | 'BACK'
  | 'HOME'
  | 'MENU'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'POWER'
  | 'RECENTS'

export const ANDROID_KEYCODES: Record<KeyCode, number> = {
  BACK: 4,
  HOME: 3,
  MENU: 82,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  POWER: 26,
  RECENTS: 187,
}
