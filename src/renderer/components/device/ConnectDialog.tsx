import { useState } from 'react'
import { X, Wifi, Link, History } from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { useDeviceStore } from '../../stores/deviceStore'

const ConnectDialog = () => {
  const { showConnectDialog, toggleConnectDialog } = useAppStore()
  const { connectDevice, savedDevices, isRefreshing } = useDeviceStore()
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('5555')
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    if (!ip.trim()) {
      setError('请输入 IP 地址')
      return
    }

    setConnecting(true)
    setError('')

    const success = await connectDevice(ip.trim(), parseInt(port, 10) || 5555)

    setConnecting(false)

    if (success) {
      toggleConnectDialog()
      setIp('')
      setPort('5555')
    } else {
      setError('连接失败，请检查 IP 地址和设备状态')
    }
  }

  const handleConnectSaved = async (savedIp: string, savedPort: number) => {
    setConnecting(true)
    setError('')
    const success = await connectDevice(savedIp, savedPort)
    setConnecting(false)
    if (success) {
      toggleConnectDialog()
    }
  }

  if (!showConnectDialog) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="cyber-card rounded-2xl w-[480px] max-w-[90vw] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-cyber-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/30 flex items-center justify-center">
              <Link className="w-5 h-5 text-cyber-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-white">连接设备</h2>
              <p className="text-xs text-gray-500">通过 WiFi 连接 Android 设备</p>
            </div>
          </div>
          <button
            onClick={toggleConnectDialog}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">IP 地址</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="例如：192.168.1.100"
                className="input-cyber"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">端口号</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="5555"
                className="input-cyber"
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {savedDevices.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <History className="w-4 h-4" />
                历史设备
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedDevices.slice(0, 5).map((d) => (
                  <button
                    key={`${d.ip}:${d.port}`}
                    onClick={() => handleConnectSaved(d.ip, d.port)}
                    disabled={connecting}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-cyber-surface/50 border border-cyber-border/50 hover:border-cyber-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Wifi className="w-4 h-4 text-cyber-accent" />
                      <div>
                        <p className="text-sm text-white">{d.alias || '未命名设备'}</p>
                        <p className="text-xs text-gray-500 font-mono">{d.ip}:{d.port}</p>
                      </div>
                    </div>
                    <span className="text-xs text-cyber-accent">连接</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-cyber-border/50">
          <button
            onClick={toggleConnectDialog}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-green flex items-center gap-2"
          >
            <Link className="w-4 h-4" />
            {connecting ? '连接中...' : '连接'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectDialog
