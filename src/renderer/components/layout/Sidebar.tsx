import { Smartphone, Settings, Activity } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useDeviceStore } from '../../stores/deviceStore'

const Sidebar = () => {
  const { activeView, setActiveView } = useAppStore()
  const { allDevices } = useDeviceStore()

  const onlineCount = allDevices.filter((d) => d.state === 'online').length

  return (
    <aside className="w-16 bg-cyber-surface border-r border-cyber-border flex flex-col items-center py-4 gap-2">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent to-cyber-purple flex items-center justify-center mb-4 animate-pulse-glow">
        <Smartphone className="w-5 h-5 text-white" />
      </div>

      <button
        onClick={() => setActiveView('devices')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
          activeView === 'devices' || activeView === 'detail'
            ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40'
            : 'text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10'
        }`}
        title="设备管理"
      >
        <Smartphone className="w-5 h-5" />
      </button>

      <button
        onClick={() => setActiveView('settings')}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
          activeView === 'settings'
            ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/40'
            : 'text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10'
        }`}
        title="设置"
      >
        <Settings className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-1 text-xs">
        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40">
          <Activity className="w-4 h-4 text-green-400" />
        </div>
        <span className="text-green-400 font-mono">{onlineCount}</span>
        <span className="text-gray-500 text-[10px]">在线</span>
      </div>
    </aside>
  )
}

export default Sidebar
