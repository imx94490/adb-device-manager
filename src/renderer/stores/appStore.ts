import { create } from 'zustand'
import { AppConfig } from '../types'

interface AppState {
  config: AppConfig | null
  theme: 'dark' | 'light'
  showSettings: boolean
  showConnectDialog: boolean
  activeView: 'devices' | 'detail' | 'settings'
  isAdbAvailable: boolean

  loadConfig: () => Promise<void>
  saveConfig: (config: Partial<AppConfig>) => Promise<void>
  setTheme: (theme: 'dark' | 'light') => void
  toggleSettings: () => void
  toggleConnectDialog: () => void
  setActiveView: (view: 'devices' | 'detail' | 'settings') => void
  checkAdb: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  config: null,
  theme: 'dark',
  showSettings: false,
  showConnectDialog: false,
  activeView: 'devices',
  isAdbAvailable: false,

  loadConfig: async () => {
    try {
      const result = await (window as any).api.config.get()
      if (result.success) {
        set({ config: result.data, theme: result.data.theme })
      }
    } catch (e) {
      console.error('Failed to load config:', e)
    }
  },

  saveConfig: async (config) => {
    try {
      const result = await (window as any).api.config.set(config)
      if (result.success) {
        const current = get().config
        set({ config: { ...current, ...config } as AppConfig })
        if (config.theme) {
          set({ theme: config.theme })
        }
      }
    } catch (e) {
      console.error('Failed to save config:', e)
    }
  },

  setTheme: (theme) => {
    set({ theme })
    get().saveConfig({ theme })
  },

  toggleSettings: () => {
    set((state) => ({ showSettings: !state.showSettings }))
  },

  toggleConnectDialog: () => {
    set((state) => ({ showConnectDialog: !state.showConnectDialog }))
  },

  setActiveView: (view) => {
    set({ activeView: view })
  },

  checkAdb: async () => {
    try {
      const result = await (window as any).api.config.checkAdb()
      if (result.success) {
        set({ isAdbAvailable: result.data })
      }
    } catch (e) {
      set({ isAdbAvailable: false })
    }
  },
}))
