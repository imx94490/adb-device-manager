import { RefreshCw, Plus, Settings as SettingsIcon, Smartphone } from 'lucide-react'
import { useDeviceStore } from '../../stores/deviceStore'
import { useAppStore } from '../../stores/appStore'

const StatusBar = () => {
  const { allDevices, isRefreshing, fetchDevices } = useDeviceStore()
  const { isAdbAvailable, toggleConnectDialog, setActiveView, activeView } = useAppStore()

  const handleSettingsClick = () => {
    setActiveView(activeView === 'settings' ? 'devices' : 'settings')
  }

  const onlineCount = allDevices.filter((d) => d.state === 'online').length
  const totalCount = allDevices.length

  return (
    <div className="h-10 bg-cyber-surface border-t border-cyber-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isAdbAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-400">
            ADB: {isAdbAvailable ? '就绪' : '未找到'}
          </span>
        </div>
        <div className="text-xs text-gray-500">|</div>
        <span className="text-xs text-gray-400">
          设备: <span className="text-cyber-accent font-mono">{onlineCount}</span> / {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={fetchDevices}
          disabled={isRefreshing}
          className="p-1.5 rounded-md text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10 transition-colors"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleConnectDialog}
          className="p-1.5 rounded-md text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10 transition-colors"
          title="连接设备"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleSettingsClick}
          className={`p-1.5 rounded-md transition-colors ${
            activeView === 'settings'
              ? 'text-cyber-accent bg-cyber-accent/10'
              : 'text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10'
          }`}
          title="设置"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default StatusBar
