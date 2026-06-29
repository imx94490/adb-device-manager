import { Smartphone, Wifi, Usb, RefreshCw, ExternalLink, X, RotateCw, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { DeviceInfo } from '../../types'
import { useDeviceStore } from '../../stores/deviceStore'
import { useAppStore } from '../../stores/appStore'

interface DeviceCardProps {
  device: DeviceInfo
}

const DeviceCard = ({ device }: DeviceCardProps) => {
  const { selectDevice, reconnectDevice, removeDevice } = useDeviceStore()
  const { setActiveView } = useAppStore()
  const [reconnecting, setReconnecting] = useState(false)
  const [removing, setRemoving] = useState(false)

  const isOnline = device.state === 'online'
  const isDisconnected = device.state === 'disconnected'
  const isReconnectable = !isOnline && device.ip && device.port

  const handleClick = () => {
    if (isOnline) {
      selectDevice(device)
      setActiveView('detail')
    }
  }

  const handleReconnect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (reconnecting) return
    setReconnecting(true)
    try {
      await reconnectDevice(device.serial)
    } finally {
      setReconnecting(false)
    }
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (removing) return
    if (!confirm(`确定要删除设备 ${device.model || device.serial} 吗？`)) return
    setRemoving(true)
    try {
      await removeDevice(device.serial)
    } finally {
      setRemoving(false)
    }
  }

  const getStatusColor = () => {
    switch (device.state) {
      case 'online':
        return 'bg-green-500'
      case 'offline':
        return 'bg-gray-500'
      case 'unauthorized':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-orange-500/70'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (device.state) {
      case 'online':
        return '在线'
      case 'offline':
        return '离线'
      case 'unauthorized':
        return '未授权'
      case 'disconnected':
        return '已断开'
      default:
        return '未知'
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`cyber-card rounded-xl p-4 group relative overflow-hidden ${
        isOnline ? 'cursor-pointer' : 'cursor-default'
      } ${!isOnline ? 'opacity-75' : ''}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyber-accent/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-transform ${
              isOnline
                ? 'bg-gradient-to-br from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/30 group-hover:scale-110'
                : 'bg-cyber-surface border border-cyber-border'
            }`}>
              <Smartphone className={`w-6 h-6 ${isOnline ? 'text-cyber-accent' : 'text-gray-500'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm truncate">
                {device.model || device.serial}
              </h3>
              <p className="text-xs text-gray-500 font-mono truncate">
                {device.serial}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${isOnline ? 'animate-pulse' : ''}`} />
            <span className={`text-xs ${
              isOnline ? 'status-online' :
              device.state === 'unauthorized' ? 'status-unauthorized' :
              'status-offline'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {device.androidVersion && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Android 版本</span>
              <span className="text-gray-300 font-mono">{device.androidVersion}</span>
            </div>
          )}

          {device.resolution && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">分辨率</span>
              <span className="text-gray-300 font-mono">{device.resolution}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-gray-500">连接方式</span>
            <span className="flex items-center gap-1 text-gray-300">
              {device.connectionType === 'wifi' ? (
                <><Wifi className="w-3 h-3 text-cyber-accent" /> WiFi</>
              ) : (
                <><Usb className="w-3 h-3 text-cyber-green" /> USB</>
              )}
            </span>
          </div>

          {device.ip && device.port && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500">IP 地址</span>
              <span className={`font-mono ${isOnline ? 'text-cyber-accent' : 'text-gray-400'}`}>
                {device.ip}:{device.port}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isOnline ? (
          <div className="mt-4 pt-3 border-t border-cyber-border/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">点击查看详情</span>
            <ExternalLink className="w-4 h-4 text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : isReconnectable ? (
          <div className="mt-4 pt-3 border-t border-cyber-border/50 flex items-center gap-2">
            <button
              onClick={handleReconnect}
              disabled={reconnecting || removing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent hover:bg-cyber-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {reconnecting ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> 连接中...</>
              ) : (
                <><RotateCw className="w-3 h-3" /> 重新连接</>
              )}
            </button>
            {isDisconnected && (
              <button
                onClick={handleRemove}
                disabled={reconnecting || removing}
                className="px-2.5 py-1.5 rounded-md text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="删除设备"
              >
                {removing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default DeviceCard
