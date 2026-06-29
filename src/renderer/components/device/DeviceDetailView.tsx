import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  Wifi,
  Usb,
  Smartphone,
  Package,
  FileText,
  RotateCw,
  Home,
  RotateCcw,
  Menu,
  Camera,
  RefreshCw,
} from 'lucide-react'
import { useDeviceStore } from '../../stores/deviceStore'
import { useAppStore } from '../../stores/appStore'
import ScreenViewer from '../screen/ScreenViewer'
import ApkInstaller from '../apk/ApkInstaller'
import LogManager from '../log/LogManager'

const DeviceDetailView = () => {
  const { selectedDevice, disconnectDevice, connectDevice } = useDeviceStore()
  const { setActiveView } = useAppStore()
  const [activeTab, setActiveTab] = useState<'screen' | 'apk' | 'log'>('screen')
  const [isStreaming, setIsStreaming] = useState(false)

  if (!selectedDevice) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-gray-500">未选择设备</p>
      </div>
    )
  }

  const isOnline = selectedDevice.state === 'online'
  const canReconnect = !isOnline && selectedDevice.ip && selectedDevice.port

  const handleBack = () => {
    setActiveView('devices')
  }

  const handleDisconnect = async () => {
    if (selectedDevice.ip && selectedDevice.port) {
      await disconnectDevice(selectedDevice.ip, selectedDevice.port)
    }
  }

  const handleReconnect = async () => {
    if (selectedDevice.ip && selectedDevice.port) {
      await connectDevice(selectedDevice.ip, selectedDevice.port)
    }
  }

  const tabs = [
    { key: 'screen', label: '屏幕控制', icon: Smartphone },
    { key: 'apk', label: 'APK 安装', icon: Package },
    { key: 'log', label: '日志管理', icon: FileText },
  ] as const

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/30 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-cyber-accent" />
            </div>
            <div>
              <h1 className="font-semibold text-white">
                {selectedDevice.model || selectedDevice.serial}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-mono">{selectedDevice.serial}</span>
                <span className="flex items-center gap-1">
                  {selectedDevice.connectionType === 'wifi' ? (
                    <><Wifi className="w-3 h-3 text-cyber-accent" /> WiFi</>
                  ) : (
                    <><Usb className="w-3 h-3 text-cyber-green" /> USB</>
                  )}
                </span>
                {selectedDevice.androidVersion && (
                  <span>Android {selectedDevice.androidVersion}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOnline && canReconnect && (
            <button onClick={handleReconnect} className="btn-cyber text-sm">
              <RotateCw className="w-4 h-4 inline mr-1.5" />
              重新连接
            </button>
          )}
          {isOnline && (
            <button onClick={handleDisconnect} className="btn-red text-sm">
              断开连接
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 border-b border-cyber-border/50 flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
              activeTab === tab.key
                ? 'text-cyber-accent'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {!isOnline ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-bg/80 backdrop-blur-sm z-10">
            <div className="text-center max-w-md p-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyber-surface flex items-center justify-center border border-cyber-border">
                <Smartphone className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">设备已离线</h3>
              <p className="text-sm text-gray-500 mb-6">
                {canReconnect
                  ? `设备 ${selectedDevice.model || selectedDevice.serial} 当前已断开连接，点击下方按钮重新连接`
                  : '设备不在线，无法使用此功能'}
              </p>
              {canReconnect && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={handleReconnect} className="btn-cyber">
                    <RotateCw className="w-4 h-4 inline mr-1.5" />
                    重新连接
                  </button>
                  <button onClick={handleBack} className="btn-cyber">
                    返回列表
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
        {activeTab === 'screen' && <ScreenViewer device={selectedDevice} />}
        {activeTab === 'apk' && <ApkInstaller device={selectedDevice} />}
        {activeTab === 'log' && <LogManager device={selectedDevice} />}
      </div>
    </div>
  )
}

export default DeviceDetailView
