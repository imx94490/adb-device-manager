import { useState, useEffect } from 'react'
import {
  Settings,
  Smartphone,
  Palette,
  FileText,
  FolderOpen,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '../../stores/appStore'
import { AppConfig } from '../../types'

const SettingsPanel = () => {
  const { config, loadConfig, saveConfig, setActiveView, isAdbAvailable, checkAdb } = useAppStore()
  const [activeTab, setActiveTab] = useState<'adb' | 'ui' | 'log'>('adb')
  const [localConfig, setLocalConfig] = useState<Partial<AppConfig>>({})
  const [testingAdb, setTestingAdb] = useState(false)
  const [adbTestResult, setAdbTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  const tabs = [
    { key: 'adb', label: 'ADB 设置', icon: Smartphone },
    { key: 'ui', label: '界面设置', icon: Palette },
    { key: 'log', label: '日志设置', icon: FileText },
  ] as const

  const handleChange = (key: keyof AppConfig, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    await saveConfig(localConfig)
  }

  const testAdbPath = async () => {
    setTestingAdb(true)
    setAdbTestResult(null)

    await saveConfig({ adbPath: localConfig.adbPath })
    await checkAdb()

    setTimeout(async () => {
      const result = await (window as any).api.config.checkAdb()
      setAdbTestResult({
        success: result.success && result.data,
        message: result.success && result.data ? 'ADB 连接成功！' : result.error || 'ADB 不可用',
      })
      setTestingAdb(false)
    }, 500)
  }

  const chooseAdbPath = async () => {
    const result = await (window as any).api.config.chooseAdbPath()
    if (result.success && result.data) {
      handleChange('adbPath', result.data)
    }
  }

  const chooseLogPath = async () => {
    const result = await (window as any).api.config.chooseLogPath()
    if (result.success && result.data) {
      handleChange('logOutputPath', result.data)
    }
  }

  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyber-accent animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <div className="w-56 border-r border-cyber-border/50 bg-cyber-surface/30 p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-accent/20 to-cyber-purple/20 border border-cyber-accent/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-cyber-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-white">设置</h2>
            <p className="text-xs text-gray-500">应用配置</p>
          </div>
        </div>

        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-2xl">
          {/* ADB Settings */}
          {activeTab === 'adb' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">ADB 设置</h3>
                <p className="text-sm text-gray-500">配置 ADB 工具路径和连接参数</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">ADB 路径</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localConfig.adbPath || ''}
                      onChange={(e) => handleChange('adbPath', e.target.value)}
                      placeholder="adb (系统 PATH 中)"
                      className="input-cyber flex-1"
                    />
                    <button onClick={chooseAdbPath} className="btn-cyber text-sm whitespace-nowrap">
                      <FolderOpen className="w-4 h-4 inline mr-1.5" />
                      浏览
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    输入 adb 可执行文件路径，或保持 "adb" 使用系统 PATH 中的版本
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm text-gray-400 mb-2">ADB 状态</label>
                    <button
                      onClick={testAdbPath}
                      disabled={testingAdb}
                      className="text-xs text-cyber-accent hover:text-cyber-accent/80 flex items-center gap-1"
                    >
                      {testingAdb ? (
                        <><RefreshCw className="w-3 h-3 animate-spin" /> 测试中...</>
                      ) : (
                        '测试连接'
                      )}
                    </button>
                  </div>
                  <div
                    className={`p-3 rounded-lg border ${
                      isAdbAvailable
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isAdbAvailable ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-green-400">ADB 正常可用</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-red-400">未检测到 ADB</span>
                        </>
                      )}
                    </div>
                  </div>
                  {adbTestResult && (
                    <p className={`text-xs mt-2 ${adbTestResult.success ? 'text-green-400' : 'text-red-400'}`}>
                      {adbTestResult.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">默认端口</label>
                  <input
                    type="number"
                    value={localConfig.defaultPort || 5555}
                    onChange={(e) => handleChange('defaultPort', parseInt(e.target.value))}
                    className="input-cyber w-32"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">自动刷新设备</label>
                    <p className="text-xs text-gray-600">定时刷新设备列表状态</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.autoRefresh ?? true}
                      onChange={(e) => handleChange('autoRefresh', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyber-accent"></div>
                  </label>
                </div>

                {localConfig.autoRefresh && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">刷新间隔 (秒)</label>
                    <input
                      type="number"
                      value={localConfig.refreshInterval || 5}
                      onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
                      className="input-cyber w-32"
                      min={1}
                      max={60}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UI Settings */}
          {activeTab === 'ui' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">界面设置</h3>
                <p className="text-sm text-gray-500">自定义应用外观和显示</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">主题</label>
                  <div className="flex gap-4">
                    {[
                      { key: 'dark', label: '深色主题', desc: '赛博朋克风格' },
                    ].map((theme) => (
                      <button
                        key={theme.key}
                        onClick={() => handleChange('theme', theme.key as any)}
                        className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                          localConfig.theme === theme.key
                            ? 'border-cyber-accent bg-cyber-accent/10'
                            : 'border-cyber-border/50 bg-cyber-surface/50 hover:border-cyber-border'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">{theme.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log Settings */}
          {activeTab === 'log' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">日志设置</h3>
                <p className="text-sm text-gray-500">配置日志保存路径和命名规则</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">日志保存路径</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localConfig.logOutputPath || ''}
                      onChange={(e) => handleChange('logOutputPath', e.target.value)}
                      className="input-cyber flex-1"
                    />
                    <button onClick={chooseLogPath} className="btn-cyber text-sm whitespace-nowrap">
                      <FolderOpen className="w-4 h-4 inline mr-1.5" />
                      浏览
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">文件名格式</label>
                  <input
                    type="text"
                    value={localConfig.logFileNamePattern || ''}
                    onChange={(e) => handleChange('logFileNamePattern', e.target.value)}
                    className="input-cyber"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    可用变量: {'{device}'} = 设备名, {'{timestamp}'} = 时间戳
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-cyber-border/50 flex justify-end gap-3">
            <button
              onClick={() => setActiveView('devices')}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              返回
            </button>
            <button onClick={handleSave} className="btn-green">
              <Check className="w-4 h-4 inline mr-1.5" />
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
