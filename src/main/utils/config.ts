import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { AppConfig, SavedDevice } from '../../renderer/types'

const configFileName = 'config.json'
let configCache: AppConfig | null = null

function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, configFileName)
}

function getDefaultConfig(): AppConfig {
  return {
    adbPath: 'adb',
    defaultPort: 5555,
    autoRefresh: true,
    refreshInterval: 5,
    theme: 'dark',
    logOutputPath: path.join(app.getPath('documents'), 'ADB_Logs'),
    logFileNamePattern: 'logcat_{device}_{timestamp}.txt',
    savedDevices: [],
  }
}

export async function loadConfig(): Promise<AppConfig> {
  if (configCache) {
    return configCache
  }

  const configPath = getConfigPath()

  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      configCache = { ...getDefaultConfig(), ...JSON.parse(data) }
    } else {
      configCache = getDefaultConfig()
      await saveConfig(configCache)
    }
  } catch (e) {
    console.error('Failed to load config:', e)
    configCache = getDefaultConfig()
  }

  return configCache as AppConfig
}

export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  const configPath = getConfigPath()
  const currentConfig = configCache || getDefaultConfig()
  const newConfig = { ...currentConfig, ...config }

  try {
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf-8')
    configCache = newConfig
  } catch (e) {
    console.error('Failed to save config:', e)
    throw e
  }
}

export async function getConfig(): Promise<AppConfig> {
  if (!configCache) {
    return loadConfig()
  }
  return configCache
}

export async function addSavedDevice(device: SavedDevice): Promise<void> {
  const config = await getConfig()
  const existingIndex = config.savedDevices.findIndex(
    (d) => d.ip === device.ip && d.port === device.port
  )

  if (existingIndex >= 0) {
    config.savedDevices[existingIndex] = {
      ...config.savedDevices[existingIndex],
      ...device,
      lastConnected: Date.now(),
    }
  } else {
    config.savedDevices.push({ ...device, lastConnected: Date.now() })
  }

  await saveConfig({ savedDevices: config.savedDevices })
}

export async function removeSavedDevice(ip: string, port: number): Promise<void> {
  const config = await getConfig()
  config.savedDevices = config.savedDevices.filter(
    (d) => !(d.ip === ip && d.port === port)
  )
  await saveConfig({ savedDevices: config.savedDevices })
}
