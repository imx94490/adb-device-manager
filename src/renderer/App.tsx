import { useEffect } from 'react'
import { useAppStore } from './stores/appStore'
import { useDeviceStore } from './stores/deviceStore'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import DeviceListView from './components/device/DeviceListView'
import DeviceDetailView from './components/device/DeviceDetailView'
import SettingsPanel from './components/settings/SettingsPanel'
import ConnectDialog from './components/device/ConnectDialog'
import './styles/globals.css'

function App() {
  const { activeView, config, loadConfig, checkAdb } = useAppStore()
  const { fetchDevices, fetchSavedDevices } = useDeviceStore()

  useEffect(() => {
    const init = async () => {
      await loadConfig()
      await checkAdb()
      await fetchDevices()
      await fetchSavedDevices()
    }
    init()
  }, [])

  useEffect(() => {
    if (!config?.autoRefresh) return

    const intervalMs = (config.refreshInterval || 5) * 1000
    const interval = setInterval(() => {
      fetchDevices()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [config?.autoRefresh, config?.refreshInterval])

  return (
    <div className="w-full h-full flex flex-col bg-cyber-bg grid-bg overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative">
          {activeView === 'devices' && <DeviceListView />}
          {activeView === 'detail' && <DeviceDetailView />}
          {activeView === 'settings' && <SettingsPanel />}
        </main>
      </div>
      <StatusBar />
      <ConnectDialog />
    </div>
  )
}

export default App
