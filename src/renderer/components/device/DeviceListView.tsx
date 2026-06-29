import { useState } from 'react'
import { RefreshCw, Plus, Search, Smartphone, Wifi, History, Usb, XCircle, AlertCircle } from 'lucide-react'
import { useDeviceStore } from '../../stores/deviceStore'
import { useAppStore } from '../../stores/appStore'
import DeviceCard from './DeviceCard'
import { DeviceInfo } from '../../types'

const DeviceListView = () => {
  const { allDevices, isRefreshing, fetchDevices } = useDeviceStore()
  const { toggleConnectDialog } = useAppStore()
  const [searchText, setSearchText] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'disconnected'>('all')

  const filterBySearch = (d: DeviceInfo) => {
    if (!searchText) return true
    const text = searchText.toLowerCase()
    return (
      d.serial.toLowerCase().includes(text) ||
      d.model?.toLowerCase().includes(text) ||
      d.ip?.toLowerCase().includes(text)
    )
  }

  const onlineDevices = allDevices.filter((d) => d.state === 'online' && filterBySearch(d))
  const offlineDevices = allDevices.filter((d) => d.state === 'offline' && filterBySearch(d))
  const unauthorizedDevices = allDevices.filter((d) => d.state === 'unauthorized' && filterBySearch(d))
  const disconnectedDevices = allDevices.filter((d) => d.state === 'disconnected' && filterBySearch(d))
  const otherDevices = allDevices.filter(
    (d) => d.state !== 'online' && d.state !== 'offline' && d.state !== 'unauthorized' && d.state !== 'disconnected' && filterBySearch(d)
  )

  const filteredDevices = (() => {
    switch (filter) {
      case 'online':
        return onlineDevices
      case 'offline':
        return [...offlineDevices, ...unauthorizedDevices, ...otherDevices]
      case 'disconnected':
        return disconnectedDevices
      default:
        return allDevices.filter(filterBySearch)
    }
  })()

  const renderDeviceGrid = (devices: DeviceInfo[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {devices.map((device) => (
        <DeviceCard key={device.serial} device={device} />
      ))}
    </div>
  )

  const renderSection = (
    title: string,
    icon: any,
    devices: DeviceInfo[],
    color: string,
    count: number,
    description?: string
  ) => {
    if (devices.length === 0) return null
    const Icon = icon
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <h2 className="text-sm font-semibold text-gray-300">{title}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${color.replace('text-', 'bg-')}/10 ${color}`}>
              {count}
            </span>
          </div>
          {description && <span className="text-xs text-gray-500">{description}</span>}
        </div>
        {renderDeviceGrid(devices)}
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-cyber-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white glow-text">设备管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理您的 Android 设备</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDevices}
              disabled={isRefreshing}
              className="btn-cyber flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button onClick={toggleConnectDialog} className="btn-green flex items-center gap-2">
              <Plus className="w-4 h-4" />
              连接设备
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索设备序列号、型号、IP..."
              className="input-cyber pl-10"
            />
          </div>

          <div className="flex items-center gap-1 bg-cyber-surface rounded-lg p-1 border border-cyber-border/50">
            {[
              { key: 'all', label: '全部', count: allDevices.length },
              { key: 'online', label: '在线', count: onlineDevices.length + offlineDevices.length + unauthorizedDevices.length },
              { key: 'disconnected', label: '已断开', count: disconnectedDevices.length },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f.key
                    ? 'bg-cyber-accent/20 text-cyber-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filter === 'all' ? (
          <>
            {renderSection('在线设备', Smartphone, onlineDevices, 'text-green-400', onlineDevices.length, '点击卡片查看详情')}
            {renderSection('未授权', AlertCircle, unauthorizedDevices, 'text-yellow-400', unauthorizedDevices.length, '需在设备上授权调试')}
            {renderSection('离线', XCircle, offlineDevices, 'text-gray-400', offlineDevices.length, '请检查设备连接')}
            {renderSection('已断开', History, disconnectedDevices, 'text-orange-400', disconnectedDevices.length, '点击重新连接')}
            {allDevices.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-surface flex items-center justify-center border border-cyber-border">
                  <Smartphone className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">暂无设备</h3>
                <p className="text-sm text-gray-600 mb-6">连接 Android 设备以开始使用</p>
                <button onClick={toggleConnectDialog} className="btn-cyber">
                  <Plus className="w-4 h-4 inline mr-2" />
                  连接设备
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredDevices.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-cyber-surface flex items-center justify-center border border-cyber-border">
                  <Smartphone className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-400 mb-2">暂无设备</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {filter === 'online' ? '请连接设备或等待设备上线' : '暂无已断开的历史设备'}
                </p>
                <button onClick={toggleConnectDialog} className="btn-cyber">
                  <Plus className="w-4 h-4 inline mr-2" />
                  连接设备
                </button>
              </div>
            ) : (
              renderDeviceGrid(filteredDevices)
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DeviceListView
