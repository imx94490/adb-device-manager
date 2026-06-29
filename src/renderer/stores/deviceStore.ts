import { create } from 'zustand'
import { DeviceInfo, SavedDevice } from '../types'

interface DeviceState {
  devices: DeviceInfo[]
  savedDevices: SavedDevice[]
  allDevices: DeviceInfo[]
  selectedDevice: DeviceInfo | null
  isRefreshing: boolean
  error: string | null

  fetchDevices: () => Promise<void>
  fetchSavedDevices: () => Promise<void>
  mergeDevices: () => void
  selectDevice: (device: DeviceInfo | null) => void
  connectDevice: (ip: string, port: number) => Promise<boolean>
  disconnectDevice: (ip: string, port: number) => Promise<boolean>
  reconnectDevice: (serial: string) => Promise<boolean>
  removeDevice: (serial: string) => Promise<void>
  refreshDevices: () => Promise<void>
}

const buildMergedDevices = (devices: DeviceInfo[], savedDevices: SavedDevice[]): DeviceInfo[] => {
  const merged: DeviceInfo[] = []
  const seen = new Set<string>()

  for (const d of devices) {
    merged.push(d)
    seen.add(d.serial)
  }

  for (const s of savedDevices) {
    const key = `${s.ip}:${s.port}`
    if (seen.has(key)) continue

    merged.push({
      serial: key,
      state: 'disconnected',
      model: s.alias,
      ip: s.ip,
      port: s.port,
      connectionType: 'wifi',
    })
  }

  return merged
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  savedDevices: [],
  allDevices: [],
  selectedDevice: null,
  isRefreshing: false,
  error: null,

  fetchDevices: async () => {
    set({ isRefreshing: true, error: null })
    try {
      const result = await (window as any).api.device.getDevices()
      if (result.success) {
        set({ devices: result.data, isRefreshing: false })
        get().mergeDevices()
      } else {
        set({ error: result.error, isRefreshing: false })
      }
    } catch (e: any) {
      set({ error: e.message, isRefreshing: false })
    }
  },

  fetchSavedDevices: async () => {
    try {
      const result = await (window as any).api.device.getSavedDevices()
      if (result.success) {
        set({ savedDevices: result.data })
        get().mergeDevices()
      }
    } catch (e) {
      console.error('Failed to fetch saved devices:', e)
    }
  },

  mergeDevices: () => {
    const { devices, savedDevices } = get()
    const allDevices = buildMergedDevices(devices, savedDevices)
    set({ allDevices })

    const selected = get().selectedDevice
    if (selected) {
      const updated = allDevices.find((d) => d.serial === selected.serial)
      set({ selectedDevice: updated || null })
    }
  },

  selectDevice: (device) => {
    set({ selectedDevice: device })
  },

  connectDevice: async (ip, port) => {
    try {
      const result = await (window as any).api.device.connect(ip, port)
      if (result.success) {
        await get().fetchDevices()
        await get().fetchSavedDevices()
        return true
      }
      set({ error: result.error })
      return false
    } catch (e: any) {
      set({ error: e.message })
      return false
    }
  },

  disconnectDevice: async (ip, port) => {
    try {
      const result = await (window as any).api.device.disconnect(ip, port)
      if (result.success) {
        await get().fetchDevices()
        return true
      }
      set({ error: result.error })
      return false
    } catch (e: any) {
      set({ error: e.message })
      return false
    }
  },

  reconnectDevice: async (serial) => {
    const { allDevices } = get()
    const device = allDevices.find((d) => d.serial === serial)
    if (!device || !device.ip || !device.port) {
      set({ error: 'Device not found or missing IP' })
      return false
    }

    return await get().connectDevice(device.ip, device.port)
  },

  removeDevice: async (serial) => {
    try {
      const { allDevices } = get()
      const device = allDevices.find((d) => d.serial === serial)
      if (!device) return

      if (device.state === 'disconnected' && device.ip && device.port) {
        const result = await (window as any).api.device.removeSavedDevice(device.ip, device.port)
        if (result.success) {
          await get().fetchSavedDevices()
        }
      } else if (device.state === 'online' && device.ip && device.port) {
        await get().disconnectDevice(device.ip, device.port)
        const result = await (window as any).api.device.removeSavedDevice(device.ip, device.port)
        if (result.success) {
          await get().fetchSavedDevices()
        }
      } else {
        set({ error: 'Cannot remove this device' })
      }
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  refreshDevices: async () => {
    await get().fetchDevices()
    await get().fetchSavedDevices()
  },
}))
