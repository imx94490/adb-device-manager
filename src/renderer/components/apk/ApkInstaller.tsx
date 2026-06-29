import { useState, useRef } from 'react'
import { Package, Upload, X, Check, AlertCircle, FileUp } from 'lucide-react'
import { DeviceInfo } from '../../types'

interface ApkInstallerProps {
  device: DeviceInfo
}

const ApkInstaller = ({ device }: ApkInstallerProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string; size: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const apkFile = files.find((f) => f.name.endsWith('.apk'))

    if (apkFile) {
      const filePath = (apkFile as any).path || apkFile.name
      setSelectedFile({
        path: filePath,
        name: apkFile.name,
        size: apkFile.size,
      })
      setResult(null)
    }
  }

  const handleChooseFile = async () => {
    const result = await (window as any).api.apk.chooseFile()
    if (result.success && result.data) {
      setSelectedFile(result.data)
      setResult(null)
    }
  }

  const handleInstall = async () => {
    if (!selectedFile) return

    setInstalling(true)
    setProgress('准备安装...')
    setResult(null)

    const unsubscribe = (window as any).api.apk.onProgress((serial: string, msg: string) => {
      if (serial === device.serial) {
        setProgress(msg.trim())
      }
    })

    try {
      const result = await (window as any).api.apk.install(device.serial, selectedFile.path)
      if (result.success) {
        setResult({ success: true, message: result.data || '安装成功！' })
      } else {
        setResult({ success: false, message: result.error || '安装失败' })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    } finally {
      unsubscribe()
      setInstalling(false)
      setProgress('')
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setResult(null)
    setProgress('')
  }

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-purple/20 to-cyber-accent/20 border border-cyber-purple/30 flex items-center justify-center">
            <Package className="w-5 h-5 text-cyber-purple" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">APK 安装</h2>
            <p className="text-xs text-gray-500">拖拽 APK 文件或点击选择文件进行安装</p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFile}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-cyber-green bg-cyber-green/10 drop-zone-active'
              : selectedFile
              ? 'border-cyber-accent/50 bg-cyber-accent/5'
              : 'border-cyber-border/50 hover:border-cyber-accent/50 bg-cyber-surface/30'
          }`}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-cyber-purple/20 border border-cyber-purple/40 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-cyber-purple" />
              </div>
              <h3 className="font-medium text-white mb-1">{selectedFile.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{formatSize(selectedFile.size)}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                移除
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-cyber-surface border border-cyber-border flex items-center justify-center mb-4">
                <FileUp className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-medium text-white mb-1">拖拽 APK 文件到这里</h3>
              <p className="text-sm text-gray-500">或点击选择文件</p>
            </div>
          )}
        </div>

        {/* Install Button */}
        <div className="mt-6">
          <button
            onClick={handleInstall}
            disabled={!selectedFile || installing}
            className="w-full btn-green py-3 text-base"
          >
            {installing ? '安装中...' : '安装 APK'}
          </button>
        </div>

        {/* Progress */}
        {installing && progress && (
          <div className="mt-4 p-4 rounded-xl bg-cyber-surface border border-cyber-border/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-300">安装中...</span>
            </div>
            <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{progress}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`mt-4 p-4 rounded-xl border ${
              result.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    result.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {result.success ? '安装成功' : '安装失败'}
                </p>
                <p className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl bg-cyber-surface/50 border border-cyber-border/50">
          <h4 className="text-sm font-medium text-white mb-3">支持的安装方式</h4>
          <ul className="text-xs text-gray-500 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>拖拽 APK 文件到上方区域</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>点击区域选择 APK 文件</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>支持覆盖安装（-r 参数）</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ApkInstaller
